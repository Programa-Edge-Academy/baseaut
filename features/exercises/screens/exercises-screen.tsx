import { DataList } from "@/components/data-list";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { useMemo, useState } from "react";
import { View } from "react-native";
import { ExerciseCard } from "../components/exercise-card";
import { NewExercise, NewExerciseData } from "../components/new-exercise";

type Exercise = {
  id: string;
  name: string;
  description: string;
  durationSeconds: number;
  tags: string[];
};

function formatDuration(seconds: number): string {
  if (!seconds) return "";
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  if (minutes && remainder) return `${minutes}min ${remainder}s`;
  if (minutes) return `${minutes}min`;
  return `${remainder}s`;
}

export function ExercisesScreen() {
  const [query, setQuery] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isNewExerciseVisible, setIsNewExerciseVisible] = useState(false);

  const filteredExercises = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return exercises;
    return exercises.filter((exercise) =>
      exercise.name.toLowerCase().includes(normalized)
    );
  }, [query, exercises]);

  const handleSaveExercise = (data: NewExerciseData) => {
    const newExercise: Exercise = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: data.name,
      description: data.description,
      durationSeconds: data.durationSeconds,
      tags: data.tags,
    };
    setExercises((current) => [newExercise, ...current]);
    setIsNewExerciseVisible(false);
  };

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
            onNewPress={() => setIsNewExerciseVisible(true)}
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
          data={filteredExercises}
          emptyMessage="Nenhum exercício encontrado."
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ExerciseCard
              className="mb-2.5"
              name={item.name}
              description={item.description}
              duration={formatDuration(item.durationSeconds)}
              tags={item.tags.join(", ").toLowerCase()}
            />
          )}
        />
      </View>

      <NewExercise
        visible={isNewExerciseVisible}
        onClose={() => setIsNewExerciseVisible(false)}
        onSave={handleSaveExercise}
        handlePhotoPress={() => {
          /* open photo picker */
        }}
        handleVideoPress={() => {
          /* open video picker */
        }}
      />

      <Footer />
    </View>
  );
}
