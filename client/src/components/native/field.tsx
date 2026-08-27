import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import { Text, TextInput, type TextInputProps, View } from 'react-native';

/** Muted placeholder colour the native inputs all shared as a literal. */
const PLACEHOLDER_COLOR = '#9ca3af';

/**
 * Heading above a group of controls that is not a single `TextInput` — the
 * colour swatches, the day toggles, the activity-type chips.
 */
export function FieldLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <Text className={cn('text-sm font-medium text-foreground mb-2', className)}>
      {children}
    </Text>
  );
}

/**
 * Labelled text input. The border/padding/colour classes were copy-pasted at
 * ten call sites, which is how the placeholder colour ended up hard-coded ten
 * times over.
 *
 * `className` is merged onto the input (tailwind-merge, so `w-20` or a font
 * override wins), `containerClassName` onto the wrapper — that is where the
 * bottom margin lives, so a field sitting in a row passes `mb-0 flex-1`.
 */
export function TextField({
  label,
  className,
  containerClassName,
  ...props
}: TextInputProps & {
  label?: string;
  containerClassName?: string;
}) {
  return (
    <View className={cn('mb-4', containerClassName)}>
      {label && (
        <Text className="text-sm font-medium text-foreground mb-1">
          {label}
        </Text>
      )}
      <TextInput
        className={cn(
          'border border-border rounded-lg px-3 py-2 text-foreground bg-card',
          className,
        )}
        placeholderTextColor={PLACEHOLDER_COLOR}
        {...props}
      />
    </View>
  );
}
