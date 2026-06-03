import { useCallback, useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

/** Response type stored in `perguntas.tipo_resposta`. */
export type TipoResposta =
  | "texto_curto"
  | "texto_longo"
  | "texto_opcional"
  | "multipla_escolha"
  | "selecao_unica"
  | "escala_likert"
  | "booleano"
  | "numerico"
  | "escala_decimal"
  | "escala_inteira";

export type FormQuestion = {
  id: string;
  texto: string;
  tipo: TipoResposta;
  opcoes: string[];
  obrigatoria: boolean;
  ordem: number;
};

export type FormMeta = {
  id: string;
  titulo: string;
  alunoId: string | null;
  protegido: boolean;
};

/**
 * Loads a form, its questions and the student's current answers, and exposes a
 * save routine that upserts the answers keyed by (formulario_id, pergunta_id).
 */
export function useFormAnswers(formularioId?: string) {
  const [form, setForm] = useState<FormMeta | null>(null);
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(formularioId));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchForm = useCallback(async () => {
    if (!formularioId) return;

    setIsLoading(true);
    setError(null);
    try {
      const { data: formData, error: formError } = await supabase
        .from("formularios")
        .select("id, titulo, aluno_id, protegido")
        .eq("id", formularioId)
        .single();
      if (formError) throw formError;

      setForm({
        id: formData.id,
        titulo: formData.titulo,
        alunoId: formData.aluno_id ?? null,
        protegido: formData.protegido ?? true,
      });

      const { data: questionsData, error: questionsError } = await supabase
        .from("perguntas")
        .select("id, texto_pergunta, tipo_resposta, opcoes, obrigatoria, ordem")
        .eq("formulario_id", formularioId)
        .order("ordem", { ascending: true });
      if (questionsError) throw questionsError;

      const mappedQuestions: FormQuestion[] = (questionsData ?? []).map(
        (row: any) => ({
          id: row.id,
          texto: row.texto_pergunta,
          tipo: row.tipo_resposta,
          opcoes: Array.isArray(row.opcoes) ? row.opcoes : [],
          obrigatoria: row.obrigatoria,
          ordem: row.ordem,
        }),
      );
      setQuestions(mappedQuestions);

      const { data: answersData, error: answersError } = await supabase
        .from("respostas_formulario")
        .select("pergunta_id, valor_preenchido")
        .eq("formulario_id", formularioId);
      if (answersError) throw answersError;

      const mappedAnswers: Record<string, string> = {};
      (answersData ?? []).forEach((row: any) => {
        mappedAnswers[row.pergunta_id] = row.valor_preenchido ?? "";
      });
      setAnswers(mappedAnswers);
    } catch (caught: any) {
      setError(caught instanceof Error ? caught : new Error(String(caught)));
    } finally {
      setIsLoading(false);
    }
  }, [formularioId]);

  useEffect(() => {
    if (formularioId) fetchForm();
  }, [formularioId, fetchForm]);

  const setAnswer = useCallback((perguntaId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [perguntaId]: value }));
  }, []);

  const saveAnswers = useCallback(async (): Promise<void> => {
    if (!form) throw new Error("Formulário não carregado.");

    setIsSaving(true);
    setError(null);
    try {
      const payload = questions.map((question) => {
        const value = answers[question.id]?.trim() ?? "";
        return {
          formulario_id: form.id,
          pergunta_id: question.id,
          aluno_id: form.alunoId,
          valor_preenchido: value.length > 0 ? value : null,
          status_item: value.length > 0 ? "respondido" : "nao_realizado",
          atualizado_em: new Date().toISOString(),
        };
      });

      const { error: upsertError } = await supabase
        .from("respostas_formulario")
        .upsert(payload, { onConflict: "formulario_id,pergunta_id" });

      if (upsertError) throw upsertError;
    } catch (caught: any) {
      const normalized =
        caught instanceof Error ? caught : new Error(String(caught));
      setError(normalized);
      throw normalized;
    } finally {
      setIsSaving(false);
    }
  }, [form, questions, answers]);

  return {
    form,
    questions,
    answers,
    isLoading,
    isSaving,
    error,
    setAnswer,
    saveAnswers,
    refetch: fetchForm,
  };
}
