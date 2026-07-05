import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type ColorBarProps = {
  color: string;
  /** Shown on hover; also used as the accessible label. */
  label?: string;
  className?: string;
};

/**
 * A full-height accent bar pinned to the left edge of a `relative` card.
 * Doubles as a hover target showing the activity type's name. The parent must
 * be `relative` (and usually `overflow-hidden` so the bar follows the card's
 * rounded corners).
 */
export function ColorBar({ color, label, className }: ColorBarProps) {
  const bar = (
    <span
      className={cn(
        'absolute inset-y-0 left-0 w-2.5 cursor-default',
        className,
      )}
      style={{ backgroundColor: color }}
      aria-label={label}
    />
  );

  if (!label) return bar;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{bar}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}
