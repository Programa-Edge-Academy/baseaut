import { supabase } from "@/lib/supabase";
import { resolveEquipeId } from "@/lib/resolve-equipe-id";
import { useCallback, useEffect, useState } from "react";
import { Alert, Platform } from "react-native";
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

  const uploadIcon = async (uri: string) => {
    try {
      const filePath = `${Date.now()}_icon.jpg`;
      let fileData: any;

      if (Platform.OS === "web") {
        const response = await fetch(uri);
        fileData = await response.blob();
      } else {
        const FileSystem = require("expo-file-system/legacy");
        const { decode } = require("base64-arraybuffer");
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: "base64",
        });
        fileData = decode(base64);
      }

      const { data, error: uploadError } = await supabase.storage
        .from("exercicio-media")
        .upload(filePath, fileData, { contentType: "image/jpeg" });

      if (uploadError) throw uploadError;

      if (data) {
        const {
          data: { publicUrl },
        } = supabase.storage.from("exercicio-media").getPublicUrl(filePath);
        return publicUrl;
      }
      return null;
    } catch (e) {
      console.error("Erro no upload do ícone:", e);
      return null;
    }
  };

  /**
   * Loads exercises for the active team.
   */
  const loadExercises = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const teamId = await resolveEquipeId();
      if (!teamId) {
        throw new Error("Usuário não está associado a nenhuma equipe ativa.");
      }
      setEquipeId(teamId);

      const { data, error: fetchError } = await supabase
        .from("exercicios")
        .select("id, titulo, descricao, duracao_segundos, tag, icone_url")
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
            tag: row.tag || "Locomotor",
            iconUrl: row.icone_url,
          })),
        );
      }
    } catch (caught: any) {
      setError(caught);
      console.error("Erro ao carregar exercícios:", caught);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExercises();
  }, [loadExercises]);

  /**
   * Creates a new exercise.
   */
  const addExercise = async (
    data: NewExerciseData,
    photoUri?: string | null,
  ) => {
    setIsLoading(true);
    try {
      if (!equipeId) throw new Error("ID da equipe não identificado.");
      let finalIconUrl = null;
      if (photoUri && !photoUri.startsWith("http")) {
        finalIconUrl = await uploadIcon(photoUri);
      }

      const payload = {
        titulo: data.name,
        descricao: data.description || null,
        equipe_id: equipeId,
        ativo: true,
        duracao_segundos: data.durationSeconds || null,
        tag: data.tag || null,
        icone_url: finalIconUrl,
      };

      const { error: insertError } = await supabase
        .from("exercicios")
        .insert([payload]);
      if (insertError) throw insertError;

      await loadExercises();
    } catch (err: any) {
      console.error("Erro ao adicionar exercício:", err);
      Alert.alert(
        "Erro ao Criar",
        `Não foi possível salvar o exercício: ${err.message}`,
      );
    } finally {
      setIsLoading(false);
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
    setIsLoading(true);
    try {
      const payload: any = {
        titulo: data.name,
        descricao: data.description || null,
        duracao_segundos: data.durationSeconds || null,
        tag: data.tag || null,
      };

      if (photoUri && !photoUri.startsWith("http")) {
        payload.icone_url = await uploadIcon(photoUri);
      } else if (photoUri === null) {
        payload.icone_url = null;
      }

      const { error: updateError } = await supabase
        .from("exercicios")
        .update(payload)
        .eq("id", id);
      if (updateError) throw updateError;

      await loadExercises();
    } catch (err: any) {
      console.error("Erro ao atualizar exercício:", err);
      Alert.alert(
        "Erro ao Editar",
        `Não foi possível atualizar o exercício: ${err.message}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Soft-deletes an exercise.
   */
  const deleteExercise = async (id: string) => {
    setIsLoading(true);
    try {
      const { error: deleteError } = await supabase
        .from("exercicios")
        .update({ ativo: false })
        .eq("id", id);

      if (deleteError) throw deleteError;
      await loadExercises();
    } catch (err: any) {
      console.error("Erro ao inativar exercício:", err);
      Alert.alert("Erro ao Remover", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Duplicates an exercise with a copy suffix.
   */
  const duplicateExercise = async (exercise: Exercise) => {
    setIsLoading(true);
    try {
      if (!equipeId) throw new Error("ID da equipe não identificado.");

      const payload = {
        titulo: `${exercise.name} (Cópia)`,
        descricao: exercise.description || null,
        equipe_id: equipeId,
        ativo: true,
        duracao_segundos: exercise.durationSeconds || null,
        tag: exercise.tag || null,
        icone_url: exercise.iconUrl || null,
      };

      const { error: insertError } = await supabase
        .from("exercicios")
        .insert([payload]);
      if (insertError) throw insertError;

      await loadExercises();
    } catch (err: any) {
      console.error("Erro ao duplicar exercício:", err);
      Alert.alert(
        "Erro ao Duplicar",
        `Não foi possível duplicar o exercício: ${err.message}`,
      );
    } finally {
      setIsLoading(false);
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
