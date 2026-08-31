import type { Todo_TodoListFragment } from '@/__generated__/graphql.js';
import { graphql } from '@/__generated__/index.js';
import {
  CompletionDialog,
  type CompletionDialogTarget,
} from '@/components/domain/CompletionDialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useConfirm } from '@/components/ui/confirm';
import {
  Check,
  Pencil,
  Trash2,
  TriangleAlert,
  Undo2,
} from '@/components/ui/icons';
import { InlineLengthEdit } from '@/components/ui/inline-length-edit';
import { useToast } from '@/components/ui/toast';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { DERIVED, evictEntity, invalidate } from '@/lib/cache';
import { HOVER_REVEAL, cn, errorMessage, priorityLabel } from '@/lib/utils';
import { useMutation } from '@apollo/client/react';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

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
  /**
   * Present only while the parent list is in multi-select mode. Its presence
   * is what swaps the complete/edit/delete controls for a checkbox — the two
   * sets of actions would otherwise compete for the same row.
   */
  selection?: { selected: boolean; onToggle: (todo: Todo) => void } | undefined;
};

export function TodoItem({ todo, onEdit, selection }: TodoItemProps) {
  const toast = useToast();
  const confirm = useConfirm();
  const isCompleted = todo.completedAt !== null;
  const [completionTarget, setCompletionTarget] =
    useState<CompletionDialogTarget | null>(null);

  // Both mutations return the todo, so the lists rendering it patch
  // themselves; only the derived views have to be dropped.
  const [uncompleteTodo, { loading: uncompleting }] = useMutation(
    UNCOMPLETE_TODO,
    { update: (cache) => invalidate(cache, ...DERIVED) },
  );

  const [updateTodo, { loading: updatingLength }] = useMutation(
    UPDATE_TODO_LENGTH,
    { update: (cache) => invalidate(cache, ...DERIVED) },
  );

  const [deleteTodo] = useMutation(DELETE_TODO, {
    update: (cache) => {
      evictEntity(cache, 'Todo', todo.id);
      invalidate(cache, ...DERIVED);
    },
  });

  async function confirmDelete() {
    const ok = await confirm({
      title: 'Delete todo?',
      description: `“${todo.title}” will be permanently deleted.`,
    });
    if (!ok) return;
    try {
      await deleteTodo({ variables: { id: todo.id } });
    } catch (err) {
      toast(errorMessage(err, 'Could not delete this todo'));
    }
  }

  function handleSaveLength(estimatedLength: number) {
    updateTodo({
      variables: { input: { id: todo.id, estimatedLength } },
    }).catch((err) => toast(errorMessage(err, 'Could not save the length')));
  }

  return (
    <View
      className={`group flex-row items-start gap-2 rounded-md border bg-card px-2 py-1.5 text-sm hover:bg-muted/40 ${
        isCompleted ? 'opacity-60' : ''
      }`}
    >
      {selection ? (
        <View className="h-6 w-6 shrink-0 items-center justify-center">
          <Checkbox
            checked={selection.selected}
            onCheckedChange={() => selection.onToggle(todo)}
            accessibilityLabel={`Select ${todo.title}`}
          />
        </View>
      ) : !isCompleted ? (
        <Button
          size="icon"
          variant="ghost"
          onPress={() =>
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
              onPress={() =>
                uncompleteTodo({ variables: { id: todo.id } }).catch((err) =>
                  toast(errorMessage(err, 'Could not reopen this todo')),
                )
              }
              aria-label={`Mark ${todo.title} as incomplete`}
              className="h-6 w-6 shrink-0 text-muted-foreground hover:text-amber-600"
            >
              <Undo2 className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Mark as incomplete</TooltipContent>
        </Tooltip>
      )}

      <View className="min-w-0 flex-1">
        <Text
          className={`font-medium ${
            isCompleted
              ? 'line-through text-muted-foreground'
              : 'text-foreground'
          }`}
        >
          {todo.title}
        </Text>
        <View className="mt-0.5 flex-row flex-wrap items-center gap-x-2 gap-y-0.5">
          <InlineLengthEdit
            value={todo.estimatedLength}
            saving={updatingLength}
            onSave={handleSaveLength}
          />
          <Text className="text-xs text-muted-foreground">·</Text>
          <Text className="text-xs text-muted-foreground">
            {priorityLabel(todo.priority)}
          </Text>
          {todo.dueAt ? (
            <Text className="text-xs text-amber-700">
              · Due {new Date(todo.dueAt as string).toLocaleDateString()}
            </Text>
          ) : null}
          {!isCompleted && !todo.scheduledAt && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/time-blocks" asChild>
                  <Pressable className="flex-row items-center gap-1">
                    <TriangleAlert className="h-3 w-3 text-amber-600" />
                    <Text className="text-xs text-amber-600">
                      Unschedulable
                    </Text>
                  </Pressable>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                No available time slot — add a matching time block or reduce
                estimated length
              </TooltipContent>
            </Tooltip>
          )}
        </View>
      </View>

      {!selection && (
        <>
          <Button
            size="icon"
            variant="ghost"
            onPress={() => onEdit(todo)}
            aria-label={`Edit ${todo.title}`}
            className={cn('h-6 w-6 shrink-0', HOVER_REVEAL)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onPress={() => void confirmDelete()}
            aria-label={`Delete ${todo.title}`}
            className={cn(
              'h-6 w-6 shrink-0 hover:text-destructive',
              HOVER_REVEAL,
            )}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </>
      )}

      <CompletionDialog
        target={completionTarget}
        onOpenChange={(open) => !open && setCompletionTarget(null)}
      />
    </View>
  );
}
