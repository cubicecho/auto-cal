/**
 * The web label: radix, which is here for one thing — clicking the label
 * focuses the control named by `htmlFor`. That association has no native
 * counterpart, which is the whole reason for the split.
 */
import { LABEL_CLASS, type LabelProps } from '@/components/ui/label-base';
import { cn } from '@/lib/utils';
import * as LabelPrimitive from '@radix-ui/react-label';

function Label({ htmlFor, className, children }: LabelProps) {
  return (
    <LabelPrimitive.Root
      htmlFor={htmlFor}
      className={cn(LABEL_CLASS, className)}
    >
      {children}
    </LabelPrimitive.Root>
  );
}

export { Label };
