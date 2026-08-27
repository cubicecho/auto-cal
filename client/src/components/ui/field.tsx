/**
 * Field chrome — the label/description/error furniture around a control.
 *
 * Shared, with no `.web.tsx`: none of it does anything a `<div>` did that a
 * `View` cannot. The one thing lost in the conversion is the
 * `group-data-[disabled=true]/field:` variant `FieldLabel` used to carry —
 * `data-*` attributes and group variants are DOM-only, and nothing set that
 * attribute anyway.
 */
import { Label } from '@/components/ui/label';
import type { LabelProps } from '@/components/ui/label-base';
import { cn } from '@/lib/utils';
import { type VariantProps, cva } from 'class-variance-authority';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

type SectionProps = {
  /**
   * `ui/form.tsx` wires `aria-describedby` from the control to the description
   * and the error, so both need to carry one. React Native takes `id` as a
   * cross-platform prop and react-native-web renders it as the DOM attribute.
   */
  id?: string | undefined;
  className?: string | undefined;
  children?: ReactNode;
};

const fieldVariants = cva('w-full gap-2', {
  variants: {
    orientation: {
      vertical: 'flex-col',
      horizontal: 'flex-row items-center',
    },
  },
  defaultVariants: { orientation: 'vertical' },
});

function Field({
  className,
  orientation = 'vertical',
  children,
}: SectionProps & VariantProps<typeof fieldVariants>) {
  return (
    <View
      // biome-ignore lint/a11y/useSemanticElements: this is not a DOM element — a `<fieldset>` has no native counterpart
      role="group"
      className={cn(fieldVariants({ orientation }), className)}
    >
      {children}
    </View>
  );
}

function FieldLabel({ className, ...props }: LabelProps) {
  return <Label className={className} {...props} />;
}

function FieldDescription({ id, className, children }: SectionProps) {
  return (
    <Text id={id} className={cn('text-muted-foreground text-sm', className)}>
      {children}
    </Text>
  );
}

function FieldError({ id, className, children }: SectionProps) {
  if (!children) return null;
  return (
    <Text
      id={id}
      role="alert"
      className={cn('text-destructive text-sm font-medium', className)}
    >
      {children}
    </Text>
  );
}

function FieldGroup({ className, children }: SectionProps) {
  return <View className={cn('flex-col gap-4', className)}>{children}</View>;
}

export { Field, FieldLabel, FieldDescription, FieldError, FieldGroup };
