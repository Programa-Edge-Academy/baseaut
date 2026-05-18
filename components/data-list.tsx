import React from "react";
import { FlatList, FlatListProps, Text, View } from "react-native";

export interface DataListProps<T> extends Omit<FlatListProps<T>, "data"> {
  data: T[] | null | undefined;
  emptyMessage?: string;
}

export function DataList<T>({
  data,
  emptyMessage = "Nenhum item encontrado.",
  contentContainerStyle,
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
      {...rest}
    />
  );
}