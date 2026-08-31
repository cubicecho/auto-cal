/**
 * The web popover: radix, anchored to its trigger. `popover.tsx` is the native
 * counterpart and `popover-base.ts` holds the contract they share.
 */
import type {
  PopoverContentProps,
  PopoverProps,
  PopoverTriggerProps,
} from '@/components/ui/popover-base';
import { cn } from '@/lib/utils';
import * as PopoverPrimitive from '@radix-ui/react-popover';

function Popover({ open, onOpenChange, children }: PopoverProps) {
  return (
    <PopoverPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </PopoverPrimitive.Root>
  );
}

function PopoverTrigger({ asChild, children }: PopoverTriggerProps) {
  return (
    <PopoverPrimitive.Trigger asChild={asChild ?? false}>
      {children}
    </PopoverPrimitive.Trigger>
  );
}

function PopoverContent({
  className,
  align = 'center',
  children,
}: PopoverContentProps) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align={align}
        sideOffset={4}
        className={cn(
          'z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          className,
        )}
      >
        {children}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  );
}

export { Popover, PopoverTrigger, PopoverContent };
