import { cn } from '@/lib/utils';
import { View } from 'react-native';

const SIZES = {
  sm: 'h-2.5 w-2.5',
  md: 'h-3 w-3',
} as const;

type ColorDotProps = {
  color: string;
  size?: keyof typeof SIZES;
  className?: string;
  /** Activity type name, exposed as the accessible name. */
  title?: string;
};

/**
 * A small round color swatch used to indicate an activity type's color.
 *
 * A `View` rather than a `<span>`: react-native-web renders it as a `<div>`
 * with the same box, and the dot now works from the native screens too. The
 * hover `title` goes with the DOM element — the accessible name it also
 * provided is kept as `aria-label`.
 */
export function ColorDot({
  color,
  size = 'md',
  className,
  title,
}: ColorDotProps) {
  return (
    <View
      className={cn('shrink-0 rounded-full', SIZES[size], className)}
      style={{ backgroundColor: color }}
      {...(title
        ? { role: 'img' as const, 'aria-label': title }
        : { 'aria-hidden': true })}
    />
  );
}
