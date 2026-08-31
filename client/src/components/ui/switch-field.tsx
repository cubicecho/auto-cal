/**
 * A switch with its caption — the "Hide project lists" / "Show archived" rows.
 *
 * On web these were a `<label htmlFor>` wrapping the switch, which put the
 * whole row in the switch's hit target for free. There is no such association
 * off web, so the caption is a `Pressable` that toggles it explicitly and both
 * platforms behave the same way.
 */
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Pressable, View } from 'react-native';

type SwitchFieldProps = {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string | undefined;
  labelClassName?: string | undefined;
};

export function SwitchField({
  id,
  label,
  checked,
  onCheckedChange,
  className,
  labelClassName,
}: SwitchFieldProps) {
  return (
    <View className={cn('flex-row items-center gap-2', className)}>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
      <Pressable onPress={() => onCheckedChange(!checked)}>
        <Label
          htmlFor={id}
          className={cn('text-sm text-muted-foreground', labelClassName)}
        >
          {label}
        </Label>
      </Pressable>
    </View>
  );
}
