/**
 * The native popover: a transparent `Modal` with a dimmed backdrop and a
 * centred card.
 *
 * It is deliberately *not* anchored to its trigger. Anchoring means measuring
 * the trigger and flipping the card against the viewport, which is a chunk of
 * layout code to reproduce a hover-era affordance — on a phone a centred sheet
 * is the native idiom anyway. `align` is accepted and ignored, and the same
 * backdrop-as-sibling rule as `dialog.tsx` applies (a `Pressable` has no
 * `stopPropagation`, so the card must not be nested inside it).
 */
import type {
  PopoverContentProps,
  PopoverProps,
  PopoverTriggerProps,
} from '@/components/ui/popover-base';
import { cn } from '@/lib/utils';
import {
  type ReactElement,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
} from 'react';
import { Modal, Pressable, View } from 'react-native';

type PopoverState = { open: boolean; setOpen: (open: boolean) => void };

const PopoverContext = createContext<PopoverState>({
  open: false,
  setOpen: () => {},
});

function Popover({ open, onOpenChange, children }: PopoverProps) {
  return (
    <PopoverContext.Provider value={{ open, setOpen: onOpenChange }}>
      {children}
    </PopoverContext.Provider>
  );
}

function PopoverTrigger({ asChild, children }: PopoverTriggerProps) {
  const { setOpen } = useContext(PopoverContext);
  if (asChild && isValidElement(children)) {
    return cloneElement(children as ReactElement<{ onPress?: () => void }>, {
      onPress: () => setOpen(true),
    });
  }
  return (
    // biome-ignore lint/a11y/useSemanticElements: this is not a DOM element — a `<button>` has no native counterpart
    <Pressable role="button" onPress={() => setOpen(true)}>
      {children}
    </Pressable>
  );
}

function PopoverContent({ className, children }: PopoverContentProps) {
  const { open, setOpen } = useContext(PopoverContext);
  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={() => setOpen(false)}
    >
      <View className="flex-1 items-center justify-center bg-black/60 p-6">
        <Pressable
          className="absolute inset-0"
          onPress={() => setOpen(false)}
          role="button"
          aria-label="Close"
        />
        <View
          className={cn(
            'w-72 rounded-md border border-border bg-popover p-4',
            className,
          )}
        >
          {children}
        </View>
      </View>
    </Modal>
  );
}

export { Popover, PopoverTrigger, PopoverContent };
