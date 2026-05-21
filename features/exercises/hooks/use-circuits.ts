import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import { Exercise } from "./use-exercises";

/**
 * Defines the possible circuit types matching the database enum.
 */
export type CircuitType = "padrao" | "mabc_1" | "mabc_2" | "mabc_3";

/**
 * Defines the possible execution modes matching the database enum.
 */
export type ExecutionMode = "estruturado" | "livre";

/**
 * Represents the Circuit domain model used by the UI.
 */
export type Circuit = {
  id: string;
  name: string;
  description: string | null;
  formId: string | null;
  type: CircuitType;
  executionMode: ExecutionMode;
  exercisesCount: number; 
  exercisesSummary: string; 
  exercises: Exercise[];
};

/**
 * Resolves the active team ID for the current authenticated user.
 * @returns A Promise that resolves to the team ID string, or null if not found.
 */
async function resolveEquipeId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: member } = await supabase
    .from("membros_equipe")
    .select("equipe_id")
    .eq("usuario_id", user.id)
    .eq("status", "ativo")
    .limit(1)
    .maybeSingle();

  if (member?.equipe_id) return member.equipe_id;

  const { data: team } = await supabase
    .from("equipes")
    .select("id")
    .eq("coordenador_id", user.id)
    .eq("ativa", true)
    .limit(1)
    .maybeSingle();

  return team?.id ?? null;
}

/**
 * Custom hook that provides CRUD operations and state management for circuits.
 */
