/**
 * The web select: radix, anchored under its trigger. `select.tsx` is the
 * native counterpart and `select-base.ts` holds the contract they share.
 */
import { Check, ChevronDown } from '@/components/ui/icons';
import {
  SELECT_ITEM_CLASS,
  SELECT_ITEM_TEXT_CLASS,
  SELECT_TRIGGER_CLASS,
  SELECT_TRIGGER_TEXT_CLASS,
  type SelectContentProps,
  type SelectItemProps,
  type SelectProps,
  type SelectTriggerProps,
  type SelectValueProps,
} from '@/components/ui/select-base';
import { cn } from '@/lib/utils';
import * as SelectPrimitive from '@radix-ui/react-select';

function Select({ value, onValueChange, children }: SelectProps) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
      {children}
    </SelectPrimitive.Root>
  );
}

function SelectTrigger({ className, onBlur, children }: SelectTriggerProps) {
  return (
    <SelectPrimitive.Trigger
      onBlur={onBlur}
      className={cn(
        SELECT_TRIGGER_CLASS,
        SELECT_TRIGGER_TEXT_CLASS,
        'ring-offset-background placeholder:text-muted-foreground focus:ring-ring flex focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
        className,
      )}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectValue({ placeholder, children }: SelectValueProps) {
  return (
    <SelectPrimitive.Value placeholder={placeholder}>
      {children}
    </SelectPrimitive.Value>
  );
}

function SelectContent({ className, children }: SelectContentProps) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        position="popper"
        className={cn(
          'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1 relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border shadow-md',
          className,
        )}
      >
        <SelectPrimitive.Viewport className="w-full min-w-[var(--radix-select-trigger-width)] p-1">
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

function SelectItem({ value, className, children }: SelectItemProps) {
  return (
    <SelectPrimitive.Item
      value={value}
      className={cn(
        SELECT_ITEM_CLASS,
        SELECT_ITEM_TEXT_CLASS,
        'focus:bg-accent focus:text-accent-foreground relative flex cursor-default select-none outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="h-4 w-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue };
