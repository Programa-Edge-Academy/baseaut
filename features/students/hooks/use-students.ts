import { useEffect, useState } from "react";
// import { supabase } from "@/lib/supabase";

export interface Student {
    id: string;
    name: string;
    age: number;
    weight: number;
    height: number;
    waist: number;
    supportLevel: string;
}

export function useStudents() {
    const [students, setStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // --- CONEXÃO COM O SUPABASE (COMENTADA POR ENQUANTO) ---
        /*
        async function fetchStudents() {
          try {
            setIsLoading(true);
            // Considerando que as colunas 'idade', 'peso', 'altura', 'cintura' e 'nivel_suporte' serão adicionadas/ajustadas no banco
            const { data, error } = await supabase
              .from("alunos")
              .select("id, nome_completo, idade, peso, altura, cintura, nivel_suporte")
              .eq("ativo", true);
    
            if (error) {
              console.error("Erro ao buscar alunos:", error);
              return;
            }
    
            if (data) {
              const formattedData = data.map((aluno) => ({
                id: aluno.id,
                name: aluno.nome_completo,
                age: aluno.idade || 0,
                weight: aluno.peso || 0,
                height: aluno.altura || 0,
                waist: aluno.cintura || 0,
                supportLevel: aluno.nivel_suporte || "Nível não definido",
              }));
              setStudents(formattedData);
            }
          } catch (err) {
            console.error("Erro inesperado:", err);
          } finally {
            setIsLoading(false);
          }
        }
        fetchStudents();
        */

        // --- LISTA PROVISÓRIA (MOCK) ---
        const mockStudents: Student[] = [
            {
                id: "1",
                name: "Lucas Pereira",
                age: 8,
                weight: 30,
                height: 125,
                waist: 60,
                supportLevel: "Nível 1",
            },
            {
                id: "2",
                name: "Miguel Santos",
                age: 10,
                weight: 35,
                height: 140,
                waist: 65,
                supportLevel: "Nível 2",
            },
            {
                id: "3",
                name: "Beatriz Oliveira",
                age: 7,
                weight: 25,
                height: 115,
                waist: 55,
                supportLevel: "Nível 3",
            },
        ];

        setTimeout(() => {
            setStudents(mockStudents);
            setIsLoading(false);
        }, 500); // Simulando tempo de rede

    }, []);

    const addStudent = async (data: Omit<Student, 'id'>) => {
        setIsLoading(true);
        // --- CONEXÃO COM O SUPABASE (COMENTADA POR ENQUANTO) ---
        /*
        const { error } = await supabase
            .from("alunos")
            .insert([{
                nome_completo: data.name,
                idade: data.age,
                peso: data.weight,
                altura: data.height,
                cintura: data.waist,
                nivel_suporte: data.supportLevel
            }]);
            
        if (error) {
            console.error("Erro ao adicionar aluno:", error);
            setIsLoading(false);
            return;
        }
        // fetchStudents() // Idealmente rebuscaria os dados ou adicionaria no estado
        */

        // --- MOCK LOGIC ---
        const newMockStudent: Student = {
            id: Math.random().toString(36).substr(2, 9),
            ...data
        };
        setTimeout(() => {
            setStudents(prev => [...prev, newMockStudent]);
            setIsLoading(false);
        }, 500);
    };

    const updateStudent = async (id: string, data: Partial<Omit<Student, 'id'>>) => {
        setIsLoading(true);
        // --- CONEXÃO COM O SUPABASE (COMENTADA POR ENQUANTO) ---
        /*
        const payload: any = {};
        if (data.name !== undefined) payload.nome_completo = data.name;
        if (data.age !== undefined) payload.idade = data.age;
        if (data.weight !== undefined) payload.peso = data.weight;
        if (data.height !== undefined) payload.altura = data.height;
        if (data.waist !== undefined) payload.cintura = data.waist;
        if (data.supportLevel !== undefined) payload.nivel_suporte = data.supportLevel;

        const { error } = await supabase
            .from("alunos")
            .update(payload)
            .eq("id", id);
            
        if (error) {
            console.error("Erro ao atualizar aluno:", error);
            setIsLoading(false);
            return;
        }
        // fetchStudents() // Idealmente rebuscaria os dados ou atualizaria o estado
        */

        // --- MOCK LOGIC ---
        setTimeout(() => {
            setStudents(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
            setIsLoading(false);
        }, 500);
    };

    const deleteStudent = async (id: string) => {
        setIsLoading(true);
        // --- CONEXÃO COM O SUPABASE (COMENTADA POR ENQUANTO) ---
        /*
        const { error } = await supabase
            .from("alunos")
            .delete()
            .eq("id", id);
            
        if (error) {
            console.error("Erro ao remover aluno:", error);
            setIsLoading(false);
            return;
        }
        */

        // --- MOCK LOGIC ---
        setTimeout(() => {
            setStudents(prev => prev.filter(s => s.id !== id));
            setIsLoading(false);
        }, 500);
    };

    return { students, isLoading, addStudent, updateStudent, deleteStudent };
}