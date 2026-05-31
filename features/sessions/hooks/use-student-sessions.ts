import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export interface SessionItem {
  id: string;
  title: string;
  date: string;
  status: string;
  hasPendency: boolean;
}

export interface StudentProfile {
  name: string;
}

export function useStudentSessions(studentId?: string) {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDetails = async () => {
    if (!studentId) return;

    try {
      setIsLoading(true);

      // 1. Fetch Student Name
      const { data: studentData, error: studentError } = await supabase
        .from("alunos")
        .select("nome_completo")
        .eq("id", studentId)
        .single();

      if (studentError) {
        throw studentError;
      }

      // 2. Fetch Sessions and related titles
      const { data: sessionsData, error: sessionsError } = await supabase
        .from("sessoes")
        .select(
          `
          id,
          status,
          data_inicio,
          circuito_id (titulo),
          formulario_id (titulo)
        `,
        )
        .eq("aluno_id", studentId)
        .order("data_inicio", { ascending: false });

      if (sessionsError) {
        throw sessionsError;
      }

      if (studentData) {
        setProfile({ name: studentData.nome_completo });
      }

      if (sessionsData) {
        const formatted = (sessionsData as any[]).map((item) => {
          const title =
            item.circuito_id?.titulo ||
            item.formulario_id?.titulo ||
            "Sessão sem título";

          return {
            id: item.id,
            title,
            date: item.data_inicio
              ? new Date(item.data_inicio).toLocaleDateString("pt-BR")
              : "Data não definida",
            status: item.status
              ? String(item.status).replace(/_/g, " ")
              : "Status não definido",
            hasPendency: false,
          };
        });
        setSessions(formatted);
      }
    } catch (error) {
      console.error("Error fetching student sessions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) fetchDetails();
  }, [studentId]);

  return { sessions, profile, isLoading, refetch: fetchDetails };
}
