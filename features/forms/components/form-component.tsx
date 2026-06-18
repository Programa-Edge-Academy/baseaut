import { colors } from "@/assets/colors";
import { FormQuestion } from "@/features/forms/components/form-question";
import { supabase } from "@/lib/supabase";
import { forwardRef, useImperativeHandle, useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";

// Returns the value the UI already displays as default, or undefined if there is no default.
function getDefaultAnswer(question: { type: string; min?: number }): any {
  if (question.type === "linear_scale") return question.min ?? null;
  return undefined;
}

export interface FormComponentProps {
  formularioId: string;
  sessaoId?: string;
  alunoId?: string;
  onSuccess?: () => void;
}

export const FormComponent = forwardRef(function FormComponent(
  { formularioId, sessaoId, alunoId, onSuccess }: FormComponentProps,
  ref
) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [, setSaving] = useState(false);

  useEffect(() => {
    async function loadQuestions() {
      if (!formularioId) {
        setLoading(false);
        return;
      }

      // Instâncias de formulário (RC/ATA/CARS criadas por sessão/avaliação) não
      // copiam as perguntas: elas apontam para o template via template_origem_id.
      // As perguntas vivem no template; as respostas, na instância.
      const { data: formulario } = await supabase
        .from("formularios")
        .select("template_origem_id")
        .eq("id", formularioId)
        .maybeSingle();

      const questionSourceId = formulario?.template_origem_id ?? formularioId;

      const { data, error } = await supabase
        .from("perguntas")
        .select("*")
        .eq("formulario_id", questionSourceId)
        .order("ordem", { ascending: true });

      if (error) {
        Alert.alert("Erro", "Não foi possível carregar as perguntas.");
        setLoading(false);
        return;
      }

      const mappedQuestions = data.map((q) => {
        let type = "open";
        let min, max, step, options, multiple;

        if (q.tipo_resposta === "escala_decimal") {
          type = "linear_scale";
          min = q.opcoes?.valores?.[0] ?? 1;
          max = q.opcoes?.valores?.[q.opcoes.valores.length - 1] ?? 4;
          step = 0.5;
        } else if (q.tipo_resposta === "escala_inteira") {
          type = "linear_scale";
          min = q.opcoes?.min ?? 0;
          max = q.opcoes?.max ?? 2;
          step = 1;
        } else if (q.tipo_resposta === "selecao_unica" && Array.isArray(q.opcoes?.valores) && q.opcoes.valores.length === 2 && q.opcoes.valores[0] === "Sim" && q.opcoes.valores[1] === "Não") {
          type = "yes_no";
          options = q.opcoes?.valores ?? [];
        } else if (q.tipo_resposta === "selecao_unica") {
          type = "dropdown";
          options = q.opcoes?.valores ?? [];
        } else if (q.tipo_resposta === "multipla_escolha") {
          type = "choice_list";
          options = q.opcoes?.valores ?? [];
          multiple = true;
        }

        const [title, ...rest] = q.texto_pergunta.split(/\n(?=\(0=)/);
        const scoringCriteria = rest.join("\n").trim();
        const descricao = q.descricao?.replace(/\\n/g, "\n") ?? "";
        const helpText = [scoringCriteria && `**${scoringCriteria}**`, descricao].filter(Boolean).join("\n\n") || undefined;

        return {
          id: q.id,
          type,
          title: title.trim(),
          min,
          max,
          step,
          options,
          multiple,
          obrigatoria: q.obrigatoria,
          helpText,
        };
      });

      setQuestions(mappedQuestions);

      // Seed visual defaults so untouched questions are saved as answered.
      const defaultAnswers: Record<string, any> = {};
      for (const q of mappedQuestions) {
        const def = getDefaultAnswer(q);
        if (def !== undefined) defaultAnswers[q.id] = def;
      }

      // Modo edição: pré-carrega as respostas já salvas deste formulário no
      // contexto atual (sessão ou aluno), parseando os tipos que guardam
      // objeto. Loaded answers override defaults to preserve edit-mode state.
      let loadedAnswers: Record<string, any> = {};
      if (sessaoId || alunoId) {
        let answersQuery = supabase
          .from("respostas_formulario")
          .select("pergunta_id, valor_preenchido")
          .eq("formulario_id", formularioId);

        if (sessaoId) {
          answersQuery = answersQuery.eq("sessao_id", sessaoId);
        } else if (alunoId) {
          answersQuery = answersQuery.eq("aluno_id", alunoId);
        }

        const { data: respostas } = await answersQuery;

        if (respostas && respostas.length > 0) {
          const objectTypes = new Set(["dropdown", "choice_list", "matrix"]);
          const typeById = new Map<string, string>(
            mappedQuestions.map((q) => [q.id, q.type]),
          );

          for (const r of respostas) {
            if (r.valor_preenchido == null) continue;
            const qType = typeById.get(r.pergunta_id);
            if (qType && objectTypes.has(qType)) {
              try {
                loadedAnswers[r.pergunta_id] = JSON.parse(r.valor_preenchido);
              } catch {
                loadedAnswers[r.pergunta_id] = r.valor_preenchido;
              }
            } else {
              loadedAnswers[r.pergunta_id] = r.valor_preenchido;
            }
          }
        }
      }

      setAnswers({ ...defaultAnswers, ...loadedAnswers });
      setLoading(false);
    }

    loadQuestions();
  }, [formularioId, sessaoId, alunoId]);

  const handleSave = async (silent = true) => {
    setSaving(true);

    try {
      const missingRequired = questions.some((q) => {
        if (!q.obrigatoria) return false;        
        const rawValue = answers[q.id];
        let isFilled = rawValue !== undefined && rawValue !== "" && rawValue !== null;
        if (isFilled && typeof rawValue === "object") {
           if (Array.isArray(rawValue)) {
             isFilled = rawValue.length > 0;
           } else if (rawValue.selected !== undefined) {
             isFilled = rawValue.selected !== null && rawValue.selected !== "" && (!Array.isArray(rawValue.selected) || rawValue.selected.length > 0);
           }
        }
        
        return !isFilled;
      });

      if (missingRequired) {
        setSaving(false);
        return { 
          success: false, 
          title: "Erro ao salvar formulário", 
          description: "Não é possível salvar formulários com campos vazios" 
        };
      }

      const payloadRespostas = questions.map((q) => {
        const rawValue = answers[q.id];
        let isFilled = rawValue !== undefined && rawValue !== "" && rawValue !== null;

        if (isFilled && typeof rawValue === "object") {
           if (Array.isArray(rawValue)) {
             isFilled = rawValue.length > 0;
           } else if (rawValue.selected !== undefined) {
             isFilled = rawValue.selected !== null && rawValue.selected !== "" && 
                        (!Array.isArray(rawValue.selected) || rawValue.selected.length > 0);
           }
        }

        let stringValue = null;
        if (isFilled) {
          stringValue = typeof rawValue === "object" ? JSON.stringify(rawValue) : String(rawValue);
        }

        return {
          formulario_id: formularioId,
          sessao_id: sessaoId || null,
          aluno_id: alunoId || null,
          pergunta_id: q.id,
          valor_preenchido: stringValue,
          status_item: isFilled ? "respondido" : "nao_realizado",
        };
      });

      if (sessaoId) {
        // Registro de Controle: a constraint UNIQUE (sessao_id, pergunta_id)
        // permite upsert idempotente por sessão.
        const { error } = await supabase
          .from("respostas_formulario")
          .upsert(payloadRespostas, { onConflict: "sessao_id, pergunta_id" });

        if (error) throw error;
      } else {
        // ATA/CARS (vinculados só ao aluno): sessao_id é nulo, então a constraint
        // acima não deduplica. Substituímos todas as respostas da instância.
        const { error: deleteError } = await supabase
          .from("respostas_formulario")
          .delete()
          .eq("formulario_id", formularioId);

        if (deleteError) throw deleteError;

        const { error: insertError } = await supabase
          .from("respostas_formulario")
          .insert(payloadRespostas);

        if (insertError) throw insertError;
      }

      if (!silent) Alert.alert("Sucesso", "Avaliação salva com sucesso!");
      if (onSuccess) onSuccess();

      return { success: true };
    } catch (error) {
      console.error(error);
      if (!silent) Alert.alert("Erro", "Ocorreu um erro ao salvar as respostas.");
      return { 
        success: false, 
        title: "Erro de conexão", 
        description: "Falha ao se conectar com os servidores. Verifique sua internet." 
      };
    } finally {
      setSaving(false);
    }
  };

  useImperativeHandle(ref, () => ({
    handleSave,
  }));

  if (loading) {
    return (
      <View className="flex-1 bg-level1 justify-center items-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="pb-10 items-center">
        {questions.length === 0 ? (
          <View className="mt-10 items-center">
            <Text className="text-muted">Nenhuma pergunta encontrada para este formulário.</Text>
          </View>
        ) : (
          questions.map((question) => (
            <View key={question.id} className="w-full mt-4">
              <FormQuestion
                question={question}
                value={answers[question.id]}
                onChange={(val: any) =>
                  setAnswers((prev) => ({ ...prev, [question.id]: val }))
                }
              />
            </View>
          ))
        )}
        
        {/* {questions.length > 0 && (
          <View className="w-full mt-8">
            <DefaultButton
              label={saving ? "Salvando..." : "Salvar Avaliação"}
              onPress={handleSave}
              disabled={saving}
            />
          </View>
        )} */}
      </View>
    </ScrollView>
  );
});