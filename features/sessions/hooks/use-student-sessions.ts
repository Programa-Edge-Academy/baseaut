import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export interface SessionItem {
  id: string;
  title: string;
  date: string;
  status: string;
  hasPendency: boolean;
  type: "session" | "form";
  rawDate: string | null;
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

      // 2. Busca as Sessões
      const { data: sessionsData, error: sessionsError } = await supabase
        .from("sessoes")
        .select(`
          id,
          status,
          data_inicio,
          circuito_id (titulo),
          formulario_id (titulo)
        `)
        .eq("aluno_id", studentId);

      if (sessionsError) throw sessionsError;

      // 3. Busca os Formulários vinculados ao aluno
      const { data: formsData, error: formsError } = await supabase
        .from("formularios")
        .select(`
          id,
          titulo,
          created_at
        `)
        .eq("aluno_id", studentId);

      if (formsError) throw formsError;

      // 4. Formata as Sessões
      const mappedSessions: SessionItem[] = (sessionsData || []).map((item: any) => ({
        id: item.id,
        title: item.circuito_id?.titulo || item.formulario_id?.titulo || "Sessão sem título",
        date: item.data_inicio
          ? new Date(item.data_inicio).toLocaleDateString("pt-BR")
          : "Data não definida",
        status: item.status
          ? String(item.status).replace(/_/g, " ")
          : "Status não definido",
        hasPendency: false,
        type: "session",
        rawDate: item.data_inicio,
      }));

      // 5. Formata os Formulários
      const mappedForms: SessionItem[] = (formsData || []).map((item: any) => ({
        id: item.id,
        title: item.titulo || "Formulário sem título",
        date: item.created_at
          ? new Date(item.created_at).toLocaleDateString("pt-BR")
          : "Data não definida",
        status: "Formulário preenchido", // Status genérico para formulários
        hasPendency: false,
        type: "form",
        rawDate: item.created_at,
      }));

      // 6. Une as duas listas e ordena da mais recente para a mais antiga
      const combinedHistory = [...mappedSessions, ...mappedForms].sort((a, b) => {
        const dateA = a.rawDate ? new Date(a.rawDate).getTime() : 0;
        const dateB = b.rawDate ? new Date(b.rawDate).getTime() : 0;
        return dateB - dateA;
      });

      setSessions(combinedHistory);

    } catch (error) {
      console.error("Error fetching student history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) fetchDetails();
  }, [studentId]);

  return { sessions, profile, isLoading, refetch: fetchDetails };
}