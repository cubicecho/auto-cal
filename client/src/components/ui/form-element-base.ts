/**
 * The contract `form-element.tsx` (native) and `form-element.web.tsx` implement.
 *
 * Its own module because Metro resolves `./form-element` to the `.web.tsx` file
 * on web, so that file cannot import the shared pieces from `./form-element`
 * without importing itself.
 */
import type { ReactNode } from 'react';

export type FormElementProps = {
  /** Submits the form. Web wires it to the DOM submit event; native does not. */
  onSubmit: () => void;
  className?: string | undefined;
  children?: ReactNode;
};
