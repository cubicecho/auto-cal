import { Button } from '@/components/ui/button';
import { ColorDot } from '@/components/ui/color-dot';
import { ArrowLeft, Pencil } from 'lucide-react';
import type { ReactNode } from 'react';

// The outline "Edit" action shared by the detail views' header.
export function EditButton({
  onClick,
  label = 'Edit',
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <Button variant="outline" size="sm" onPress={onClick}>
      <Pencil className="mr-1.5 h-3.5 w-3.5" />
      {label}
    </Button>
  );
}

type DetailHeaderProps = {
  onBack: () => void;
  backLabel: string;
  /** Activity-type color for the leading dot; omit to hide the dot. */
  color?: string | null | undefined;
  colorLabel?: string | undefined;
  title: string;
  /** Small muted line under the title (description, activity type, etc.). */
  subtitle?: ReactNode;
  /** Rendered next to the title, e.g. a StatusChip. */
  badge?: ReactNode;
  /** Trailing actions (Edit / Archive / …). */
  actions?: ReactNode;
};

// The back-button + color dot + title + badge + subtitle + actions row shared
// by the habit and project detail views.
export function DetailHeader({
  onBack,
  backLabel,
  color,
  colorLabel,
  title,
  subtitle,
  badge,
  actions,
}: DetailHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <Button
        variant="ghost"
        size="icon"
        onPress={onBack}
        aria-label={backLabel}
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          {color ? (
            <ColorDot
              color={color}
              {...(colorLabel ? { title: colorLabel } : {})}
            />
          ) : null}
          <h2 className="text-2xl font-bold">{title}</h2>
          {badge}
        </div>
        {subtitle ? (
          <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {actions}
    </div>
  );
}
