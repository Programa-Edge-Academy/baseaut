import { supabase } from "@/lib/supabase";
import { calculateAge } from "@/lib/date-utils";
import { useEffect, useState } from "react";

export type ResumeExercise = {
  id: string;
  name: string;
  description: string;
};

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
}

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


export function useStudentSessions(studentId?: string) {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDetails = async () => {
    if (!studentId) return;

    try {
      setIsLoading(true);

      // 1. Busca o perfil do aluno
      const { data: studentData, error: studentError } = await supabase
        .from("alunos")
        .select("nome_completo, avatar_url, altura, peso, cintura, data_nascimento, nivel_suporte, observacoes_clinicas")
        .eq("id", studentId)
        .single();

      if (studentError) throw studentError;
      
      if (studentData) {
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
          birthDate: studentData.data_nascimento ?? null,
          supportLevel: formatSupportLevel(studentData.nivel_suporte),
          observations: studentData.observacoes_clinicas ?? null,
        });
      }

      const birthDate = studentData?.data_nascimento || null;

      // 2. Busca as Sessões (direto na tabela)
      const { data: sessionsData, error: sessionsError } = await supabase
        .from("sessoes")
        .select(`
          id,
          status,
          data_inicio,
          circuito_id (id, titulo, tipo, itens_circuito (ordem, exercicios (id, titulo, descricao))),
          formulario_id (titulo)
        `)
        .eq("aluno_id", studentId);

      if (sessionsError) console.error("Erro ao buscar sessões", sessionsError);

      // 3. Busca Formulários (via RPC disponível)
      const { data: formsData, error: formsError } = await supabase
        .rpc("listar_formularios_aluno", { p_aluno_id: studentId });

      if (formsError) console.error("Erro ao buscar formulários", formsError);

      // 4. Formata as Sessões
      const mappedSessions: SessionItem[] = (sessionsData || []).map((item: any) => {
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
          title: circuit?.titulo || item.formulario_id?.titulo || "Sessão sem título",
          date: item.data_inicio
            ? new Date(item.data_inicio).toLocaleDateString("pt-BR")
            : "Data não definida",
          status: item.status
            ? String(item.status).replace(/_/g, " ")
            : "Status não definido",
          hasPendency: false,
          type: "session",
          rawDate: item.data_inicio,
          isResumable: item.status === "em_andamento" && circuit != null,
          circuitId: circuit?.id ?? null,
          circuitType: circuit?.tipo ?? null,
          resumeExercises,
        };
      });
      // 4. Busca Histórico MABC-2 (via RPC disponível)
      const { data: mabcData, error: mabcError } = await supabase
        .rpc("rpc_get_historico_mabc2_aluno", { p_aluno_id: studentId });

      if (mabcError) console.error("Erro ao buscar histórico MABC", mabcError);

      // 6. Formata os Formulários
      const mappedForms: SessionItem[] = (formsData || []).map((item: any) => ({
        id: item.id,
        title: item.titulo || "Formulário",
        date: item.created_at
          ? new Date(item.created_at).toLocaleDateString("pt-BR")
          : "Data não definida",
        status: item.tem_respostas ? "Preenchido" : "Pendente",
        hasPendency: !item.tem_respostas,
        type: "form",
        rawDate: item.created_at,
        isResumable: false,
        circuitId: null,
        circuitType: null,
        resumeExercises: null,
      }));

      // 7. Formata o MABC-2 (calculando a idade no momento da avaliação para a cor)
      const parsedMabcData = typeof mabcData === "string" ? JSON.parse(mabcData) : (mabcData || []);
      const mappedMabc: SessionItem[] = (parsedMabcData || []).map((item: any) => {
        const eventDate = item.data_avaliacao || item.created_at || new Date().toISOString();
        return {
          id: item.id || item.formulario_id,
          title: item.titulo || "Avaliação MABC-2",
          date: new Date(eventDate).toLocaleDateString("pt-BR"),
          status: item.status || "Finalizado",
          hasPendency: item.tem_pendencia === true,
          type: "mabc",
          rawDate: eventDate,
          ageAtEvent: calculateAge(birthDate, eventDate),
        };
      });

      // 8. Une todas as listas e ordena da mais recente para a mais antiga
      const combinedHistory = [...mappedSessions, ...mappedForms, ...mappedMabc].sort((a, b) => {
        const dateA = a.rawDate ? new Date(a.rawDate).getTime() : 0;
        const dateB = b.rawDate ? new Date(b.rawDate).getTime() : 0;
        return dateB - dateA;
      });

      setSessions(combinedHistory);

    } catch (error) {
      console.error("Erro na estruturação do histórico do aluno:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) fetchDetails();
  }, [studentId]);

  return { sessions, profile, isLoading, refetch: fetchDetails };
}