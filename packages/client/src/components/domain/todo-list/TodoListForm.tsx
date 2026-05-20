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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FieldWrapper, Form } from '@/components/ui/form';
import { useAppForm } from '@/hooks/form-hook';
import { useMutation } from '@apollo/client/react';
import { Trash2 } from 'lucide-react';
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
] as const;

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

  const [createList] = useMutation<
    CreateTodoListMutation,
    CreateTodoListMutationVariables
  >(CREATE_TODO_LIST, {
    refetchQueries: ['GetTodoListsPage', 'GetTodoListsForSelect'],
  });

  const [updateList] = useMutation<
    UpdateTodoListMutation,
    UpdateTodoListMutationVariables
  >(UPDATE_TODO_LIST, {
    refetchQueries: ['GetTodoListsPage', 'GetTodoListsForSelect'],
  });

  const [deleteList] = useMutation<
    DeleteTodoListMutation,
    DeleteTodoListMutationVariables
  >(DELETE_TODO_LIST, {
    refetchQueries: ['GetTodoListsPage', 'GetTodoListsForSelect'],
  });

  const form = useAppForm({
    defaultValues: {
      name: list?.name ?? '',
      description: list?.description ?? '',
      activityTypeId: list?.activityType?.id ?? '',
      defaultPriority: String(list?.defaultPriority ?? 0),
      defaultEstimatedLength: String(list?.defaultEstimatedLength ?? 30),
    } as FormValues,
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

  async function handleDelete() {
    if (!isEdit) return;
    try {
      await deleteList({ variables: { id: list.id } });
      onOpenChange(false);
    } catch (err) {
      // Server returns "Cannot delete a list that still contains todos" — surface it.
      alert(err instanceof Error ? err.message : 'Failed to delete list');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit List' : 'New Todo List'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update this list and its defaults.'
              : 'Lists group todos by activity. New todos inherit the list’s defaults.'}
          </DialogDescription>
        </DialogHeader>

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

            <DialogFooter className="flex items-center justify-between">
              <div>
                {isEdit && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    Delete
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <form.Subscribe
                  selector={(state) => [state.canSubmit, state.isSubmitting]}
                >
                  {([canSubmit, isSubmitting]) => (
                    <Button
                      type="submit"
                      disabled={!canSubmit || !!isSubmitting}
                    >
                      {isSubmitting
                        ? 'Saving…'
                        : isEdit
                          ? 'Save changes'
                          : 'Create list'}
                    </Button>
                  )}
                </form.Subscribe>
              </div>
            </DialogFooter>
          </Form>
        </form.AppForm>
      </DialogContent>
    </Dialog>
  );
}
