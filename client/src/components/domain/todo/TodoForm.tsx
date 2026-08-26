import type {
  CreateTodoMutation,
  CreateTodoMutationVariables,
  Todo_TodoListFragment,
  UpdateTodoMutation,
  UpdateTodoMutationVariables,
} from '@/__generated__/graphql.js';
import { graphql } from '@/__generated__/index.js';
import {
  type TodoListForSelect,
  TodoListSelect,
} from '@/components/domain/todo-list/TodoListSelect';
import { Button } from '@/components/ui/button';
import { FieldWrapper, Form } from '@/components/ui/form';
import { FormDialog, FormDialogFooter } from '@/components/ui/form-dialog';
import { useAppForm } from '@/hooks/form-hook';
import { DERIVED, invalidate } from '@/lib/cache';
import { useMutation } from '@apollo/client/react';
import { Check } from 'lucide-react';
import { useEffect } from 'react';
import { z } from 'zod';

// ─── GraphQL Operations ────────────────────────────────────────────────────

const CREATE_TODO = graphql(`
  mutation CreateTodo($input: CreateTodoArgs!) {
    myCreateTodo(input: $input) {
      id
      title
      description
      list { id name }
      activityType {
        id
        name
        color
      }
      priority
      estimatedLength
      dueAt
      scheduledAt
      completedAt
    }
  }
`);

const UPDATE_TODO = graphql(`
  mutation UpdateTodo($input: UpdateTodoArgs!) {
    myUpdateTodo(input: $input) {
      id
      title
      description
      list { id name }
      activityType {
        id
        name
        color
      }
      priority
      estimatedLength
      dueAt
      scheduledAt
      completedAt
    }
  }
`);

const COMPLETE_TODO = graphql(`
  mutation CompleteTodoFromForm($id: ID!) {
    myCompleteTodo(id: $id) {
      id
      completedAt
    }
  }
`);

// ─── Constants ─────────────────────────────────────────────────────────────

const PRIORITY_OPTIONS = [
  { label: 'Low', value: '0' },
  { label: 'Medium', value: '25' },
  { label: 'High', value: '50' },
  { label: 'Urgent', value: '100' },
] as const;

const DURATION_OPTIONS = [
  { label: '15 minutes', value: '15' },
  { label: '30 minutes', value: '30' },
  { label: '45 minutes', value: '45' },
  { label: '1 hour', value: '60' },
  { label: '1.5 hours', value: '90' },
  { label: '2 hours', value: '120' },
  { label: '3 hours', value: '180' },
  { label: '4+ hours', value: '480' },
] as const;

// ─── Validation Schema ──────────────────────────────────────────────────────

const todoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Max 200 characters'),
  description: z.string().max(2000, 'Max 2000 characters'),
  listId: z.string().uuid('List is required'),
  priority: z.string().min(1, 'Priority is required'),
  estimatedLength: z.string().min(1, 'Duration is required'),
  // Local datetime string (YYYY-MM-DDTHH:mm) from <input type="datetime-local">
  dueAt: z.string(),
});

type TodoFormValues = z.infer<typeof todoSchema>;

// ─── Types ─────────────────────────────────────────────────────────────────

type Todo = Todo_TodoListFragment;

// ─── Props ─────────────────────────────────────────────────────────────────

