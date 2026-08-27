import type {
  CreateActivityTypeMutation,
  CreateActivityTypeMutationVariables,
  DeleteActivityTypeMutation,
  DeleteActivityTypeMutationVariables,
  GetActivityTypesPageQuery,
  UpdateActivityTypeMutation,
  UpdateActivityTypeMutationVariables,
} from '@/__generated__/graphql.js';
import { graphql } from '@/__generated__/index.js';
import { Button } from '@/components/ui/button';
import { FieldWrapper, Form } from '@/components/ui/form';
import { FormDialog, FormDialogFooter } from '@/components/ui/form-dialog';
import { Input } from '@/components/ui/input';
import { useAppForm } from '@/hooks/form-hook';
import { useResetOnOpen } from '@/hooks/useResetOnOpen';
import { DERIVED, evictEntity, invalidate } from '@/lib/cache';
import { DEFAULT_ACTIVITY_COLOR } from '@/lib/form-constants';
import { errorMessage } from '@/lib/utils';
import { useMutation } from '@apollo/client/react';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { z } from 'zod';

// ─── GraphQL Operations ────────────────────────────────────────────────────

const CREATE_ACTIVITY_TYPE = graphql(`
  mutation CreateActivityType($input: CreateActivityTypeArgs!) {
    myCreateActivityType(input: $input) {
      id
      name
      color
    }
  }
`);

const UPDATE_ACTIVITY_TYPE = graphql(`
  mutation UpdateActivityType($input: UpdateActivityTypeArgs!) {
    myUpdateActivityType(input: $input) {
      id
      name
      color
    }
  }
`);

const DELETE_ACTIVITY_TYPE = graphql(`
  mutation DeleteActivityType($id: ID!) {
    myDeleteActivityType(id: $id)
  }
`);

// ─── Validation Schema ──────────────────────────────────────────────────────

const activityTypeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color like #6366f1'),
});

type ActivityTypeFormValues = z.infer<typeof activityTypeSchema>;

// ─── Types ──────────────────────────────────────────────────────────────────

type ActivityTypeItem = GetActivityTypesPageQuery['myActivityTypes'][number];

interface ActivityTypeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activityType?: ActivityTypeItem;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ActivityTypeForm({
  open,
  onOpenChange,
  activityType,
}: ActivityTypeFormProps) {
  const isEdit = activityType !== undefined;
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [createActivityType] = useMutation<
    CreateActivityTypeMutation,
    CreateActivityTypeMutationVariables
  >(CREATE_ACTIVITY_TYPE, {
    update: (cache) => invalidate(cache, 'myActivityTypes', ...DERIVED),
  });

  const [updateActivityType] = useMutation<
    UpdateActivityTypeMutation,
    UpdateActivityTypeMutationVariables
  >(UPDATE_ACTIVITY_TYPE, {
    // Returns the activity type; every list and every `activityType { … }`
    // sub-selection points at the same normalized entity, so a rename or a
    // colour change lands everywhere without a refetch.
    update: (cache) => invalidate(cache, ...DERIVED),
  });

  const [deleteActivityType] = useMutation<
    DeleteActivityTypeMutation,
    DeleteActivityTypeMutationVariables
  >(DELETE_ACTIVITY_TYPE, {
    update: (cache, _result, { variables }) => {
      if (variables) evictEntity(cache, 'ActivityType', variables.id);
      invalidate(cache, 'myActivityTypes', ...DERIVED);
    },
  });

  const defaultValues: ActivityTypeFormValues = {
    name: activityType?.name ?? '',
    color: activityType?.color ?? DEFAULT_ACTIVITY_COLOR,
  };

  const form = useAppForm({
    defaultValues,
    validators: { onChange: activityTypeSchema },
    onSubmit: async ({ value }) => {
      if (isEdit) {
        await updateActivityType({
          variables: {
            input: {
              id: activityType.id,
              name: value.name,
              color: value.color,
            },
          },
        });
      } else {
        await createActivityType({
          variables: { input: { name: value.name, color: value.color } },
        });
      }
      onOpenChange(false);
    },
  });

  useResetOnOpen(open, activityType?.id, () => {
    form.reset(defaultValues);
    setConfirmingDelete(false);
    setDeleteError(null);
  });

  async function handleDelete() {
    if (!isEdit) return;
    try {
      setDeleteError(null);
      await deleteActivityType({ variables: { id: activityType.id } });
      onOpenChange(false);
    } catch (err) {
      // Every FK to activity_types is onDelete: 'restrict', so the database
      // refuses this whenever a habit, list, time block, or project uses it.
      setDeleteError(
        errorMessage(
          err,
          'Failed to delete — something still uses this activity type.',
        ),
      );
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      className="sm:max-w-[400px]"
      title={isEdit ? 'Edit Activity Type' : 'New Activity Type'}
      description={
        isEdit
          ? 'Update this activity type used to categorize your tasks.'
          : 'Create an activity type to categorize your todos, habits, and time blocks.'
      }
    >
      <form.AppForm>
        <Form className="space-y-4">
          <div className="flex flex-col gap-4 py-2">
            {/* Name */}
            <form.AppField name="name">
              {(field) => (
                <field.InputField
                  label="Name"
                  placeholder="e.g. Work, Exercise, Learning"
                />
              )}
            </form.AppField>

            {/* Color */}
            <form.AppField name="color">
              {(field) => (
                <FieldWrapper
                  label="Color"
                  control={
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        className="h-10 w-16 cursor-pointer rounded border border-input bg-background p-1"
                      />
                      <Input
                        placeholder={DEFAULT_ACTIVITY_COLOR}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        className="font-mono"
                      />
                    </div>
                  }
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
                  onClick={
                    confirmingDelete
                      ? handleDelete
                      : () => setConfirmingDelete(true)
                  }
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  {confirmingDelete ? 'Confirm delete' : 'Delete'}
                </Button>
              ) : undefined
            }
          >
            <form.SubmitButton isEdit={isEdit} createLabel="Create" />
          </FormDialogFooter>
        </Form>
      </form.AppForm>
    </FormDialog>
  );
}
