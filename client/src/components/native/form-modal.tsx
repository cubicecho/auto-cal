import type { ReactNode } from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';

/**
 * The pageSheet form modal shared by the six native create/edit sheets: a title
 * row with a Cancel affordance, the fields, and a single primary submit button
 * pinned under them.
 *
 * Render it conditionally (`{open && <FormModal …>}`) rather than toggling a
 * `visible` prop — unmounting is what discards the field state, so a sheet
 * reopened after a cancel starts empty without each screen resetting by hand.
 */
export function FormModal({
  title,
  onClose,
  submitLabel,
  onSubmit,
  submitDisabled = false,
  children,
}: {
  title: string;
  onClose: () => void;
  /** Text on the primary button — call sites swap it for "Saving…" while busy. */
  submitLabel: string;
  onSubmit: () => void;
  submitDisabled?: boolean;
  children: ReactNode;
}) {
  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-background p-6">
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-xl font-bold text-foreground">{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Text className="text-primary text-base">Cancel</Text>
          </TouchableOpacity>
        </View>

        {children}

        <TouchableOpacity
          className="bg-primary rounded-lg py-3 items-center mt-2"
          onPress={onSubmit}
          disabled={submitDisabled}
        >
          <Text className="text-primary-foreground font-semibold">
            {submitLabel}
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}
