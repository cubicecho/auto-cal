/**
 * The web tooltip: radix, shown on hover and focus. `tooltip.tsx` is the
 * native counterpart and `tooltip-base.ts` holds the contract they share.
 */
import {
  TOOLTIP_CONTENT_CLASS,
  TOOLTIP_TEXT_CLASS,
  type TooltipContentProps,
  type TooltipProps,
  type TooltipProviderProps,
  type TooltipTriggerProps,
} from '@/components/ui/tooltip-base';
import { cn } from '@/lib/utils';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

function TooltipProvider({ children }: TooltipProviderProps) {
  return <TooltipPrimitive.Provider>{children}</TooltipPrimitive.Provider>;
}

function Tooltip({ children }: TooltipProps) {
  return <TooltipPrimitive.Root>{children}</TooltipPrimitive.Root>;
}

function TooltipTrigger({ asChild, children }: TooltipTriggerProps) {
  return (
    <TooltipPrimitive.Trigger asChild={asChild ?? false}>
      {children}
    </TooltipPrimitive.Trigger>
  );
}

function TooltipContent({ className, children }: TooltipContentProps) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={4}
        className={cn(
          'z-50 shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          TOOLTIP_CONTENT_CLASS,
          TOOLTIP_TEXT_CLASS,
          className,
        )}
      >
        {children}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