export function useCircuits() {
  const [circuits, setCircuits] = useState<Circuit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [equipeId, setEquipeId] = useState<string | null>(null);

  /**
   * Fetches the list of active circuits using real database columns 'tipo' and 'modo_execucao'.
   */
  const loadCircuits = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const teamId = await resolveEquipeId();
      if (!teamId) {
        throw new Error("User is not associated with any active team.");
      }
      setEquipeId(teamId);

      const { data, error: fetchError } = await supabase
        .from("circuitos")
        .select(`
          id, 
          titulo, 
          descricao, 
          formulario_id,
          tipo,
          modo_execucao,
          itens_circuito (
            ordem,
            exercicios (
              id,
              titulo,
              descricao
            )
          )
        `)
        .eq("equipe_id", teamId)
        .eq("ativo", true)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      if (data) {
        setCircuits(
          data.map((row: any) => {
            const sortedItems = (row.itens_circuito || []).sort((a: any, b: any) => a.ordem - b.ordem);
            
            const summary = sortedItems
              .map((item: any) => item.exercicios?.titulo)
              .filter(Boolean)
              .join(", ");

            const mappedExercises: Exercise[] = sortedItems
              .map((item: any) => ({
                id: item.exercicios?.id,
                name: item.exercicios?.titulo,
                description: item.exercicios?.descricao || "",
                durationSeconds: 120,
                tag: "Locomotor",
              }))
              .filter((ex) => ex.id);

            return {
              id: row.id,
              name: row.titulo,
              description: row.descricao,
              formId: row.formulario_id,
              type: row.tipo || "padrao",
              executionMode: row.modo_execucao || "estruturado",
              exercisesCount: sortedItems.length,
              exercisesSummary: summary || "Sem exercícios vinculados",
              exercises: mappedExercises,
            };
          })
        );
      }
    } catch (caught: any) {
      setError(caught);
      console.error("Error loading circuits:", caught);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCircuits();
  }, [loadCircuits]);

  /**
   * Creates a new circuit with execution mode properties.
   */
  const addCircuit = async (data: { 
    name: string; 
    type: CircuitType; 
    executionMode: ExecutionMode; 
    form: string | null; 
    exercises: Exercise[] 
  }) => {
    setIsLoading(true);
    try {
      if (!equipeId) throw new Error("Team ID not identified.");

      const payload = {
        titulo: data.name,
        descricao: null,
        equipe_id: equipeId,
        ativo: true,
        formulario_id: data.form, 
        tipo: data.type,
        modo_execucao: data.executionMode,
      };

      const { data: insertedCircuit, error: insertError } = await supabase
        .from("circuitos")
        .insert([payload])
        .select()
        .single();
        
      if (insertError) throw insertError;

      if (data.exercises.length > 0) {
        const itemsPayload = data.exercises.map((ex, index) => ({
          circuito_id: insertedCircuit.id,
          exercicio_id: ex.id,
          ordem: index + 1,
        }));

        const { error: itemsError } = await supabase
          .from("itens_circuito")
          .insert(itemsPayload);

        if (itemsError) throw itemsError;
      }

      await loadCircuits();
    } catch (err: any) {
      console.error("Error adding circuit:", err);
      Alert.alert("Erro ao Criar", `Não foi possível salvar o circuito: ${err.message}`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Updates an existing circuit properties and rebuilds relational items.
   */
  const updateCircuit = async (id: string, data: { 
    name: string; 
    type: CircuitType; 
    executionMode: ExecutionMode; 
    form: string | null; 
    exercises: Exercise[] 
  }) => {
    setIsLoading(true);
    try {
      const payload = {
        titulo: data.name,
        tipo: data.type,
        modo_execucao: data.executionMode,
        formulario_id: data.form,
      };

      const { error: updateError } = await supabase
        .from("circuitos")
        .update(payload)
        .eq("id", id);
        
      if (updateError) throw updateError;

      const { error: deleteItemsError } = await supabase
        .from("itens_circuito")
        .delete()
        .eq("circuito_id", id);

      if (deleteItemsError) throw deleteItemsError;

      if (data.exercises.length > 0) {
        const itemsPayload = data.exercises.map((ex, index) => ({
          circuito_id: id,
          exercicio_id: ex.id,
          ordem: index + 1,
        }));

        const { error: itemsError } = await supabase
          .from("itens_circuito")
          .insert(itemsPayload);

        if (itemsError) throw itemsError;
      }

      await loadCircuits();
    } catch (err: any) {
      console.error("Error updating circuit:", err);
      Alert.alert("Erro ao Editar", `Não foi possível atualizar o circuito: ${err.message}`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Performs standard soft delete for active circuits.
   */
  const deleteCircuit = async (id: string) => {
    setIsLoading(true);
    try {
      const { error: deleteError } = await supabase
        .from("circuitos")
        .update({ ativo: false })
        .eq("id", id);

      if (deleteError) throw deleteError;
      await loadCircuits();
    } catch (err: any) {
      console.error("Error disabling circuit:", err);
      Alert.alert("Erro ao Remover", err.message);
    } finally {
      setIsLoading(false);
    }
  };

/**
   * Duplicates an existing circuit properties and rebuilds relational items.
   */
  const duplicateCircuit = async (circuit: Circuit) => {
    setIsLoading(true);
    try {
      if (!equipeId) throw new Error("Team ID not identified.");

      // Copia os dados principais do circuito com sufixo no nome
      const payload = {
        titulo: `${circuit.name} (Cópia)`,
        descricao: circuit.description,
        equipe_id: equipeId,
        ativo: true,
        formulario_id: circuit.formId, 
        tipo: circuit.type,
        modo_execucao: circuit.executionMode,
      };

      const { data: insertedCircuit, error: insertError } = await supabase
        .from("circuitos")
        .insert([payload])
        .select()
        .single();
        
      if (insertError) throw insertError;

      // Duplica os vínculos com os exercícios se existirem
      if (circuit.exercises.length > 0) {
        const itemsPayload = circuit.exercises.map((ex, index) => ({
          circuito_id: insertedCircuit.id,
          exercicio_id: ex.id,
          ordem: index + 1,
        }));

        const { error: itemsError } = await supabase
          .from("itens_circuito")
          .insert(itemsPayload);

        if (itemsError) throw itemsError;
      }

      await loadCircuits();
    } catch (err: any) {
      console.error("Error duplicating circuit:", err);
      Alert.alert("Erro ao Duplicar", `Não foi possível duplicar o circuito: ${err.message}`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    circuits,
    isLoading,
    error,
    refresh: loadCircuits,
    addCircuit,
    updateCircuit,
    deleteCircuit,
    duplicateCircuit,
  };
}