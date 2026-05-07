import { useState } from 'react';
import { supabase } from '../../../lib/supabase';

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

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nome_completo: name,
          role: 'monitor',
        },
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return false;
    }

    return true;
  };

  return { register, loading, error };
}
