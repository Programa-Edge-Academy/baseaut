import { useCallback, useEffect, useState } from "react";
// import { supabase } from "@/lib/supabase";
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
  durationSeconds?: number;
  tag: string;
};

/*
// --- TIPAGENS PARA O SUPABASE (COMENTADAS POR ENQUANTO) ---
type ExerciseRow = {
  id: string;
  titulo: string;
  descricao: string | null;
  // TODO: descomentar quando as colunas existirem na tabela 'exercicios' do banco
  // duracao_segundos: number | null;
  // tag: string | null;
};

function rowToExercise(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    name: row.titulo ?? "",
    description: row.descricao ?? "",
    durationSeconds: undefined, // row.duracao_segundos ?? undefined
    tag: "Locomotor", // row.tag ?? "Locomotor"
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
*/

const MOCK_EXERCISES: Exercise[] = [
  {
    id: "e1",
    name: "Caminhada em linha reta",
    description: "Caminhar sobre uma fita no chão mantendo o equilíbrio.",
    durationSeconds: 120,
    tag: "Locomotor",
  },
  {
    id: "e2",
    name: "Arremesso ao alvo",
    description: "Arremessar bolas de meia em um cesto a 2 metros de distância.",
    durationSeconds: 60,
    tag: "Manipulativo",
  },
  {
    id: "e3",
    name: "Aviãozinho",
    description: "Ficar em apoio unipodal com os braços abertos.",
    durationSeconds: 45,
    tag: "Estabilizador",
  }
];

export function useExercises() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [equipeId, setEquipeId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // --- CONEXÃO COM O SUPABASE (COMENTADA POR ENQUANTO) ---
      /*
      const teamId = await resolveEquipeId();
      if (!teamId) {
        throw new Error(
          "Usuário não pertence a nenhuma equipe ativa. Não é possível carregar exercícios."
        );
      }
      setEquipeId(teamId);

      const { data, error: fetchError } = await supabase
        .from("exercicios")
        .select("id, titulo, descricao") // Adicionar novos campos aqui posteriormente
        .eq("equipe_id", teamId)
        .eq("ativo", true)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setExercises(((data ?? []) as ExerciseRow[]).map(rowToExercise));
      */

      // --- MOCK LOGIC ---
      setExercises(MOCK_EXERCISES);
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
      // --- CONEXÃO COM O SUPABASE (COMENTADA POR ENQUANTO) ---
      /*
      if (!equipeId) throw new Error("Equipe ainda não carregada.");

      const { data: inserted, error: insertError } = await supabase
        .from("exercicios")
        .insert({
          titulo: data.name,
          descricao: data.description || null,
          equipe_id: equipeId,
          // duracao_segundos: data.durationSeconds || null,
          // tag: data.tag,
        })
        .select("id, titulo, descricao")
        .single();

      if (insertError) throw insertError;
      */

      // --- MOCK LOGIC ---
      const exercise: Exercise = {
        id: Math.random().toString(36).substring(2, 11),
        name: data.name,
        description: data.description,
        durationSeconds: data.durationSeconds,
        tag: data.tag || "Locomotor",
      };
      setExercises((current) => [exercise, ...current]);
    },
    [equipeId]
  );

  const updateExercise = useCallback(
    async (id: string, data: NewExerciseData) => {
      // --- CONEXÃO COM O SUPABASE (COMENTADA POR ENQUANTO) ---
      /*
      const { error: updateError } = await supabase
        .from("exercicios")
        .update({
          titulo: data.name,
          descricao: data.description || null,
          // duracao_segundos: data.durationSeconds || null,
          // tag: data.tag,
        })
        .eq("id", id);

      if (updateError) throw updateError;
      */

      // --- MOCK LOGIC ---
      setExercises((current) =>
        current.map((exercise) =>
          exercise.id === id
            ? {
                ...exercise,
                name: data.name,
                description: data.description,
                durationSeconds: data.durationSeconds,
                tag: data.tag || "Locomotor",
              }
            : exercise
        )
      );
    },
    []
  );

  const deleteExercise = useCallback(async (id: string) => {
    // --- CONEXÃO COM O SUPABASE (COMENTADA POR ENQUANTO) ---
    /*
    const { error: deleteError } = await supabase
      .from("exercicios")
      .update({ ativo: false })
      .eq("id", id);

    if (deleteError) throw deleteError;
    */

    // --- MOCK LOGIC ---
    setExercises((current) => current.filter((exercise) => exercise.id !== id));
  }, []);

  const duplicateExercise = useCallback(
    async (exercise: Exercise) => {
      // --- CONEXÃO COM O SUPABASE (COMENTADA POR ENQUANTO) ---
      /*
      await addExercise({
        name: `${exercise.name} (Cópia)`,
        description: exercise.description,
        durationSeconds: exercise.durationSeconds || 0,
        tag: exercise.tag,
      });
      */

      // --- MOCK LOGIC ---
      const duplicated: Exercise = {
        ...exercise,
        id: Math.random().toString(36).substring(2, 11),
        name: `${exercise.name} (Cópia)`,
      };
      setExercises((prev) => [duplicated, ...prev]);
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