import { supabase } from "@/lib/supabase";
import type { TranslationKey } from "@/features/settings/constants/translations";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import { resolveEquipeId } from "@/lib/resolve-equipe-id";
import { uploadImage } from "@/lib/upload-image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import { NewExerciseData } from "../components/new-exercise";

/**
 * Main tags of an exercise, each mapped to its own subtags. An exercise has
 * one to three main tags, and each of them one to three subtags.
 */
export type ExerciseTags = Record<string, string[]>;

/**
 * Exercise domain model used by the UI.
 */
export type Exercise = {
  id: string;
  name: string;
  description: string;
  /** How many times the exercise is performed in a session. Informational. */
  repetitions?: number | null;
  /** Every main tag with its subtags. */
  tags: ExerciseTags;
  /**
   * First main tag. Kept in sync with the first key of {@link Exercise.tags}
   * for the consumers that still reason about a single tag.
   */
  tag: string;
  /** Subtags of the first main tag. */
  subtags?: string[];
  iconUrl?: string | null;
};

/** Returns the first main tag of a tag map, or null when it is empty. */
export function primaryTag(tags: ExerciseTags | null | undefined): string | null {
  const keys = Object.keys(tags ?? {});
  return keys.length > 0 ? keys[0] : null;
}

/**
 * Normalizes whatever the database returns into a tag map, falling back to the
 * legacy single `tag` + flat `subtags` columns for rows not yet backfilled.
 */
function toTagMap(
  raw: unknown,
  legacyTag: string | null,
  legacySubtags: string[] | null,
): ExerciseTags {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const entries = Object.entries(raw as Record<string, unknown>).filter(
      ([, subs]) => Array.isArray(subs),
    );
    if (entries.length > 0) {
      return Object.fromEntries(
        entries.map(([tag, subs]) => [tag, (subs as unknown[]).map(String)]),
      );
    }
  }
  return legacyTag ? { [legacyTag]: legacySubtags ?? [] } : {};
}

/**
 * Seed exercises for the tutorial's mock mode (kept entirely in memory). The
 * display fields (name/description) are localized; `tag`/`subtags` stay as the
 * stored identifier values (translated for display by the tag components).
 */
const buildMockExercises = (t: (key: TranslationKey) => string): Exercise[] => [
  {
    id: "mock-linha",
    name: t("mock.exWalkLine"),
    description: t("mock.exWalkLineDesc"),
    repetitions: 3,
    tags: { "Equilíbrio": ["estabilizador"] },
    tag: "Equilíbrio",
    subtags: ["estabilizador"],
    iconUrl: null,
  },
  {
    id: "mock-bambole",
    name: t("mock.exHoop"),
    description: t("mock.exHoopDesc"),
    repetitions: 5,
    tags: { "Coordenação": ["manipulativo"], "Força": ["locomotor"] },
    tag: "Coordenação",
    subtags: ["manipulativo"],
    iconUrl: null,
  },
];

/** Options for {@link useExercises}. */
export type UseExercisesOptions = {
  /** When true, runs entirely on in-memory mock data (tutorial only). */
  mock?: boolean;
};

/**
 * Provides CRUD operations and state for exercises.
 *
 * @param options - Pass `{ mock: true }` (tutorial only) to operate on seeded
 * in-memory data instead of Supabase.
 */
