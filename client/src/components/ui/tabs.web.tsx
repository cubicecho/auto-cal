/**
 * The web tabs: radix. `tabs.tsx` is the native counterpart and `tabs-base.ts`
 * holds the contract they share.
 */
import {
  TABS_LIST_CLASS,
  TABS_TRIGGER_CLASS,
  TABS_TRIGGER_TEXT_CLASS,
  type TabsContentProps,
  type TabsListProps,
  type TabsProps,
  type TabsTriggerProps,
} from '@/components/ui/tabs-base';
import { cn } from '@/lib/utils';
import * as TabsPrimitive from '@radix-ui/react-tabs';

function Tabs({ defaultValue, className, children }: TabsProps) {
  return (
    <TabsPrimitive.Root defaultValue={defaultValue} className={cn(className)}>
      {children}
    </TabsPrimitive.Root>
  );
}

function TabsList({ className, children }: TabsListProps) {
  return (
    <TabsPrimitive.List
      className={cn(
        'inline-flex text-muted-foreground',
        TABS_LIST_CLASS,
        className,
      )}
    >
      {children}
    </TabsPrimitive.List>
  );
}

function TabsTrigger({ value, className, children }: TabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      value={value}
      className={cn(
        'inline-flex whitespace-nowrap ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
        TABS_TRIGGER_CLASS,
        TABS_TRIGGER_TEXT_CLASS,
        className,
      )}
    >
      {children}
    </TabsPrimitive.Trigger>
  );
}

function TabsContent({ value, className, children }: TabsContentProps) {
  return (
    <TabsPrimitive.Content
      value={value}
      className={cn(
        'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className,
      )}
    >
      {children}
    </TabsPrimitive.Content>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
