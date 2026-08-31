/**
 * Swatches plus a hex field, replacing `<input type="color">`.
 *
 * The DOM colour input has no native counterpart — react-native-web renders it
 * as a plain text box and a `TextInput` cannot open a picker — so the web forms
 * and the native sheets had grown two different colour controls. The swatch row
 * is what the native sheets already used; the hex field is what the web forms
 * had beside the picker, and it is still the way to enter a colour that is not
 * on the list.
 */
import { Input } from '@/components/ui/input';
import { ACTIVITY_COLORS, DEFAULT_ACTIVITY_COLOR } from '@/lib/form-constants';
import { cn } from '@/lib/utils';
import { Pressable, Text, View } from 'react-native';

type ColorPickerProps = {
  value: string;
  onChange: (color: string) => void;
  onBlur?: (() => void) | undefined;
  /** Swatches to offer. Defaults to the shared activity palette. */
  colors?: readonly string[];
  className?: string | undefined;
};

export function ColorPicker({
  value,
  onChange,
  onBlur,
  colors = ACTIVITY_COLORS,
  className,
}: ColorPickerProps) {
  return (
    <View className={cn('gap-3', className)}>
      <View className="flex-row flex-wrap gap-2">
        {colors.map((color) => {
          const selected = value.toLowerCase() === color.toLowerCase();
          return (
            <Pressable
              key={color}
              onPress={() => onChange(color)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={color}
              className={cn(
                'h-9 w-9 items-center justify-center rounded-full border-2',
                selected ? 'border-foreground' : 'border-transparent',
              )}
              style={{ backgroundColor: color }}
            >
              {selected ? (
                <Text className="text-base leading-none text-white">✓</Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
      <Input
        placeholder={DEFAULT_ACTIVITY_COLOR}
        value={value}
        onChangeText={onChange}
        onBlur={onBlur}
        maxLength={7}
        className="font-mono"
      />
    </View>
  );
}
