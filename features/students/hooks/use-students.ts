import { useEffect, useState } from "react";
// import { supabase } from "@/lib/supabase";

export interface Student {
    id: string;
    name: string;
    age: number;
    weight: number;
    height: number;
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
            // Considerando que as colunas 'idade', 'peso', 'altura' e 'nivel_suporte' serão adicionadas/ajustadas no banco
            const { data, error } = await supabase
              .from("alunos")
              .select("id, nome_completo, idade, peso, altura, nivel_suporte")
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
                supportLevel: "Nível 1",
            },
            {
                id: "2",
                name: "Miguel Santos",
                age: 10,
                weight: 35,
                height: 140,
                supportLevel: "Nível 2",
            },
            {
                id: "3",
                name: "Beatriz Oliveira",
                age: 7,
                weight: 25,
                height: 115,
                supportLevel: "Nível 3",
            },
        ];

        setTimeout(() => {
            setStudents(mockStudents);
            setIsLoading(false);
        }, 500); // Simulando tempo de rede

    }, []);

    return { students, isLoading };
}