import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

/** Student profile fields used across session screens. */
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

/** Maps a stored support level code to its display label. */
function formatSupportLevel(level: string | null): string | null {
  if (!level) return null;
  if (level === "nivel_1") return "Nível 1";
  if (level === "nivel_2") return "Nível 2";
  if (level === "nivel_3") return "Nível 3";
  return level;
}

/** Loads a student's profile by id, returning it with a loading flag. */
export function useStudentProfile(studentId?: string) {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!studentId) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("alunos")
          .select("nome_completo, avatar_url, altura, peso, cintura, data_nascimento, nivel_suporte, observacoes_clinicas")
          .eq("id", studentId)
          .single();

        if (error) throw error;
        if (cancelled) return;

        setProfile(data ? {
          name: data.nome_completo,
          avatarUrl: data.avatar_url,
          height: data.altura ? Number(data.altura) : null,
          weight: data.peso ? Number(data.peso) : null,
          waist: data.cintura ? Number(data.cintura) : null,
          birthDate: data.data_nascimento ?? null,
          supportLevel: formatSupportLevel(data.nivel_suporte),
          observations: data.observacoes_clinicas ?? null,
        } : null);
      } catch {
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [studentId]);

  return { profile, isLoading };
}
