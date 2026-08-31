/**
 * The contract `file-picker.tsx` (native) and `file-picker.web.tsx` implement.
 *
 * Its own module for the usual reason — Metro resolves `./file-picker` to the
 * `.web.tsx` file on web, so that file cannot import the shared pieces from
 * `./file-picker` without importing itself.
 */

export type FilePickerProps = {
  /** Handed the picked file's decoded text, never the `File` object itself. */
  onPick: (text: string, fileName: string) => void;
  /** e.g. `'application/json,.json'`. Web only — advisory on the dialog. */
  accept?: string | undefined;
  label: string;
  hint?: string | undefined;
};
