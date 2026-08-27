/**
 * The contract both `input.tsx` (native) and `input.web.tsx` implement.
 *
 * It lives in its own module because Metro resolves `./input` to `input.web.tsx`
 * on web — the web file importing the shared pieces from `./input` would be
 * importing itself.
 */

import type { Ref } from 'react';

/** Everything but `text` and `number` falls back to plain text entry off web. */
export type InputType = 'text' | 'number' | 'time' | 'datetime-local' | 'color';

/**
 * What a caller may do to an input imperatively. `select` is web-only —
 * `TextInput` has no equivalent — so callers must treat it as optional.
 */
export type InputHandle = {
  focus: () => void;
  select?: () => void;
};

export type InputProps = {
  value?: string | undefined;
  onChangeText?: ((text: string) => void) | undefined;
  onBlur?: (() => void) | undefined;
  /** Enter on web, the return key on native. */
  onSubmitEditing?: (() => void) | undefined;
  placeholder?: string | undefined;
  type?: InputType | undefined;
  maxLength?: number | undefined;
  /** Web only; the native keyboard has no equivalent constraint. */
  min?: number | undefined;
  max?: number | undefined;
  disabled?: boolean | undefined;
  className?: string | undefined;
  /** Web only: ties the control to its `<label>`. */
  id?: string | undefined;
  autoFocus?: boolean | undefined;
  ref?: Ref<InputHandle> | undefined;
};

export const INPUT_CLASS =
  'border-input bg-background text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';
