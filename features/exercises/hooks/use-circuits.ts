import { supabase } from "@/lib/supabase";
import { resolveEquipeId } from "@/lib/resolve-equipe-id";
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
export type ExecutionMode = "estruturado" | "semi-estruturado";

/**
 * Resolve o template global do Registro de Controle pelo tipo (sem ID fixo).
 * Vinculá-lo ao circuito faz o trigger de sessão criar uma instância de RC por
 * sessão e preencher sessoes.formulario_id automaticamente.
 */
async function resolveRcTemplateId(): Promise<string | null> {
  const { data } = await supabase
    .from("formularios")
    .select("id")
    .eq("tipo", "registro_controle")
    .is("aluno_id", null)
    .order("protegido", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.id ?? null;
}

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
 * Seeds fixed MABC-2 circuits and their corresponding exercises for a team.
 * @param teamId The active team ID to seed the circuits for.
 */
async function seedMabcCircuits(teamId: string): Promise<void> {
  try {
    const { data: existing, error: checkError } = await supabase
      .from("circuitos")
      .select("tipo")
      .eq("equipe_id", teamId)
      .eq("ativo", true)
      .in("tipo", ["mabc_1", "mabc_2", "mabc_3"]);

    if (checkError) {
      console.error("[Seeding] Error checking existing MABC circuits:", checkError);
      return;
    }

    const existingTypes = new Set(existing?.map((c) => c.tipo) || []);

    const bandsToSeed = [
      {
        tipo: "mabc_1" as const,
        titulo: "MABC-2 (3 a 6 anos)",
        descricao: "Avaliação MABC-2 para crianças de 3 a 6 anos (Faixa Etária 1).",
        exercicios: [
          { titulo: "Colocar moedas no cofre", descricao: "Colocar moedas no cofre com a mão preferida e não preferida." },
          { titulo: "Entrelaçar cubos com o cordão", descricao: "Entrelaçar cubos com o cordão." },
          { titulo: "Desenhar o caminho", descricao: "Desenhar o caminho sem sair dos limites." },
          { titulo: "Pegar o saquinho de feijão", descricao: "Pegar o saquinho de feijão lançado pelo avaliador." },
          { titulo: "Arremessar o saquinho de feijão no tapete", descricao: "Arremessar o saquinho de feijão no tapete alvo." },
          { titulo: "Equilíbrio em uma perna só", descricao: "Equilibrar-se em uma perna só (Melhor e Outra perna)." },
          { titulo: "Caminhar na ponta dos pés", descricao: "Caminhar na ponta dos pés sobre a linha." },
          { titulo: "Saltar nos tapetes", descricao: "Saltar de tapete em tapete nos alvos." },
        ],
      },
      {
        tipo: "mabc_2" as const,
        titulo: "MABC-2 (7 a 10 anos)",
        descricao: "Avaliação MABC-2 para crianças de 7 a 10 anos (Faixa Etária 2).",
        exercicios: [
          { titulo: "Colocar pinos no tabuleiro", descricao: "Colocar pinos no tabuleiro com a mão preferida e não preferida." },
          { titulo: "Entrelaçar o cordão", descricao: "Entrelaçar o cordão na prancha perfurada." },
          { titulo: "Desenhar o caminho", descricao: "Desenhar o caminho na folha de registro." },
          { titulo: "Pegar com as duas mãos", descricao: "Pegar a bola lançada com as duas mãos." },
          { titulo: "Arremessar o saquinho de feijão no tapete", descricao: "Arremessar o saquinho de feijão no tapete alvo." },
          { titulo: "Equilíbrio sobre a prancha", descricao: "Equilibrar-se sobre a prancha em um pé só (Melhor e Outra perna)." },
          { titulo: "Caminhar para frente (Calcanhar-dedos)", descricao: "Caminhar para frente tocando calcanhar no dedo sobre a linha." },
          { titulo: "Saltar com um pé nos tapetes", descricao: "Saltar com um pé nos tapetes alvos (Melhor e Outra perna)." },
        ],
      },
      {
        tipo: "mabc_3" as const,
        titulo: "MABC-2 (11 a 16 anos)",
        descricao: "Avaliação MABC-2 para adolescentes de 11 a 16 anos (Faixa Etária 3).",
        exercicios: [
          { titulo: "Virar pinos", descricao: "Virar pinos no tabuleiro com a mão preferida e não preferida." },
          { titulo: "Triângulo com porcas e parafusos", descricao: "Montar o triângulo usando porcas e parafusos." },
          { titulo: "Desenhar caminho", descricao: "Desenhar o caminho com a caneta no papel de registro." },
          { titulo: "Pegar com uma mão", descricao: "Pegar a bola lançada com uma das mãos (Melhor e Outra mão)." },
          { titulo: "Arremessar em um alvo na parede", descricao: "Arremessar a bola contra um alvo na parede." },
          { titulo: "Equilíbrio sobre duas pranchas", descricao: "Equilibrar-se sobre duas pranchas em um pé só." },
          { titulo: "Caminhar para trás (Dedos-calcanhar)", descricao: "Caminhar para trás tocando o calcanhar nos dedos sobre a linha." },
          { titulo: "Saltar com um pé em Zique-zague", descricao: "Saltar com um pé em zique-zague sobre os tapetes alvos (Melhor e Outra perna)." },
        ],
      },
    ];

    for (const band of bandsToSeed) {
      if (existingTypes.has(band.tipo)) {
        continue;
      }

      console.log(`[Seeding] Starting seeding for MABC circuit type: ${band.tipo} in team: ${teamId}`);

      // Insert exercises
      const exercisesPayload = band.exercicios.map((ex) => ({
        titulo: ex.titulo,
        descricao: ex.descricao,
        equipe_id: teamId,
        ativo: true,
        duracao_segundos: null,
        tag: null,
        icone_url: null,
      }));

      const { data: insertedExercises, error: excError } = await supabase
        .from("exercicios")
        .insert(exercisesPayload)
        .select("id, titulo");

      if (excError) {
        console.error(`[Seeding] Error inserting exercises for MABC circuit ${band.tipo}:`, excError);
        continue;
      }

      if (!insertedExercises || insertedExercises.length === 0) {
        console.error(`[Seeding] No exercises were returned for MABC circuit ${band.tipo}`);
        continue;
      }

      // Insert circuit
      const { data: insertedCircuit, error: circError } = await supabase
        .from("circuitos")
        .insert({
          titulo: band.titulo,
          descricao: band.descricao,
          equipe_id: teamId,
          ativo: true,
          tipo: band.tipo,
          modo_execucao: "estruturado",
        })
        .select("id")
        .single();

      if (circError) {
        if (circError.code === "23505") {
          // Another client seeded this circuit concurrently; clean up orphaned exercises.
          const orphanIds = insertedExercises.map((ex) => ex.id);
          await supabase.from("exercicios").delete().in("id", orphanIds);
        } else {
          console.error(`[Seeding] Error inserting MABC circuit ${band.tipo}:`, circError);
        }
        continue;
      }

      // Link exercises in circuit items
      const exerciseOrderMap = new Map(band.exercicios.map((ex, index) => [ex.titulo, index + 1]));

      const itemsPayload = insertedExercises.map((inserted) => {
        const order = exerciseOrderMap.get(inserted.titulo) || 1;
        return {
          circuito_id: insertedCircuit.id,
          exercicio_id: inserted.id,
          ordem: order,
        };
      });

      const { error: itemsError } = await supabase
        .from("itens_circuito")
        .insert(itemsPayload);

      if (itemsError) {
        console.error(`[Seeding] Error linking exercises to MABC circuit ${band.tipo}:`, itemsError);
      } else {
        console.log(`[Seeding] Successfully seeded MABC circuit ${band.tipo} with ${insertedExercises.length} exercises.`);
      }
    }
  } catch (err) {
    console.error("[Seeding] Unexpected error during MABC seeding:", err);
  }
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
  const loadCircuits = useCallback(async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    setError(null);

    try {
      const teamId = await resolveEquipeId();
      if (!teamId) {
        throw new Error("User is not associated with any active team.");
      }
      setEquipeId(teamId);

      // Seed MABC circuits if missing
      await seedMabcCircuits(teamId);

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
              descricao,
              duracao_segundos,
              tag,
              icone_url
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
                durationSeconds: item.exercicios?.duracao_segundos ?? undefined,
                tag: item.exercicios?.tag || "Locomotor",
                iconUrl: item.exercicios?.icone_url ?? null,
              }))
              .filter((ex: any) => ex.id);

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
      if (showLoader) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCircuits(true);
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
    try {
      if (!equipeId) throw new Error("Team ID not identified.");

      // Circuitos comuns (padrão) recebem o template de RC para o trigger de
      // sessão gerar a instância do registro de controle. MABC tem fluxo próprio.
      const formId =
        data.form ??
        (data.type === "padrao" ? await resolveRcTemplateId() : null);

      const payload = {
        titulo: data.name,
        descricao: null,
        equipe_id: equipeId,
        ativo: true,
        formulario_id: formId,
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

      await loadCircuits(false);
    } catch (err: any) {
      console.error("Error adding circuit:", err);
      Alert.alert("Erro ao Criar", `Não foi possível salvar o circuito: ${err.message}`);
      throw err;
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
    try {
      const formId =
        data.form ??
        (data.type === "padrao" ? await resolveRcTemplateId() : null);

      const payload = {
        titulo: data.name,
        tipo: data.type,
        modo_execucao: data.executionMode,
        formulario_id: formId,
      };

      const { error: updateError } = await supabase
        .from("circuitos")
        .update(payload)
        .eq("id", id);

      if (updateError) throw updateError;

      const itemsPayload = data.exercises.map((ex, index) => ({
        exercicio_id: ex.id,
        ordem: index + 1,
      }));

      const { error: rpcError } = await supabase.rpc("substituir_itens_circuito", {
        p_circuito_id: id,
        p_itens: itemsPayload,
      });

      if (rpcError) throw rpcError;

      await loadCircuits(false);
    } catch (err: any) {
      console.error("Error updating circuit:", err);
      Alert.alert("Erro ao Editar", `Não foi possível atualizar o circuito: ${err.message}`);
      throw err;
    }
  };

  /**
   * Performs standard soft delete for active circuits.
   */
  const deleteCircuit = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from("circuitos")
        .update({ ativo: false })
        .eq("id", id);

      if (deleteError) throw deleteError;
      await loadCircuits(false);
    } catch (err: any) {
      console.error("Error disabling circuit:", err);
      Alert.alert("Erro ao Remover", err.message);
    }
  };

  /**
     * Duplicates an existing circuit properties and rebuilds relational items.
     */
  const duplicateCircuit = async (circuit: Circuit) => {
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

      await loadCircuits(false);
    } catch (err: any) {
      console.error("Error duplicating circuit:", err);
      Alert.alert("Erro ao Duplicar", `Não foi possível duplicar o circuito: ${err.message}`);
      throw err;
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