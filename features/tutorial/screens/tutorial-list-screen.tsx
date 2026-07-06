import { Header } from "@/components/header";
import { PageHeader } from "@/components/page-header";
import { buildTutorialModules } from "@/features/tutorial/constants/modules";
import { useTutorial } from "@/features/tutorial/contexts/tutorial-context";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import { useThemeColors } from "@/features/settings/contexts/theme-context";
import { useRouter } from "expo-router";
import { CheckCircle2, ChevronRight, Circle } from "lucide-react-native";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

/**
 * Tutorial landing screen: lists the feature modules, each showing whether it
 * has already been completed, and opens a module when tapped.
 */
export function TutorialListScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { t } = useI18n();
  const { isCompleted, completed } = useTutorial();

  const modules = React.useMemo(() => buildTutorialModules(t), [t]);
  const total = modules.length;
  const done = completed.length;

  return (
    <View className="flex-1 bg-level1">
      <Header variant="back" onPressBack={() => router.back()} />

      <ScrollView
        className="flex-1 px-8"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="mt-5 w-full">
          <PageHeader
            title={t("tutorial.listTitle")}
            subtitle={t("tutorial.listSubtitle").replace("{done}", String(done)).replace("{total}", String(total))}
          />
        </View>

        <View className="mt-6 gap-3">
          {modules.map((module) => {
            const Icon = module.icon;
            const accent = colors[module.accent] ?? colors.primary;
            const finished = isCompleted(module.id);

            return (
              <Pressable
                key={module.id}
                onPress={() =>
                  router.push({
                    pathname: "/tutorial-module",
                    params: { moduleId: module.id },
                  } as never)
                }
                className="flex-row items-center gap-4 rounded-2xl border border-outline bg-level2 p-4 active:opacity-70"
              >
                <View
                  className="h-12 w-12 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: `${accent}1A` }}
                >
                  <Icon size={22} color={accent} />
                </View>

                <View className="flex-1">
                  <Text className="text-header-3 text-content">{module.title}</Text>
                  <Text className="text-default-2 text-muted" numberOfLines={2}>
                    {module.description}
                  </Text>
                </View>

                {finished ? (
                  <CheckCircle2 size={22} color={colors.secondary} />
                ) : (
                  <Circle size={22} color={colors.muted} />
                )}
                <ChevronRight size={18} color={colors.muted} />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
