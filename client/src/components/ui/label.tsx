/**
 * The native label: just text. `htmlFor` is accepted and ignored — there is no
 * label/control association on native, and a `TextInput` is focused by tapping
 * it rather than its caption.
 */
import { LABEL_CLASS, type LabelProps } from '@/components/ui/label-base';
import { cn } from '@/lib/utils';
import { Text } from 'react-native';

function Label({ className, children }: LabelProps) {
  return <Text className={cn(LABEL_CLASS, className)}>{children}</Text>;
}

export { Label };
