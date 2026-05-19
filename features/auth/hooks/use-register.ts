import { supabase } from "@/lib/supabase";
import { useState } from "react";

type RegisterData = {
  name: string;
  email: string;
  password: string;
};

export function useRegister() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = async ({ name, email, password }: RegisterData): Promise<boolean> => {
    setLoading(true);
    setError(null);
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim().replace(/\s+/g, ' '); 

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          nome_completo: cleanName,
          role: "monitor",
        },
      },
    });

    if (signUpError) {
      setLoading(false);
      setError(signUpError.message);
      return false;
    }

    if (data?.session || data?.user) {
      await supabase.auth.signOut();
    }
    setLoading(false);

    return true;
  };

  return { register, loading, error };
}
