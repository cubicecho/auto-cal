import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Parses a `#rrggbb` color into hue (0–360), saturation and lightness (0–1). */
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = Number.parseInt(hex.slice(1, 3), 16) / 255;
  const g = Number.parseInt(hex.slice(3, 5), 16) / 255;
  const b = Number.parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }

  return { h: Math.round(h * 360), s, l };
}

/**
 * Returns a desaturated high-lightness background tint derived from a hex
 * color. Only used by the native (Expo) screens; web uses ColorBar/ColorDot.
 */
export function hexToDesaturated(hex: string): string {
  const { h } = hexToHsl(hex);
  return `hsl(${h}, 25%, 88%)`;
}

/**
 * Normalizes a user-chosen hex color into an accent shade that stays visible
 * against both the light and dark card backgrounds: keeps the hue but clamps
 * lightness to a mid range so near-white/near-black picks can't vanish.
 */
export function hexToAccent(hex: string): string {
  const { h, s, l } = hexToHsl(hex);
  const clampedL = Math.min(0.62, Math.max(0.38, l));
  return `hsl(${h}, ${Math.round(s * 100)}%, ${Math.round(clampedL * 100)}%)`;
}

export function priorityLabel(priority: number): string {
  if (priority >= 100) return 'Urgent';
  if (priority >= 50) return 'High';
  if (priority >= 25) return 'Medium';
  return 'Low';
}

/**
 * The message to show for a rejected mutation. Apollo rejects with an Error
 * carrying the server's message ("Cannot delete a list that still contains
 * todos"), which is worth showing verbatim; anything else falls back.
 */
export function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

/** Formats a minute count as "1hr 30min" / "45min" / "2hr". */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}min`;
  if (mins === 0) return `${hours}hr`;
  return `${hours}hr ${mins}min`;
}
