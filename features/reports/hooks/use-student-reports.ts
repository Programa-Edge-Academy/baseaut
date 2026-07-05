import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useRef, useState } from "react";

/** Snapshot of the student's profile captured when a report is created. */
export type StudentSnapshot = {
  nome_completo: string;
  altura: number | null;
  peso: number | null;
  cintura: number | null;
  data_nascimento: string | null;
  nivel_suporte: string | null;
  observacoes_clinicas: string | null;
};

/** A saved report covering a date range for a student. */
export type Report = {
  id: string;
  aluno_id: string;
  titulo: string;
  data_inicio: string;
  data_fim: string;
  snapshot_aluno: StudentSnapshot | null;
  /** Snapshot image shared by reports with intersecting periods, if any. */
  imagem_id: string | null;
  /** Public URL of the snapshot image, resolved from {@link Report.imagem_id}. */
  imagem_url: string | null;
  created_at: string;
};

/** Form fields used to create a report. */
export type ReportFormData = {
  titulo: string;
  data_inicio: string;
  data_fim: string;
};

/** Extracts the object path of a public `avatares` bucket URL, or null. */
function avataresPathFromUrl(url: string): string | null {
  const marker = "/object/public/avatares/";
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length).split("?")[0]);
}

/**
 * Resolves the snapshot image for a new report period.
 *
 * When an existing image of the student covers the report's start or end date,
 * it is reused and its covered period grows to the union with the new period.
 * Otherwise the student's current avatar is copied inside the `avatares`
 * bucket (so later avatar changes do not affect the report) and registered
 * with the report period.
 *
 * @returns The `relatorio_imagens_aluno` id to link, or null when the student
 * has no avatar.
 */
