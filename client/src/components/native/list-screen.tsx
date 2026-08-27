import type { ReactElement, ReactNode } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

/**
 * The shell the five native list screens were each repeating verbatim: a
 * first-load spinner, a `FlatList` with a "+ New …" header button, and an
 * empty-state line that stays hidden while the first load is in flight.
 *
 * Pass `items` straight from the query (`data?.myHabits`, not `?? []`) — the
 * spinner is gated on `items === undefined` rather than on `loading` alone, so
 * a cache-and-network refetch updates in place instead of flashing.
 */
export function ListScreen<T extends { id: string }>({
  items,
  loading,
  newLabel,
  onNew,
  emptyLabel,
  renderItem,
  children,
}: {
  items: readonly T[] | undefined;
  loading: boolean;
  /** Label for the header button, without the leading "+". */
  newLabel: string;
  onNew: () => void;
  emptyLabel: string;
  renderItem: (item: T) => ReactElement;
  /** Modals and other overlays, rendered above the list. */
  children?: ReactNode;
}) {
  return (
    <View className="flex-1 bg-background">
      {loading && items === undefined && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      )}

      <FlatList
        data={items ?? []}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4 py-4"
        ListHeaderComponent={
          <TouchableOpacity
            className="bg-primary rounded-xl py-3 items-center mb-4"
            onPress={onNew}
          >
            <Text className="text-primary-foreground font-semibold">
              + {newLabel}
            </Text>
          </TouchableOpacity>
        }
        ListEmptyComponent={
          loading ? null : (
            <Text className="text-center text-muted-foreground mt-8">
              {emptyLabel}
            </Text>
          )
        }
        renderItem={({ item }) => renderItem(item)}
      />

      {children}
    </View>
  );
}
