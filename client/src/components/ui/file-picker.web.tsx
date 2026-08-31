/**
 * The web file picker: a drop zone over a hidden `<input type="file">`.
 *
 * Both are DOM-only, which is why this is a `.web.tsx`. The caller never sees
 * a `File` — it gets the decoded text — so the calling screen stays shared.
 */
import type { FilePickerProps } from '@/components/ui/file-picker-base';
import { Upload } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { useRef, useState } from 'react';
import { Text } from 'react-native';

export function FilePicker({ onPick, accept, label, hint }: FilePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  async function read(file: File) {
    onPick(await file.text(), file.name);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void read(file);
        }}
        className={cn(
          'w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors',
          dragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50',
        )}
      >
        <Upload className="h-8 w-8 text-muted-foreground" />
        <Text className="font-medium text-sm">{label}</Text>
        {hint ? (
          <Text className="text-xs text-muted-foreground">{hint}</Text>
        ) : null}
      </button>
      <input
        ref={inputRef}
        type="file"
        {...(accept ? { accept } : {})}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void read(file);
          // Allow re-selecting the same file after a reset.
          e.target.value = '';
        }}
      />
    </>
  );
}
