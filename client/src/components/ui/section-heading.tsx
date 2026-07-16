import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type SectionHeadingProps = {
  /** `overline` is the smaller uppercase label; `default` is a plain section label. */
  variant?: 'default' | 'overline';
  className?: string;
  children: ReactNode;
};

// A small muted heading above a section of content.
export function SectionHeading({
  variant = 'default',
  className,
  children,
}: SectionHeadingProps) {
  return (
    <p
      className={cn(
        'font-semibold text-muted-foreground',
        variant === 'overline' ? 'text-xs uppercase tracking-wide' : 'text-sm',
        className,
      )}
    >
      {children}
    </p>
  );
}
