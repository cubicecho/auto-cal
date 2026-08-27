import type { GestureResponderEvent } from 'react-native';
import { Text, TouchableOpacity } from 'react-native';

/**
 * The small pill button on a list row — Edit, Delete, Archive.
 *
 * `destructive` picks the red outline; without it the pill is the neutral
 * outline. Both variants were written out at six call sites, and the neutral
 * one had already drifted between screens.
 *
 * The press event is passed through because a pill inside a pressable row
 * needs `stopPropagation` to keep the row from also firing on web.
 */
export function RowAction({
  label,
  onPress,
  destructive = false,
}: {
  label: string;
  onPress: (event: GestureResponderEvent) => void;
  destructive?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={
        destructive
          ? 'px-3 py-1 rounded-lg border border-destructive/40'
          : 'px-3 py-1 rounded-lg border border-border bg-background/60'
      }
    >
      <Text
        className={
          destructive ? 'text-xs text-destructive' : 'text-xs text-foreground'
        }
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
