import { DataList } from "@/components/data-list";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { useState } from "react";
import { View } from "react-native";

export function ExercisesScreen() {
  const [query, setQuery] = useState("");

  return (
    <View className="flex-1 bg-level1">
      <Header />

      <View className="flex-1">
        {/* TODO: segmented tabs (Exercícios / Circuitos) — no existing component yet */}

        <View className="mx-8 mt-5">
          <PageHeader
            mode="exercicios"
            title="Exercícios"
            subtitle="Gerencie os exercícios disponíveis"
            onNewPress={() => {
              /* open new-exercise modal */
            }}
          />
        </View>

        <SearchInput
          containerClassName="mx-8 mt-5"
          placeholder="Buscar exercício por nome..."
          value={query}
          onChangeText={setQuery}
          showTags
          onTagsPress={() => {
            /* open tag filter */
          }}
        />

        <DataList
          className="mt-5 px-8"
          data={[]} // wire to real data
          emptyMessage="Nenhum exercício encontrado."
          renderItem={() => null} // replace with an ExerciseCard
        />
      </View>

      <Footer />
    </View>
  );
}
