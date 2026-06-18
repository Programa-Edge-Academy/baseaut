import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

/**
 * Cache do papel (role) do usuário em nível de módulo: é buscado uma única vez
 * por sessão e reaproveitado por todos os consumidores (ex.: vários Headers),
 * evitando uma nova consulta ao Supabase a cada troca de tela.
 *
 * undefined = ainda não buscado · null = buscado, sem role.
 */
let cachedRole: string | null | undefined = undefined;
let inFlight: Promise<string | null> | null = null;

async function fetchUserRole(): Promise<string | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (error || !data) return null;
    return data.role ?? null;
  } catch (err) {
    console.error("Erro ao buscar role do usuário:", err);
    return null;
  }
}

// Invalida o cache ao trocar de usuário (login/logout).
supabase.auth.onAuthStateChange((event) => {
  if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
    cachedRole = undefined;
    inFlight = null;
  }
});

/**
 * Retorna o role do usuário atual (ou null). Busca uma vez e cacheia;
 * montagens seguintes leem o valor já em memória, sem refetch.
 */
export function useUserRole(): string | null {
  const [role, setRole] = useState<string | null>(cachedRole ?? null);

  useEffect(() => {
    if (cachedRole !== undefined) {
      setRole(cachedRole);
      return;
    }

    let active = true;
    if (!inFlight) inFlight = fetchUserRole();
    inFlight.then((resolved) => {
      cachedRole = resolved;
      inFlight = null;
      if (active) setRole(resolved);
    });

    return () => {
      active = false;
    };
  }, []);

  return role;
}
