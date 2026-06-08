import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";
import type { ProtocolStatus, ProtocolTipo } from "./use-protocol-records";

export type ProtocolStatuses = Record<ProtocolTipo, ProtocolStatus>;

const INITIAL_STATUSES: ProtocolStatuses = {
  ata: "nao_registrado",
  cars: "nao_registrado",
  mabc2: "nao_registrado",
};

/**
 * Resolves whether each protocol (ATA/CARS/MABC-2) has at least one answered
 * record for the student, used to drive the "Registrado / Não registrado"
 * status on the applied-protocols card.
 */
export function useProtocolStatuses(studentId?: string) {
  const [statuses, setStatuses] = useState<ProtocolStatuses>(INITIAL_STATUSES);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(studentId));

  useEffect(() => {
    let active = true;

    async function fetchStatuses() {
      if (!studentId) return;
      setIsLoading(true);
      try {
        const { data: forms } = await supabase
          .from("formularios")
          .select("id, tipo")
          .eq("aluno_id", studentId)
          .eq("protegido", false)
          .in("tipo", ["ata", "cars", "mabc2"]);

        const formList = (forms ?? []) as { id: string; tipo: ProtocolTipo }[];
        const tipoByForm = new Map(formList.map((f) => [f.id, f.tipo]));

        const next: ProtocolStatuses = { ...INITIAL_STATUSES };

        if (formList.length > 0) {
          const { data: answers } = await supabase
            .from("respostas_formulario")
            .select("formulario_id, valor_preenchido")
            .in(
              "formulario_id",
              formList.map((f) => f.id),
            );

          (answers ?? []).forEach((a: any) => {
            if (a.valor_preenchido == null || a.valor_preenchido === "") return;
            const tipo = tipoByForm.get(a.formulario_id);
            if (tipo) next[tipo] = "registrado";
          });
        }

        if (active) setStatuses(next);
      } catch (error) {
        console.error("Erro ao carregar status dos protocolos:", error);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    fetchStatuses();
    return () => {
      active = false;
    };
  }, [studentId]);

  return { statuses, isLoading };
}
