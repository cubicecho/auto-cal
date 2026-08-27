/**
 * The web implementation — see `input.tsx` for why this one is split, and
 * `input-base.ts` for the contract both sides implement.
 *
 * It keeps the DOM `<input>` so `type="time"`, `type="number"` and `min`/`max`
 * keep working, and adapts the event to the shared `onChangeText` contract so
 * no call site has to know which platform it is on.
 */
import {
  INPUT_CLASS,
  type InputHandle,
  type InputProps,
} from '@/components/ui/input-base';
import { cn } from '@/lib/utils';
import { useImperativeHandle, useRef } from 'react';

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
  min,
  max,
  id,
  autoFocus,
  ref,
}: InputProps) {
  const inner = useRef<HTMLInputElement>(null);
  useImperativeHandle<InputHandle, InputHandle>(ref, () => ({
    focus: () => inner.current?.focus(),
    select: () => inner.current?.select(),
  }));

  return (
    <input
      ref={inner}
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChangeText?.(e.target.value)}
      onBlur={onBlur}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && onSubmitEditing) {
          e.preventDefault();
          onSubmitEditing();
        }
      }}
      placeholder={placeholder}
      maxLength={maxLength}
      disabled={disabled}
      min={min}
      max={max}
      // biome-ignore lint/a11y/noAutofocus: preserves the behaviour of the call sites that ask for it
      autoFocus={autoFocus}
      className={cn(
        INPUT_CLASS,
        'file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
    />
  );
}

export { Input };
export type {
  InputProps,
  InputType,
  InputHandle,
} from '@/components/ui/input-base';
