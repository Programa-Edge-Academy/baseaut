import { supabase } from "@/lib/supabase";
import { calculateAge } from "@/lib/date-utils";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import { resolveEquipeId } from "@/lib/resolve-equipe-id";
import { uploadImage } from "@/lib/upload-image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";

/**
 * Student domain model used by the UI.
 */
export type Student = {
  id: string;
  name: string;
  birthDate: string;
  age: number;
  weight: number;
  height: number;
  waist: number;
  supportLevel: string;
  healthConditions: string;
  observations: string;
  avatarUrl: string | null;
  pendencyAlert: boolean;
};

/** Seed students for the tutorial's mock mode (kept entirely in memory). */
const MOCK_STUDENTS: Student[] = [
  {
    id: "mock-ana",
    name: "Ana Beatriz",
    birthDate: "2017-03-12",
    age: calculateAge("2017-03-12"),
    weight: 28,
    height: 122,
    waist: 54,
    supportLevel: "Nível 2",
    healthConditions: "",
    observations: "",
    avatarUrl: null,
    pendencyAlert: false,
  },
  {
    id: "mock-lucas",
    name: "Lucas Martins",
    birthDate: "2015-08-04",
    age: calculateAge("2015-08-04"),
    weight: 34,
    height: 135,
    waist: 60,
    supportLevel: "Nível 1",
    healthConditions: "",
    observations: "",
    avatarUrl: null,
    pendencyAlert: false,
  },
];

/** Options for {@link useStudents}. */
export type UseStudentsOptions = {
  /**
   * When true, the hook runs entirely on in-memory mock data with no Supabase
   * access, used by the tutorial practice replica of the students screen.
   */
  mock?: boolean;
};

/**
 * Provides CRUD operations and state for students.
 *
 * @param options - Pass `{ mock: true }` (tutorial only) to operate on seeded
 * in-memory data instead of Supabase.
 */
