import type {
  TodoList_TodoListListFragment,
  Todo_TodoListFragment,
} from '@/__generated__/graphql.js';
import { graphql } from '@/__generated__/index.js';
import { TodoForm } from '@/components/domain/todo/TodoForm';
import { TodoItem } from '@/components/domain/todo/TodoItem';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useConfirm } from '@/components/ui/confirm';
import {
  Check,
  FolderKanban,
  ListChecks,
  ListX,
  Pencil,
  Plus,
  Trash2,
} from '@/components/ui/icons';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { DERIVED, evictEntity, invalidate } from '@/lib/cache';
import { cn, errorMessage, formatDuration } from '@/lib/utils';
import { useMutation } from '@apollo/client/react';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { TodoListForm } from './TodoListForm';

const QUICK_CREATE_TODO = graphql(`
  mutation QuickCreateTodo($input: CreateTodoArgs!) {
    myCreateTodo(input: $input) {
      id
      title
    }
  }
`);

const DELETE_TODOS = graphql(`
  mutation DeleteTodos($listId: ID!, $completed: Boolean) {
    myDeleteTodos(listId: $listId, completed: $completed) {
      id
    }
  }
`);

// One mutation for the whole selection rather than N `myCompleteTodo` calls:
// each of those fires its own scheduler writeback, and N writebacks for one
// user race each other over the same `scheduledAt` columns.
const COMPLETE_SELECTED = graphql(`
  mutation CompleteSelectedTodos($ids: [ID!]!) {
    myCompleteTodos(ids: $ids) {
      id
      completedAt
      scheduledAt
    }
  }
`);

const DELETE_SELECTED = graphql(`
  mutation DeleteSelectedTodos($ids: [ID!]!) {
    myDeleteTodosById(ids: $ids) {
      id
    }
  }
`);

type TodoList = TodoList_TodoListListFragment;
type Todo = Todo_TodoListFragment;

type TodoListCardProps = {
  list: TodoList;
  todos: Todo[];
};

