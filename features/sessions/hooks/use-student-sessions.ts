import { supabase } from "@/lib/supabase";
import { calculateAge } from "@/lib/date-utils";
import type { TranslationKey } from "@/features/settings/constants/translations";
import { useI18n } from "@/features/settings/contexts/i18n-context";
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
 * Seed records for the tutorial's mock student history. Titles/status are
 * localized display text; `formType`/`type`/dates stay as stored values. The
 * `status` display strings are also localized (the "concluida" one is an enum
 * used only for logic, so it is kept as-is).
 *
 * @remarks
 * The session record's counts must match the executions seeded in
 * {@link file://./use-session-detail.ts}, which the history simulation opens.
 */
const buildMockSessions = (t: (key: TranslationKey) => string): SessionItem[] => [
  { id: "mock-rc-form", title: t("mock.controlRecord"), date: "28/06/2026", status: t("mock.statusPending"), hasPendency: true, type: "form", rawDate: "2026-06-28", isResumable: false, circuitId: null, circuitType: null, resumeExercises: null, formType: "registro_controle" },
  { id: "mock-ata-form", title: "ATA", date: "27/06/2026", status: t("mock.statusFilled"), hasPendency: false, type: "form", rawDate: "2026-06-27", isResumable: false, circuitId: null, circuitType: null, resumeExercises: null, formType: "ata" },
  { id: "mock-hist-session", title: t("mock.circuit1"), date: "26/06/2026", status: "concluida", hasPendency: false, type: "session", rawDate: "2026-06-26", isResumable: false, circuitId: null, circuitType: null, resumeExercises: null, totalPrevisto: 2, totalRealizado: 2 },
];

const buildMockProfile = (t: (key: TranslationKey) => string): StudentProfile => ({
  name: "Ana Beatriz",
  avatarUrl: null,
  height: 122,
  weight: 28,
  waist: 54,
  birthDate: "2017-03-12",
  supportLevel: t("reports.supportLevel2"),
  observations: null,
});

/** Options for {@link useStudentSessions}. */
export type UseStudentSessionsOptions = {
  /** When true, returns seeded mock records (tutorial only). */
  mock?: boolean;
};

/**
 * Loads a student's profile and combined record history (sessions, ATA/CARS
 * forms, and MABC-2 assessments), resolving pendencies and execution progress,
 * sorted from newest to oldest.
 *
 * @param options - Pass `{ mock: true }` (tutorial only) for seeded records.
 */
export function useStudentSessions(studentId?: string, options?: UseStudentSessionsOptions) {
  const isMock = options?.mock ?? false;
  const { t } = useI18n();
  const [sessions, setSessions] = useState<SessionItem[]>(isMock ? buildMockSessions(t) : []);
  const [profile, setProfile] = useState<StudentProfile | null>(isMock ? buildMockProfile(t) : null);
  const [isLoading, setIsLoading] = useState(!isMock);

  const fetchDetails = useCallback(async () => {
    if (isMock) {
      setIsLoading(false);
      return;
    }
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
            title: circuit?.titulo || item.formulario_id?.titulo || t("session.clinicalSession"),
            date: item.data_inicio
              ? new Date(item.data_inicio).toLocaleDateString("pt-BR")
              : t("common.dateUndefined"),
            status: item.status
              ? String(item.status).replace(/_/g, " ")
              : t("common.statusUndefined"),
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
          title: item.titulo || t("form.fallbackTitle"),
          date: item.created_at
            ? new Date(item.created_at).toLocaleDateString("pt-BR")
            : t("common.dateUndefined"),
          status: item.pendente ? t("mock.statusPending") : t("mock.statusFilled"),
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
          title: item.titulo || t("session.mabcAssessment"),
          date: new Date(eventDate).toLocaleDateString("pt-BR"),
          status: item.tem_pendencia ? t("mock.statusPending") : t("mock.statusFinished"),
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
  }, [studentId, isMock]);

  useEffect(() => {
    if (isMock || studentId) fetchDetails();
  }, [studentId, fetchDetails, isMock]);

  return { sessions, profile, isLoading, refetch: fetchDetails };
}
