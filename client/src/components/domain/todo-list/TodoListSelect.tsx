import { graphql } from '@/__generated__/index.js';
import { ColorDot } from '@/components/ui/color-dot';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery } from '@apollo/client/react';
import { Link } from 'expo-router';
import { Text, View } from 'react-native';

const GET_TODO_LISTS = graphql(`
  query GetTodoListsForSelect {
    myTodoLists {
      id
      name
      defaultPriority
      defaultEstimatedLength
      activityType {
        id
        name
        color
      }
    }
  }
`);

export type TodoListForSelect = {
  id: string;
  name: string;
  defaultPriority: number;
  defaultEstimatedLength: number;
  activityType: { id: string; name: string; color: string } | null;
};

interface TodoListSelectProps {
  value: string | undefined;
  onValueChange: (value: string | undefined, list?: TodoListForSelect) => void;
  onBlur?: () => void;
}

export function TodoListSelect({
  value,
  onValueChange,
  onBlur,
}: TodoListSelectProps) {
  const { data } = useQuery(GET_TODO_LISTS);

  const lists = (data?.myTodoLists ?? []) as TodoListForSelect[];

  if (lists.length === 0) {
    return (
      <Text className="text-sm text-muted-foreground">
        No todo lists yet —{' '}
        <Link href="/todo-lists" className="underline text-primary">
          create one first
        </Link>
        .
      </Text>
    );
  }

  return (
    <Select
      value={value ?? ''}
      onValueChange={(v) => {
        const list = lists.find((l) => l.id === v);
        onValueChange(v, list);
      }}
    >
      <SelectTrigger onBlur={onBlur}>
        <SelectValue placeholder="Select a list">
          {value
            ? (() => {
                const l = lists.find((x) => x.id === value);
                if (!l) return 'Select a list';
                return (
                  <View className="flex-row items-center gap-2">
                    {l.activityType ? (
                      <ColorDot color={l.activityType.color} />
                    ) : null}
                    <Text className="text-sm text-foreground">{l.name}</Text>
                  </View>
                );
              })()
            : 'Select a list'}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {lists.map((l) => (
          <SelectItem key={l.id} value={l.id}>
            <View className="flex-row items-center gap-2">
              {l.activityType ? (
                <ColorDot color={l.activityType.color} />
              ) : null}
              <Text className="text-sm text-foreground">{l.name}</Text>
            </View>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
