import { cn } from '@/lib/utils';

const SIZES = {
  sm: 'h-2.5 w-2.5',
  md: 'h-3 w-3',
} as const;

type ColorDotProps = {
  color: string;
  size?: keyof typeof SIZES;
  className?: string;
  /** Activity type name: shown on hover and exposed as the accessible name. */
  title?: string;
};

/** A small round color swatch used to indicate an activity type's color. */
export function ColorDot({
  color,
  size = 'md',
  className,
  title,
}: ColorDotProps) {
  return (
    <span
      className={cn(
        'inline-block shrink-0 rounded-full',
        SIZES[size],
        className,
      )}
      style={{ backgroundColor: color }}
      title={title}
      {...(title
        ? { role: 'img', 'aria-label': title }
        : { 'aria-hidden': true })}
    />
  );
}
