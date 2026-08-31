/**
 * The web switch: radix. `switch.tsx` is the native counterpart and
 * `switch-base.ts` holds the contract they share.
 */
import {
  SWITCH_THUMB_CLASS,
  SWITCH_TRACK_CLASS,
  type SwitchProps,
} from '@/components/ui/switch-base';
import { cn } from '@/lib/utils';
import * as SwitchPrimitive from '@radix-ui/react-switch';

function Switch({
  checked,
  onCheckedChange,
  id,
  disabled,
  className,
}: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={cn(
        SWITCH_TRACK_CLASS,
        'peer inline-flex cursor-pointer shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input',
        className,
      )}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          SWITCH_THUMB_CLASS,
          'pointer-events-none block shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0',
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
