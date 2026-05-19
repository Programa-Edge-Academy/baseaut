import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import { NewExerciseData } from "../components/new-exercise";

export type Exercise = {
  id: string;
  name: string;
  description: string;
  durationSeconds?: number;
  tag: string;
};

async function resolveEquipeId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membro } = await supabase
    .from("membros_equipe")
    .select("equipe_id")
    .eq("usuario_id", user.id)
    .eq("status", "ativo")
    .limit(1)
    .maybeSingle();

  if (membro?.equipe_id) return membro.equipe_id;

  const { data: equipe } = await supabase
    .from("equipes")
    .select("id")
    .eq("coordenador_id", user.id)
    .eq("ativa", true)
    .limit(1)
    .maybeSingle();

  return equipe?.id ?? null;
}

export function useExercises() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [equipeId, setEquipeId] = useState<string | null>(null);

  const loadExercises = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const teamId = await resolveEquipeId();
      if (!teamId) {
        throw new Error("Usuário não está associado a nenhuma equipe ativa.");
      }
      setEquipeId(teamId);

      // TODO: Quando as colunas forem criadas, adicionar "duracao_segundos, tag" no select
      const { data, error: fetchError } = await supabase
        .from("exercicios")
        .select("id, titulo, descricao") 
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
            
            // TODO: Descomentar abaixo quando os atributos existirem na tabela 'exercicios'
            // durationSeconds: row.duracao_segundos,
            // tag: row.tag || "Locomotor",

            // --- Valores provisórios mockados para a UI não ficar vazia até lá ---
            durationSeconds: 120, 
            tag: "Locomotor",
          }))
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

  const addExercise = async (data: NewExerciseData) => {
    setIsLoading(true);
    try {
      if (!equipeId) throw new Error("ID da equipe não identificado.");

      const payload = {
        titulo: data.name,
        descricao: data.description || null,
        equipe_id: equipeId,
        ativo: true,
        // TODO: Descomentar quando as colunas forem adicionadas no banco
        // duracao_segundos: data.durationSeconds || null,
        // tag: data.tag || null,
      };

      const { error: insertError } = await supabase.from("exercicios").insert([payload]);
      if (insertError) throw insertError;

      await loadExercises();
    } catch (err: any) {
      console.error("Erro ao adicionar exercício:", err);
      Alert.alert("Erro ao Criar", `Não foi possível salvar o exercício: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const updateExercise = async (id: string, data: NewExerciseData) => {
    setIsLoading(true);
    try {
      const payload = {
        titulo: data.name,
        descricao: data.description || null,
        // TODO: Descomentar quando as colunas forem adicionadas no banco
        // duracao_segundos: data.durationSeconds || null,
        // tag: data.tag || null,
      };

      const { error: updateError } = await supabase.from("exercicios").update(payload).eq("id", id);
      if (updateError) throw updateError;

      await loadExercises();
    } catch (err: any) {
      console.error("Erro ao atualizar exercício:", err);
      Alert.alert("Erro ao Editar", `Não foi possível atualizar o exercício: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

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

  const duplicateExercise = async (exercise: Exercise) => {
    setIsLoading(true);
    try {
      if (!equipeId) throw new Error("ID da equipe não identificado.");

      const payload = {
        titulo: `${exercise.name} (Cópia)`,
        descricao: exercise.description || null,
        equipe_id: equipeId,
        ativo: true,
        // TODO: Descomentar quando as colunas forem adicionadas no banco
        // duracao_segundos: exercise.durationSeconds || null,
        // tag: exercise.tag || null,
      };

      const { error: insertError } = await supabase.from("exercicios").insert([payload]);
      if (insertError) throw insertError;

      await loadExercises();
    } catch (err: any) {
      console.error("Erro ao duplicar exercício:", err);
      Alert.alert("Erro ao Duplicar", `Não foi possível duplicar o exercício: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    exercises,
    isLoading,
    error,
    refresh: loadExercises,
    addExercise,
    updateExercise,
    deleteExercise,
    duplicateExercise,
  };
}