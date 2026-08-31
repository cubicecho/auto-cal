/**
 * The contract `popover.tsx` (native) and `popover.web.tsx` (radix) both
 * implement. Its own module for the usual reason: Metro resolves `./popover`
 * to `popover.web.tsx` on web, so the web file cannot import shared types from
 * `./popover` without importing itself.
 *
 * Narrower than radix's props on purpose — the only caller
 * (`date-time-input.tsx`) opens a controlled popover with a `asChild` trigger
 * and one content pane.
 */
import type { ReactNode } from 'react';

export type PopoverProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
};

export type PopoverTriggerProps = {
  /**
   * Hand the press handler to the single child element rather than wrapping it.
   * Always pass it: a `Pressable` wrapping a `Button` never fires on native,
   * because the inner pressable claims the touch responder.
   */
  asChild?: boolean | undefined;
  children: ReactNode;
};

export type PopoverContentProps = {
  className?: string | undefined;
  /** Web only — the native sheet is centred and has nothing to align to. */
  align?: 'start' | 'center' | 'end' | undefined;
  children?: ReactNode;
};