export function useStudents(options?: UseStudentsOptions) {
  const isMock = options?.mock ?? false;
  const { t } = useI18n();
  const [students, setStudents] = useState<Student[]>(isMock ? MOCK_STUDENTS : []);
  const [isLoading, setIsLoading] = useState(!isMock);
  const [error, setError] = useState<Error | null>(null);
  const [equipeId, setEquipeId] = useState<string | null>(null);
  const mockIdRef = useRef(0);

  /**
   * Loads students for the active team.
   */
const loadStudents = useCallback(async (showLoader = true) => {
    if (isMock) {
      setIsLoading(false);
      return;
    }
    if (showLoader) setIsLoading(true);
    setError(null);
    try {
      const teamId = await resolveEquipeId();
      if (!teamId) {
        throw new Error("Usuário não está associado a nenhuma equipe ativa.");
      }
      setEquipeId(teamId);

      const { data: alunos, error: fetchError } = await supabase
        .from("alunos")
        .select("id, nome_completo, data_nascimento, peso, altura, cintura, nivel_suporte, diagnostico_detalhado, observacoes_clinicas, avatar_url")
        .eq("equipe_id", teamId)
        .eq("ativo", true)
        .order("nome_completo", { ascending: true });

      if (fetchError) throw fetchError;

      const { data: pendencias } = await supabase
        .from("vw_alunos_pendencias")
        .select("aluno_id, tem_pendencia");

      if (alunos) {
        setStudents(
          alunos.map((aluno) => {
            const temPendencia = pendencias?.some(
              (p) => p.aluno_id === aluno.id && p.tem_pendencia
            ) ?? false;

            return {
              id: aluno.id,
              name: aluno.nome_completo,
              birthDate: aluno.data_nascimento,
              age: calculateAge(aluno.data_nascimento),
              weight: Number(aluno.peso) || 0,
              height: Number(aluno.altura) || 0,
              waist: Number(aluno.cintura) || 0,
              supportLevel: 
              aluno.nivel_suporte === "nivel_1" ? "Nível 1"
                : aluno.nivel_suporte === "nivel_2"
                  ? "Nível 2"
                  : "Nível 3",
              healthConditions: aluno.diagnostico_detalhado || "",
              observations: aluno.observacoes_clinicas || "",
              avatarUrl: aluno.avatar_url,
              pendencyAlert: temPendencia, 
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
    loadStudents(true);
  }, [loadStudents]);

  /**
   * Creates a new student and uploads the avatar if needed.
   */
  const addStudent = async (
    data: Omit<Student, "id" | "age">,
    photoUri?: string | null,
  ) => {
    if (isMock) {
      mockIdRef.current += 1;
      const newStudent: Student = {
        id: `mock-new-${mockIdRef.current}`,
        name: data.name,
        birthDate: data.birthDate,
        age: calculateAge(data.birthDate),
        weight: data.weight || 0,
        height: data.height || 0,
        waist: data.waist || 0,
        supportLevel: data.supportLevel,
        healthConditions: data.healthConditions || "",
        observations: data.observations || "",
        avatarUrl: photoUri ?? data.avatarUrl ?? null,
        pendencyAlert: false,
      };
      setStudents((prev) =>
        [...prev, newStudent].sort((a, b) => a.name.localeCompare(b.name)),
      );
      return;
    }

    try {
      if (!equipeId) throw new Error("ID da equipe não identificado.");

      let finalAvatarUrl: string | null = null;
      if (photoUri) {
        finalAvatarUrl = photoUri.startsWith("http")
          ? photoUri
          : (await uploadImage("avatares", photoUri, "alunos")) ?? null;
      }

      let nivelSuporteDb = "nivel_1";
      const supportLower = data.supportLevel.toLowerCase();
      if (supportLower.includes("2")) nivelSuporteDb = "nivel_2";
      if (supportLower.includes("3")) nivelSuporteDb = "nivel_3";

      let formattedDate = data.birthDate;
      if (formattedDate.includes("/")) {
        const [day, month, year] = formattedDate.split("/");
        formattedDate = `${year}-${month}-${day}`;
      }

      const payload = {
        nome_completo: data.name,
        data_nascimento: formattedDate,
        peso: data.weight || null,
        altura: data.height || null,
        cintura: data.waist || null,
        nivel_suporte: nivelSuporteDb,
        diagnostico_detalhado: data.healthConditions || null,
        observacoes_clinicas: data.observations || null,
        avatar_url: finalAvatarUrl,
        equipe_id: equipeId,
        ativo: true,
      };

      const { error: insertError } = await supabase
        .from("alunos")
        .insert([payload]);
      if (insertError) throw insertError;

      await loadStudents(false);
    } catch (err: any) {
      Alert.alert(
        t("students.error.createTitle"),
        `${t("students.error.createBody")} ${err.message}`,
      );
    }
  };

  /**
   * Updates a student record and uploads a new avatar if needed.
   */
  const updateStudent = async (
    id: string,
    data: Partial<Omit<Student, "id" | "age">>,
    photoUri?: string | null,
  ) => {
    if (isMock) {
      setStudents((prev) =>
        prev
          .map((s) => {
            if (s.id !== id) return s;
            const merged: Student = { ...s, ...data };
            if (data.birthDate) merged.age = calculateAge(data.birthDate);
            if (photoUri === null) merged.avatarUrl = null;
            else if (photoUri !== undefined) merged.avatarUrl = photoUri;
            return merged;
          })
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
      return;
    }

    try {
      const payload: any = {};
      if (data.name !== undefined) payload.nome_completo = data.name;
      if (data.weight !== undefined) payload.peso = data.weight;
      if (data.height !== undefined) payload.altura = data.height;
      if (data.waist !== undefined) payload.cintura = data.waist;
      if (data.healthConditions !== undefined)
        payload.diagnostico_detalhado = data.healthConditions;
      if (data.observations !== undefined)
        payload.observacoes_clinicas = data.observations;

      if (photoUri === null) {
        payload.avatar_url = null;
      } else if (photoUri !== undefined) {
        payload.avatar_url = photoUri.startsWith("http")
          ? photoUri
          : (await uploadImage("avatares", photoUri, "alunos")) ?? null;
      }

      if (data.supportLevel !== undefined) {
        let nivelSuporteDb = "nivel_1";
        const supportLower = data.supportLevel.toLowerCase();
        if (supportLower.includes("2")) nivelSuporteDb = "nivel_2";
        if (supportLower.includes("3")) nivelSuporteDb = "nivel_3";
        payload.nivel_suporte = nivelSuporteDb;
      }

      if (data.birthDate !== undefined) {
        let formattedDate = data.birthDate;
        if (formattedDate.includes("/")) {
          const [day, month, year] = formattedDate.split("/");
          formattedDate = `${year}-${month}-${day}`;
        }
        payload.data_nascimento = formattedDate;
      }

      const { error: updateError } = await supabase
        .from("alunos")
        .update(payload)
        .eq("id", id);
      if (updateError) throw updateError;

      await loadStudents(false);
    } catch (err: any) {
      Alert.alert(
        t("students.error.editTitle"),
        `${t("students.error.editBody")} ${err.message}`,
      );
    }
  };

  /**
   * Soft-deletes a student record.
   */
  const deleteStudent = async (id: string) => {
    if (isMock) {
      setStudents((prev) => prev.filter((s) => s.id !== id));
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from("alunos")
        .update({ ativo: false })
        .eq("id", id);

      if (deleteError) throw deleteError;
      await loadStudents(false);
    } catch (err: any) {
      Alert.alert(t("students.error.deleteTitle"), err.message);
    }
  };

  return {
    students,
    isLoading,
    error,
    refresh: loadStudents,
    addStudent,
    updateStudent,
    deleteStudent,
  };
}