async function resolveReportImage(
  studentId: string,
  dataInicio: string,
  dataFim: string,
  avatarUrl: string | null,
): Promise<string | null> {
  const { data: existing } = await supabase
    .from("relatorio_imagens_aluno")
    .select("id, periodo_inicio, periodo_fim")
    .eq("aluno_id", studentId)
    .or(
      `and(periodo_inicio.lte.${dataInicio},periodo_fim.gte.${dataInicio}),` +
        `and(periodo_inicio.lte.${dataFim},periodo_fim.gte.${dataFim})`,
    )
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existing) {
    const periodoInicio =
      dataInicio < existing.periodo_inicio ? dataInicio : existing.periodo_inicio;
    const periodoFim =
      dataFim > existing.periodo_fim ? dataFim : existing.periodo_fim;
    await supabase
      .from("relatorio_imagens_aluno")
      .update({ periodo_inicio: periodoInicio, periodo_fim: periodoFim })
      .eq("id", existing.id);
    return existing.id;
  }

  if (!avatarUrl) return null;

  let finalUrl = avatarUrl;
  let storagePath: string | null = null;

  const sourcePath = avataresPathFromUrl(avatarUrl);
  if (sourcePath) {
    const ext = sourcePath.split(".").pop() ?? "jpg";
    const targetPath = `relatorios/${studentId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: copyError } = await supabase.storage
      .from("avatares")
      .copy(sourcePath, targetPath);
    if (!copyError) {
      finalUrl = supabase.storage.from("avatares").getPublicUrl(targetPath).data.publicUrl;
      storagePath = targetPath;
    }
  }

  const { data: created, error } = await supabase
    .from("relatorio_imagens_aluno")
    .insert({
      aluno_id: studentId,
      url: finalUrl,
      storage_path: storagePath,
      periodo_inicio: dataInicio,
      periodo_fim: dataFim,
    })
    .select("id")
    .single();

  if (error) return null;
  return created?.id ?? null;
}

/**
 * Recomputes the covered period of a snapshot image after a report that used
 * it was deleted. When no report references the image anymore, both the row
 * and the copied storage object are removed.
 */
async function reevaluateReportImage(imageId: string): Promise<void> {
  const { data: remaining } = await supabase
    .from("relatorios")
    .select("data_inicio, data_fim")
    .eq("imagem_id", imageId);

  if (remaining && remaining.length > 0) {
    const periodoInicio = remaining
      .map((r) => r.data_inicio)
      .reduce((min, d) => (d < min ? d : min));
    const periodoFim = remaining
      .map((r) => r.data_fim)
      .reduce((max, d) => (d > max ? d : max));
    await supabase
      .from("relatorio_imagens_aluno")
      .update({ periodo_inicio: periodoInicio, periodo_fim: periodoFim })
      .eq("id", imageId);
    return;
  }

  const { data: image } = await supabase
    .from("relatorio_imagens_aluno")
    .select("storage_path")
    .eq("id", imageId)
    .maybeSingle();

  if (image?.storage_path) {
    await supabase.storage.from("avatares").remove([image.storage_path]);
  }
  await supabase.from("relatorio_imagens_aluno").delete().eq("id", imageId);
}

/**
 * Provides a student's reports plus create, rename, and delete actions, keeping
 * a profile snapshot on each created report and a snapshot image shared across
 * reports with intersecting periods (see {@link resolveReportImage} and
 * {@link reevaluateReportImage}).
 */
export function useStudentReports(studentId: string, options?: { mock?: boolean }) {
  const isMock = options?.mock ?? false;
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(!isMock);
  const mockIdRef = useRef(0);

  const loadReports = useCallback(async (showLoader = false) => {
    if (isMock) {
      setIsLoading(false);
      return;
    }
    if (!studentId) return;
    if (showLoader) setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("relatorios")
        .select(
          "id, aluno_id, titulo, data_inicio, data_fim, snapshot_aluno, imagem_id, created_at, imagem:relatorio_imagens_aluno(url)",
        )
        .eq("aluno_id", studentId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReports(
        (data ?? []).map((row: any) => ({
          ...row,
          imagem_url: row.imagem?.url ?? null,
          imagem: undefined,
        })) as Report[],
      );
    } catch {
    } finally {
      if (showLoader) setIsLoading(false);
    }
  }, [studentId, isMock]);

  useEffect(() => {
    loadReports(true);
  }, [loadReports]);

  const createReport = async (data: ReportFormData): Promise<void> => {
    if (isMock) {
      mockIdRef.current += 1;
      const created: Report = {
        id: `mock-new-report-${mockIdRef.current}`,
        aluno_id: studentId,
        titulo: data.titulo,
        data_inicio: data.data_inicio,
        data_fim: data.data_fim,
        snapshot_aluno: null,
        imagem_id: null,
        imagem_url: null,
        created_at: new Date().toISOString(),
      };
      setReports((prev) => [created, ...prev]);
      return;
    }
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) throw new Error("Usuário não autenticado.");

    const { data: studentData } = await supabase
      .from("alunos")
      .select("nome_completo, altura, peso, cintura, data_nascimento, nivel_suporte, observacoes_clinicas, avatar_url")
      .eq("id", studentId)
      .single();

    const { avatar_url: avatarUrl, ...snapshot } = (studentData ?? {}) as any;

    const imagemId = await resolveReportImage(
      studentId,
      data.data_inicio,
      data.data_fim,
      avatarUrl ?? null,
    );

    const { error } = await supabase.from("relatorios").insert({
      aluno_id: studentId,
      created_by: userId,
      titulo: data.titulo,
      data_inicio: data.data_inicio,
      data_fim: data.data_fim,
      snapshot_aluno: studentData ? snapshot : null,
      imagem_id: imagemId,
    });
    if (error) throw error;
    await loadReports();
  };

  const renameReport = async (id: string, titulo: string): Promise<void> => {
    if (isMock) {
      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, titulo } : r)));
      return;
    }
    const { error } = await supabase
      .from("relatorios")
      .update({ titulo })
      .eq("id", id);
    if (error) throw error;
    await loadReports();
  };

  const deleteReport = async (id: string): Promise<void> => {
    if (isMock) {
      setReports((prev) => prev.filter((r) => r.id !== id));
      return;
    }
    const { data: report } = await supabase
      .from("relatorios")
      .select("imagem_id")
      .eq("id", id)
      .maybeSingle();

    const { error } = await supabase.from("relatorios").delete().eq("id", id);
    if (error) throw error;

    if (report?.imagem_id) {
      await reevaluateReportImage(report.imagem_id);
    }
    await loadReports();
  };

  return { reports, isLoading, refresh: loadReports, createReport, renameReport, deleteReport };
}
