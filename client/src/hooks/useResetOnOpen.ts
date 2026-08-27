import { useEffect } from 'react';

/**
 * Run `reset` whenever the dialog opens or a different entity is selected.
 *
 * Every form dialog is a single instance reused across create and edit targets,
 * so `defaultValues` — which TanStack Form only applies on mount — is stale from
 * the second open onward. Six forms had each written this effect out, each with
 * its own copy of the dependency-array suppression below.
 *
 * `key` is the selected entity's id (`undefined` when creating). Deliberately
 * not depending on `reset`: it closes over values derived from the current
 * render, so including it would re-run on every keystroke and wipe the form
 * mid-edit. That is the whole point of keying on the id instead.
 */
export function useResetOnOpen(
  open: boolean,
  key: string | undefined,
  reset: () => void,
): void {
  // biome-ignore lint/correctness/useExhaustiveDependencies: see the note above — keyed on the selected entity, not on every render's `reset`.
  useEffect(() => {
    if (open) reset();
  }, [open, key]);
}
