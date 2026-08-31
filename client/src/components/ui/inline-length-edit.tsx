import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Pressable, Text } from 'react-native';

type InlineLengthEditProps = {
  value: number;
  saving?: boolean;
  onSave: (value: number) => void;
};

/**
 * The estimated-length badge on a todo row, editable in place.
 *
 * The badge is a `Pressable` inside a pressable row, so the row would fire too
 * — the caller stops that by rendering this inside a container that swallows
 * the press, which is what `TodoItem` does.
 */
export function InlineLengthEdit({
  value,
  saving,
  onSave,
}: InlineLengthEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  function commit() {
    const parsed = Number(draft);
    const clamped = Math.max(1, Math.min(1440, parsed || 1));
    if (clamped !== value) onSave(clamped);
    setEditing(false);
  }

  if (editing) {
    return (
      <Input
        type="number"
        min={1}
        max={1440}
        value={draft}
        autoFocus
        className="h-6 w-16 px-1 py-0 text-xs font-medium"
        onChangeText={setDraft}
        onBlur={commit}
        onSubmitEditing={commit}
      />
    );
  }

  return (
    <Pressable
      className="rounded px-0.5"
      accessibilityLabel="Edit estimated length"
      disabled={saving}
      onPress={() => {
        setDraft(String(value));
        setEditing(true);
      }}
    >
      <Text className={`text-xs font-medium ${saving ? 'opacity-50' : ''}`}>
        {saving ? '…' : `${value} min`}
      </Text>
    </Pressable>
  );
}
