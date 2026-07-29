import { supabase } from "@/lib/supabase";
import { useState } from "react";

/** Result of checking a signed-in user's account status. */
export type AccountStatusResult = "ok" | "pending" | "blocked";

/**
 * Checks the profile of a signed-in user against the account-approval rules:
 * non-coordinator accounts must be approved ("ativa") before entering the app.
 * Pending or blocked/rejected accounts are signed out.
 */
export async function verifyAccountStatus(userId: string): Promise<AccountStatusResult> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("status_conta, role")
    .eq("id", userId)
    .single();

  if (error) throw error;

  if (profile.role !== "coordenador") {
    if (profile.status_conta === "pendente") {
      await supabase.auth.signOut();
      return "pending";
    }
    if (profile.status_conta === "bloqueada" || profile.status_conta === "rejeitada") {
      await supabase.auth.signOut();
      return "blocked";
    }
  }
  return "ok";
}

/**
 * Provides an e-mail login handler backed by Supabase auth.
 */
export function useLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPendingApproval, setIsPendingApproval] = useState(false);

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    setIsPendingApproval(false);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInError) throw signInError;

      if (data.user) {
        const status = await verifyAccountStatus(data.user.id);
        if (status === "pending") {
          setIsPendingApproval(true);
          return false;
        }
        if (status === "blocked") {
          throw new Error("Invalid login credentials");
        }
        return true;
      }
      return false;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { login, loading, error, isPendingApproval };
}
