import { supabase } from "@/lib/supabase";
import { resolveEquipeId } from "@/lib/resolve-equipe-id";
import { uploadImage } from "@/lib/upload-image";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import { NewExerciseData } from "../components/new-exercise";

/**
 * Exercise domain model used by the UI.
 */
export type Exercise = {
  id: string;
  name: string;
  description: string;
  durationSeconds?: number;
  tag: string;
  subtags?: string[];
  iconUrl?: string | null;
};

/**
 * Provides CRUD operations and state for exercises.
 */
export function useExercises() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [equipeId, setEquipeId] = useState<string | null>(null);

  /**
   * Loads exercises for the active team.
   */
  const loadExercises = useCallback(async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    setError(null);
    try {
      const teamId = await resolveEquipeId();
      if (!teamId) {
        throw new Error("Usuário não está associado a nenhuma equipe ativa.");
      }
      setEquipeId(teamId);

      const { data, error: fetchError } = await supabase
        .from("exercicios")
        .select("id, titulo, descricao, duracao_segundos, tag, subtags, icone_url")
        .eq("equipe_id", teamId)
        .eq("ativo", true)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      if (data) {
        setExercises(
          data.map((row) => ({
            id: row.id,
            name: row.titulo,
            description: row.descricao || "",
            durationSeconds: row.duracao_segundos,
            tag: row.tag || "Coordenação",
            subtags: row.subtags || ["estabilizador"],
            iconUrl: row.icone_url,
          })),
        );
      }
    } catch (caught: any) {
      setError(caught);
      console.error("Erro ao carregar exercícios:", caught);
    } finally {
      if (showLoader) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExercises(true);
  }, [loadExercises]);

  /**
   * Creates a new exercise.
   */
  const addExercise = async (
    data: NewExerciseData,
    photoUri?: string | null,
  ) => {
    try {
      if (!equipeId) throw new Error("ID da equipe não identificado.");
      let finalIconUrl = null;
      if (photoUri && !photoUri.startsWith("http")) {
        finalIconUrl = await uploadImage("exercicio-media", photoUri, "icons");
      }

      const payload = {
        titulo: data.name,
        descricao: data.description || null,
        equipe_id: equipeId,
        ativo: true,
        duracao_segundos: data.durationSeconds || null,
        tag: data.tag || null,
        subtags: data.subtags,
        icone_url: finalIconUrl,
      };

      const { error: insertError } = await supabase
        .from("exercicios")
        .insert([payload]);
      if (insertError) throw insertError;

      await loadExercises(false);
    } catch (err: any) {
      console.error("Erro ao adicionar exercício:", err);
      Alert.alert(
        "Erro ao Criar",
        `Não foi possível salvar o exercício: ${err.message}`,
      );
    }
  };

  /**
   * Updates an existing exercise.
   */
  const updateExercise = async (
    id: string,
    data: NewExerciseData,
    photoUri?: string | null,
  ) => {
    try {
      const payload: any = {
        titulo: data.name,
        descricao: data.description || null,
        duracao_segundos: data.durationSeconds || null,
        tag: data.tag || null,
        subtags: data.subtags,
      };

      if (photoUri && !photoUri.startsWith("http")) {
        payload.icone_url = await uploadImage("exercicio-media", photoUri, "icons");
      } else if (photoUri === null) {
        payload.icone_url = null;
      }

      const { error: updateError } = await supabase
        .from("exercicios")
        .update(payload)
        .eq("id", id);
      if (updateError) throw updateError;

      await loadExercises(false);
    } catch (err: any) {
      console.error("Erro ao atualizar exercício:", err);
      Alert.alert(
        "Erro ao Editar",
        `Não foi possível atualizar o exercício: ${err.message}`,
      );
    }
  };

  /**
   * Soft-deletes an exercise.
   */
  const deleteExercise = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from("exercicios")
        .update({ ativo: false })
        .eq("id", id);

      if (deleteError) throw deleteError;
      await loadExercises(false);
    } catch (err: any) {
      console.error("Erro ao inativar exercício:", err);
      Alert.alert("Erro ao Remover", err.message);
    }
  };

  /**
   * Duplicates an exercise with a copy suffix.
   */
  const duplicateExercise = async (exercise: Exercise) => {
    try {
      if (!equipeId) throw new Error("ID da equipe não identificado.");

      const payload = {
        titulo: `${exercise.name} (Cópia)`,
        descricao: exercise.description || null,
        equipe_id: equipeId,
        ativo: true,
        duracao_segundos: exercise.durationSeconds || null,
        tag: exercise.tag || null,
        subtags: exercise.subtags || ["estabilizador"],
        icone_url: exercise.iconUrl || null,
      };

      const { error: insertError } = await supabase
        .from("exercicios")
        .insert([payload]);
      if (insertError) throw insertError;

      await loadExercises(false);
    } catch (err: any) {
      console.error("Erro ao duplicar exercício:", err);
      Alert.alert(
        "Erro ao Duplicar",
        `Não foi possível duplicar o exercício: ${err.message}`,
      );
    }
  };

  /**
   * Returns how many circuits reference the given exercise.
   */
  async function getExerciseCircuitCount(id: string) {
    try {
      const { data, count, error } = await supabase
        .from("itens_circuito")
        .select("circuito_id", { count: "exact" })
        .eq("exercicio_id", id);

      if (error) throw error;
      // prefer count when available, fallback to data length
      return typeof count === "number" ? count : data ? data.length : 0;
    } catch (err) {
      console.error("Erro ao verificar vínculos do exercício:", err);
      return 0;
    }
  }

  return {
    exercises,
    isLoading,
    error,
    refresh: loadExercises,
    addExercise,
    updateExercise,
    deleteExercise,
    getExerciseCircuitCount,
    duplicateExercise,
  };
}
