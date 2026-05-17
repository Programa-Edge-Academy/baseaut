import { useEffect, useState } from "react";
// import { supabase } from "@/lib/supabase";

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

const MOCK_STUDENTS: Student[] = [
  {
    id: "4a89f665-266d-4cbc-a273-25045851ada9",
    name: "Lucas Souza",
    birthDate: "2018-03-10",
    age: 6,
    weight: 25,
    height: 120,
    waist: 50,
    supportLevel: "nivel_2",
    healthConditions: "",
    observations: "",
    avatarUrl: null,
  },
  {
    id: "b8d8c9b1-9770-49c2-b90b-58019207c995",
    name: "Pedro Oliveira",
    birthDate: "2014-11-05",
    age: 11,
    weight: 42,
    height: 145,
    waist: 65,
    supportLevel: "nivel_3",
    healthConditions: "Alergia a amendoim",
    observations: "Usa comunicação alternativa",
    avatarUrl: null,
  },
  {
    id: "e9c21bdc-48c0-4650-97df-7848e4ba1572",
    name: "Ana Lima",
    birthDate: "2016-07-22",
    age: 9,
    weight: 30,
    height: 135,
    waist: 58,
    supportLevel: "nivel_1",
    healthConditions: "",
    observations: "",
    avatarUrl: null,
  }
];

export function useStudents() {
  const [students, setStudents] = useState<Student[]>([]);
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

  /*
  // --- FUNÇÃO AUXILIAR DE UPLOAD PARA O SUPABASE (COMENTADA POR ENQUANTO) ---
  const uploadImage = async (uri: string) => {
    const FileSystem = require('expo-file-system');
    const { decode } = require('base64-arraybuffer');
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
      if (data) {
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
        return publicUrl;
      }
      return null;
    } catch (e) {
      console.error(e);
      return null;
    }
  };
  */

  useEffect(() => {
    // --- CONEXÃO COM O SUPABASE (COMENTADA POR ENQUANTO) ---
    /*
    async function fetchStudents() {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("alunos")
          .select("id, nome_completo, data_nascimento, peso, altura, cintura, nivel_suporte, diagnostico_detalhado, observacoes_clinicas, avatar_url")
          .eq("ativo", true);

        if (error) {
          console.error("Erro ao buscar alunos:", error);
          return;
        }

        if (data) {
          setStudents(
            data.map((aluno) => ({
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
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStudents();
    */

    // --- LISTA PROVISÓRIA (MOCK) ---
    const timer = setTimeout(() => {
      setStudents(MOCK_STUDENTS);
      setIsLoading(false);
    }, 600);
    
    return () => clearTimeout(timer);
  }, []);

  const addStudent = async (data: Omit<Student, "id" | "age">, photoUri?: string | null) => {
    // --- CONEXÃO COM O SUPABASE (COMENTADA POR ENQUANTO) ---
    /*
    try {
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
        equipe_id: "33af53f5-113c-42c4-aa46-6faa6cfdd5e7",
        ativo: true,
      };
      const { error } = await supabase.from("alunos").insert([payload]);
      if (error) throw error;
    } catch (err) {
      console.error(err);
    }
    */

    // --- MOCK LOGIC ---
    const newStudent: Student = {
      id: Math.random().toString(36).substring(2, 11),
      name: data.name,
      birthDate: data.birthDate,
      age: calculateAge(data.birthDate),
      weight: data.weight,
      height: data.height,
      waist: data.waist,
      supportLevel: data.supportLevel,
      healthConditions: data.healthConditions,
      observations: data.observations,
      avatarUrl: photoUri || null,
    };
    
    setStudents((prev) => [...prev, newStudent]);
  };

  const updateStudent = async (id: string, data: Partial<Omit<Student, "id" | "age">>, photoUri?: string | null) => {
    // --- CONEXÃO COM O SUPABASE (COMENTADA POR ENQUANTO) ---
    /*
    try {
      setIsLoading(true);
      let finalAvatarUrl = data.avatarUrl;
      if (photoUri && !photoUri.startsWith("http")) {
        const uploadedUrl = await uploadImage(photoUri);
        if (uploadedUrl) finalAvatarUrl = uploadedUrl;
      }
      const payload: any = {};
      if (data.name !== undefined) payload.nome_completo = data.name;
      if (data.birthDate !== undefined) payload.data_nascimento = data.birthDate;
      if (data.weight !== undefined) payload.peso = data.weight;
      if (data.height !== undefined) payload.altura = data.height;
      if (data.waist !== undefined) payload.cintura = data.waist;
      if (data.supportLevel !== undefined) payload.nivel_suporte = data.supportLevel;
      if (data.healthConditions !== undefined) payload.diagnostico_detalhado = data.healthConditions;
      if (data.observations !== undefined) payload.observacoes_clinicas = data.observations;
      if (finalAvatarUrl !== undefined) payload.avatar_url = finalAvatarUrl;

      const { error } = await supabase.from("alunos").update(payload).eq("id", id);
      if (error) throw error;
    } catch (err) {
      console.error(err);
    }
    */

    // --- MOCK LOGIC ---
    setStudents((prev) => prev.map((student) => {
      if (student.id === id) {
        return {
          ...student,
          ...data,
          age: data.birthDate ? calculateAge(data.birthDate) : student.age,
          avatarUrl: photoUri !== undefined ? photoUri : student.avatarUrl
        };
      }
      return student;
    }));
  };

  const deleteStudent = async (id: string) => {
    // --- CONEXÃO COM O SUPABASE (COMENTADA POR ENQUANTO) ---
    /*
    try {
      setIsLoading(true);
      const { error } = await supabase.from("alunos").update({ ativo: false }).eq("id", id);
      if (error) throw error;
    } catch (err) {
      console.error(err);
    }
    */

    // --- MOCK LOGIC ---
    setStudents((prev) => prev.filter((student) => student.id !== id));
  };

  return { students, isLoading, addStudent, updateStudent, deleteStudent };
}