import { supabase } from "@/lib/supabase";
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

/** Shown when the insert fails without a readable reason. */
const genericErrorMessage =
  "Não foi possível enviar seu feedback. Tente novamente.";

/**
 * Sends user feedback to the development team by inserting it into the private
 * `feedbacks` table. RLS allows only the user's own insert and no reads, so the
 * content is never exposed to other users in the app; the team reads it through
 * the Supabase dashboard.
 */
export function useFeedback() {
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
      setError("Sessão expirada. Entre novamente para enviar seu feedback.");
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
      setError(genericErrorMessage);
      return false;
    }

    return true;
  };

  return { sendFeedback, loading, error, setError };
}
