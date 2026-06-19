import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useState } from "react";

export type StudentSnapshot = {
  nome_completo: string;
  altura: number | null;
  peso: number | null;
  cintura: number | null;
  data_nascimento: string | null;
  nivel_suporte: string | null;
  observacoes_clinicas: string | null;
};

export type Report = {
  id: string;
  aluno_id: string;
  titulo: string;
  data_inicio: string;
  data_fim: string;
  snapshot_aluno: StudentSnapshot | null;
  created_at: string;
};

export type ReportFormData = {
  titulo: string;
  data_inicio: string;
  data_fim: string;
};

export function useStudentReports(studentId: string) {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadReports = useCallback(async (showLoader = false) => {
    if (!studentId) return;
    if (showLoader) setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("relatorios")
        .select("id, aluno_id, titulo, data_inicio, data_fim, snapshot_aluno, created_at")
        .eq("aluno_id", studentId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReports((data ?? []) as Report[]);
    } catch (err) {
      console.error("Erro ao carregar relatórios:", err);
    } finally {
      if (showLoader) setIsLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    loadReports(true);
  }, [loadReports]);

  const createReport = async (data: ReportFormData): Promise<void> => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) throw new Error("Usuário não autenticado.");

    const { data: studentData } = await supabase
      .from("alunos")
      .select("nome_completo, altura, peso, cintura, data_nascimento, nivel_suporte, observacoes_clinicas")
      .eq("id", studentId)
      .single();

    const { error } = await supabase.from("relatorios").insert({
      aluno_id: studentId,
      created_by: userId,
      titulo: data.titulo,
      data_inicio: data.data_inicio,
      data_fim: data.data_fim,
      snapshot_aluno: studentData ?? null,
    });
    if (error) throw error;
    await loadReports();
  };

  const renameReport = async (id: string, titulo: string): Promise<void> => {
    const { error } = await supabase
      .from("relatorios")
      .update({ titulo })
      .eq("id", id);
    if (error) throw error;
    await loadReports();
  };

  const deleteReport = async (id: string): Promise<void> => {
    const { error } = await supabase.from("relatorios").delete().eq("id", id);
    if (error) throw error;
    await loadReports();
  };

  return { reports, isLoading, refresh: loadReports, createReport, renameReport, deleteReport };
}
