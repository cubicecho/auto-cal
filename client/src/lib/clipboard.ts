import * as Clipboard from 'expo-clipboard';

/**
 * Copies text on every platform.
 *
 * `expo-clipboard` covers web too (it wraps `navigator.clipboard`), so this
 * replaces the `navigator.clipboard` call plus its hidden-`<textarea>` +
 * `document.execCommand('copy')` fallback that the API-key dialog carried —
 * both of which are DOM-only and would have thrown on native.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    await Clipboard.setStringAsync(text);
    return true;
  } catch {
    return false;
  }
}
