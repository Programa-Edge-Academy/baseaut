import { supabase } from "@/lib/supabase";
import { calculateAge } from "@/lib/date-utils";
import { useCallback, useEffect, useState } from "react";

/** Minimal exercise data used to resume an in-progress session. */
export type ResumeExercise = {
  id: string;
  name: string;
  description: string;
};

/** A single history entry (session, form, or MABC-2 assessment) for a student. */
export interface SessionItem {
  id: string;
  title: string;
  date: string;
  status: string;
  hasPendency: boolean;
  type: "session" | "form" | "mabc";
  rawDate: string | null;
  isResumable: boolean;
  circuitId: string | null;
  circuitType: string | null;
  resumeExercises: ResumeExercise[] | null;
  ageAtEvent?: number;
  faixaMabc?: number;
  totalPrevisto?: number;
  totalRealizado?: number;
  numeroSessao?: number | null;
  formType?: string | null;
}

/** Student profile fields shown alongside the session history. */
export interface StudentProfile {
  name: string;
  avatarUrl: string | null;
  height: number | null;
  weight: number | null;
  waist: number | null;
  birthDate: string | null;
  supportLevel: string | null;
  observations: string | null;
}

/**
 * Loads a student's profile and combined record history (sessions, ATA/CARS
 * forms, and MABC-2 assessments), resolving pendencies and execution progress,
 * sorted from newest to oldest.
 */
