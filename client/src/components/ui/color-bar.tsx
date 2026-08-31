import { cn, hexToAccent } from '@/lib/utils';
import { View } from 'react-native';

type ColorBarProps = {
  /** Nullable so callers can pass `activityType?.color`; renders nothing without it. */
  color?: string | null | undefined;
  /** Activity type name, exposed as the bar's accessible name. */
  label?: string | undefined;
  className?: string | undefined;
};

/**
 * A full-height accent bar pinned to the left edge of a card. The color is
 * normalized via `hexToAccent` so it stays visible in both light and dark
 * mode. `label` is the accessible name only — a `title` tooltip has no native
 * counterpart, so it was dropped rather than made web-only. Prefer `<Card accentColor accentLabel>`, which owns the positioning
 * this component needs; when using ColorBar directly, the parent must be
 * `relative` and `overflow-hidden` so the bar follows the rounded corners.
 */
export function ColorBar({ color, label, className }: ColorBarProps) {
  if (!color) return null;
  return (
    <View
      className={cn('absolute inset-y-0 left-0 w-2.5', className)}
      style={{ backgroundColor: hexToAccent(color) }}
      {...(label
        ? ({ role: 'img', 'aria-label': label } as const)
        : ({ 'aria-hidden': true } as const))}
    />
  );
}
