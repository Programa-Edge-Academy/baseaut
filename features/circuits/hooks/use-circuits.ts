import { supabase } from "@/lib/supabase";
import type { TranslationKey } from "@/features/settings/constants/translations";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import { resolveEquipeId } from "@/lib/resolve-equipe-id";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import { Exercise } from "@/features/exercises/hooks/use-exercises";

/**
 * Defines the possible circuit types matching the database enum.
 */
export type CircuitType = "padrao" | "mabc_1" | "mabc_2" | "mabc_3";

/**
 * Defines the possible execution modes matching the database enum.
 */
export type ExecutionMode = "estruturado" | "semi-estruturado";

/**
 * Resolves the global Control Record template by type (without a hardcoded ID).
 * Linking it to a circuit makes the session trigger create a per-session Control
 * Record instance and populate `sessoes.formulario_id` automatically.
 *
 * @returns The template's id, or null when none exists.
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
        continue;
      }

      if (!insertedExercises || insertedExercises.length === 0) {
        continue;
      }

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
          const orphanIds = insertedExercises.map((ex) => ex.id);
          await supabase.from("exercicios").delete().in("id", orphanIds);
        }
        continue;
      }

      const exerciseOrderMap = new Map(band.exercicios.map((ex, index) => [ex.titulo, index + 1]));

      const itemsPayload = insertedExercises.map((inserted) => {
        const order = exerciseOrderMap.get(inserted.titulo) || 1;
        return {
          circuito_id: insertedCircuit.id,
          exercicio_id: inserted.id,
          ordem: order,
        };
      });

      await supabase
        .from("itens_circuito")
        .insert(itemsPayload);
    }
  } catch {
  }
}

/** Seed exercises available for selection inside the tutorial's mock circuit modal. */
const buildMockCircuitExercises = (t: (key: TranslationKey) => string): Exercise[] => [
  { id: "mock-linha", name: t("mock.exWalkLine"), description: "", tag: "Equilíbrio", subtags: ["estabilizador"], iconUrl: null },
  { id: "mock-bambole", name: t("mock.exHoop"), description: "", tag: "Coordenação", subtags: ["manipulativo"], iconUrl: null },
];

/** Seed circuits for the tutorial's mock mode (kept entirely in memory). */
const buildMockCircuits = (t: (key: TranslationKey) => string): Circuit[] => [
  {
    id: "mock-circ-ex",
    name: t("mock.exampleCircuit"),
    description: null,
    formId: null,
    type: "padrao",
    executionMode: "estruturado",
    exercisesCount: 2,
    exercisesSummary: `${t("mock.exWalkLine")}, ${t("mock.exHoop")}`,
    exercises: buildMockCircuitExercises(t),
  },
];

/** Options for {@link useCircuits}. */
export type UseCircuitsOptions = {
  /** When true, runs entirely on in-memory mock data (tutorial only). */
  mock?: boolean;
};

/**
 * Custom hook that provides CRUD operations and state management for circuits.
 *
 * @param options - Pass `{ mock: true }` (tutorial only) to operate on seeded
 * in-memory data instead of Supabase.
 */
export function useCircuits(options?: UseCircuitsOptions) {
  const isMock = options?.mock ?? false;
  const { t } = useI18n();
  const [circuits, setCircuits] = useState<Circuit[]>(isMock ? buildMockCircuits(t) : []);
  const [isLoading, setIsLoading] = useState(!isMock);
  const [error, setError] = useState<Error | null>(null);
  const [equipeId, setEquipeId] = useState<string | null>(null);
  const mockIdRef = useRef(0);

  /**
   * Fetches the list of active circuits using real database columns 'tipo' and 'modo_execucao'.
   */
  const loadCircuits = useCallback(async (showLoader = true) => {
    if (isMock) {
      setIsLoading(false);
      return;
    }
    if (showLoader) setIsLoading(true);
    setError(null);

    try {
      const teamId = await resolveEquipeId();
      if (!teamId) {
        throw new Error("User is not associated with any active team.");
      }
      setEquipeId(teamId);

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
              exercisesSummary: summary || t("circuits.noExercises"),
              exercises: mappedExercises,
            };
          })
        );
      }
    } catch (caught: any) {
      setError(caught);
    } finally {
      if (showLoader) setIsLoading(false);
    }
  }, [isMock, t]);

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
    if (isMock) {
      mockIdRef.current += 1;
      const created: Circuit = {
        id: `mock-new-${mockIdRef.current}`,
        name: data.name,
        description: null,
        formId: data.form,
        type: data.type,
        executionMode: data.executionMode,
        exercisesCount: data.exercises.length,
        exercisesSummary:
          data.exercises.map((e) => e.name).join(", ") || t("circuits.noExercises"),
        exercises: data.exercises,
      };
      setCircuits((prev) => [created, ...prev]);
      return;
    }

    try {
      if (!equipeId) throw new Error("Team ID not identified.");

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
      Alert.alert(t("circuits.error.createTitle"), `${t("circuits.error.createBody")} ${err.message}`);
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
    if (isMock) {
      setCircuits((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                name: data.name,
                type: data.type,
                executionMode: data.executionMode,
                formId: data.form,
                exercisesCount: data.exercises.length,
                exercisesSummary:
                  data.exercises.map((e) => e.name).join(", ") || t("circuits.noExercises"),
                exercises: data.exercises,
              }
            : c,
        ),
      );
      return;
    }

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
      Alert.alert(t("circuits.error.editTitle"), `${t("circuits.error.editBody")} ${err.message}`);
      throw err;
    }
  };

  /**
   * Performs standard soft delete for active circuits.
   */
  const deleteCircuit = async (id: string) => {
    if (isMock) {
      setCircuits((prev) => prev.filter((c) => c.id !== id));
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from("circuitos")
        .update({ ativo: false })
        .eq("id", id);

      if (deleteError) throw deleteError;
      await loadCircuits(false);
    } catch (err: any) {
      Alert.alert(t("circuits.error.deleteTitle"), err.message);
    }
  };

  /**
   * Duplicates an existing circuit, copying its properties and exercise items.
   */
  const duplicateCircuit = async (circuit: Circuit) => {
    if (isMock) {
      mockIdRef.current += 1;
      const copy: Circuit = {
        ...circuit,
        id: `mock-dup-${mockIdRef.current}`,
        name: `${circuit.name}${t("common.copySuffix")}`,
      };
      setCircuits((prev) => [copy, ...prev]);
      return;
    }

    try {
      if (!equipeId) throw new Error("Team ID not identified.");

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
      Alert.alert(t("circuits.error.duplicateTitle"), `${t("circuits.error.duplicateBody")} ${err.message}`);
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