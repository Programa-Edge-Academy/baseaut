import { colors } from "@/assets/colors";
import React from "react";
import { FlatList, FlatListProps, RefreshControl, Text, View } from "react-native";

export interface DataListProps<T> extends Omit<FlatListProps<T>, "data"> {
  data: T[] | null | undefined;
  emptyMessage?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export function DataList<T>({
  data,
  emptyMessage = "Nenhum item encontrado.",
  contentContainerStyle,
  onRefresh,
  refreshing = false,
  ...rest
}: DataListProps<T>) {

  const renderEmptyComponent = () => (
    <View className="mt-16 flex-1 items-center justify-center">
      <Text className="text-center text-default-1 text-muted">
        {emptyMessage}
      </Text>
    </View>
  );

  return (
    <FlatList
      data={data || []}
      ListEmptyComponent={renderEmptyComponent}
      contentContainerStyle={contentContainerStyle ?? { paddingBottom: 24, flexGrow: 1 }}
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
