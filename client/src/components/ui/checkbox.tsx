/**
 * A checkbox built from a `Pressable`, not radix's — the multi-select rows are
 * the only place one is needed, and adding a radix primitive would mean a
 * `.web.tsx` pair for a box with a tick in it.
 *
 * `role="checkbox"` plus `aria-checked` is what makes it a real checkbox to a
 * screen reader on both platforms; without the role react-native-web renders a
 * plain `<div>`.
 */
import { Check } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { Pressable } from 'react-native';

type CheckboxProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  /** Required: the box carries no visible label of its own. */
  accessibilityLabel: string;
  className?: string | undefined;
};

export function Checkbox({
  checked,
  onCheckedChange,
  disabled = false,
  accessibilityLabel,
  className,
}: CheckboxProps) {
  return (
    <Pressable
      // biome-ignore lint/a11y/useSemanticElements: this is not a DOM element — a `<input type="checkbox">` has no native counterpart
      role="checkbox"
      aria-checked={checked}
      aria-label={accessibilityLabel}
      disabled={disabled}
      onPress={() => onCheckedChange(!checked)}
      className={cn(
        'h-4 w-4 items-center justify-center rounded border',
        checked ? 'border-primary bg-primary' : 'border-input bg-background',
        disabled && 'opacity-50',
        className,
      )}
    >
      {checked && <Check className="h-3 w-3 text-primary-foreground" />}
    </Pressable>
  );
}
