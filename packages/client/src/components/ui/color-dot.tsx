import { cn } from '@/lib/utils';

type ColorDotProps = {
  color: string;
  className?: string;
  title?: string;
};

/** A small round color swatch used to indicate an activity type's color. */
export function ColorDot({ color, className, title }: ColorDotProps) {
  return (
    <span
      className={cn('inline-block h-3 w-3 shrink-0 rounded-full', className)}
      style={{ backgroundColor: color }}
      title={title}
      aria-hidden="true"
    />
  );
}
