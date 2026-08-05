import { colors } from "@/assets/colors";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { DataList } from "@/components/data-list";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { ListCard } from "@/components/list-card";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { SwipeNavigator } from "@/components/swipe-navigator";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import { TutorialPracticeNotice } from "@/features/tutorial/components/tutorial-practice-notice";
import { TutorialSpotlight } from "@/features/tutorial/components/tutorial-spotlight";
import { useTutorialSimulation } from "@/features/tutorial/contexts/tutorial-simulation-context";
import { User } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, View, Image } from "react-native";
import { NewStudent } from "../components/new-student";
import { useStudents } from "../hooks/use-students";
import { router } from "expo-router";

/** Props for {@link StudentsScreen}. */
export type StudentsScreenProps = {
  /**
   * When true, the screen is a tutorial practice replica: it runs on mocked
   * data, drops the footer and swipe navigation, and shows the "Em tutorial"
   * header banner with its practice notice. Tutorial only.
   */
  tutorial?: boolean;
};

/**
 * Students list screen with search and CRUD modals. Used both as the real home
 * screen and, with `tutorial`, as its 1:1 tutorial practice replica.
 */
export function StudentsScreen({ tutorial = false }: StudentsScreenProps) {
  const { t } = useI18n();
  const { students, isLoading, refresh, addStudent, updateStudent, deleteStudent } =
    useStudents({ mock: tutorial });
  const [isNewStudentModalVisible, setIsNewStudentModalVisible] =
    useState(false);
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [studentToDelete, setStudentToDelete] = useState<any | null>(null);
  const [noticeOpen, setNoticeOpen] = useState(false);

  const sim = useTutorialSimulation();
  const newButtonRef = useRef<View>(null);

  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const hasPendingAlert = students.some(student => student.pendencyAlert);

  // Register the "+ New" spotlight target (the ⋮/menu targets live on the card).
  useEffect(() => {
    if (!tutorial) return;
    sim.registerTarget("new", newButtonRef, { rounded: true });
    return () => sim.unregisterTarget("new");
  }, [tutorial, sim]);

  /**
   * Normalizes support level values to translated display labels.
   */
  const formatSupportLevel = (level: string) => {
    if (level.includes("1")) return t("students.support.n1");
    if (level.includes("2")) return t("students.support.n2");
    if (level.includes("3")) return t("students.support.n3");
    return t("students.support.undefined");
  };

  const content = (
    <View className="flex-1">
      <View className="mx-8 mt-5">
        <PageHeader
          mode={hasPendingAlert ? "inicio-pendente" : "inicio"}
          title={t("students.title")}
          subtitle={t("students.subtitle")}
          newButtonRef={tutorial ? newButtonRef : undefined}
          onNewPress={() => {
            setEditingStudent(null);
            setIsNewStudentModalVisible(true);
            sim.complete("new");
          }}
          onHistoryPress={tutorial ? undefined : () => router.push("/history")}
        />
      </View>

      <View className="mx-8 mt-5">
        <SearchInput
          placeholder={t("common.searchPlaceholder")}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View className="flex-1 mx-8 mt-5">
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <DataList
          data={filteredStudents}
          keyExtractor={(item) => item.id}
          emptyMessage={t("students.empty")}
          onRefresh={refresh}
          renderItem={({ item }) => {
            const isCreated = tutorial && item.id.startsWith("mock-new-");
            return (
              <ListCard
                title={item.name}
                pendencyAlert={item.pendencyAlert}
                subtitle={`${item.age} ${t("students.years")} · ${item.weight ? `${item.weight}kg · ` : ''}${item.height ? `${(item.height/100).toFixed(2)}m · ` : ''}${item.waist ? `${item.waist}cm · ` : ''}${formatSupportLevel(item.supportLevel)}`}
                icon={
                  item.avatarUrl ? (
                    <Image
                      source={{ uri: item.avatarUrl }}
                      style={{ width: "100%", height: "100%", borderRadius: 12 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <User size={20} color={colors.muted} />
                  )
                }
                iconBgColor={item.avatarUrl ? "transparent" : undefined}
                enableRipple={true}
                moreButtonSpotlightKeys={isCreated ? ["editMenu", "deleteMenu"] : undefined}
                editSpotlightKey={isCreated ? "editSelect" : undefined}
                deleteSpotlightKey={isCreated ? "deleteSelect" : undefined}
                onMenuOpen={
                  isCreated
                    ? () => {
                        sim.complete("editMenu");
                        sim.complete("deleteMenu");
                      }
                    : undefined
                }
                onPress={() => {
                  if (tutorial) return;
                  router.push({
                    pathname: "/circuit-selection",
                    params: { studentId: item.id, studentName: item.name }
                  });
                }}
                onEdit={() => {
                  setEditingStudent(item);
                  setIsNewStudentModalVisible(true);
                  sim.complete("editSelect");
                }}
                onDelete={() => {
                  setStudentToDelete(item);
                  sim.complete("deleteSelect");
                }}
              />
            );
          }}
        />
      )}
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-level1">
      {tutorial ? (
        <Header
          variant="tutorial"
          onPressBack={() => router.back()}
          onPressFinish={() => setNoticeOpen(true)}
        />
      ) : (
        <Header />
      )}

      {tutorial ? (
        content
      ) : (
        <SwipeNavigator
          onSwipeLeft={() => router.replace("/analysis")}
          onSwipeRight={() => router.replace("/exercises")}
        >
          {content}
        </SwipeNavigator>
      )}

      {!tutorial && <Footer />}

      <NewStudent
        visible={isNewStudentModalVisible}
        mode={editingStudent ? "edit" : "create"}
        initialData={editingStudent}
        onClose={() => {
          setIsNewStudentModalVisible(false);
          setEditingStudent(null);
        }}
        onSave={(data, photoUri) => {
          if (editingStudent) {
            updateStudent(editingStudent.id, data as any, photoUri);
            sim.complete("editSave");
          } else {
            addStudent(data as any, photoUri);
            sim.complete("save");
          }
          setIsNewStudentModalVisible(false);
          setEditingStudent(null);
        }}
      />

      <ConfirmationModal
        visible={!!studentToDelete}
        onClose={() => setStudentToDelete(null)}
        onConfirm={() => {
          if (studentToDelete) {
            deleteStudent(studentToDelete.id);
            sim.complete("deleteConfirm");
          }
          setStudentToDelete(null);
        }}
        title={t("students.deleteTitle")}
        message={t("students.deleteMessage")}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        confirmSpotlightKey={tutorial ? "deleteConfirm" : undefined}
      />

      {tutorial && (
        <TutorialPracticeNotice
          visible={noticeOpen}
          onClose={() => setNoticeOpen(false)}
          onExit={() => setNoticeOpen(false)}
        />
      )}

      {tutorial && <TutorialSpotlight />}
    </View>
  );
}
