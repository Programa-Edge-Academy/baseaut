import { resolveEquipeId } from "@/lib/resolve-equipe-id";
import { supabase } from "@/lib/supabase";
import { calculateAge } from "@/lib/date-utils";
import { uploadImage } from "@/lib/upload-image";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import { useEffect, useState } from "react";
import { Alert } from "react-native";

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
  avatarUrl: string | null;
};

/**
 * Provides data and actions for team management.
 */
export function useTeamData() {
  const { t } = useI18n();
  const [students, setStudents] = useState<StudentData[]>([]);
  const [companions, setCompanions] = useState<CompanionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [equipeId, setEquipeId] = useState<string | null>(null);

  /**
   * Loads students and companions for the team.
   */
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const resolvedId = await resolveEquipeId();
      if (!resolvedId) {
        setStudents([]);
        setCompanions([]);
        setIsLoading(false);
        return;
      }
      setEquipeId(resolvedId);

      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = authData.user?.id;
      const { data: alunosData, error: alunosError } = await supabase
        .from("alunos")
        .select(
          "id, nome_completo, data_nascimento, peso, altura, cintura, nivel_suporte, diagnostico_detalhado, observacoes_clinicas, avatar_url",
        )
        .eq("equipe_id", resolvedId)
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
          `id, status, usuario_id, profiles:usuario_id (nome_completo, email, avatar_url)`,
        )
        .eq("equipe_id", resolvedId)
        .neq("status", "removido");

      const { data: pendentesData, error: pendentesError } = await supabase
        .from("profiles")
        .select("id, nome_completo, email, status_conta, avatar_url")
        .eq("role", "monitor")
        .eq("status_conta", "pendente");

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
              avatarUrl: membro.profiles.avatar_url ?? null,
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
              avatarUrl: profile.avatar_url ?? null,
            });
          }
        });
      }

      setCompanions(listaMonitores);
    } catch {
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
      p_equipe_id: equipeId
    });

    if (error) {
      Alert.alert(t("common.error"), t("teams.approveError"));
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
      Alert.alert(t("common.error"), t("teams.rejectError"));
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
      Alert.alert(t("common.error"), t("teams.removeCompanionError"));
    }

    fetchData();
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
        const uploadedUrl = await uploadImage("avatares", photoUri, "alunos");
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

      const basePayload = {
        nome_completo: data.name,
        data_nascimento: formattedDate,
        peso: data.weight || null,
        altura: data.height || null,
        cintura: data.waist || null,
        nivel_suporte: nivelSuporteDb,
        diagnostico_detalhado: data.healthConditions || null,
        observacoes_clinicas: data.observations || null,
        avatar_url: finalAvatarUrl,
        ativo: true,
      };

      if (data.id) {
        const { error } = await supabase
          .from("alunos")
          .update(basePayload)
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("alunos")
          .insert([{ ...basePayload, equipe_id: equipeId }]);
        if (error) throw error;
      }

      await fetchData();
    } catch (error: any) {
      Alert.alert(
        t("teams.saveErrorTitle"),
        t("teams.saveError").replace("{msg}", error.message),
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
