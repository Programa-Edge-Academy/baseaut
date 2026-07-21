import { supabase } from "@/lib/supabase";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import Constants from "expo-constants";
import { useState } from "react";
import { Platform } from "react-native";

/** Category of a feedback submission. */
export type FeedbackCategory = "problema" | "sugestao" | "outro";

/** Payload accepted by {@link useFeedback.sendFeedback}. */
type SendFeedbackData = {
  categoria: FeedbackCategory;
  mensagem: string;
};

/**
 * Sends user feedback to the development team by inserting it into the private
 * `feedbacks` table. RLS allows only the user's own insert and no reads, so the
 * content is never exposed to other users in the app; the team reads it through
 * the Supabase dashboard.
 */
export function useFeedback() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Persists a feedback entry tagged with the current platform and app version.
   * @returns `true` when the feedback was stored.
   */
  const sendFeedback = async ({
    categoria,
    mensagem,
  }: SendFeedbackData): Promise<boolean> => {
    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      setError(t("feedback.sessionExpired"));
      return false;
    }

    const { error: insertError } = await supabase.from("feedbacks").insert({
      usuario_id: user.id,
      categoria,
      mensagem: mensagem.trim(),
      plataforma: Platform.OS,
      app_version: Constants.expoConfig?.version ?? null,
    });

    setLoading(false);

    if (insertError) {
      setError(t("feedback.sendError"));
      return false;
    }

    return true;
  };

  return { sendFeedback, loading, error, setError };
}
