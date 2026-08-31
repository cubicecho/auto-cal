/**
 * The native tabs: a row of `Pressable`s over a context holding the active
 * value, and content panes that render only when selected.
 *
 * The active value lives in this component rather than in props because the
 * contract is uncontrolled (see `tabs-base.ts`). Unselected panes unmount, as
 * they do under radix without `forceMount`.
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
import { createContext, useContext, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

type TabsState = { value: string; setValue: (value: string) => void };

const TabsContext = createContext<TabsState>({ value: '', setValue: () => {} });

function Tabs({ defaultValue, className, children }: TabsProps) {
  const [value, setValue] = useState(defaultValue);
  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <View className={cn(className)}>{children}</View>
    </TabsContext.Provider>
  );
}

function TabsList({ className, children }: TabsListProps) {
  return (
    <View className={cn('flex-row', TABS_LIST_CLASS, className)}>
      {children}
    </View>
  );
}

function TabsTrigger({ value, className, children }: TabsTriggerProps) {
  const tabs = useContext(TabsContext);
  const active = tabs.value === value;
  return (
    <Pressable
      role="tab"
      aria-selected={active}
      onPress={() => tabs.setValue(value)}
      className={cn(TABS_TRIGGER_CLASS, active && 'bg-background', className)}
    >
      {/* Text colour does not inherit on native, so the active/inactive split
          has to land on the `<Text>` rather than on the container. */}
      <Text
        className={cn(
          TABS_TRIGGER_TEXT_CLASS,
          active ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        {children}
      </Text>
    </Pressable>
  );
}

function TabsContent({ value, className, children }: TabsContentProps) {
  const tabs = useContext(TabsContext);
  if (tabs.value !== value) return null;
  return <View className={cn('mt-2', className)}>{children}</View>;
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
