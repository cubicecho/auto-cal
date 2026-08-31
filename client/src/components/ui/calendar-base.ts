/**
 * The contract `calendar.tsx` (native) and `calendar.web.tsx`
 * (react-day-picker) both implement. Its own module because Metro resolves
 * `./calendar` to `calendar.web.tsx` on web.
 *
 * Single-date selection only. react-day-picker's `mode` is not in the contract
 * — the one caller (`date-time-input.tsx`) picks one day, and range/multi
 * selection has no native implementation behind it.
 */
export type CalendarProps = {
  selected?: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  /** Month shown on first render; defaults to the selected date's month. */
  defaultMonth?: Date | undefined;
  className?: string | undefined;
};
