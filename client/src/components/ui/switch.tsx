/**
 * The native switch: a `Pressable` track with a thumb that moves, rather than
 * react-native's `Switch`. RN's takes `trackColor`/`thumbColor` as raw colour
 * values, which would pin the control outside the tailwind theme and make it
 * the one control that does not follow dark mode with the rest.
 *
 * `switch.web.tsx` is radix; `switch-base.ts` holds the contract and the track
 * classes, so the two cannot drift visually.
 */
import {
  SWITCH_THUMB_CLASS,
  SWITCH_TRACK_CLASS,
  type SwitchProps,
} from '@/components/ui/switch-base';
import { cn } from '@/lib/utils';
import { Pressable, View } from 'react-native';

function Switch({
  checked,
  onCheckedChange,
  disabled,
  className,
}: SwitchProps) {
  return (
    <Pressable
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onPress={() => onCheckedChange(!checked)}
      className={cn(
        SWITCH_TRACK_CLASS,
        checked ? 'bg-primary' : 'bg-input',
        // `disabled:` never applies to a Pressable — apply the state directly.
        disabled && 'opacity-50',
        className,
      )}
    >
      <View className={cn(SWITCH_THUMB_CLASS, checked ? 'ml-4' : 'ml-0')} />
    </Pressable>
  );
}

export { Switch };
