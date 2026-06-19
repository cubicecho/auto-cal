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
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { formatDuration, hexToDesaturated, useIsDark } from '@/lib/utils';
import { useMutation } from '@apollo/client/react';
import { ListX, Pencil, Plus } from 'lucide-react';
import { type KeyboardEvent, useState } from 'react';
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

type TodoList = TodoList_TodoListListFragment;
type Todo = Todo_TodoListFragment;

type TodoListCardProps = {
  list: TodoList;
  todos: Todo[];
};

export function TodoListCard({ list, todos }: TodoListCardProps) {
  const [editingList, setEditingList] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [clearCompletedOpen, setClearCompletedOpen] = useState(false);

  const [createTodo, { loading: creating }] = useMutation(QUICK_CREATE_TODO, {
    refetchQueries: ['GetTodoListsPage'],
  });

  const [deleteTodos, { loading: clearing }] = useMutation(DELETE_TODOS, {
    refetchQueries: ['GetTodoListsPage'],
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

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      void handleQuickAdd();
    }
  }

  async function handleClearCompleted() {
    try {
      await deleteTodos({
        variables: { listId: list.id, completed: true },
      });
      setClearCompletedOpen(false);
    } catch (err) {
      // Keep the dialog open on failure so the user can retry.
      console.error('Failed to clear completed todos', err);
    }
  }

  const isDark = useIsDark();

  return (
    <>
      <Card
        className="flex flex-col"
        style={{
          backgroundColor: list.activityType
            ? hexToDesaturated(list.activityType.color, isDark)
            : undefined,
        }}
      >
        <CardHeader className="space-y-1 pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base truncate">{list.name}</CardTitle>
              {list.description && (
                <CardDescription className="line-clamp-2 text-xs">
                  {list.description}
                </CardDescription>
              )}
              {todos.length > 0 && (
                <p className="text-xs font-normal text-muted-foreground">
                  {formatDuration(remainingLength)}
                  <span className="opacity-60">
                    {' / '}
                    {formatDuration(totalLength)}
                  </span>
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setEditingList(true)}
                aria-label={`Edit ${list.name}`}
                className="h-7 w-7"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              {completedCount > 0 && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setClearCompletedOpen(true)}
                  aria-label={`Remove all completed todos from ${list.name}`}
                  title="Remove all completed"
                  className="h-7 w-7 hover:text-destructive"
                >
                  <ListX className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-2 pt-0">
          <div className="flex items-center gap-2">
            <Input
              value={newTitle}
              placeholder="Add a todo…"
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-8 text-sm"
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={handleQuickAdd}
              disabled={creating || newTitle.trim().length === 0}
              aria-label="Add todo"
              className="h-8 w-8 shrink-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {visibleTodos.length === 0 && completedCount === 0 && (
            <p className="py-2 text-center text-xs text-muted-foreground">
              No todos yet
            </p>
          )}

          <div className="space-y-1">
            {visibleTodos.map((todo) => (
              <TodoItem key={todo.id} todo={todo} onEdit={setEditingTodo} />
            ))}
          </div>

          {completedCount > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowCompleted((v) => !v)}
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

      <ConfirmDialog
        open={clearCompletedOpen}
        onOpenChange={setClearCompletedOpen}
        title="Remove all completed?"
        description={
          <>
            {completedCount} completed {completedCount === 1 ? 'todo' : 'todos'}{' '}
            in &ldquo;{list.name}
            &rdquo; will be permanently deleted.
          </>
        }
        confirmLabel="Remove all"
        loading={clearing}
        onConfirm={handleClearCompleted}
      />
    </>
  );
}
