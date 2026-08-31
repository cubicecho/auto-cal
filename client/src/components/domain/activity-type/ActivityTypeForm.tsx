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
import { ColorPicker } from '@/components/ui/color-picker';
import { FieldWrapper, Form } from '@/components/ui/form';
import { FormDialog, FormDialogFooter } from '@/components/ui/form-dialog';
import { Trash2 } from '@/components/ui/icons';
import { useAppForm } from '@/hooks/form-hook';
import { useResetOnOpen } from '@/hooks/useResetOnOpen';
import { DERIVED, evictEntity, invalidate } from '@/lib/cache';
import { DEFAULT_ACTIVITY_COLOR } from '@/lib/form-constants';
import { errorMessage } from '@/lib/utils';
import { useMutation } from '@apollo/client/react';
import { useState } from 'react';
import { View } from 'react-native';
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
        <Form className="gap-4">
          <View className="flex-col gap-4 py-2">
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
                    <ColorPicker
                      value={field.state.value}
                      onChange={(color) => field.handleChange(color)}
                      onBlur={field.handleBlur}
                    />
                  }
                />
              )}
            </form.AppField>
          </View>

          <FormDialogFooter
            onCancel={() => onOpenChange(false)}
            error={deleteError}
            secondary={
              isEdit ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onPress={
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
