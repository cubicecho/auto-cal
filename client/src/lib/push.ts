/**
 * Browser push plumbing, wrapped the way `src/storage.ts` wraps localStorage:
 * every entry point is safe to call anywhere and reports "unsupported" off web
 * rather than throwing on a missing global.
 *
 * Native push is a different transport entirely (`expo-notifications` and a
 * device token, not a service worker), so nothing here pretends to cover it —
 * `pushSupported()` is false there and the settings UI says so.
 */
import { Platform } from 'react-native';

export type PushRegistration = {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent: string;
};

/** Whether this platform can register a Web Push subscription at all. */
export function pushSupported(): boolean {
  return (
    Platform.OS === 'web' &&
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    typeof window !== 'undefined' &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/** `granted` / `denied` / `default`, or `unsupported` where there is no API. */
export function permissionState():
  | 'granted'
  | 'denied'
  | 'default'
  | 'unsupported' {
  if (!pushSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * VAPID keys travel as base64url and `PushManager.subscribe` wants raw bytes.
 * `atob` only speaks standard base64, hence the character swap and the padding.
 */
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(normalized);
  // Backed by an explicit ArrayBuffer: `applicationServerKey` takes a
  // `BufferSource`, which excludes a view over a SharedArrayBuffer.
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

/** The subscription's keys, base64url-encoded the way the server stores them. */
function encodeKey(subscription: globalThis.PushSubscription, name: string) {
  const key = subscription.getKey(name as PushEncryptionKeyName);
  if (!key) return null;
  const bytes = new Uint8Array(key);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return window
    .btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function ready(): Promise<ServiceWorkerRegistration> {
  await navigator.serviceWorker.register('/sw.js');
  return navigator.serviceWorker.ready;
}

/**
 * Ask for permission, subscribe, and return what the server needs to push.
 *
 * Returns null when the user declines or the platform cannot do this — a
 * declined prompt is an ordinary outcome, not an error, and the caller's job is
 * to leave the toggle off rather than to show a failure.
 */
export async function subscribeToPush(
  vapidPublicKey: string,
): Promise<PushRegistration | null> {
  if (!pushSupported()) return null;
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  const registration = await ready();
  const existing = await registration.pushManager.getSubscription();
  // Re-subscribing with a different key silently keeps the old subscription,
  // so an existing one is dropped first; the server upserts on endpoint, so
  // the row follows.
  if (existing) await existing.unsubscribe();

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });

  const p256dh = encodeKey(subscription, 'p256dh');
  const auth = encodeKey(subscription, 'auth');
  if (!p256dh || !auth) return null;

  return {
    endpoint: subscription.endpoint,
    p256dh,
    auth,
    userAgent: navigator.userAgent.slice(0, 512),
  };
}

/** The endpoint this browser is currently subscribed with, if any. */
export async function currentEndpoint(): Promise<string | null> {
  if (!pushSupported()) return null;
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  return subscription?.endpoint ?? null;
}

/** Drop the browser-side subscription. The server row is removed separately. */
export async function unsubscribeFromPush(): Promise<string | null> {
  if (!pushSupported()) return null;
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return null;
  const { endpoint } = subscription;
  await subscription.unsubscribe();
  return endpoint;
}
