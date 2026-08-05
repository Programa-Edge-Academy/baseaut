import { colors } from "@/assets/colors";
import { FormQuestion } from "@/features/forms/components/form-question";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import type { TranslationKey } from "@/features/settings/constants/translations";
import { localizeFormText } from "@/features/forms/utils/form-content-i18n";
import { SpotlightTarget } from "@/features/tutorial/components/spotlight-target";
import { useTutorialSimulation } from "@/features/tutorial/contexts/tutorial-simulation-context";
import { supabase } from "@/lib/supabase";
import { useKeyboardAwareScroll } from "@/lib/use-keyboard-aware-scroll";
import { useKeyboardPadding } from "@/lib/use-keyboard-padding";
import { forwardRef, useId, useImperativeHandle, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  View,
} from "react-native";

/** Returns the value the UI already displays as default, or undefined when there is none. */
function getDefaultAnswer(question: { type: string; min?: number }): any {
  if (question.type === "linear_scale") return question.min ?? null;
  return undefined;
}

/**
 * Extracts the ticked options of a choice list answer.
 *
 * @param rawValue - The current answer, in either shape described below.
 * @returns The ticked options, or an empty list when none is ticked.
 *
 * @remarks
 * The choice list UI keeps its answer as `{ selected, other }`, while an answer
 * read straight from `valores_selecionados` is a plain array. Both shapes reach
 * the save path, so both are normalized to the array the column stores.
 */
function getSelectedOptions(rawValue: any): string[] {
  if (Array.isArray(rawValue)) return rawValue.map(String);
  if (Array.isArray(rawValue?.selected)) return rawValue.selected.map(String);
  return [];
}

/**
 * Control Record questions auto-filled by the session and hidden during
 * execution: the app fills them when the session ends, and they remain editable
 * later from the history.
 */
const RC_AUTO_FILLED_TITLES = [
  "Tempo da sessão",
  "Fugas (número de fugas e tempo do ocorrido)",
];

/** Mock Control Record questions used by the tutorial session simulation. */
function buildMockRcQuestions(t: (key: TranslationKey) => string) {
  return [
    {
      id: "mock-rc-1",
      type: "linear_scale",
      title: t("forms.mockRcEngagement"),
      min: 1,
      max: 5,
      step: 1,
      options: undefined,
      multiple: undefined,
      obrigatoria: true,
      helpText: undefined,
      numeric: false,
    },
    {
      id: "mock-rc-2",
      type: "open",
      title: t("forms.mockRcObservations"),
      min: undefined,
      max: undefined,
      step: undefined,
      options: undefined,
      multiple: undefined,
      obrigatoria: false,
      helpText: undefined,
      numeric: false,
    },
  ];
}

