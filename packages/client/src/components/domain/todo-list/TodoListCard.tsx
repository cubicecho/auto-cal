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
import { Input } from '@/components/ui/input';
import { useMutation } from '@apollo/client/react';
import { Pencil, Plus } from 'lucide-react';
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

  const [createTodo, { loading: creating }] = useMutation(QUICK_CREATE_TODO, {
    refetchQueries: ['GetTodoListsPage'],
  });

  const visibleTodos = showCompleted
    ? todos
    : todos.filter((t) => t.completedAt === null);
  const completedCount = todos.filter((t) => t.completedAt !== null).length;

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

  return (
    <>
      <Card className="flex flex-col">
        <CardHeader className="space-y-1 pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <CardTitle className="flex items-center gap-2 text-base">
                {list.activityType && (
                  <span
                    className="inline-block h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: list.activityType.color }}
                  />
                )}
                <span className="truncate">{list.name}</span>
              </CardTitle>
              {list.description && (
                <CardDescription className="line-clamp-2 text-xs">
                  {list.description}
                </CardDescription>
              )}
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setEditingList(true)}
              aria-label={`Edit ${list.name}`}
              className="h-7 w-7 shrink-0"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
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
    </>
  );
}
