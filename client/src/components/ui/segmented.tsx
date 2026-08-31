import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import { Pressable, Text } from 'react-native';

// Shared class for a pill in a segmented control / nav (active vs inactive).
// Used by the app-shell nav links and the stats date-range selector, which
// render as an expo-router <Link> and a <button> respectively — hence a class
// helper rather than a component.
export function segmentedItemClass(active: boolean, className?: string) {
  return cn(
    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
    active
      ? 'bg-primary text-primary-foreground'
      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
    className,
  );
}

/**
 * The `<Text>` half of the pill. Native does not inherit colour, so a pill
 * built from a `Pressable` needs the colour on its label, not its container.
 */
export function segmentedTextClass(active: boolean, className?: string) {
  return cn(
    'text-sm font-medium',
    active ? 'text-primary-foreground' : 'text-muted-foreground',
    className,
  );
}

/**
 * A pressable pill. `segmentedItemClass` still exists for the expo-router
 * `<Link>`s in the web nav, which render a `Text` and so do inherit colour.
 */
export function SegmentedButton({
  active,
  onPress,
  className,
  children,
}: {
  active: boolean;
  onPress: () => void;
  className?: string | undefined;
  children: ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className={cn(
        'rounded-md px-3 py-1.5',
        active ? 'bg-primary' : 'hover:bg-muted',
        className,
      )}
    >
      {typeof children === 'string' ? (
        <Text className={segmentedTextClass(active)}>{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
}
