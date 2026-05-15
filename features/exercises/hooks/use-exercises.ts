import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { NewExerciseData } from "../components/new-exercise";

/**
 * Local view-model of an exercise.
 *
 * NOTE: `durationSeconds` and `tag` are kept in client state only. The
 * `exercicios` table currently has no columns for them, so they are not
 * persisted and will be lost on reload.
 *
 * TODO: when the schema gains `duracao_segundos` and `tag` columns
 * (via `supabase migration new add_duracao_e_tag_to_exercicios`),
 * include them in the SELECT/INSERT/UPDATE payloads below.
 */
export type Exercise = {
  id: string;
  name: string;
  description: string;
  durationSeconds: number;
  tag: string | null;
};

type ExerciseRow = {
  id: string;
  titulo: string;
  descricao: string | null;
};

function rowToExercise(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    name: row.titulo ?? "",
    description: row.descricao ?? "",
    durationSeconds: 0,
    tag: null,
  };
}

async function resolveEquipeId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("membros_equipe")
    .select("equipe_id")
    .eq("usuario_id", user.id)
    .eq("status", "ativo")
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data?.equipe_id as string | undefined) ?? null;
}

export function useExercises() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [equipeId, setEquipeId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const teamId = await resolveEquipeId();
      if (!teamId) {
        throw new Error(
          "Usuário não pertence a nenhuma equipe ativa. Não é possível carregar exercícios."
        );
      }
      setEquipeId(teamId);

      const { data, error: fetchError } = await supabase
        .from("exercicios")
        .select("id, titulo, descricao")
        .eq("equipe_id", teamId)
        .eq("ativo", true)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setExercises(((data ?? []) as ExerciseRow[]).map(rowToExercise));
    } catch (caught) {
      setError(caught as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const addExercise = useCallback(
    async (data: NewExerciseData) => {
      if (!equipeId) throw new Error("Equipe ainda não carregada.");

      const { data: inserted, error: insertError } = await supabase
        .from("exercicios")
        .insert({
          titulo: data.name,
          descricao: data.description || null,
          equipe_id: equipeId,
        })
        .select("id, titulo, descricao")
        .single();

      if (insertError) throw insertError;

      const exercise: Exercise = {
        ...rowToExercise(inserted as ExerciseRow),
        durationSeconds: data.durationSeconds,
        tag: data.tag,
      };
      setExercises((current) => [exercise, ...current]);
    },
    [equipeId]
  );

  const updateExercise = useCallback(
    async (id: string, data: NewExerciseData) => {
      const { error: updateError } = await supabase
        .from("exercicios")
        .update({
          titulo: data.name,
          descricao: data.description || null,
        })
        .eq("id", id);

      if (updateError) throw updateError;

      setExercises((current) =>
        current.map((exercise) =>
          exercise.id === id
            ? {
                ...exercise,
                name: data.name,
                description: data.description,
                durationSeconds: data.durationSeconds,
                tag: data.tag,
              }
            : exercise
        )
      );
    },
    []
  );

  const deleteExercise = useCallback(async (id: string) => {
    const { error: deleteError } = await supabase
      .from("exercicios")
      .update({ ativo: false })
      .eq("id", id);

    if (deleteError) throw deleteError;

    setExercises((current) => current.filter((exercise) => exercise.id !== id));
  }, []);

  const duplicateExercise = useCallback(
    async (exercise: Exercise) => {
      await addExercise({
        name: exercise.name,
        description: exercise.description,
        durationSeconds: exercise.durationSeconds,
        tag: exercise.tag,
      });
    },
    [addExercise]
  );

  return {
    exercises,
    isLoading,
    error,
    refresh: load,
    addExercise,
    updateExercise,
    deleteExercise,
    duplicateExercise,
  };
}
