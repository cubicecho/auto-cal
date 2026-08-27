/**
 * The contract `dialog.tsx` and `dialog.web.tsx` both implement. Separate
 * module for the usual reason: Metro resolves `./dialog` to `dialog.web.tsx`
 * on web, so the web file cannot import shared types from `./dialog` without
 * importing itself.
 *
 * Deliberately narrower than radix's own props. The four call sites only ever
 * pass `open`/`onOpenChange`/`className`/`children`, and a shared contract is
 * the only thing that makes the platform pair checkable — TypeScript resolves
 * the native file and never compares the two.
 */
import type { ReactNode } from 'react';

export type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
};

/** Every part inside a `Dialog` — content, header, footer, title, description. */
export type DialogSectionProps = {
  className?: string | undefined;
  children?: ReactNode;
};
