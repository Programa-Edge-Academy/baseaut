import { colors } from "@/assets/colors";
import { useI18n } from "@/features/settings/contexts/i18n-context";
import React from "react";
import { FlatList, FlatListProps, RefreshControl, Text, View } from "react-native";

/** Props for {@link DataList}. */
export interface DataListProps<T> extends Omit<FlatListProps<T>, "data"> {
  /** Items to render. Null/undefined is treated as an empty list. */
  data: T[] | null | undefined;
  /** Message shown when the list is empty. */
  emptyMessage?: string;
  /** Pull-to-refresh handler. When omitted, refresh control is disabled. */
  onRefresh?: () => void;
  /** Whether the refresh control is in its refreshing state. */
  refreshing?: boolean;
}

/**
 * Themed {@link FlatList} with a centered empty state and optional
 * pull-to-refresh, used as the standard list primitive across screens.
 */
export function DataList<T>({
  data,
  emptyMessage,
  contentContainerStyle,
  onRefresh,
  refreshing = false,
  ...rest
}: DataListProps<T>) {
  const { t } = useI18n();
  const renderEmptyComponent = () => (
    <View className="mt-16 flex-1 items-center justify-center">
      <Text className="text-center text-default-1 text-muted">
        {emptyMessage ?? t("common.noItems")}
      </Text>
    </View>
  );

  return (
    <FlatList
      data={data || []}
      ListEmptyComponent={renderEmptyComponent}
      contentContainerStyle={contentContainerStyle ?? { flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        ) : undefined
      }
      {...rest}
    />
  );
}