/** Normalizes a title for comparison by removing accents and casing. */
function normalizeTitle(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/** Props for {@link FormComponent}. */
export interface FormComponentProps {
  formularioId: string;
  sessaoId?: string;
  alunoId?: string;
  onSuccess?: () => void;
  /** Hides the auto-filled Control Record questions (inline use during a session). */
  hideAutoFilledSessionFields?: boolean;
  /**
   * Whether the component owns its scrolling. Defaults to true. Set to false
   * when rendered inside a parent `ScrollView` (e.g. during a running session),
   * so it renders as a plain view and the parent handles scrolling and
   * keyboard-aware behavior.
   */
  scrollable?: boolean;
  /**
   * When true, renders mock Control Record questions with no Supabase access
   * (tutorial session simulation), so answers can be filled or left pending.
   */
  mock?: boolean;
  /**
   * Tutorial spotlight key for the mock question's answer control. When set (in
   * the forms simulation), the linear-scale question is highlighted and the
   * sub-step advances once the user changes its answer.
   */
  answerSpotlightKey?: string;
}

/**
 * Renders and persists a dynamic form instance. Loads its questions from the
 * linked template (`template_origem_id`), pre-fills saved answers in edit mode,
 * and exposes an imperative `handleSave` (supporting partial saves) via ref.
 *
 * @remarks
 * When it owns its scrolling (`scrollable`, the default), the keyboard brings
 * the focused input above it (see {@link useKeyboardAwareScroll}) and the
 * bottom padding grows by the keyboard height (see {@link useKeyboardPadding}).
 * When nested inside a parent `ScrollView` (e.g. a running session), pass
 * `scrollable={false}` so it renders as a plain view and the parent owns the
 * scrolling and keyboard-aware behavior — otherwise the inner scroll never
 * moves.
 */
export const FormComponent = forwardRef(function FormComponent(
  { formularioId, sessaoId, alunoId, onSuccess, hideAutoFilledSessionFields, scrollable = true, mock = false, answerSpotlightKey }: FormComponentProps,
  ref
) {
  const { t, locale } = useI18n();
  const sim = useTutorialSimulation();
  const questionsRef = useRef<View>(null);
  const passthroughId = useId();
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  /**
   * Whether this instance is an ATA. Its multiple-choice answers persist the
   * ticked options in `valores_selecionados`; the 0/1/2 score in
   * `valor_preenchido` is derived by the database from how many were ticked.
   */
  const [isAta, setIsAta] = useState(false);
  const [, setSaving] = useState(false);
  const keyboardPadding = useKeyboardPadding();
  const keyboardAwareScroll = useKeyboardAwareScroll();

  useEffect(() => {
    if (mock) {
      const mockQuestions = buildMockRcQuestions(t);
      const defaults: Record<string, any> = {};
      for (const q of mockQuestions) {
        const def = getDefaultAnswer(q);
        if (def !== undefined) defaults[q.id] = def;
      }
      setQuestions(mockQuestions);
      setAnswers(defaults);
      setLoading(false);
      return;
    }

    async function loadQuestions() {
      if (!formularioId) {
        setLoading(false);
        return;
      }

      const { data: formulario } = await supabase
        .from("formularios")
        .select("template_origem_id, tipo")
        .eq("id", formularioId)
        .maybeSingle();

      const questionSourceId = formulario?.template_origem_id ?? formularioId;
      const isMabc = formulario?.tipo === "mabc2";
      setIsAta(formulario?.tipo === "ata");

      const { data, error } = await supabase
        .from("perguntas")
        .select("id, texto_pergunta, tipo_resposta, opcoes, descricao, obrigatoria, ordem")
        .eq("formulario_id", questionSourceId)
        .order("ordem", { ascending: true });

      if (error) {
        Alert.alert(t("common.error"), t("form.loadQuestionsError"));
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

        // Titles, scoring criteria and descriptions are canonical seeded
        // content, so they are localized for display only; the stored answer
        // value is unaffected. Localizing the whole `texto_pergunta` before the
        // split keeps the `(0=` marker (preserved in the translation) working.
        const localizedPergunta = localizeFormText(q.texto_pergunta, locale);
        const [title, ...rest] = localizedPergunta.split(/\n(?=\(0=)/);
        const scoringCriteria = rest.join("\n").trim();
        // Expand the seed's literal `\n` escapes first, then localize, so the
        // dictionary keys can use real newlines.
        const descricao = localizeFormText((q.descricao ?? "").replace(/\\n/g, "\n"), locale);
        const helpText = [scoringCriteria && `**${scoringCriteria}**`, descricao].filter(Boolean).join("\n\n") || undefined;
        // Original Portuguese title, kept for internal matching (the auto-filled
        // RC filter below) so it stays reliable regardless of display locale.
        const [ptTitle] = q.texto_pergunta.split(/\n(?=\(0=)/);

        return {
          id: q.id,
          type,
          title: title.trim(),
          ptTitle: ptTitle.trim(),
          min,
          max,
          step,
          options,
          multiple,
          obrigatoria: q.obrigatoria,
          helpText,
          numeric: isMabc && type === "open",
        };
      });

      const visibleQuestions = hideAutoFilledSessionFields
        ? mappedQuestions.filter(
            (q) =>
              !RC_AUTO_FILLED_TITLES.some(
                (t) => normalizeTitle(q.ptTitle) === normalizeTitle(t),
              ),
          )
        : mappedQuestions;

      setQuestions(visibleQuestions);

      const defaultAnswers: Record<string, any> = {};
      for (const q of mappedQuestions) {
        const def = getDefaultAnswer(q);
        if (def !== undefined) defaultAnswers[q.id] = def;
      }

      let loadedAnswers: Record<string, any> = {};
      if (sessaoId || alunoId) {
        let answersQuery = supabase
          .from("respostas_formulario")
          .select("pergunta_id, valor_preenchido, valores_selecionados")
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
            // An ATA answer lives in its own column: the ticked options are the
            // answer, and `valor_preenchido` only carries the derived score.
            // The choice list UI reads `{ selected, other }`, so the stored
            // array is wrapped back into that shape — otherwise reopening the
            // form would show every indicator unticked.
            if (Array.isArray(r.valores_selecionados)) {
              loadedAnswers[r.pergunta_id] = {
                selected: r.valores_selecionados.map(String),
                other: "",
              };
              continue;
            }
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
    // `locale` is included so canonical question/description text re-localizes
    // when the user switches languages.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formularioId, sessaoId, alunoId, hideAutoFilledSessionFields, mock, locale]);

  /**
   * Persists the current answers. When `allowPartial` is true, empty required
   * fields do not block saving (used for the Control Record's auto-save during a
   * session so partial answers persist and can be resumed/edited later).
   *
   * @param silent - When false, shows success/error alerts.
   * @param allowPartial - When true, allows saving with empty required fields.
   */
  const handleSave = async (silent = true, allowPartial = false) => {
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

      if (missingRequired && !allowPartial) {
        setSaving(false);
        return {
          success: false,
          title: t("form.saveErrorTitle"),
          description: t("form.emptyFieldsError")
        };
      }

      // Tutorial mock: never touches Supabase; answers can be filled or left pending.
      if (mock) {
        setSaving(false);
        if (!silent) Alert.alert(t("form.successTitle"), t("form.savedEvaluation"));
        if (onSuccess) onSuccess();
        return { success: true, hadPending: missingRequired };
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

        // An ATA domain stores the ticked indicators; the database derives the
        // 0/1/2 score from how many there are, so no score is sent from here.
        // An empty list is a real answer ("no indicator observed" = 0), which is
        // why it is sent even though `isFilled` is false for it.
        const isAtaChoice = isAta && q.type === "choice_list";
        if (isAtaChoice) {
          return {
            formulario_id: formularioId,
            sessao_id: sessaoId || null,
            aluno_id: alunoId || null,
            pergunta_id: q.id,
            valores_selecionados: getSelectedOptions(rawValue),
            status_item: "respondido",
          };
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
        const { error } = await supabase
          .from("respostas_formulario")
          .upsert(payloadRespostas, { onConflict: "sessao_id, pergunta_id" });

        if (error) throw error;

        await supabase.rpc(
          "sincronizar_comportamentos_rc",
          { p_sessao_id: sessaoId },
        );
      } else {
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

      if (!silent) Alert.alert(t("form.successTitle"), t("form.savedEvaluation"));
      if (onSuccess) onSuccess();

      return { success: true, hadPending: missingRequired };
    } catch {
      if (!silent) Alert.alert(t("common.error"), t("form.saveResponsesError"));
      return {
        success: false,
        title: t("form.connectionError"),
        description: t("form.connectionErrorDesc")
      };
    } finally {
      setSaving(false);
    }
  };

  useImperativeHandle(ref, () => ({
    handleSave,
  }));

  // Answering is data entry, not navigation: the hints ask the user to fill a
  // form in steps whose highlight sits on the save button, so the tutorial tap
  // guard must never block these fields.
  useEffect(() => {
    if (!sim.active) return;
    sim.registerPassthrough(passthroughId, questionsRef);
    return () => sim.unregisterPassthrough(passthroughId);
  }, [sim, passthroughId]);

  if (loading) {
    return (
      <View className="flex-1 bg-level1 justify-center items-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const content = (
    <View
      ref={questionsRef}
      collapsable={false}
      className="items-center"
      style={{ paddingBottom: scrollable ? 40 + keyboardPadding : 40 }}
    >
      {questions.length === 0 ? (
        <View className="mt-10 items-center">
          <Text className="text-muted">{t("form.noQuestions")}</Text>
        </View>
      ) : (
        questions.map((question) => {
          // In the forms simulation, highlight the mock scale question and
          // advance the sub-step once the user changes its answer.
          const isAnswerTarget =
            mock && !!answerSpotlightKey && question.type === "linear_scale";
          const questionNode = (
            <FormQuestion
              question={question}
              value={answers[question.id]}
              onChange={(val: any) => {
                setAnswers((prev) => ({ ...prev, [question.id]: val }));
                if (isAnswerTarget && sim.active && sim.currentKey === answerSpotlightKey) {
                  sim.complete(answerSpotlightKey!);
                }
              }}
            />
          );
          return (
            <View key={question.id} className="w-full mt-4">
              {isAnswerTarget ? (
                <SpotlightTarget targetKey={answerSpotlightKey!}>{questionNode}</SpotlightTarget>
              ) : (
                questionNode
              )}
            </View>
          );
        })
      )}
    </View>
  );

  // Nested inside a parent ScrollView: let the parent own scrolling.
  if (!scrollable) {
    return content;
  }

  return (
    <ScrollView
      {...keyboardAwareScroll}
      className="flex-1"
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {content}
    </ScrollView>
  );
});