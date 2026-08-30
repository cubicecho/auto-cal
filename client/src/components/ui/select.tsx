/**
 * The native select: a trigger that opens the options in a `Modal` sheet.
 *
 * A listbox that drops open under its trigger is a pointer affordance; every
 * native platform shows the choices as a sheet instead, so that is what this
 * renders rather than trying to reproduce radix's anchored popper.
 *
 * `SelectContent` owns the `Modal`, which is why `Select` may hold both a
 * trigger and a content child in any order — the open state lives in the
 * context above them.
 */
import { Check, ChevronDown } from '@/components/ui/icons';
import {
  SELECT_ITEM_CLASS,
  SELECT_ITEM_TEXT_CLASS,
  SELECT_TRIGGER_CLASS,
  SELECT_TRIGGER_TEXT_CLASS,
  type SelectContentProps,
  type SelectItemProps,
  type SelectProps,
  type SelectTriggerProps,
  type SelectValueProps,
} from '@/components/ui/select-base';
import { cn } from '@/lib/utils';
import { createContext, useContext, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

type SelectState = {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
};

const SelectContext = createContext<SelectState>({
  value: '',
  onValueChange: () => {},
  open: false,
  setOpen: () => {},
});

function Select({ value, onValueChange, children }: SelectProps) {
  const [open, setOpen] = useState(false);
  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      {children}
    </SelectContext.Provider>
  );
}

function SelectTrigger({ className, onBlur, children }: SelectTriggerProps) {
  const { setOpen } = useContext(SelectContext);
  return (
    <Pressable
      // biome-ignore lint/a11y/useSemanticElements: this is not a DOM element — a `<button>` has no native counterpart
      role="button"
      onPress={() => {
        setOpen(true);
        // A native sheet takes focus away from the trigger the way a blur
        // would on web, and the forms depend on that to mark the field touched.
        onBlur?.();
      }}
      className={cn(SELECT_TRIGGER_CLASS, className)}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </Pressable>
  );
}

/**
 * Renders whatever the caller passed, or the placeholder when nothing is
 * selected. Bare strings are wrapped for the caller — an unwrapped string
 * inside a `View` throws on native and renders fine on web, which is exactly
 * the kind of divergence a shared primitive should absorb.
 */
function SelectValue({ placeholder, children }: SelectValueProps) {
  const { value } = useContext(SelectContext);
  const content = value && children ? children : placeholder;
  return typeof content === 'string' ? (
    <Text className={SELECT_TRIGGER_TEXT_CLASS}>{content}</Text>
  ) : (
    content
  );
}

function SelectContent({ className, children }: SelectContentProps) {
  const { open, setOpen } = useContext(SelectContext);
  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={() => setOpen(false)}
    >
      <View className="flex-1 items-center justify-center bg-black/60 p-6">
        {/* Sibling, not parent: `Pressable` has no `stopPropagation`. */}
        <Pressable
          className="absolute inset-0"
          onPress={() => setOpen(false)}
          role="button"
          aria-label="Close"
        />
        <View
          className={cn(
            'max-h-96 w-full max-w-sm rounded-md border border-border bg-popover p-1',
            className,
          )}
        >
          <ScrollView>{children}</ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function SelectItem({ value, className, children }: SelectItemProps) {
  const select = useContext(SelectContext);
  const selected = select.value === value;
  return (
    <Pressable
      role="menuitem"
      onPress={() => {
        select.onValueChange(value);
        select.setOpen(false);
      }}
      className={cn(SELECT_ITEM_CLASS, selected && 'bg-accent', className)}
    >
      {selected ? (
        <View className="absolute left-2 h-3.5 w-3.5 items-center justify-center">
          <Check className="h-4 w-4" />
        </View>
      ) : null}
      {typeof children === 'string' ? (
        <Text className={SELECT_ITEM_TEXT_CLASS}>{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue };
