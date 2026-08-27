import type {
  CreateTodoListMutation,
  CreateTodoListMutationVariables,
  DeleteTodoListMutation,
  DeleteTodoListMutationVariables,
  TodoList_TodoListListFragment,
  UpdateTodoListMutation,
  UpdateTodoListMutationVariables,
} from '@/__generated__/graphql.js';
import { graphql } from '@/__generated__/index.js';
import { ActivityTypeSelect } from '@/components/domain/activity-type/ActivityTypeSelect';
import { Button } from '@/components/ui/button';
import { FieldWrapper, Form } from '@/components/ui/form';
import { FormDialog, FormDialogFooter } from '@/components/ui/form-dialog';
import { useAppForm } from '@/hooks/form-hook';
import { useResetOnOpen } from '@/hooks/useResetOnOpen';
import { DERIVED, evictEntity, invalidate } from '@/lib/cache';
import { DURATION_OPTIONS, PRIORITY_OPTIONS } from '@/lib/form-constants';
import { errorMessage } from '@/lib/utils';
import { useMutation } from '@apollo/client/react';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { z } from 'zod';

const CREATE_TODO_LIST = graphql(`
  mutation CreateTodoList($input: CreateTodoListArgs!) {
    myCreateTodoList(input: $input) {
      id
      name
      description
      defaultPriority
      defaultEstimatedLength
      activityType { id name color }
    }
  }
`);

const UPDATE_TODO_LIST = graphql(`
  mutation UpdateTodoList($input: UpdateTodoListArgs!) {
    myUpdateTodoList(input: $input) {
      id
      name
      description
      defaultPriority
      defaultEstimatedLength
      activityType { id name color }
    }
  }
`);

const DELETE_TODO_LIST = graphql(`
  mutation DeleteTodoList($id: ID!) {
    myDeleteTodoList(id: $id)
  }
`);

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(2000),
  activityTypeId: z.string().uuid('Activity type is required'),
  defaultPriority: z.string().min(1),
  defaultEstimatedLength: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

type TodoList = TodoList_TodoListListFragment;

type TodoListFormProps = {
  list?: TodoList;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function TodoListForm({ list, open, onOpenChange }: TodoListFormProps) {
  const isEdit = list !== undefined;
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [createList] = useMutation<
    CreateTodoListMutation,
    CreateTodoListMutationVariables
  >(CREATE_TODO_LIST, {
    update: (cache) => invalidate(cache, 'myTodoLists'),
  });

  const [updateList] = useMutation<
    UpdateTodoListMutation,
    UpdateTodoListMutationVariables
  >(UPDATE_TODO_LIST, {
    // Returns the list; its activity type feeds the scheduler.
    update: (cache) => invalidate(cache, ...DERIVED),
  });

  const [deleteList] = useMutation<
    DeleteTodoListMutation,
    DeleteTodoListMutationVariables
  >(DELETE_TODO_LIST, {
    // Deleting a list cascades to its todos, so `myTodos` goes too.
    update: (cache, _result, { variables }) => {
      if (variables) evictEntity(cache, 'TodoList', variables.id);
      invalidate(cache, 'myTodoLists', 'myTodos', ...DERIVED);
    },
  });

  const defaultValues: FormValues = {
    name: list?.name ?? '',
    description: list?.description ?? '',
    activityTypeId: list?.activityType?.id ?? '',
    defaultPriority: String(list?.defaultPriority ?? 0),
    defaultEstimatedLength: String(list?.defaultEstimatedLength ?? 30),
  };

  const form = useAppForm({
    defaultValues,
    validators: { onChange: schema },
    onSubmit: async ({ value }) => {
      if (isEdit) {
        await updateList({
          variables: {
            input: {
              id: list.id,
              name: value.name,
              description: value.description || null,
              activityTypeId: value.activityTypeId,
              defaultPriority: Number(value.defaultPriority),
              defaultEstimatedLength: Number(value.defaultEstimatedLength),
            },
          },
        });
      } else {
        await createList({
          variables: {
            input: {
              name: value.name,
              description: value.description || undefined,
              activityTypeId: value.activityTypeId,
              defaultPriority: Number(value.defaultPriority),
              defaultEstimatedLength: Number(value.defaultEstimatedLength),
            },
          },
        });
      }
      onOpenChange(false);
    },
  });

  useResetOnOpen(open, list?.id, () => {
    form.reset(defaultValues);
    setDeleteError(null);
  });

  async function handleDelete() {
    if (!isEdit) return;
    try {
      setDeleteError(null);
      await deleteList({ variables: { id: list.id } });
      onOpenChange(false);
    } catch (err) {
      // Server returns "Cannot delete a list that still contains todos".
      setDeleteError(errorMessage(err, 'Failed to delete list'));
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Edit List' : 'New Todo List'}
      description={
        isEdit
          ? 'Update this list and its defaults.'
          : 'Lists group todos by activity. New todos inherit the list’s defaults.'
      }
    >
      <form.AppForm>
        <Form className="space-y-4">
          <form.AppField name="name">
            {(field) => (
              <field.InputField
                label="Name"
                placeholder="e.g. Work, Side project, Errands"
              />
            )}
          </form.AppField>

          <form.AppField name="description">
            {(field) => (
              <field.TextAreaField
                label="Description (optional)"
                placeholder="What kind of todos go in this list?"
              />
            )}
          </form.AppField>

          <form.AppField name="activityTypeId">
            {(field) => (
              <FieldWrapper
                label="Activity Type"
                control={
                  <ActivityTypeSelect
                    value={field.state.value || undefined}
                    onValueChange={(v) => field.handleChange(v ?? '')}
                    onBlur={field.handleBlur}
                  />
                }
              />
            )}
          </form.AppField>

          <div className="grid grid-cols-2 gap-4">
            <form.AppField name="defaultPriority">
              {(field) => (
                <field.SelectField
                  label="Default priority"
                  options={PRIORITY_OPTIONS}
                  placeholder="Select priority"
                />
              )}
            </form.AppField>

            <form.AppField name="defaultEstimatedLength">
              {(field) => (
                <field.SelectField
                  label="Default duration"
                  options={DURATION_OPTIONS}
                  placeholder="Select duration"
                />
              )}
            </form.AppField>
          </div>

          <FormDialogFooter
            onCancel={() => onOpenChange(false)}
            error={deleteError}
            secondary={
              isEdit ? (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  Delete
                </Button>
              ) : undefined
            }
          >
            <form.SubmitButton isEdit={isEdit} createLabel="Create list" />
          </FormDialogFooter>
        </Form>
      </form.AppForm>
    </FormDialog>
  );
}
