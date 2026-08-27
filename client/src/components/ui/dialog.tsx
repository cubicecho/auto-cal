/**
 * The native dialog: a transparent `Modal` with a dimmed backdrop and a centred
 * card, matching what radix renders on web closely enough that the four call
 * sites need no branching.
 *
 * What does not carry over from radix, and is not faked here: the focus trap
 * and the scroll lock (a `Modal` already owns the screen) and the enter/exit
 * animations beyond the `fade` the `Modal` does itself. `Escape` becomes
 * `onRequestClose`, which is the Android back button.
 *
 * `open === false` renders nothing at all, so a dialog's body unmounts between
 * openings exactly as it does on web.
 */
import type {
  DialogProps,
  DialogSectionProps,
} from '@/components/ui/dialog-base';
import { X } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { createContext, useContext } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

/**
 * Radix wires its `Close` up through the `Root` it is nested in. There is no
 * equivalent on native, so `Dialog` publishes the closer and `DialogContent`
 * — which owns both the backdrop and the X — reads it.
 */
const DialogCloseContext = createContext<() => void>(() => {});

function Dialog({ open, onOpenChange, children }: DialogProps) {
  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={() => onOpenChange(false)}
    >
      <DialogCloseContext.Provider value={() => onOpenChange(false)}>
        {children}
      </DialogCloseContext.Provider>
    </Modal>
  );
}

function DialogContent({ className, children }: DialogSectionProps) {
  const close = useContext(DialogCloseContext);
  return (
    <View className="flex-1 items-center justify-center bg-black/80 p-6">
      {/* The backdrop is a sibling laid out underneath rather than a parent of
          the card, because `Pressable` has no `stopPropagation` — nesting the
          card inside it would make every press on the card close the dialog. */}
      <Pressable
        className="absolute inset-0"
        onPress={close}
        role="button"
        aria-label="Close"
      />
      <View
        className={cn(
          'w-full max-w-lg gap-4 rounded-lg border border-border bg-background p-6',
          className,
        )}
      >
        {children}
        <Pressable
          className="absolute right-4 top-4 opacity-70"
          onPress={close}
          // biome-ignore lint/a11y/useSemanticElements: this is not a DOM element — a `<button>` has no native counterpart
          role="button"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </Pressable>
      </View>
    </View>
  );
}

// `space-y-*` and `space-x-*` are child-combinator utilities nativewind does
// not implement; `gap` is the cross-platform equivalent and behaves the same
// for these two rows.
function DialogHeader({ className, children }: DialogSectionProps) {
  return <View className={cn('gap-1.5', className)}>{children}</View>;
}

function DialogFooter({ className, children }: DialogSectionProps) {
  return (
    <View className={cn('flex-row justify-end gap-2', className)}>
      {children}
    </View>
  );
}

function DialogTitle({ className, children }: DialogSectionProps) {
  return (
    <Text
      // biome-ignore lint/a11y/useSemanticElements: this is not a DOM element — an `<h2>` has no native counterpart
      role="heading"
      aria-level={2}
      className={cn(
        'text-lg font-semibold leading-none tracking-tight text-foreground',
        className,
      )}
    >
      {children}
    </Text>
  );
}

function DialogDescription({ className, children }: DialogSectionProps) {
  return (
    <Text className={cn('text-sm text-muted-foreground', className)}>
      {children}
    </Text>
  );
}

export {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
};
