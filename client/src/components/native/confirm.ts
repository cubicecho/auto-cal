import { Alert } from 'react-native';

/**
 * The two-button destructive confirmation every native row was hand-rolling.
 *
 * Six call sites had written out the same `Alert.alert(title, message, [cancel,
 * destructive])` triple, which is enough repetition for the button order or the
 * `style: 'destructive'` flag to drift between screens without anyone noticing.
 *
 * Native only — `Alert` is a no-op shim on web, and the web screens use
 * `ui/confirm-dialog` instead.
 */
export function confirmDestructive({
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
}: {
  title: string;
  message: string;
  /** Verb on the destructive button. Defaults to "Delete". */
  confirmLabel?: string;
  onConfirm: () => void;
}): void {
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}
