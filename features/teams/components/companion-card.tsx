import { colors } from "@/assets/colors";
import { GraduationCap } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";
import { CompanionItem } from "./companion-item";

/**
 * Companion list entry used by team cards.
 */
export type Companion = {
  id: string;
  name: string;
  email: string;
  status?: "ativo" | "pendente" | "removido";
};

/**
 * Props for the companion list card.
 */
interface CompanionCardProps {
  className?: string;
  companions: Companion[];
  onRemoveCompanion?: (id: string) => void;
  onAcceptCompanion?: (id: string) => void;
  onRejectCompanion?: (id: string) => void;
}

/**
 * Renders a card listing team companions.
 */
export function CompanionCard({
  className,
  companions,
  onRemoveCompanion,
  onAcceptCompanion,
  onRejectCompanion,
}: CompanionCardProps) {
  return (
    <View
      className={`w-full max-w-[380px] rounded-[20px] bg-level2 p-5 border border-outline ${className ?? ""}`}
    >
      <View className="mb-4 flex-row items-center gap-3">
        <GraduationCap size={24} color={colors.secondary} />
        <Text className="text-lg font-bold text-white">
          Monitores ({companions.length - companions.filter((c) => c.status === "pendente").length})
        </Text>
      </View>

      {companions.length === 0 ? (
        <Text className="text-sm font-medium text-muted leading-5">
          Nenhum monitor na equipe. Convide usando email/telefone ou compartilhe
          o código da equipe.
        </Text>
      ) : (
        <View className="gap-2">
          {companions.map((companion, index) => (
            <React.Fragment key={companion.id}>
              <CompanionItem
                name={companion.name}
                email={companion.email}
                status={companion.status}
                onRemove={() => onRemoveCompanion?.(companion.id)}
                onAccept={() => onAcceptCompanion?.(companion.id)}
                onReject={() => onRejectCompanion?.(companion.id)}
              />
            </React.Fragment>
          ))}
        </View>
      )}
    </View>
  );
}
