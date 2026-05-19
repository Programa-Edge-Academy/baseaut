import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useState } from "react";
import { Alert, Platform } from "react-native";

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

export function useStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [equipeId, setEquipeId] = useState<string | null>(null);

  const calculateAge = (birthDateString: string) => {
    if (!birthDateString) return 0;
    const birthDate = new Date(birthDateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const uploadImage = async (uri: string) => {
    try {
      const filePath = `${Date.now()}_avatar.jpg`;
      let fileData: any;

      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        fileData = await response.blob();
      } else {
        const FileSystem = require('expo-file-system/legacy');
        const { decode } = require('base64-arraybuffer');

        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: 'base64',
        });
        fileData = decode(base64);
      }

      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, fileData, { contentType: 'image/jpeg' });
      
      if (uploadError) throw uploadError;

      if (data) {
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
        return publicUrl;
      }
      return null;
    } catch (e) {
      console.error("Erro no upload do avatar:", e);
      return null;
    }
  };

  const loadStudents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const teamId = await resolveEquipeId();
      if (!teamId) {
        throw new Error("Usuário não está associado a nenhuma equipe ativa.");
      }
      setEquipeId(teamId);

      const { data, error: fetchError } = await supabase
        .from("alunos")
        .select("id, nome_completo, data_nascimento, peso, altura, cintura, nivel_suporte, diagnostico_detalhado, observacoes_clinicas, avatar_url")
        .eq("equipe_id", teamId)
        .eq("ativo", true)
        .order("nome_completo", { ascending: true });

      if (fetchError) throw fetchError;

      if (data) {
        setStudents(
          data.map((aluno) => ({
            id: aluno.id,
            name: aluno.nome_completo,
            birthDate: aluno.data_nascimento,
            age: calculateAge(aluno.data_nascimento),
            weight: Number(aluno.peso) || 0,
            height: Number(aluno.altura) || 0,
            waist: Number(aluno.cintura) || 0,
            supportLevel: aluno.nivel_suporte === "nivel_1" ? "Nível 1" : aluno.nivel_suporte === "nivel_2" ? "Nível 2" : "Nível 3",
            healthConditions: aluno.diagnostico_detalhado || "",
            observations: aluno.observacoes_clinicas || "",
            avatarUrl: aluno.avatar_url,
          }))
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

  const addStudent = async (data: Omit<Student, "id" | "age">, photoUri?: string | null) => {
    setIsLoading(true);
    try {
      if (!equipeId) throw new Error("ID da equipe não identificado.");

      let finalAvatarUrl = data.avatarUrl;
      if (photoUri && !photoUri.startsWith("http")) {
        const uploadedUrl = await uploadImage(photoUri);
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

      const { error: insertError } = await supabase.from("alunos").insert([payload]);
      if (insertError) throw insertError;

      await loadStudents();
    } catch (err: any) {
      console.error("Erro ao adicionar aluno:", err);
      Alert.alert("Erro ao Criar", `Não foi possível salvar o aluno: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStudent = async (id: string, data: Partial<Omit<Student, "id" | "age">>, photoUri?: string | null) => {
    setIsLoading(true);
    try {
      let finalAvatarUrl = data.avatarUrl;
      if (photoUri && !photoUri.startsWith("http")) {
        const uploadedUrl = await uploadImage(photoUri);
        if (uploadedUrl) finalAvatarUrl = uploadedUrl;
      }

      const payload: any = {};
      if (data.name !== undefined) payload.nome_completo = data.name;
      if (data.weight !== undefined) payload.peso = data.weight;
      if (data.height !== undefined) payload.altura = data.height;
      if (data.waist !== undefined) payload.cintura = data.waist;
      if (data.healthConditions !== undefined) payload.diagnostico_detalhado = data.healthConditions;
      if (data.observations !== undefined) payload.observacoes_clinicas = data.observations;
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

      const { error: updateError } = await supabase.from("alunos").update(payload).eq("id", id);
      if (updateError) throw updateError;

      await loadStudents();
    } catch (err: any) {
      console.error("Erro ao atualizar aluno:", err);
      Alert.alert("Erro ao Editar", `Não foi possível atualizar o aluno: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

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
    deleteStudent 
  };
}