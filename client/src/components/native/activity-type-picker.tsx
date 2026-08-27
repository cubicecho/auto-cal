import { graphql } from '@/__generated__/index.js';
import { FieldLabel } from '@/components/native/field';
import { cn, hexToDesaturated } from '@/lib/utils';
import { useQuery } from '@apollo/client/react';
import { Text, TouchableOpacity, View } from 'react-native';

/**
 * One document instead of the four identical `myActivityTypes { id name color }`
 * queries the native sheets had each declared for themselves, so they now share
 * a cache entry as well as the markup.
 */
const GET_ACTIVITY_TYPES = graphql(`
  query GetActivityTypesForNativePicker {
    myActivityTypes {
      id
      name
      color
    }
  }
`);

/**
 * Single-select activity type chips. Fetches its own options, since every sheet
 * that needs them needs all of them.
 *
 * The empty state matters: without an activity type nothing here can be
 * submitted, so a screen that just showed a blank row left the user with a
 * disabled button and no reason for it.
 */
export function ActivityTypePicker({
  label = 'Activity Type',
  selectedId,
  onSelect,
  className,
}: {
  label?: string;
  selectedId: string;
  onSelect: (id: string) => void;
  className?: string;
}) {
  const { data } = useQuery(GET_ACTIVITY_TYPES);
  const activityTypes = data?.myActivityTypes ?? [];

  return (
    <View className={cn(className)}>
      <FieldLabel>{label}</FieldLabel>
      <View className="flex-row flex-wrap gap-2 mb-4">
        {activityTypes.map((at) => (
          <TouchableOpacity
            key={at.id}
            onPress={() => onSelect(at.id)}
            className={`rounded-lg px-3 py-2 border ${selectedId === at.id ? 'border-primary' : 'border-border'}`}
            style={{ backgroundColor: hexToDesaturated(at.color) }}
          >
            <Text className="text-sm text-foreground">{at.name}</Text>
          </TouchableOpacity>
        ))}
        {activityTypes.length === 0 && (
          <Text className="text-sm text-muted-foreground">
            No activity types — create one first
          </Text>
        )}
      </View>
    </View>
  );
}
