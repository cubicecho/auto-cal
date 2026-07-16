import { cn } from '@/lib/utils';

// Shared class for a pill in a segmented control / nav (active vs inactive).
// Used by the app-shell nav links and the stats date-range selector, which
// render as an expo-router <Link> and a <button> respectively — hence a class
// helper rather than a component.
export function segmentedItemClass(active: boolean, className?: string) {
  return cn(
    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
    active
      ? 'bg-primary text-primary-foreground'
      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
    className,
  );
}
