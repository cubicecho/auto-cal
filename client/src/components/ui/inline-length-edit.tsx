import { useState } from 'react';

type InlineLengthEditProps = {
  value: number;
  saving?: boolean;
  onSave: (value: number) => void;
};

export function InlineLengthEdit({
  value,
  saving,
  onSave,
}: InlineLengthEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function commit() {
    const clamped = Math.max(1, Math.min(1440, draft || 1));
    if (clamped !== value) onSave(clamped);
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        type="number"
        min={1}
        max={1440}
        value={draft}
        // biome-ignore lint/a11y/noAutofocus: intentional focus when user activates inline edit
        autoFocus
        className="w-16 rounded border border-input bg-background px-1 py-0 text-xs font-medium tabular-nums focus:outline-none focus:ring-1 focus:ring-ring"
        onChange={(e) => setDraft(Number(e.target.value))}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit();
          }
          if (e.key === 'Escape') setEditing(false);
        }}
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <button
      type="button"
      className="cursor-text rounded px-0.5 text-xs font-medium tabular-nums hover:bg-muted disabled:opacity-50"
      title="Click to edit estimated length"
      disabled={saving}
      onClick={(e) => {
        e.stopPropagation();
        setDraft(value);
        setEditing(true);
      }}
    >
      {saving ? '…' : `${value} min`}
    </button>
  );
}
