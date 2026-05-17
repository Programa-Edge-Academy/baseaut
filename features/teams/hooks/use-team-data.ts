import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

const EQUIPE_ID = "33af53f5-113c-42c4-aa46-6faa6cfdd5e7";

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

export type CompanionData = {
  id: string; 
  profileId: string;
  name: string;
  email: string;
  status: "ativo" | "pendente" | "removido";
};

export function useTeamData() {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [companions, setCompanions] = useState<CompanionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: alunosData, error: alunosError } = await supabase
        .from("alunos")
        .select("id, nome_completo, data_nascimento, peso, altura, cintura, nivel_suporte, diagnostico_detalhado, observacoes_clinicas, avatar_url")
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
          }))
        );
      }

      const { data: membrosData, error: membrosError } = await supabase
        .from("membros_equipe")
        .select(`id, status, usuario_id, profiles:usuario_id (nome_completo, email)`)
        .eq("equipe_id", EQUIPE_ID)
        .neq("status", "removido");

      if (membrosError) {
        console.error("Erro ao buscar membros_equipe:", membrosError);
      }

      const { data: pendentesData, error: pendentesError } = await supabase
        .from("profiles")
        .select("id, nome_completo, email")
        .eq("role", "monitor")
        .eq("status_conta", "pendente");

      if (pendentesError) {
        console.error("Erro ao buscar profiles pendentes (Verifique o RLS no Supabase!):", pendentesError);
      } else if (pendentesData?.length === 0) {
        console.log("Nenhum profile pendente encontrado ou bloqueado pelo RLS da tabela 'profiles'.");
      }

      const listaMonitores: CompanionData[] = [];
      const addedProfileIds = new Set<string>();

      if (!membrosError && membrosData) {
        membrosData.forEach((membro: any) => {
          if (membro.profiles) {
            listaMonitores.push({
              id: membro.id,
              profileId: membro.usuario_id,
              name: membro.profiles.nome_completo,
              email: membro.profiles.email,
              status: membro.status,
            });
            addedProfileIds.add(membro.usuario_id);
          }
        });
      }

      if (!pendentesError && pendentesData) {
        pendentesData.forEach((profile) => {
          if (!addedProfileIds.has(profile.id)) {
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

  const acceptCompanion = async (id: string) => {
    const comp = companions.find(c => c.id === id);
    if (!comp) return;

    if (comp.id !== comp.profileId) {
      await supabase.from("membros_equipe").update({ status: "ativo" }).eq("id", comp.id);
    } else {
      await supabase.from("membros_equipe").insert([
        {
          usuario_id: comp.profileId,
          equipe_id: EQUIPE_ID,
          papel: "monitor",
          status: "ativo",
        },
      ]);
    }

    await supabase.from("profiles").update({ status_conta: "ativa" }).eq("id", comp.profileId);
    
    fetchData();
  };

  const rejectCompanion = async (id: string) => {
    const comp = companions.find(c => c.id === id);
    if (!comp) return;

    if (comp.id !== comp.profileId) {
      await supabase.from("membros_equipe").delete().eq("id", comp.id);
    }

    await supabase.from("profiles").update({ status_conta: "recusado" }).eq("id", comp.profileId);
    
    fetchData();
  };

  const removeCompanion = async (membroEquipeId: string) => {
    await supabase
      .from("membros_equipe")
      .update({ status: "removido" })
      .eq("id", membroEquipeId);

    fetchData();
  };

  const uploadImage = async (uri: string) => {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });

      const filePath = `${Date.now()}_avatar.jpg`;
      
      const { data, error } = await supabase.storage.from('avatars').upload(
        filePath, 
        decode(base64), 
        { contentType: 'image/jpeg' }
      );
      
      if (error) {
        console.error("Erro no Storage:", error);
        return null;
      }

      if (data) {
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
        return publicUrl;
      }
      return null;
    } catch (e) {
      console.error("Erro no upload", e);
      return null;
    }
  };

  const saveStudent = async (data: Partial<StudentData>, photoUri?: string | null) => {
    setIsLoading(true);
    let finalAvatarUrl = data.avatarUrl;

    if (photoUri && !photoUri.startsWith("http")) {
      const uploadedUrl = await uploadImage(photoUri);
      if (uploadedUrl) finalAvatarUrl = uploadedUrl;
    }

    const payload = {
      nome_completo: data.name,
      data_nascimento: data.birthDate,
      peso: data.weight,
      altura: data.height,
      cintura: data.waist,
      nivel_suporte: data.supportLevel,
      diagnostico_detalhado: data.healthConditions,
      observacoes_clinicas: data.observations,
      avatar_url: finalAvatarUrl,
      equipe_id: EQUIPE_ID,
      ativo: true,
    };

    if (data.id) {
      await supabase.from("alunos").update(payload).eq("id", data.id);
    } else {
      await supabase.from("alunos").insert([payload]);
    }
    fetchData();
  };

  const deleteStudent = async (id: string) => {
    await supabase.from("alunos").update({ ativo: false }).eq("id", id);
    fetchData();
  };

  return {
    students, companions, isLoading, acceptCompanion, rejectCompanion, removeCompanion, saveStudent, deleteStudent,
  };
}