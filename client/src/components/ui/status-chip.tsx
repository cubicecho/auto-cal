import { cn } from '@/lib/utils';

// Project lifecycle status pill (active | completed | archived). Kept in one
// place so ProjectCard and ProjectDetail can't drift apart.
const STATUS_STYLES: Record<string, string> = {
  active: 'bg-primary/10 text-primary',
  completed: 'bg-green-500/10 text-green-600',
  archived: 'bg-muted text-muted-foreground',
};

export function StatusChip({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-[11px] font-medium capitalize',
        STATUS_STYLES[status] ?? STATUS_STYLES.active,
        className,
      )}
    >
      {status}
    </span>
  );
}
