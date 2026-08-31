/**
 * The contract `switch.tsx` (native) and `switch.web.tsx` (radix) both
 * implement. Its own module because Metro resolves `./switch` to
 * `switch.web.tsx` on web — the web file would otherwise import itself.
 */
export type SwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** Web only: what a `<label htmlFor>` points at. */
  id?: string | undefined;
  disabled?: boolean | undefined;
  className?: string | undefined;
};

/** Shared between the two files so the track cannot drift between platforms. */
export const SWITCH_TRACK_CLASS =
  'h-5 w-9 shrink-0 flex-row items-center rounded-full border-2 border-transparent';
export const SWITCH_THUMB_CLASS = 'h-4 w-4 rounded-full bg-background';
