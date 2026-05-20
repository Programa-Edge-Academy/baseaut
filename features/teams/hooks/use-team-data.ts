import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { Alert, Platform } from "react-native";

/**
 * Fallback team id used for team management flows.
 */
const EQUIPE_ID = "33af53f5-113c-42c4-aa46-6faa6cfdd5e7";

/**
 * Student data used in team management screens.
 */
export type StudentData = {
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
};

/**
 * Companion (monitor) data used in team management screens.
 */
export type CompanionData = {
  id: string;
  profileId: string;
  name: string;
  email: string;
  status: "ativo" | "pendente" | "removido";
};

/**
 * Provides data and actions for team management.
 */
export function useTeamData() {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [companions, setCompanions] = useState<CompanionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Calculates age in years from a birth date string.
   */
  const calculateAge = (birthDateString: string) => {
    const birthDate = new Date(birthDateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  /**
   * Loads students and companions for the team.
   */
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = authData.user?.id;
      const { data: alunosData, error: alunosError } = await supabase
        .from("alunos")
        .select(
          "id, nome_completo, data_nascimento, peso, altura, cintura, nivel_suporte, diagnostico_detalhado, observacoes_clinicas, avatar_url",
        )
        .eq("ativo", true);

      if (!alunosError && alunosData) {
        setStudents(
          alunosData.map((aluno) => ({
            id: aluno.id,
            name: aluno.nome_completo,
            birthDate: aluno.data_nascimento,
            age: calculateAge(aluno.data_nascimento),
            weight: aluno.peso || 0,
            height: aluno.altura || 0,
            waist: aluno.cintura || 0,
            supportLevel: aluno.nivel_suporte,
            healthConditions: aluno.diagnostico_detalhado || "",
            observations: aluno.observacoes_clinicas || "",
            avatarUrl: aluno.avatar_url,
          })),
        );
      }

      const { data: membrosData, error: membrosError } = await supabase
        .from("membros_equipe")
        .select(
          `id, status, usuario_id, profiles:usuario_id (nome_completo, email)`,
        )
        .eq("equipe_id", EQUIPE_ID)
        .neq("status", "removido");

      if (membrosError) {
        console.error("Erro ao buscar membros_equipe:", membrosError);
      }

      const { data: pendentesData, error: pendentesError } = await supabase
        .from("profiles")
        .select("id, nome_completo, email, status_conta")
        .eq("role", "monitor")
        .eq("status_conta", "pendente");

      if (pendentesError) {
        console.error(
          "Erro ao buscar profiles pendentes (Verifique o RLS no Supabase!):",
          pendentesError,
        );
      }

      const listaMonitores: CompanionData[] = [];
      const addedProfileIds = new Set<string>();

      if (!membrosError && membrosData) {
        membrosData.forEach((membro: any) => {
          if (membro.profiles && membro.usuario_id !== currentUserId) {
            listaMonitores.push({
              id: membro.id,
              profileId: membro.usuario_id,
              name: membro.profiles.nome_completo,
              email: membro.profiles.email,
              status: membro.status === "pendente" ? "pendente" : (membro.status === "removido" ? "removido" : "ativo"),
            });
            addedProfileIds.add(membro.usuario_id);
          }
        });
      }

      if (!pendentesError && pendentesData) {
        pendentesData.forEach((profile) => {
          if (!addedProfileIds.has(profile.id) && profile.id !== currentUserId) {
            listaMonitores.push({
              id: profile.id,
              profileId: profile.id,
              name: profile.nome_completo,
              email: profile.email,
              status: "pendente",
            });
          }
        });
      }

      setCompanions(listaMonitores);
    } catch (err) {
      console.error("Erro ao carregar dados da equipe:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /**
   * Accepts a pending companion request.
   */
  const acceptCompanion = async (id: string) => {
    const comp = companions.find((c) => c.id === id);
    if (!comp) return;

    const { error } = await supabase.rpc('aprovar_monitor', {
      p_monitor_id: comp.profileId,
      p_equipe_id: EQUIPE_ID
    });

    if (error) {
      console.error(error);
      Alert.alert("Erro", "Não foi possível aprovar o monitor.");
    }

    fetchData();
  };

  /**
   * Rejects a pending companion request.
   */
  const rejectCompanion = async (id: string) => {
    const comp = companions.find((c) => c.id === id);
    if (!comp) return;

    const { error } = await supabase.rpc('rejeitar_monitor', {
      p_monitor_id: comp.profileId
    });

    if (error) {
      console.error(error);
      Alert.alert("Erro", "Não foi possível rejeitar o monitor.");
    }

    fetchData();
  };

  /**
   * Soft-removes a companion from the team.
   */
  const removeCompanion = async (id: string) => {
    const comp = companions.find((c) => c.id === id);
    if (!comp) return;

    const { error } = await supabase.rpc('remover_monitor', {
      p_monitor_id: comp.profileId
    });

    if (error) {
      console.error(error);
      Alert.alert("Erro", "Não foi possível remover o monitor.");
    }

    fetchData();
  };

  /**
   * Uploads a local avatar image and returns its public URL.
   */
  const uploadImage = async (uri: string) => {
    try {
      const filePath = `${Date.now()}_avatar.jpg`;
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
        .from("avatares")
        .upload(filePath, fileData, { contentType: "image/jpeg" });

      if (uploadError) throw uploadError;

      if (data) {
        const {
          data: { publicUrl },
        } = supabase.storage.from("avatares").getPublicUrl(filePath);
        return publicUrl;
      }
      return null;
    } catch (e) {
      console.error("Erro no upload do avatar:", e);
      return null;
    }
  };

  /**
   * Creates or updates a student within the team.
   */
  const saveStudent = async (
    data: Partial<StudentData>,
    photoUri?: string | null,
  ) => {
    setIsLoading(true);
    try {
      let finalAvatarUrl = data.avatarUrl;

      if (photoUri && !photoUri.startsWith("http")) {
        const uploadedUrl = await uploadImage(photoUri);
        if (uploadedUrl) finalAvatarUrl = uploadedUrl;
      }

      let formattedDate = data.birthDate;
      if (formattedDate && formattedDate.includes("/")) {
        const [day, month, year] = formattedDate.split("/");
        formattedDate = `${year}-${month}-${day}`;
      }

      let nivelSuporteDb = "nivel_1";
      const suporteText = data.supportLevel?.toLowerCase() || "";

      if (
        suporteText.includes("nível 1") ||
        suporteText.includes("nivel 1") ||
        suporteText === "nivel_1"
      ) {
        nivelSuporteDb = "nivel_1";
      } else if (
        suporteText.includes("nível 2") ||
        suporteText.includes("nivel 2") ||
        suporteText === "nivel_2"
      ) {
        nivelSuporteDb = "nivel_2";
      } else if (
        suporteText.includes("nível 3") ||
        suporteText.includes("nivel 3") ||
        suporteText === "nivel_3"
      ) {
        nivelSuporteDb = "nivel_3";
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
        equipe_id: EQUIPE_ID,
        ativo: true,
      };

      if (data.id) {
        const { error } = await supabase
          .from("alunos")
          .update(payload)
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("alunos").insert([payload]);
        if (error) throw error;
      }

      await fetchData();
    } catch (error: any) {
      console.error("Erro ao salvar aluno:", error);
      Alert.alert(
        "Erro ao Salvar",
        `Não foi possível salvar o aluno. Detalhes: ${error.message}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Soft-deletes a student within the team.
   */
  const deleteStudent = async (id: string) => {
    await supabase.from("alunos").update({ ativo: false }).eq("id", id);
    fetchData();
  };

  return {
    students,
    companions,
    isLoading,
    acceptCompanion,
    rejectCompanion,
    removeCompanion,
    saveStudent,
    deleteStudent,
  };
}
