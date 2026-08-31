/**
 * One confirmation prompt for both platforms.
 *
 * Web rendered a `<ConfirmDialog>` per call site with its own `open` state;
 * native called `Alert.alert` with a hand-written cancel/destructive pair. Both
 * are replaced by `useConfirm()`, which resolves a promise:
 *
 * ```ts
 * const confirm = useConfirm();
 * if (await confirm({ title: 'Delete list?', description: '…' })) remove();
 * ```
 *
 * The dialog closes as soon as the choice is made, so the in-flight state
 * belongs to whatever the caller does next — a row that greys itself out while
 * its mutation runs, not a button inside a prompt the user already dismissed.
 */
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import type { ReactNode } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';

export type ConfirmOptions = {
  title: string;
  description: string;
  /** Verb on the destructive button. Defaults to "Delete". */
  confirmLabel?: string;
  cancelLabel?: string;
};

type Confirm = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<Confirm | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<ConfirmOptions | null>(null);
  // Held in a ref rather than state: settling it is not a render, and a second
  // `confirm()` while one is open must not lose the first one's resolver.
  const resolveRef = useRef<((ok: boolean) => void) | null>(null);

  const settle = useCallback((ok: boolean) => {
    resolveRef.current?.(ok);
    resolveRef.current = null;
    setPending(null);
  }, []);

  const confirm = useCallback<Confirm>((options) => {
    // A prompt raised over an open one supersedes it; the older caller is
    // told no rather than left waiting on a promise nothing will settle.
    resolveRef.current?.(false);
    setPending(options);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) settle(false);
        }}
        title={pending?.title ?? ''}
        description={pending?.description ?? ''}
        confirmLabel={pending?.confirmLabel ?? 'Delete'}
        {...(pending?.cancelLabel ? { cancelLabel: pending.cancelLabel } : {})}
        onConfirm={() => settle(true)}
      />
    </ConfirmContext.Provider>
  );
}

/**
 * Throws when no provider is mounted rather than resolving `false`: a delete
 * that silently never happens is worse than a crash in development.
 */
export function useConfirm(): Confirm {
  const confirm = useContext(ConfirmContext);
  if (!confirm) {
    throw new Error('useConfirm must be used inside <ConfirmProvider>');
  }
  return confirm;
}
