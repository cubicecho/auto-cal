/**
 * The native implementation. `input.web.tsx` is its web counterpart, and
 * `input-base.ts` holds the contract they share.
 *
 * This is the one primitive in the spike that genuinely needs the split the
 * plan allows for: `type="time"` and `type="number"` (with `min`/`max`) are
 * real DOM input behaviour that `TextInput` cannot reproduce, and
 * react-native-web offers no way to reach them. Because both files export the
 * same `InputProps`, call sites never branch — the only rules are that they
 * speak `onChangeText` rather than `onChange`, and reach the element through
 * `InputHandle` rather than an `HTMLInputElement` ref.
 */
import {
  INPUT_CLASS,
  type InputHandle,
  type InputProps,
} from '@/components/ui/input-base';
import { cn } from '@/lib/utils';
import { useImperativeHandle, useRef } from 'react';
import { TextInput } from 'react-native';

function Input({
  className,
  type = 'text',
  value,
  onChangeText,
  onBlur,
  onSubmitEditing,
  placeholder,
  maxLength,
  disabled,
  autoFocus,
  ref,
}: InputProps) {
  const inner = useRef<TextInput>(null);
  useImperativeHandle<InputHandle, InputHandle>(ref, () => ({
    focus: () => inner.current?.focus(),
  }));

  return (
    <TextInput
      ref={inner}
      value={value}
      onChangeText={onChangeText}
      onBlur={onBlur}
      onSubmitEditing={onSubmitEditing}
      placeholder={placeholder}
      maxLength={maxLength}
      editable={!disabled}
      autoFocus={autoFocus}
      keyboardType={type === 'number' ? 'numeric' : 'default'}
      className={cn(INPUT_CLASS, disabled && 'opacity-50', className)}
    />
  );
}

export { Input };
export type {
  InputProps,
  InputType,
  InputHandle,
} from '@/components/ui/input-base';
