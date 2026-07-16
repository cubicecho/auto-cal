import { Page } from '@/components/ui/page';
import type { ReactNode } from 'react';

type DetailPageProps<T> = {
  /** The loaded entity, or null/undefined while loading or when missing. */
  entity: T | null | undefined;
  loading?: boolean;
  /** Shown when the entity is absent and not loading. */
  notFoundLabel: string;
  className?: string;
  /** Rendered only once the entity is present, so it is non-null inside. */
  children: (entity: T) => ReactNode;
};

// The <Page> shell + loading/not-found guard shared by the detail routes.
export function DetailPage<T>({
  entity,
  loading,
  notFoundLabel,
  className,
  children,
}: DetailPageProps<T>) {
  return (
    <Page {...(className ? { className } : {})}>
      {entity ? (
        children(entity)
      ) : (
        <p className="text-muted-foreground">
          {loading ? 'Loading…' : notFoundLabel}
        </p>
      )}
    </Page>
  );
}