export function useStudentSessions(studentId?: string) {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDetails = useCallback(async () => {
    if (!studentId) return;

    try {
      setIsLoading(true);

      const { data: studentData, error: studentError } = await supabase
        .from("alunos")
        .select("nome_completo, avatar_url, altura, peso, cintura, data_nascimento, nivel_suporte, observacoes_clinicas")
        .eq("id", studentId)
        .single();

      if (studentError) throw studentError;

      let birthDateStr: string | null = null;

      if (studentData) {
        birthDateStr = studentData.data_nascimento ?? null;

        const formatSupportLevel = (level: string | null) => {
          if (!level) return null;
          if (level === "nivel_1") return "Nível 1";
          if (level === "nivel_2") return "Nível 2";
          if (level === "nivel_3") return "Nível 3";
          return level;
        };

        setProfile({
          name: studentData.nome_completo,
          avatarUrl: studentData.avatar_url,
          height: studentData.altura ? Number(studentData.altura) : null,
          weight: studentData.peso ? Number(studentData.peso) : null,
          waist: studentData.cintura ? Number(studentData.cintura) : null,
          birthDate: birthDateStr,
          supportLevel: formatSupportLevel(studentData.nivel_suporte),
          observations: studentData.observacoes_clinicas ?? null,
        });
      }

      const { data: sessionsData } = await supabase
        .from("sessoes")
        .select(`
          id,
          status,
          data_inicio,
          numero_sessao,
          circuito_id (id, titulo, tipo, itens_circuito (ordem, exercicios (id, titulo, descricao))),
          formulario_id (titulo)
        `)
        .eq("aluno_id", studentId)
        .neq("status", "cancelada");

      const { data: formsData } = await supabase
        .rpc("listar_formularios_aluno", { p_aluno_id: studentId });

      const { data: mabcData } = await supabase
        .rpc("rpc_get_historico_mabc2_aluno", { p_aluno_id: studentId });

      const { data: progressData } = await supabase
        .rpc("rpc_get_progresso_sessoes_aluno", { p_aluno_id: studentId });

      let parsedProgress: any[] = [];
      try {
        parsedProgress = typeof progressData === "string" ? JSON.parse(progressData) : (progressData || []);
      } catch {}

      const mappedSessions: SessionItem[] = await Promise.all(
        (sessionsData || []).map(async (item: any) => {
          let temPendencia = false;

          const { data: rpcData, error: rpcError } = await supabase.rpc(
            "verificar_pendencias_sessao",
            { p_sessao_id: item.id }
          );

          if (!rpcError && rpcData) {
            const result = typeof rpcData === "string" ? JSON.parse(rpcData) : rpcData;
            temPendencia = result?.tem_pendencias || false;
          }

          const sessaoProgresso = parsedProgress.find((p: any) => p.sessao_id === item.id);

          const circuit = item.circuito_id;
          const sortedItems = (circuit?.itens_circuito ?? []).sort(
            (a: any, b: any) => a.ordem - b.ordem,
          );
          const resumeExercises: ResumeExercise[] | null =
            circuit && sortedItems.length > 0
              ? sortedItems
                  .map((ci: any) => ({
                    id: ci.exercicios?.id,
                    name: ci.exercicios?.titulo,
                    description: ci.exercicios?.descricao ?? "",
                  }))
                  .filter((e: any) => e.id)
              : null;

          return {
            id: item.id,
            title: circuit?.titulo || item.formulario_id?.titulo || "Sessão Clínica",
            date: item.data_inicio
              ? new Date(item.data_inicio).toLocaleDateString("pt-BR")
              : "Data não definida",
            status: item.status
              ? String(item.status).replace(/_/g, " ")
              : "Status não definido",
            hasPendency: temPendencia,
            type: "session",
            rawDate: item.data_inicio,
            isResumable: item.status === "em_andamento" && circuit != null,
            circuitId: circuit?.id ?? null,
            circuitType: circuit?.tipo ?? null,
            resumeExercises,
            totalPrevisto: sessaoProgresso?.total_previsto ?? 0,
            totalRealizado: sessaoProgresso?.total_realizado ?? 0,
            numeroSessao: item.numero_sessao ?? null,
          };
        })
      );

      const mappedForms: SessionItem[] = (formsData || [])
        .filter((item: any) => item.tipo === "ata" || item.tipo === "cars")
        .map((item: any) => ({
          id: item.id,
          title: item.titulo || "Formulário",
          date: item.created_at
            ? new Date(item.created_at).toLocaleDateString("pt-BR")
            : "Data não definida",
          status: item.pendente ? "Pendente" : "Preenchido",
          hasPendency: item.pendente === true,
          type: "form",
          rawDate: item.created_at,
          isResumable: false,
          circuitId: null,
          circuitType: null,
          resumeExercises: null,
          formType: item.tipo ?? null,
        }));

      let parsedMabcData: any[] = [];
      try {
        parsedMabcData = typeof mabcData === "string" ? JSON.parse(mabcData) : (mabcData || []);
      } catch {}

      const mappedMabc: SessionItem[] = (parsedMabcData || []).map((item: any) => {
        const eventDate = item.data_avaliacao || item.created_at || new Date().toISOString();
        const meta = typeof item.metadados === "string" ? JSON.parse(item.metadados) : item.metadados;
        const faixaDoObjeto = meta?.faixa_mabc ? Number(meta.faixa_mabc) : undefined;

        return {
          id: item.id || item.formulario_id,
          title: item.titulo || "Avaliação MABC-2",
          date: new Date(eventDate).toLocaleDateString("pt-BR"),
          status: item.tem_pendencia ? "Pendente" : "Finalizado",
          hasPendency: item.tem_pendencia === true,
          type: "mabc",
          rawDate: eventDate,
          isResumable: false,
          circuitId: null,
          circuitType: null,
          resumeExercises: null,
          faixaMabc: faixaDoObjeto,
          ageAtEvent: birthDateStr ? calculateAge(birthDateStr, eventDate) : undefined,
        };
      });

      const combinedHistory = [...mappedSessions, ...mappedForms, ...mappedMabc].sort((a, b) => {
        const dateA = a.rawDate ? new Date(a.rawDate).getTime() : 0;
        const dateB = b.rawDate ? new Date(b.rawDate).getTime() : 0;
        return dateB - dateA;
      });

      setSessions(combinedHistory);

    } catch {
    } finally {
      setIsLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    if (studentId) fetchDetails();
  }, [studentId, fetchDetails]);

  return { sessions, profile, isLoading, refetch: fetchDetails };
}