type TodoFormProps = {
  todo?: Todo;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// ─── Helpers ──────────────────────────────────────────────────────────────

/** Convert a server datetime string ("YYYY-MM-DDTHH:mm:ss" naive) to the
 *  "YYYY-MM-DDTHH:mm" shape that <input type="datetime-local"> expects. */
function toDateTimeLocal(value: string | null | undefined): string {
  if (!value) return '';
  // Trim seconds (and any trailing Z) — the input only accepts minute precision.
  return value.replace(/Z$/, '').slice(0, 16);
}

// ─── Component ─────────────────────────────────────────────────────────────

export function TodoForm({ todo, open, onOpenChange }: TodoFormProps) {
  const isEdit = todo !== undefined;

  const [createTodo] = useMutation<
    CreateTodoMutation,
    CreateTodoMutationVariables
  >(CREATE_TODO, {
    update: (cache) => invalidate(cache, 'myTodos', ...DERIVED),
  });

  const [updateTodo] = useMutation<
    UpdateTodoMutation,
    UpdateTodoMutationVariables
  >(UPDATE_TODO, {
    // Returns the todo, so the lists patch themselves.
    update: (cache) => invalidate(cache, ...DERIVED),
  });

  const [completeTodo, { loading: completing }] = useMutation(COMPLETE_TODO, {
    update: (cache) => invalidate(cache, ...DERIVED),
  });

  const defaultValues: TodoFormValues = {
    title: todo?.title ?? '',
    description: todo?.description ?? '',
    listId: todo?.list?.id ?? '',
    priority: String(todo?.priority ?? 0),
    estimatedLength: String(todo?.estimatedLength ?? 30),
    dueAt: toDateTimeLocal(todo?.dueAt as string | null | undefined),
  };

  const form = useAppForm({
    defaultValues,
    validators: {
      onChange: todoSchema,
    },
    onSubmit: async ({ value }) => {
      // datetime-local gives "YYYY-MM-DDTHH:mm" — append ":00" so it satisfies
      // the server's datetime({ local: true }) validator which expects seconds.
      const dueAt = value.dueAt ? `${value.dueAt}:00` : null;
      if (isEdit) {
        await updateTodo({
          variables: {
            input: {
              id: todo.id,
              title: value.title,
              description: value.description ?? null,
              listId: value.listId,
              priority: Number(value.priority),
              estimatedLength: Number(value.estimatedLength),
              dueAt,
            },
          },
        });
      } else {
        await createTodo({
          variables: {
            input: {
              title: value.title,
              description: value.description ?? null,
              listId: value.listId,
              priority: Number(value.priority),
              estimatedLength: Number(value.estimatedLength),
              dueAt: dueAt ?? undefined,
            },
          },
        });
      }
      onOpenChange(false);
    },
  });

  // Reset to the selected todo's values whenever the dialog opens or a
  // different todo is edited — defaultValues only apply on mount and this form
  // instance is reused across create/edit targets.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally keyed on todo?.id — we reset when a different item is selected, not on every field change; form.reset and defaultValues are derived from the current render
  useEffect(() => {
    if (open) form.reset(defaultValues);
  }, [open, todo?.id]);

  // Snapshot the list's defaults into the priority/duration fields when the
  // user picks a list (only if they haven't customized those fields yet).
  function applyListDefaults(list?: TodoListForSelect) {
    if (!list) return;
    if (isEdit) return; // never overwrite values on an existing todo
    if (
      !form.getFieldValue('priority') ||
      form.getFieldValue('priority') === '0'
    ) {
      form.setFieldValue('priority', String(list.defaultPriority));
    }
    if (
      !form.getFieldValue('estimatedLength') ||
      form.getFieldValue('estimatedLength') === '30'
    ) {
      form.setFieldValue(
        'estimatedLength',
        String(list.defaultEstimatedLength || 30),
      );
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Edit Todo' : 'New Todo'}
      description={
        isEdit
          ? 'Update the details of your todo.'
          : 'Add a new task to one of your lists.'
      }
    >
      <form.AppForm>
        <Form className="space-y-4">
          <form.AppField name="title">
            {(field) => (
              <field.InputField
                label="Title"
                placeholder="What needs to be done?"
              />
            )}
          </form.AppField>

          <form.AppField name="description">
            {(field) => (
              <field.TextAreaField
                label="Description (optional)"
                placeholder="Add any notes or details..."
              />
            )}
          </form.AppField>

          <form.AppField name="listId">
            {(field) => (
              <FieldWrapper
                label="List"
                control={
                  <TodoListSelect
                    value={field.state.value || undefined}
                    onValueChange={(v, list) => {
                      field.handleChange(v ?? '');
                      applyListDefaults(list);
                    }}
                    onBlur={field.handleBlur}
                  />
                }
              />
            )}
          </form.AppField>

          <div className="grid grid-cols-2 gap-4">
            <form.AppField name="priority">
              {(field) => (
                <field.SelectField
                  label="Priority"
                  options={PRIORITY_OPTIONS}
                  placeholder="Select priority"
                />
              )}
            </form.AppField>

            <form.AppField name="estimatedLength">
              {(field) => (
                <field.SelectField
                  label="Duration"
                  options={DURATION_OPTIONS}
                  placeholder="Select duration"
                />
              )}
            </form.AppField>
          </div>

          <form.AppField name="dueAt">
            {(field) => (
              <field.InputField
                label="Due date (optional)"
                type="datetime-local"
              />
            )}
          </form.AppField>

          <FormDialogFooter
            onCancel={() => onOpenChange(false)}
            secondary={
              isEdit && !todo?.completedAt ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={completing}
                  onClick={async () => {
                    await completeTodo({ variables: { id: todo?.id } });
                    onOpenChange(false);
                  }}
                  className="text-green-600 border-green-600 hover:bg-green-50"
                >
                  <Check className="mr-1 h-4 w-4" />
                  Mark Complete
                </Button>
              ) : isEdit && !!todo?.completedAt ? (
                <span className="text-sm text-muted-foreground">
                  ✓ Completed
                </span>
              ) : undefined
            }
          >
            <form.SubmitButton isEdit={isEdit} createLabel="Create Todo" />
          </FormDialogFooter>
        </Form>
      </form.AppForm>
    </FormDialog>
  );
}
