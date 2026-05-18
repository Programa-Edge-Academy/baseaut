import React from "react";
import { View, Text } from "react-native";
import { GraduationCap } from "lucide-react-native";
import { CompanionItem } from "./companion-item";
import { colors } from "@/assets/colors";

export type Companion = {
  id: string;
  name: string;
  email: string;
  status_conta?: "ativo" | "pendente" | "removido";
};

interface CompanionCardProps {
  className?: string;
  companions: Companion[];
  onRemoveCompanion?: (id: string) => void;
  onAcceptCompanion?: (id: string) => void;
  onRejectCompanion?: (id: string) => void;
}

export function CompanionCard({ 
  className, 
  companions, 
  onRemoveCompanion, 
  onAcceptCompanion, 
  onRejectCompanion 
}: CompanionCardProps) {
  return (
    <View className={`w-full max-w-[380px] rounded-[20px] bg-level2 p-5 border border-outline ${className ?? ""}`}>
      <View className="mb-4 flex-row items-center gap-3">
        <GraduationCap size={24} color={colors.secondary} />
        <Text className="text-lg font-bold text-white">
          Monitores ({companions.length})
        </Text>
      </View>

      {companions.length === 0 ? (
        <Text className="text-sm font-medium text-muted leading-5">
          Nenhum monitor na equipe. Convide usando email/telefone ou compartilhe o código da equipe.
        </Text>
      ) : (
        <View>
          {companions.map((companion, index) => (
            <React.Fragment key={companion.id}>
              <CompanionItem 
                name={companion.name}
                email={companion.email}
                status_conta={companion.status_conta}
                onRemove={() => onRemoveCompanion?.(companion.id)} 
                onAccept={() => onAcceptCompanion?.(companion.id)}
                onReject={() => onRejectCompanion?.(companion.id)}
              />
              {index < companions.length - 1 && (
                <View className="my-2 h-[1px] w-full bg-outline opacity-50" />
              )}
            </React.Fragment>
          ))}
        </View>
      )}
    </View>
  );
}