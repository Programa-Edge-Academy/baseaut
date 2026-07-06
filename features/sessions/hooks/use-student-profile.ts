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

/** Seed profile for the tutorial's mock analysis screens. */
const MOCK_PROFILE: StudentProfile = {
  name: "Ana Beatriz",
  avatarUrl: null,
  height: 122,
  weight: 28,
  waist: 54,
  birthDate: "2017-03-12",
  supportLevel: "Nível 2",
  observations: null,
};

/**
 * Loads a student's profile by id, returning it with a loading flag.
 *
 * @param options - Pass `{ mock: true }` (tutorial only) for a seeded profile.
 */
export function useStudentProfile(studentId?: string, options?: { mock?: boolean }) {
  const isMock = options?.mock ?? false;
  const [profile, setProfile] = useState<StudentProfile | null>(isMock ? MOCK_PROFILE : null);
  const [isLoading, setIsLoading] = useState(!isMock);

  useEffect(() => {
    if (isMock) {
      setIsLoading(false);
      return;
    }
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
  }, [studentId, isMock]);

  return { profile, isLoading };
}