export function TodoListCard({ list, todos }: TodoListCardProps) {
  const confirm = useConfirm();
  const toast = useToast();
  const [editingList, setEditingList] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  // `null` is "not selecting"; an empty set is selection mode with nothing
  // picked, which still has to show the toolbar so there is a way back out.
  const [selectedIds, setSelectedIds] = useState<Set<string> | null>(null);

  const [createTodo, { loading: creating }] = useMutation(QUICK_CREATE_TODO, {
    update: (cache) => invalidate(cache, 'myTodos', ...DERIVED),
  });

  const [completeSelected, { loading: completingSelected }] = useMutation(
    COMPLETE_SELECTED,
    {
      // The mutation returns every row it touched, so the lists rendering them
      // patch themselves; only membership and the derived views move.
      update: (cache) => invalidate(cache, 'myTodos', ...DERIVED),
    },
  );

  const [deleteSelected, { loading: deletingSelected }] = useMutation(
    DELETE_SELECTED,
    {
      update: (cache, { data }) => {
        for (const todo of data?.myDeleteTodosById ?? [])
          evictEntity(cache, 'Todo', todo.id);
        invalidate(cache, 'myTodos', ...DERIVED);
      },
    },
  );

  const [deleteTodos] = useMutation(DELETE_TODOS, {
    // Returns the rows it deleted, so each one can be evicted by id rather
    // than re-fetching every list that might have held them.
    update: (cache, { data }) => {
      for (const todo of data?.myDeleteTodos ?? [])
        evictEntity(cache, 'Todo', todo.id);
      invalidate(cache, 'myTodos', ...DERIVED);
    },
  });

  const visibleTodos = showCompleted
    ? todos
    : todos.filter((t) => t.completedAt === null);
  // Single pass over todos: completed count plus total and remaining length.
  let completedCount = 0;
  let totalLength = 0;
  let remainingLength = 0;
  for (const t of todos) {
    totalLength += t.estimatedLength;
    if (t.completedAt !== null) completedCount += 1;
    else remainingLength += t.estimatedLength;
  }

  const selectionCount = selectedIds?.size ?? 0;
  const busy = completingSelected || deletingSelected;

  function toggleSelected(todo: Todo) {
    setSelectedIds((prev) => {
      const next = new Set(prev ?? []);
      if (next.has(todo.id)) next.delete(todo.id);
      else next.add(todo.id);
      return next;
    });
  }

  async function handleCompleteSelected() {
    if (!selectedIds?.size) return;
    try {
      await completeSelected({ variables: { ids: [...selectedIds] } });
      setSelectedIds(null);
    } catch (err) {
      toast(errorMessage(err, 'Could not complete the selected todos'));
    }
  }

  async function handleDeleteSelected() {
    if (!selectedIds?.size) return;
    const count = selectedIds.size;
    const ok = await confirm({
      title: `Delete ${count} ${count === 1 ? 'todo' : 'todos'}?`,
      description: 'The selected todos will be permanently deleted.',
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    try {
      await deleteSelected({ variables: { ids: [...selectedIds] } });
      setSelectedIds(null);
    } catch (err) {
      toast(errorMessage(err, 'Could not delete the selected todos'));
    }
  }

  async function handleQuickAdd() {
    const title = newTitle.trim();
    if (!title) return;
    await createTodo({
      variables: {
        input: {
          listId: list.id,
          title,
          priority: list.defaultPriority,
          estimatedLength: list.defaultEstimatedLength || 30,
        },
      },
    });
    setNewTitle('');
  }

  async function handleClearCompleted() {
    const ok = await confirm({
      title: 'Remove all completed?',
      description: `${completedCount} completed ${
        completedCount === 1 ? 'todo' : 'todos'
      } in “${list.name}” will be permanently deleted.`,
      confirmLabel: 'Remove all',
    });
    if (!ok) return;
    try {
      await deleteTodos({ variables: { listId: list.id, completed: true } });
    } catch (err) {
      toast(errorMessage(err, 'Could not remove the completed todos'));
    }
  }

  return (
    <>
      <Card
        className="flex-col"
        accentColor={list.activityType?.color}
        accentLabel={list.activityType?.name}
      >
        <CardHeader className="gap-1 pb-3">
          <View className="flex-row items-start justify-between gap-2">
            <View className="min-w-0 flex-1">
              <CardTitle className="truncate text-base">{list.name}</CardTitle>
              {list.project && (
                <View className="mt-0.5 flex-row items-center gap-1 self-start rounded-full bg-muted px-2 py-0.5">
                  <FolderKanban className="h-3 w-3 text-muted-foreground" />
                  <Text className="text-[11px] font-medium text-muted-foreground">
                    {list.project.name}
                  </Text>
                </View>
              )}
              {list.description && (
                <CardDescription className="line-clamp-2 text-xs">
                  {list.description}
                </CardDescription>
              )}
              {todos.length > 0 && (
                <Text className="text-xs font-normal text-muted-foreground">
                  {formatDuration(remainingLength)}
                  <Text className="opacity-60">
                    {' / '}
                    {formatDuration(totalLength)}
                  </Text>
                </Text>
              )}
            </View>
            <View className="flex-row shrink-0 items-center gap-1">
              {visibleTodos.length > 1 && (
                <Button
                  size="icon"
                  variant="ghost"
                  onPress={() =>
                    setSelectedIds((prev) => (prev === null ? new Set() : null))
                  }
                  aria-label={
                    selectedIds === null
                      ? `Select todos in ${list.name}`
                      : 'Cancel selection'
                  }
                  className={cn(
                    'h-7 w-7',
                    selectedIds !== null && 'bg-muted text-foreground',
                  )}
                >
                  <ListChecks className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                onPress={() => setEditingList(true)}
                aria-label={`Edit ${list.name}`}
                className="h-7 w-7"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              {completedCount > 0 && (
                <Button
                  size="icon"
                  variant="ghost"
                  onPress={() => void handleClearCompleted()}
                  aria-label={`Remove all completed todos from ${list.name}`}
                  className="h-7 w-7 hover:text-destructive"
                >
                  <ListX className="h-3.5 w-3.5" />
                </Button>
              )}
            </View>
          </View>
        </CardHeader>

        <CardContent className="flex-1 flex-col gap-2 pt-0">
          {selectedIds === null ? (
            <View className="flex-row items-center gap-2">
              <Input
                value={newTitle}
                placeholder="Add a todo…"
                onChangeText={setNewTitle}
                onSubmitEditing={() => {
                  void handleQuickAdd();
                }}
                className="h-8 flex-1 text-sm"
              />
              <Button
                size="icon"
                variant="ghost"
                onPress={handleQuickAdd}
                disabled={creating || newTitle.trim().length === 0}
                aria-label="Add todo"
                className="h-8 w-8 shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </View>
          ) : (
            <View className="flex-row flex-wrap items-center gap-2 rounded-md bg-muted px-2 py-1.5">
              <Text className="text-xs font-medium text-muted-foreground">
                {selectionCount} selected
              </Text>
              <Button
                size="sm"
                variant="ghost"
                onPress={() =>
                  setSelectedIds(
                    selectionCount === visibleTodos.length
                      ? new Set()
                      : new Set(visibleTodos.map((t) => t.id)),
                  )
                }
                className="h-7 px-2 text-xs"
              >
                {selectionCount === visibleTodos.length
                  ? 'Clear'
                  : 'Select all'}
              </Button>
              <View className="flex-1" />
              <Button
                size="sm"
                variant="outline"
                disabled={selectionCount === 0 || busy}
                onPress={() => void handleCompleteSelected()}
                className="h-7 px-2 text-xs"
              >
                <Check className="mr-1 h-3.5 w-3.5" />
                Complete
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={selectionCount === 0 || busy}
                onPress={() => void handleDeleteSelected()}
                className="h-7 px-2 text-xs hover:text-destructive"
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                Delete
              </Button>
            </View>
          )}

          {visibleTodos.length === 0 && completedCount === 0 && (
            <Text className="py-2 text-center text-xs text-muted-foreground">
              No todos yet
            </Text>
          )}

          <View className="gap-1">
            {visibleTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onEdit={setEditingTodo}
                selection={
                  selectedIds === null
                    ? undefined
                    : {
                        selected: selectedIds.has(todo.id),
                        onToggle: toggleSelected,
                      }
                }
              />
            ))}
          </View>

          {completedCount > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onPress={() => setShowCompleted((v) => !v)}
              className="mt-1 h-7 self-start px-2 text-xs text-muted-foreground"
            >
              {showCompleted
                ? `Hide completed (${completedCount})`
                : `Show completed (${completedCount})`}
            </Button>
          )}
        </CardContent>
      </Card>

      <TodoListForm
        {...(editingList ? { list } : {})}
        open={editingList}
        onOpenChange={setEditingList}
      />

      <TodoForm
        {...(editingTodo ? { todo: editingTodo } : {})}
        open={editingTodo !== null}
        onOpenChange={(open) => !open && setEditingTodo(null)}
      />
    </>
  );
}