export function useExercises(options?: UseExercisesOptions) {
  const isMock = options?.mock ?? false;
  const { t } = useI18n();
  const [exercises, setExercises] = useState<Exercise[]>(isMock ? buildMockExercises(t) : []);
  const [isLoading, setIsLoading] = useState(!isMock);
  const [error, setError] = useState<Error | null>(null);
  const [equipeId, setEquipeId] = useState<string | null>(null);
  const mockIdRef = useRef(0);

  /**
   * Loads exercises for the active team.
   */
  const loadExercises = useCallback(async (showLoader = true) => {
    if (isMock) {
      setIsLoading(false);
      return;
    }
    if (showLoader) setIsLoading(true);
    setError(null);
    try {
      const teamId = await resolveEquipeId();
      if (!teamId) {
        throw new Error(t("common.err.noActiveTeam"));
      }
      setEquipeId(teamId);

      const { data, error: fetchError } = await supabase
        .from("exercicios")
        .select("id, titulo, descricao, repeticoes, tags, tag, subtags, icone_url")
        .eq("equipe_id", teamId)
        .eq("ativo", true)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      if (data) {
        setExercises(
          data.map((row) => {
            const tags = toTagMap(row.tags, row.tag, row.subtags);
            const first = primaryTag(tags);
            return {
              id: row.id,
              name: row.titulo,
              description: row.descricao || "",
              repetitions: row.repeticoes ?? null,
              tags,
              tag: first ?? "Coordenação",
              subtags: first ? tags[first] : ["estabilizador"],
              iconUrl: row.icone_url,
            };
          }),
        );
      }
    } catch (caught: any) {
      setError(caught);
    } finally {
      if (showLoader) setIsLoading(false);
    }
  }, [isMock]);

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
    const first = primaryTag(data.tags);

    if (isMock) {
      mockIdRef.current += 1;
      const created: Exercise = {
        id: `mock-new-${mockIdRef.current}`,
        name: data.name,
        description: data.description,
        repetitions: data.repetitions,
        tags: data.tags,
        tag: first ?? "Coordenação",
        subtags: first ? data.tags[first] : [],
        iconUrl: photoUri ?? null,
      };
      setExercises((prev) => [created, ...prev]);
      return;
    }

    try {
      if (!equipeId) throw new Error(t("common.err.teamNotIdentified"));
      let finalIconUrl = null;
      if (photoUri && !photoUri.startsWith("http")) {
        finalIconUrl = await uploadImage("exercicio-media", photoUri, "icons");
      }

      const payload = {
        titulo: data.name,
        descricao: data.description || null,
        equipe_id: equipeId,
        ativo: true,
        repeticoes: data.repetitions ?? null,
        tags: data.tags,
        // `tag`/`subtags` espelham a primeira tag para os consumidores antigos.
        tag: first,
        subtags: first ? data.tags[first] : [],
        icone_url: finalIconUrl,
      };

      const { error: insertError } = await supabase
        .from("exercicios")
        .insert([payload]);
      if (insertError) throw insertError;

      await loadExercises(false);
    } catch (err: any) {
      Alert.alert(
        t("exercises.error.createTitle"),
        `${t("exercises.error.createBody")} ${err.message}`,
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
    const first = primaryTag(data.tags);

    if (isMock) {
      setExercises((prev) =>
        prev.map((e) =>
          e.id === id
            ? {
                ...e,
                name: data.name,
                description: data.description,
                repetitions: data.repetitions,
                tags: data.tags,
                tag: first ?? e.tag,
                subtags: first ? data.tags[first] : [],
                iconUrl: photoUri === null ? null : photoUri ?? e.iconUrl,
              }
            : e,
        ),
      );
      return;
    }

    try {
      const payload: any = {
        titulo: data.name,
        descricao: data.description || null,
        repeticoes: data.repetitions ?? null,
        tags: data.tags,
        tag: first,
        subtags: first ? data.tags[first] : [],
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
      Alert.alert(
        t("exercises.error.editTitle"),
        `${t("exercises.error.editBody")} ${err.message}`,
      );
    }
  };

  /**
   * Soft-deletes an exercise and removes it from every circuit it belongs to.
   *
   * @remarks
   * Delegates to the `excluir_exercicio` RPC so the soft-delete, the removal of
   * the exercise's `itens_circuito` rows and the renumbering of each affected
   * circuit's `ordem` all happen in a single transaction.
   */
  const deleteExercise = async (id: string) => {
    if (isMock) {
      setExercises((prev) => prev.filter((e) => e.id !== id));
      return;
    }

    try {
      const { error: deleteError } = await supabase.rpc("excluir_exercicio", {
        p_exercicio_id: id,
      });

      if (deleteError) throw deleteError;
      await loadExercises(false);
    } catch (err: any) {
      Alert.alert(t("exercises.error.deleteTitle"), err.message);
    }
  };

  /**
   * Duplicates an exercise with a copy suffix.
   */
  const duplicateExercise = async (exercise: Exercise) => {
    if (isMock) {
      mockIdRef.current += 1;
      const copy: Exercise = {
        ...exercise,
        id: `mock-dup-${mockIdRef.current}`,
        name: `${exercise.name}${t("common.copySuffix")}`,
      };
      setExercises((prev) => [copy, ...prev]);
      return;
    }

    try {
      if (!equipeId) throw new Error(t("common.err.teamNotIdentified"));

      const first = primaryTag(exercise.tags);
      const payload = {
        titulo: `${exercise.name} (Cópia)`,
        descricao: exercise.description || null,
        equipe_id: equipeId,
        ativo: true,
        repeticoes: exercise.repetitions ?? null,
        tags: exercise.tags,
        tag: first,
        subtags: first ? exercise.tags[first] : [],
        icone_url: exercise.iconUrl || null,
      };

      const { error: insertError } = await supabase
        .from("exercicios")
        .insert([payload]);
      if (insertError) throw insertError;

      await loadExercises(false);
    } catch (err: any) {
      Alert.alert(
        t("exercises.error.duplicateTitle"),
        `${t("exercises.error.duplicateBody")} ${err.message}`,
      );
    }
  };

  /**
   * Returns how many active circuits reference the given exercise.
   *
   * @remarks
   * Inner-joins `circuitos` to exclude soft-deleted circuits and counts
   * distinct circuit ids, since an exercise may appear more than once in the
   * same circuit.
   */
  async function getExerciseCircuitCount(id: string) {
    if (isMock) return 0;
    try {
      const { data, error } = await supabase
        .from("itens_circuito")
        .select("circuito_id, circuitos!inner(ativo)")
        .eq("exercicio_id", id)
        .eq("circuitos.ativo", true);

      if (error) throw error;
      return new Set((data ?? []).map((row) => row.circuito_id)).size;
    } catch {
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
