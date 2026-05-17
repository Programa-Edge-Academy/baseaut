import { supabase } from "@/lib/supabase";
import { useState } from "react";

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
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("status_conta, role")
          .eq("id", data.user.id)
          .single();

        if (profileError) throw profileError;

        if (profile.role !== "coordenador" && profile.status_conta === "pendente") {
          await supabase.auth.signOut();
          setIsPendingApproval(true);
          return false;
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