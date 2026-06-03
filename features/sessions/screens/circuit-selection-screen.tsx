import { colors } from "@/assets/colors";
import { withOpacity } from "@/components/color-opacity";
import { DataList } from "@/components/data-list";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { ListCard } from "@/components/list-card";
import { SearchInput } from "@/components/search-input";
import { ClipboardEdit, Layers } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { Text, View } from "react-native";

export type CircuitType = "estruturado" | "livre" | "ata" | "cars" | "mabc";

export type CircuitItem = {
  id: string;
  name: string;
  description: string;
  type: CircuitType;
};

const MOCK_CIRCUITS: CircuitItem[] = [
  {
    id: "1",
    name: "Circuito 1",
    description:
      "3 exercícios - Girar bambolê, Equilíbrio na tábua, Escalada",
    type: "estruturado",
  },
  {
    id: "2",
    name: "Circuito 2",
    description:
      "3 exercícios - Arremesso de bola, Empilhamento de cones, Escalada",
    type: "livre",
  },
  {
    id: "ata",
    name: "Formulário ATA",
    description: "",
    type: "ata",
  },
  {
    id: "cars",
    name: "Formulário CARS",
    description: "",
    type: "cars",
  },
];

export type CircuitSelectionScreenProps = {
  studentName: string;
  circuits?: CircuitItem[];
  onPressBack?: () => void;
  onPressCircuit?: (circuit: CircuitItem) => void;
};

/**
 * Lets the user pick which circuit (or the ATA form) to run inside an
 * already-opened session.
 */
export function CircuitSelectionScreen({
  studentName,
  circuits = MOCK_CIRCUITS,
  onPressBack,
  onPressCircuit,
}: CircuitSelectionScreenProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return circuits;
    return circuits.filter((circuit) =>
      circuit.name.toLowerCase().includes(normalized)
    );
  }, [query, circuits]);

  return (
    <View className="flex-1 bg-level1">
      <Header variant="back" onPressBack={onPressBack} />

      <View className="flex-1">
        <View className="mx-8 mt-5">
          <Text className="text-header-1 text-white">
            Sessão de {studentName}
          </Text>
          <Text className="mt-1 text-default-1 text-muted">
            Selecione o circuito
          </Text>
        </View>

        <SearchInput
          containerClassName="mx-8 mt-5"
          placeholder="Buscar circuito por nome..."
          value={query}
          onChangeText={setQuery}
        />

        <DataList
          className="mt-5 px-8"
          data={filtered}
          emptyMessage="Nenhum circuito encontrado."
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isForm = item.type === "ata" || item.type === "cars" || item.type === "mabc";
            const badge =
              item.type === "estruturado"
                ? { label: "Estruturado", color: colors.primary }
                : item.type === "livre"
                ? { label: "Livre", color: colors.extra }
                : undefined;

            return (
              <ListCard
                title={item.name}
                subtitle={item.description}
                icon={
                  isForm ? (
                    <ClipboardEdit size={20} color={colors.primary} />
                  ) : (
                    <Layers size={20} color={colors.secondary} />
                  )
                }
                iconBgColor={withOpacity(
                  isForm ? colors.primary : colors.secondary,
                  0.15
                )}
                badge={badge}
                rightAction="chevron"
                onPress={() => onPressCircuit?.(item)}
              />
            );
          }}
        />
      </View>

      <Footer />
    </View>
  );
}
