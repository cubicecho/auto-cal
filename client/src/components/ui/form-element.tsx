/**
 * The element `<Form>` renders on native: a plain `View`.
 *
 * There is no submit event to listen for off web — `SubmitButton` calls
 * `form.handleSubmit()` on press, which is the only path to submission there.
 */
import type { FormElementProps } from '@/components/ui/form-element-base';
import { cn } from '@/lib/utils';
import { View } from 'react-native';

export function FormElement({ className, children }: FormElementProps) {
  return <View className={cn('flex-col', className)}>{children}</View>;
}
