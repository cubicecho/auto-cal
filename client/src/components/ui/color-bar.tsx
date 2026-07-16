import { cn, hexToAccent } from '@/lib/utils';

type ColorBarProps = {
  /** Nullable so callers can pass `activityType?.color`; renders nothing without it. */
  color?: string | null | undefined;
  /** Activity type name: shown on hover and exposed as the accessible name. */
  label?: string | undefined;
  className?: string | undefined;
};

/**
 * A full-height accent bar pinned to the left edge of a card. The color is
 * normalized via `hexToAccent` so it stays visible in both light and dark
 * mode. Prefer `<Card accentColor accentLabel>`, which owns the positioning
 * this component needs; when using ColorBar directly, the parent must be
 * `relative` and `overflow-hidden` so the bar follows the rounded corners.
 */
export function ColorBar({ color, label, className }: ColorBarProps) {
  if (!color) return null;
  return (
    <span
      className={cn('absolute inset-y-0 left-0 w-2.5', className)}
      style={{ backgroundColor: hexToAccent(color) }}
      title={label}
      {...(label
        ? { role: 'img', 'aria-label': label }
        : { 'aria-hidden': true })}
    />
  );
}
