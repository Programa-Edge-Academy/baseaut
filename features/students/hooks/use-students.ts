import { supabase } from "@/lib/supabase";
import { calculateAge } from "@/lib/date-utils";
import { resolveEquipeId } from "@/lib/resolve-equipe-id";
import { uploadImage } from "@/lib/upload-image";
import { useCallback, useEffect, useState } from "react";
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

/**
 * Provides CRUD operations and state for students.
 */
export function useStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [equipeId, setEquipeId] = useState<string | null>(null);

  /**
   * Loads students for the active team.
   */
const loadStudents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const teamId = await resolveEquipeId();
      if (!teamId) {
        throw new Error("Usuário não está associado a nenhuma equipe ativa.");
      }
      setEquipeId(teamId);

      // 1. Buscamos alunos
      const { data: alunos, error: fetchError } = await supabase
        .from("alunos")
        .select("id, nome_completo, data_nascimento, peso, altura, cintura, nivel_suporte, diagnostico_detalhado, observacoes_clinicas, avatar_url")
        .eq("equipe_id", teamId)
        .eq("ativo", true)
        .order("nome_completo", { ascending: true });

      if (fetchError) throw fetchError;

      // 2. Buscamos as pendências separadamente
      const { data: pendencias } = await supabase
        .from("vw_alunos_pendencias")
        .select("aluno_id, tem_pendencia");

      if (alunos) {
        setStudents(
          alunos.map((aluno) => {
            // Verifica pendência para este aluno específico
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
      console.error("Erro ao carregar alunos:", caught);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  /**
   * Creates a new student and uploads the avatar if needed.
   */
  const addStudent = async (
    data: Omit<Student, "id" | "age">,
    photoUri?: string | null,
  ) => {
    setIsLoading(true);
    try {
      if (!equipeId) throw new Error("ID da equipe não identificado.");

      let finalAvatarUrl = data.avatarUrl;
      if (photoUri && !photoUri.startsWith("http")) {
        const uploadedUrl = await uploadImage("avatares", photoUri, "alunos");
        if (uploadedUrl) finalAvatarUrl = uploadedUrl;
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

      await loadStudents();
    } catch (err: any) {
      console.error("Erro ao adicionar aluno:", err);
      Alert.alert(
        "Erro ao Criar",
        `Não foi possível salvar o aluno: ${err.message}`,
      );
    } finally {
      setIsLoading(false);
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
    setIsLoading(true);
    try {
      let finalAvatarUrl = data.avatarUrl;
      if (photoUri && !photoUri.startsWith("http")) {
        const uploadedUrl = await uploadImage("avatares", photoUri, "alunos");
        if (uploadedUrl) finalAvatarUrl = uploadedUrl;
      }

      const payload: any = {};
      if (data.name !== undefined) payload.nome_completo = data.name;
      if (data.weight !== undefined) payload.peso = data.weight;
      if (data.height !== undefined) payload.altura = data.height;
      if (data.waist !== undefined) payload.cintura = data.waist;
      if (data.healthConditions !== undefined)
        payload.diagnostico_detalhado = data.healthConditions;
      if (data.observations !== undefined)
        payload.observacoes_clinicas = data.observations;
      if (finalAvatarUrl !== undefined) payload.avatar_url = finalAvatarUrl;

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

      await loadStudents();
    } catch (err: any) {
      console.error("Erro ao atualizar aluno:", err);
      Alert.alert(
        "Erro ao Editar",
        `Não foi possível atualizar o aluno: ${err.message}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Soft-deletes a student record.
   */
  const deleteStudent = async (id: string) => {
    setIsLoading(true);
    try {
      const { error: deleteError } = await supabase
        .from("alunos")
        .update({ ativo: false })
        .eq("id", id);

      if (deleteError) throw deleteError;
      await loadStudents();
    } catch (err: any) {
      console.error("Erro ao inativar aluno:", err);
      Alert.alert("Erro ao Remover", err.message);
    } finally {
      setIsLoading(false);
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
