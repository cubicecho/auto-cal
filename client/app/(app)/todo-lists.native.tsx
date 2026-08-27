import type {
  TodoList_TodoListListFragment,
  Todo_TodoListFragment,
} from '@/__generated__/graphql.js';
import { graphql } from '@/__generated__/index.js';
import { TODO_LIST_LIST_FRAGMENT } from '@/components/domain/todo-list/TodoListList';
import { TODO_LIST_FRAGMENT } from '@/components/domain/todo/TodoItem';
import { ActivityTypePicker } from '@/components/native/activity-type-picker';
import { confirmDestructive } from '@/components/native/confirm';
import { TextField } from '@/components/native/field';
import { FormModal } from '@/components/native/form-modal';
import { ListScreen } from '@/components/native/list-screen';
import { DERIVED, evictEntity, invalidate } from '@/lib/cache';
import { hexToDesaturated } from '@/lib/utils';
import { useMutation, useQuery } from '@apollo/client/react';
import { useMemo, useState } from 'react';
import { Pressable, Text, TouchableOpacity, View } from 'react-native';

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

function CreateListModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [activityTypeId, setActivityTypeId] = useState('');

  const [createList, { loading }] = useMutation(CREATE_TODO_LIST, {
    update: (cache) => invalidate(cache, 'myTodoLists'),
    onCompleted: onClose,
  });

  function handleSubmit() {
    // activityTypeId is required server-side (a uuid), which is why the picker
    // is not optional here — submitting without one fails validation.
    if (!name.trim() || !activityTypeId) return;
    createList({
      variables: {
        input: {
          name: name.trim(),
          description: description.trim() || undefined,
          activityTypeId,
          defaultPriority: 0,
          defaultEstimatedLength: 30,
        },
      },
    });
  }

  return (
    <FormModal
      title="New List"
      onClose={onClose}
      onSubmit={handleSubmit}
      submitDisabled={loading || !name.trim() || !activityTypeId}
      submitLabel={loading ? 'Creating…' : 'Create List'}
    >
      <TextField
        label="Name"
        placeholder="List name"
        value={name}
        onChangeText={setName}
        autoFocus
      />

      <TextField
        label="Description (optional)"
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
      />

      <ActivityTypePicker
        selectedId={activityTypeId}
        onSelect={setActivityTypeId}
      />
    </FormModal>
  );
}

// ─── Add Todo Modal ───────────────────────────────────────────────────────────

function AddTodoModal({ list, onClose }: { list: List; onClose: () => void }) {
  const [title, setTitle] = useState('');

  const [createTodo, { loading }] = useMutation(CREATE_TODO, {
    update: (cache) => invalidate(cache, 'myTodos', ...DERIVED),
    onCompleted: onClose,
  });

  function handleSubmit() {
    if (!title.trim()) return;
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
    <FormModal
      title="Add Todo"
      onClose={onClose}
      onSubmit={handleSubmit}
      submitDisabled={loading || !title.trim()}
      submitLabel={loading ? 'Adding…' : 'Add Todo'}
    >
      <Text className="text-sm text-muted-foreground mb-3">
        In: {list.name}
      </Text>

      <TextField
        placeholder="What needs to be done?"
        value={title}
        onChangeText={setTitle}
        autoFocus
      />
    </FormModal>
  );
}

// ─── Todo Row ─────────────────────────────────────────────────────────────────

function TodoRow({ todo }: { todo: Todo }) {
  const done = !!todo.completedAt;

  const [completeTodo] = useMutation(COMPLETE_TODO, {
    update: (cache) => invalidate(cache, ...DERIVED),
  });
  const [deleteTodo] = useMutation(DELETE_TODO, {
    update: (cache, _result, { variables }) => {
      if (variables) evictEntity(cache, 'Todo', variables.id);
      invalidate(cache, ...DERIVED);
    },
  });

  function handleDelete() {
    confirmDestructive({
      title: 'Delete todo?',
      message: `"${todo.title}" will be permanently deleted.`,
      onConfirm: () => deleteTodo({ variables: { id: todo.id } }),
    });
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

  const { data, loading } = useQuery(GET_TODO_LISTS_PAGE, {
    fetchPolicy: 'cache-and-network',
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

  return (
    <ListScreen
      items={data?.myTodoLists}
      loading={loading}
      newLabel="New List"
      onNew={() => setShowCreateList(true)}
      emptyLabel="No lists yet. Create one to get started."
      renderItem={(item) => (
        <ListCard
          list={item}
          todos={todosByListId.get(item.id) ?? []}
          onAddTodo={setAddingToList}
        />
      )}
    >
      {showCreateList && (
        <CreateListModal onClose={() => setShowCreateList(false)} />
      )}
      {addingToList && (
        <AddTodoModal
          list={addingToList}
          onClose={() => setAddingToList(null)}
        />
      )}
    </ListScreen>
  );
}
