/**
 * The contract `tabs.tsx` (native) and `tabs.web.tsx` (radix) both implement.
 * Its own module because Metro resolves `./tabs` to `tabs.web.tsx` on web.
 *
 * Uncontrolled only — `defaultValue` and nothing else. The single caller
 * (`ProjectNotesEditor`) never reads or sets the active tab from outside.
 */
import type { ReactNode } from 'react';

export type TabsProps = {
  defaultValue: string;
  className?: string | undefined;
  children: ReactNode;
};

export type TabsListProps = {
  className?: string | undefined;
  children: ReactNode;
};

export type TabsTriggerProps = {
  value: string;
  className?: string | undefined;
  children: ReactNode;
};

export type TabsContentProps = {
  value: string;
  className?: string | undefined;
  children: ReactNode;
};

export const TABS_LIST_CLASS =
  'h-10 items-center justify-center rounded-md bg-muted p-1';
export const TABS_TRIGGER_CLASS =
  'items-center justify-center rounded-sm px-3 py-1.5';
export const TABS_TRIGGER_TEXT_CLASS = 'text-sm font-medium';
