import { cn } from '@/lib/utils';
import { Text, View } from 'react-native';

// Project lifecycle status pill (active | completed | archived). Kept in one
// place so ProjectCard and ProjectDetail can't drift apart.
//
// The pill splits into a container class and a text class: native does not
// inherit colour, so the `text-*` half has to sit on the `<Text>` itself.
const STATUS_STYLES: Record<string, string> = {
  active: 'bg-primary/10',
  completed: 'bg-green-500/10',
  archived: 'bg-muted',
};

const STATUS_TEXT_STYLES: Record<string, string> = {
  active: 'text-primary',
  completed: 'text-green-600',
  archived: 'text-muted-foreground',
};

export function StatusChip({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <View
      className={cn(
        'self-start rounded-full px-2 py-0.5',
        STATUS_STYLES[status] ?? STATUS_STYLES.active,
        className,
      )}
    >
      <Text
        className={cn(
          'text-[11px] font-medium capitalize',
          STATUS_TEXT_STYLES[status] ?? STATUS_TEXT_STYLES.active,
        )}
      >
        {status}
      </Text>
    </View>
  );
}
