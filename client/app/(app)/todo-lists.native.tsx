import type {
  TodoList_TodoListListFragment,
  Todo_TodoListFragment,
} from '@/__generated__/graphql.js';
import { graphql } from '@/__generated__/index.js';
import { TODO_LIST_LIST_FRAGMENT } from '@/components/domain/todo-list/TodoListList';
import { TODO_LIST_FRAGMENT } from '@/components/domain/todo/TodoItem';
import { useTodoListsUpdated } from '@/hooks/useTodoListsUpdated';
import { useTodosUpdated } from '@/hooks/useTodosUpdated';
import { hexToDesaturated } from '@/lib/utils';
import { useMutation, useQuery } from '@apollo/client/react';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// ─── GraphQL ─────────────────────────────────────────────────────────────────

const GET_TODO_LISTS_PAGE = graphql(`
  query GetTodoListsPageNative {
    myTodoLists {
      ...TodoList_TodoListList
    }
    myTodos {
      ...Todo_TodoList
    }
  }
`);

// Re-register fragments so codegen links them
const _tll = TODO_LIST_LIST_FRAGMENT;
const _tl = TODO_LIST_FRAGMENT;

const CREATE_TODO_LIST = graphql(`
  mutation CreateTodoListNative($input: CreateTodoListArgs!) {
    myCreateTodoList(input: $input) {
      ...TodoList_TodoListList
    }
  }
`);

const CREATE_TODO = graphql(`
  mutation CreateTodoNative($input: CreateTodoArgs!) {
    myCreateTodo(input: $input) {
      ...Todo_TodoList
    }
  }
`);

const COMPLETE_TODO = graphql(`
  mutation CompleteTodoNative($id: ID!) {
    myCompleteTodo(id: $id) {
      id
      completedAt
    }
  }
`);

const DELETE_TODO = graphql(`
  mutation DeleteTodoNative($id: ID!) {
    myDeleteTodo(id: $id)
  }
`);

// ─── Types ────────────────────────────────────────────────────────────────────

type List = TodoList_TodoListListFragment;
type Todo = Todo_TodoListFragment;

// ─── Create List Modal ────────────────────────────────────────────────────────

function CreateListModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const [createList, { loading }] = useMutation(CREATE_TODO_LIST, {
    refetchQueries: ['GetTodoListsPageNative'],
    onCompleted: () => {
      setName('');
      setDescription('');
      onClose();
    },
  });

  function handleSubmit() {
    if (!name.trim()) return;
    createList({
      variables: {
        input: {
          name: name.trim(),
          description: description.trim() || undefined,
          activityTypeId: '',
          defaultPriority: 0,
          defaultEstimatedLength: 30,
        },
      },
    });
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-background p-6">
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-xl font-bold text-foreground">New List</Text>
          <TouchableOpacity onPress={onClose}>
            <Text className="text-primary text-base">Cancel</Text>
          </TouchableOpacity>
        </View>

        <Text className="text-sm font-medium text-foreground mb-1">Name</Text>
        <TextInput
          className="border border-border rounded-lg px-3 py-2 mb-4 text-foreground bg-card"
          placeholder="List name"
          placeholderTextColor="#9ca3af"
          value={name}
          onChangeText={setName}
          autoFocus
        />

        <Text className="text-sm font-medium text-foreground mb-1">
          Description (optional)
        </Text>
        <TextInput
          className="border border-border rounded-lg px-3 py-2 mb-6 text-foreground bg-card"
          placeholder="Description"
          placeholderTextColor="#9ca3af"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />

        <TouchableOpacity
          className="bg-primary rounded-lg py-3 items-center"
          onPress={handleSubmit}
          disabled={loading || !name.trim()}
        >
          <Text className="text-primary-foreground font-semibold">
            {loading ? 'Creating…' : 'Create List'}
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// ─── Add Todo Modal ───────────────────────────────────────────────────────────

function AddTodoModal({
  list,
  onClose,
}: {
  list: List | null;
  onClose: () => void;
}) {
  const [title, setTitle] = useState('');

  const [createTodo, { loading }] = useMutation(CREATE_TODO, {
    refetchQueries: ['GetTodoListsPageNative'],
    onCompleted: () => {
      setTitle('');
      onClose();
    },
  });

  if (!list) return null;

  function handleSubmit() {
    if (!title.trim() || !list) return;
    createTodo({
      variables: {
        input: {
          listId: list.id,
          title: title.trim(),
          priority: list.defaultPriority,
          estimatedLength: list.defaultEstimatedLength || 30,
        },
      },
    });
  }

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-background p-6">
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-xl font-bold text-foreground">Add Todo</Text>
          <TouchableOpacity onPress={onClose}>
            <Text className="text-primary text-base">Cancel</Text>
          </TouchableOpacity>
        </View>
        <Text className="text-sm text-muted-foreground mb-3">
          In: {list.name}
        </Text>

        <TextInput
          className="border border-border rounded-lg px-3 py-2 mb-6 text-foreground bg-card"
          placeholder="What needs to be done?"
          placeholderTextColor="#9ca3af"
          value={title}
          onChangeText={setTitle}
          autoFocus
        />

        <TouchableOpacity
          className="bg-primary rounded-lg py-3 items-center"
          onPress={handleSubmit}
          disabled={loading || !title.trim()}
        >
          <Text className="text-primary-foreground font-semibold">
            {loading ? 'Adding…' : 'Add Todo'}
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// ─── Todo Row ─────────────────────────────────────────────────────────────────

function TodoRow({ todo }: { todo: Todo }) {
  const done = !!todo.completedAt;

  const [completeTodo] = useMutation(COMPLETE_TODO, {
    refetchQueries: ['GetTodoListsPageNative'],
  });
  const [deleteTodo] = useMutation(DELETE_TODO, {
    refetchQueries: ['GetTodoListsPageNative'],
  });

  function handleDelete() {
    Alert.alert(
      'Delete todo?',
      `"${todo.title}" will be permanently deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteTodo({ variables: { id: todo.id } }),
        },
      ],
    );
  }

  return (
    <View className="flex-row items-center gap-3 py-2 px-1">
      <TouchableOpacity
        onPress={() => !done && completeTodo({ variables: { id: todo.id } })}
        className={`h-5 w-5 rounded-full border-2 items-center justify-center ${done ? 'border-primary bg-primary' : 'border-border'}`}
      >
        {done && <Text className="text-primary-foreground text-xs">✓</Text>}
      </TouchableOpacity>
      <Text
        className={`flex-1 text-sm ${done ? 'line-through text-muted-foreground' : 'text-foreground'}`}
      >
        {todo.title}
      </Text>
      <TouchableOpacity onPress={handleDelete} className="px-2 py-1">
        <Text className="text-muted-foreground text-xs">✕</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── List Card ────────────────────────────────────────────────────────────────

function ListCard({
  list,
  todos,
  onAddTodo,
}: {
  list: List;
  todos: Todo[];
  onAddTodo: (list: List) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const pending = todos.filter((t) => !t.completedAt);
  const done = todos.filter((t) => t.completedAt);

  return (
    <View
      className="rounded-xl border border-border mb-3 overflow-hidden"
      style={{
        backgroundColor: list.activityType
          ? hexToDesaturated(list.activityType.color)
          : undefined,
      }}
    >
      <Pressable
        className="flex-row items-center justify-between px-4 py-3"
        onPress={() => setExpanded((v) => !v)}
      >
        <View className="flex-1">
          <Text className="font-semibold text-base text-foreground">
            {list.name}
          </Text>
          {list.activityType && (
            <Text className="text-xs text-muted-foreground">
              {list.activityType.name}
            </Text>
          )}
        </View>
        <View className="flex-row items-center gap-3">
          <Text className="text-xs text-muted-foreground">
            {pending.length} pending
          </Text>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation?.();
              onAddTodo(list);
            }}
            className="bg-primary rounded-full h-7 w-7 items-center justify-center"
          >
            <Text className="text-primary-foreground text-lg leading-none">
              +
            </Text>
          </TouchableOpacity>
        </View>
      </Pressable>

      {expanded && (
        <View className="px-4 pb-3 border-t border-border/40">
          {todos.length === 0 ? (
            <Text className="text-sm text-muted-foreground py-2">
              No todos yet
            </Text>
          ) : (
            <>
              {pending.map((t) => (
                <TodoRow key={t.id} todo={t} />
              ))}
              {done.length > 0 && (
                <Text className="text-xs text-muted-foreground mt-2 mb-1">
                  {done.length} completed
                </Text>
              )}
              {done.map((t) => (
                <TodoRow key={t.id} todo={t} />
              ))}
            </>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function TodoListsScreen() {
  const [showCreateList, setShowCreateList] = useState(false);
  const [addingToList, setAddingToList] = useState<List | null>(null);

  const { data, loading, refetch } = useQuery(GET_TODO_LISTS_PAGE, {
    fetchPolicy: 'cache-and-network',
  });
  // The typed todo/todo-list streams patch the web query by name; the native
  // query is separate, so just refetch it when either entity changes anywhere.
  useTodosUpdated(() => {
    refetch();
  });
  useTodoListsUpdated(() => {
    refetch();
  });

  const todosByListId = useMemo(() => {
    const map = new Map<string, Todo[]>();
    for (const todo of data?.myTodos ?? []) {
      if (!todo.list?.id) continue;
      const bucket = map.get(todo.list.id) ?? [];
      bucket.push(todo);
      map.set(todo.list.id, bucket);
    }
    return map;
  }, [data?.myTodos]);

  const lists = data?.myTodoLists ?? [];

  return (
    <View className="flex-1 bg-background">
      {loading && !data && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      )}

      <FlatList
        data={lists}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4 py-4"
        ListHeaderComponent={
          <TouchableOpacity
            className="bg-primary rounded-xl py-3 items-center mb-4"
            onPress={() => setShowCreateList(true)}
          >
            <Text className="text-primary-foreground font-semibold">
              + New List
            </Text>
          </TouchableOpacity>
        }
        ListEmptyComponent={
          !loading ? (
            <Text className="text-center text-muted-foreground mt-8">
              No lists yet. Create one to get started.
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <ListCard
            list={item}
            todos={todosByListId.get(item.id) ?? []}
            onAddTodo={setAddingToList}
          />
        )}
      />

      <CreateListModal
        visible={showCreateList}
        onClose={() => setShowCreateList(false)}
      />
      <AddTodoModal list={addingToList} onClose={() => setAddingToList(null)} />
    </View>
  );
}
