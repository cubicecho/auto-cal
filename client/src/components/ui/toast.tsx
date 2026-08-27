/**
 * Transient messages for mutations fired outside a form.
 *
 * A dialog can show a failure in `FormDialogFooter`, and a card can show one in
 * the card. Everything else — the completion checkbox, drag-to-reschedule, the
 * inline length editor — has no surface of its own, so those failures used to
 * reach `console.error` and nowhere else: the checkbox simply sprang back and
 * the user was never told why.
 *
 * Built on react-native primitives rather than `<div>` so the same provider
 * serves web and native; only the viewport's positioning differs.
 */
import type { ReactNode } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { ViewStyle } from 'react-native';
import { Platform, Pressable, Text, View } from 'react-native';

export type ToastTone = 'error' | 'success';

type Toast = { id: number; message: string; tone: ToastTone };

/** Show a message. Defaults to `error`, which is what nearly every caller wants. */
type ShowToast = (message: string, tone?: ToastTone) => void;

const ToastContext = createContext<ShowToast | null>(null);

/** Errors linger — the user has to read a reason; confirmations do not. */
const DURATION_MS: Record<ToastTone, number> = {
  error: 6000,
  success: 3000,
};

const TONE_CLASS: Record<ToastTone, string> = {
  error: 'bg-destructive',
  success: 'bg-primary',
};

const TONE_TEXT_CLASS: Record<ToastTone, string> = {
  error: 'text-destructive-foreground',
  success: 'text-primary-foreground',
};

/**
 * `position: 'fixed'` keeps the stack pinned to the viewport on web no matter
 * which scroll container the mutation was fired from. It is a real CSS value
 * that react-native-web passes through, but not one react-native's `ViewStyle`
 * admits, hence the cast. Native gets `absolute`, which resolves against the
 * router's full-screen container.
 */
const VIEWPORT_STYLE = Platform.select({
  web: { position: 'fixed', right: 16, bottom: 16, zIndex: 50 },
  default: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 32,
    zIndex: 50,
  },
}) as unknown as ViewStyle;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback<ShowToast>(
    (message, tone = 'error') => {
      const id = nextId.current++;
      setToasts((prev) => [...prev, { id, message, tone }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), DURATION_MS[tone]),
      );
    },
    [dismiss],
  );

  // A toast outlives the component that raised it, so the timer has to be
  // cleaned up here rather than at the call site.
  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const timer of pending.values()) clearTimeout(timer);
      pending.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toasts.length > 0 && (
        <View pointerEvents="box-none" style={VIEWPORT_STYLE} className="gap-2">
          {toasts.map((toast) => (
            <Pressable
              key={toast.id}
              onPress={() => dismiss(toast.id)}
              accessibilityRole="alert"
              accessibilityLabel={toast.message}
              className={`max-w-sm rounded-lg px-4 py-3 shadow-lg ${TONE_CLASS[toast.tone]}`}
            >
              <Text className={`text-sm ${TONE_TEXT_CLASS[toast.tone]}`}>
                {toast.message}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </ToastContext.Provider>
  );
}

/**
 * Throws when no provider is mounted rather than silently swallowing the
 * message — a toast that never appears is the bug this module exists to fix.
 */
export function useToast(): ShowToast {
  const show = useContext(ToastContext);
  if (!show) {
    throw new Error('useToast must be used inside <ToastProvider>');
  }
  return show;
}
