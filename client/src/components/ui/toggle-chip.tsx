/**
 * A small selectable pill — the day toggles, the activity-type chips, the
 * stats date-range buttons.
 *
 * It exists because the same pill was a `<button className={cn(selected ? …)}>`
 * on web and a `TouchableOpacity` with the same two class strings on native,
 * and the two had already drifted. Colour is split across the container and the
 * `<Text>` for the usual reason: native does not inherit it.
 */
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import { Pressable, Text } from 'react-native';

type ToggleChipProps = {
  selected?: boolean;
  onPress: () => void;
  disabled?: boolean;
  /** Overrides the selected background — used for the activity-type swatches. */
  backgroundColor?: string | undefined;
  size?: 'sm' | 'default';
  className?: string | undefined;
  accessibilityLabel?: string | undefined;
  children: ReactNode;
};

export function ToggleChip({
  selected = false,
  onPress,
  disabled = false,
  backgroundColor,
  size = 'default',
  className,
  accessibilityLabel,
  children,
}: ToggleChipProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      {...(accessibilityLabel ? { accessibilityLabel } : {})}
      className={cn(
        'rounded-md border',
        size === 'sm' ? 'px-2 py-1' : 'px-3 py-2',
        selected
          ? 'border-primary bg-primary'
          : 'border-border bg-background hover:bg-muted',
        disabled && 'opacity-60',
        className,
      )}
      {...(backgroundColor ? { style: { backgroundColor } } : {})}
    >
      {typeof children === 'string' || typeof children === 'number' ? (
        <Text
          className={cn(
            'font-medium',
            size === 'sm' ? 'text-xs' : 'text-sm',
            selected && !backgroundColor
              ? 'text-primary-foreground'
              : 'text-foreground',
          )}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}
