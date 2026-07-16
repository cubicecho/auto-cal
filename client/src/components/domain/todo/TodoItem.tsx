import type { Todo_TodoListFragment } from '@/__generated__/graphql.js';
import { graphql } from '@/__generated__/index.js';
import {
  CompletionDialog,
  type CompletionDialogTarget,
} from '@/components/domain/CompletionDialog';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { InlineLengthEdit } from '@/components/ui/inline-length-edit';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { priorityLabel } from '@/lib/utils';
import { useMutation } from '@apollo/client/react';
import { Link } from 'expo-router';
import { AlertTriangle, Check, Pencil, Trash2, Undo2 } from 'lucide-react';
import { useState } from 'react';

// Colocated here so /todo-lists doesn't depend on a deleted parent list component.
export const TODO_LIST_FRAGMENT = graphql(`
  fragment Todo_TodoList on Todo {
    id
    title
    description
    priority
    estimatedLength
    list {
      id
      name
    }
    activityType {
      id
      name
      color
    }
    dueAt
    scheduledAt
    completedAt
    createdAt
  }
`);

const UPDATE_TODO_LENGTH = graphql(`
  mutation UpdateTodoEstimatedLength($input: UpdateTodoArgs!) {
    myUpdateTodo(input: $input) {
      id
      estimatedLength
    }
  }
`);

const UNCOMPLETE_TODO = graphql(`
  mutation UncompleteTodo($id: ID!) {
    myUpdateTodo(input: { id: $id, completedAt: null }) {
      id
      completedAt
    }
  }
`);

const DELETE_TODO = graphql(`
  mutation DeleteTodo($id: ID!) {
    myDeleteTodo(id: $id)
  }
`);

type Todo = Todo_TodoListFragment;

type TodoItemProps = {
  todo: Todo;
  onEdit: (todo: Todo) => void;
};

export function TodoItem({ todo, onEdit }: TodoItemProps) {
  const isCompleted = todo.completedAt !== null;
  const [completionTarget, setCompletionTarget] =
    useState<CompletionDialogTarget | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [uncompleteTodo, { loading: uncompleting }] = useMutation(
    UNCOMPLETE_TODO,
    { refetchQueries: ['GetTodoListsPage', 'GetProjectDetail'] },
  );

  const [updateTodo, { loading: updatingLength }] = useMutation(
    UPDATE_TODO_LENGTH,
    { refetchQueries: ['GetTodoListsPage', 'GetProjectDetail'] },
  );

  const [deleteTodo, { loading: deleting }] = useMutation(DELETE_TODO, {
    refetchQueries: ['GetTodoListsPage', 'GetProjectDetail'],
  });

  function handleSaveLength(estimatedLength: number) {
    updateTodo({ variables: { input: { id: todo.id, estimatedLength } } });
  }

  return (
    <div
      className={`group flex items-start gap-2 rounded-md border bg-card px-2 py-1.5 text-sm hover:bg-muted/40 ${
        isCompleted ? 'opacity-60' : ''
      }`}
    >
      {!isCompleted ? (
        <Button
          size="icon"
          variant="ghost"
          onClick={() =>
            setCompletionTarget({
              kind: 'todo',
              id: todo.id,
              title: todo.title,
            })
          }
          aria-label={`Mark ${todo.title} as complete`}
          className="h-6 w-6 shrink-0 text-muted-foreground hover:text-green-600"
        >
          <Check className="h-3.5 w-3.5" />
        </Button>
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              disabled={uncompleting}
              onClick={() => uncompleteTodo({ variables: { id: todo.id } })}
              aria-label={`Mark ${todo.title} as incomplete`}
              className="h-6 w-6 shrink-0 text-muted-foreground hover:text-amber-600"
            >
              <Undo2 className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Mark as incomplete</TooltipContent>
        </Tooltip>
      )}

      <div className="min-w-0 flex-1">
        <div
          className={`truncate font-medium ${
            isCompleted ? 'line-through text-muted-foreground' : ''
          }`}
        >
          {todo.title}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          <InlineLengthEdit
            value={todo.estimatedLength}
            saving={updatingLength}
            onSave={handleSaveLength}
          />
          <span>·</span>
          <span>{priorityLabel(todo.priority)}</span>
          {todo.dueAt ? (
            <span className="text-amber-700">
              · Due {new Date(todo.dueAt as string).toLocaleDateString()}
            </span>
          ) : null}
          {!isCompleted && !todo.scheduledAt && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/time-blocks"
                  className="inline-flex items-center gap-1 text-amber-600 hover:text-amber-700 hover:underline"
                >
                  <AlertTriangle className="h-3 w-3" />
                  Unschedulable
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                No available time slot — add a matching time block or reduce
                estimated length
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      <Button
        size="icon"
        variant="ghost"
        onClick={() => onEdit(todo)}
        aria-label={`Edit ${todo.title}`}
        className="h-6 w-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
      >
        <Pencil className="h-3.5 w-3.5" />
      </Button>

      <Button
        size="icon"
        variant="ghost"
        onClick={() => setDeleteOpen(true)}
        aria-label={`Delete ${todo.title}`}
        className="h-6 w-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete todo?"
        description={
          <>&ldquo;{todo.title}&rdquo; will be permanently deleted.</>
        }
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={() =>
          deleteTodo({ variables: { id: todo.id } }).then(() =>
            setDeleteOpen(false),
          )
        }
      />

      <CompletionDialog
        target={completionTarget}
        onOpenChange={(open) => !open && setCompletionTarget(null)}
        refetchQueries={['GetTodoListsPage', 'GetProjectDetail']}
      />
    </div>
  );
}
