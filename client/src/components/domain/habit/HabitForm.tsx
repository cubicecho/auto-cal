import type {
  CreateHabitMutation,
  CreateHabitMutationVariables,
  DeleteHabitMutation,
  DeleteHabitMutationVariables,
  Habit_HabitListFragment,
  UpdateHabitMutation,
  UpdateHabitMutationVariables,
} from '@/__generated__/graphql.js';
import { graphql } from '@/__generated__/index.js';
import { ActivityTypeSelect } from '@/components/domain/activity-type/ActivityTypeSelect';
import { Button } from '@/components/ui/button';
import { FieldRow, FieldWrapper, Form } from '@/components/ui/form';
import { FormDialog, FormDialogFooter } from '@/components/ui/form-dialog';
import { Trash2 } from '@/components/ui/icons';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAppForm } from '@/hooks/form-hook';
import { useResetOnOpen } from '@/hooks/useResetOnOpen';
import { DERIVED, evictEntity, invalidate } from '@/lib/cache';
import { DURATION_OPTIONS, PRIORITY_OPTIONS } from '@/lib/form-constants';
import { errorMessage } from '@/lib/utils';
import { useMutation } from '@apollo/client/react';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { z } from 'zod';

// ─── GraphQL Operations ────────────────────────────────────────────────────

const CREATE_HABIT = graphql(`
  mutation CreateHabit($input: CreateHabitArgs!) {
    myCreateHabit(input: $input) {
      id
      title
      description
      activityType {
        id
        name
        color
      }
      priority
      estimatedLength
      frequencyCount
      frequencyUnit
      pomodoroEnabled
      pomodoroUnitLength
      pomodoroShortBreakLength
      pomodoroUnitsBeforeLongBreak
      pomodoroLongBreakLength
      pomodoroMaxPerDay
    }
  }
`);

const UPDATE_HABIT = graphql(`
  mutation UpdateHabit($input: UpdateHabitArgs!) {
    myUpdateHabit(input: $input) {
      id
      title
      description
      activityType {
        id
        name
        color
      }
      priority
      estimatedLength
      frequencyCount
      frequencyUnit
      pomodoroEnabled
      pomodoroUnitLength
      pomodoroShortBreakLength
      pomodoroUnitsBeforeLongBreak
      pomodoroLongBreakLength
      pomodoroMaxPerDay
    }
  }
`);

const DELETE_HABIT = graphql(`
  mutation DeleteHabit($id: ID!) {
    myDeleteHabit(id: $id)
  }
`);

// ─── Constants ─────────────────────────────────────────────────────────────

const FREQUENCY_UNIT_OPTIONS = [
  { label: 'per week', value: 'week' },
  { label: 'per month', value: 'month' },
] as const;

// ─── Validation Schema ──────────────────────────────────────────────────────

const pomodoroConfig = z.object({
  pomodoroUnitLength: z.number().int().min(1).max(120),
  pomodoroShortBreakLength: z.number().int().min(1).max(60),
  pomodoroUnitsBeforeLongBreak: z.number().int().min(1).max(20),
  pomodoroLongBreakLength: z.number().int().min(1).max(120),
});

const habitSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Title is required')
      .max(200, 'Max 200 characters'),
    description: z.string().max(2000, 'Max 2000 characters'),
    activityTypeId: z.string().uuid('Activity type is required'),
    priority: z.string().min(1, 'Priority is required'),
    estimatedLength: z.string().min(1, 'Duration is required'),
    frequencyCount: z
      .number()
      .int()
      .min(1, 'Must be at least 1')
      .max(30, 'Max 30'),
    frequencyUnit: z.string().min(1, 'Frequency unit is required'),
    minTimeBetweenInstances: z.number().int().min(0).nullable(),
    pomodoroEnabled: z.boolean(),
    pomodoroUnitLength: z.number().int().min(1).max(120).nullable(),
    pomodoroShortBreakLength: z.number().int().min(1).max(60).nullable(),
    pomodoroUnitsBeforeLongBreak: z.number().int().min(1).max(20).nullable(),
    pomodoroLongBreakLength: z.number().int().min(1).max(120).nullable(),
    pomodoroMaxPerDay: z.number().int().min(1).max(100).nullable(),
  })
  .superRefine((data, ctx) => {
    if (!data.pomodoroEnabled) return;
    const result = pomodoroConfig.safeParse({
      pomodoroUnitLength: data.pomodoroUnitLength,
      pomodoroShortBreakLength: data.pomodoroShortBreakLength,
      pomodoroUnitsBeforeLongBreak: data.pomodoroUnitsBeforeLongBreak,
      pomodoroLongBreakLength: data.pomodoroLongBreakLength,
    });
    if (!result.success) {
      for (const issue of result.error.issues) {
        ctx.addIssue({ ...issue, path: issue.path });
      }
    }
  });

type HabitFormValues = z.infer<typeof habitSchema>;

// ─── Props ─────────────────────────────────────────────────────────────────

type HabitFormProps = {
  habit?: Habit_HabitListFragment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
};

// ─── Component ─────────────────────────────────────────────────────────────

export function HabitForm({
  habit,
  open,
  onOpenChange,
  onDeleted,
}: HabitFormProps) {
  const isEdit = habit !== undefined;
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [createHabit] = useMutation<
    CreateHabitMutation,
    CreateHabitMutationVariables
  >(CREATE_HABIT, {
    update: (cache) => invalidate(cache, 'myHabits', ...DERIVED),
  });

  const [updateHabit] = useMutation<
    UpdateHabitMutation,
    UpdateHabitMutationVariables
  >(UPDATE_HABIT, {
    update: (cache) => invalidate(cache, ...DERIVED),
  });

  const [deleteHabit, { loading: deleting }] = useMutation<
    DeleteHabitMutation,
    DeleteHabitMutationVariables
  >(DELETE_HABIT, {
    update: (cache, _result, { variables }) => {
      if (variables) evictEntity(cache, 'Habit', variables.id);
      invalidate(cache, 'myHabits', ...DERIVED);
    },
  });

  const defaultValues: HabitFormValues = {
    title: habit?.title ?? '',
    description: habit?.description ?? '',
    activityTypeId: habit?.activityType?.id ?? '',
    priority: String(habit?.priority ?? 0),
    estimatedLength: String(habit?.estimatedLength ?? 30),
    frequencyCount: habit?.frequencyCount ?? 1,
    frequencyUnit: habit?.frequencyUnit ?? 'week',
    minTimeBetweenInstances: habit?.minTimeBetweenInstances ?? null,
    pomodoroEnabled: habit?.pomodoroEnabled ?? false,
    pomodoroUnitLength: habit?.pomodoroUnitLength ?? 25,
    pomodoroShortBreakLength: habit?.pomodoroShortBreakLength ?? 5,
    pomodoroUnitsBeforeLongBreak: habit?.pomodoroUnitsBeforeLongBreak ?? 4,
    pomodoroLongBreakLength: habit?.pomodoroLongBreakLength ?? 15,
    pomodoroMaxPerDay: habit?.pomodoroMaxPerDay ?? null,
  };

  const form = useAppForm({
    defaultValues,
    validators: {
      onChange: habitSchema,
    },
    onSubmit: async ({ value }) => {
      const pomodoroFields = value.pomodoroEnabled
        ? {
            pomodoroEnabled: true,
            pomodoroUnitLength: value.pomodoroUnitLength ?? 25,
            pomodoroShortBreakLength: value.pomodoroShortBreakLength ?? 5,
            pomodoroUnitsBeforeLongBreak:
              value.pomodoroUnitsBeforeLongBreak ?? 4,
            pomodoroLongBreakLength: value.pomodoroLongBreakLength ?? 15,
            pomodoroMaxPerDay: value.pomodoroMaxPerDay,
          }
        : {
            pomodoroEnabled: false,
            pomodoroUnitLength: null,
            pomodoroShortBreakLength: null,
            pomodoroUnitsBeforeLongBreak: null,
            pomodoroLongBreakLength: null,
            pomodoroMaxPerDay: null,
          };

      if (isEdit && habit) {
        await updateHabit({
          variables: {
            input: {
              id: habit.id,
              title: value.title,
              description: value.description ?? null,
              activityTypeId: value.activityTypeId,
              priority: Number(value.priority),
              estimatedLength: Number(value.estimatedLength),
              frequencyCount: value.frequencyCount,
              frequencyUnit: value.frequencyUnit,
              minTimeBetweenInstances: value.minTimeBetweenInstances,
              ...pomodoroFields,
            },
          },
        });
      } else {
        await createHabit({
          variables: {
            input: {
              title: value.title,
              description: value.description ?? null,
              activityTypeId: value.activityTypeId,
              priority: Number(value.priority),
              estimatedLength: Number(value.estimatedLength),
              frequencyCount: value.frequencyCount,
              frequencyUnit: value.frequencyUnit,
              minTimeBetweenInstances: value.minTimeBetweenInstances,
              ...pomodoroFields,
            },
          },
        });
      }
      onOpenChange(false);
    },
  });

  useResetOnOpen(open, habit?.id, () => {
    form.reset(defaultValues);
    setConfirmingDelete(false);
    setDeleteError(null);
  });

  async function handleDelete() {
    if (!isEdit || !habit) return;
    try {
      setDeleteError(null);
      await deleteHabit({ variables: { id: habit.id } });
      onOpenChange(false);
      onDeleted?.();
    } catch (err) {
      setDeleteError(errorMessage(err, 'Failed to delete habit'));
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Edit Habit' : 'New Habit'}
      description={
        isEdit
          ? 'Update the details of this habit.'
          : 'Add a recurring habit to your schedule.'
      }
    >
      <form.AppForm>
        <Form className="gap-4">
          {/* Title */}
          <form.AppField name="title">
            {(field) => (
              <field.InputField
                label="Title"
                placeholder="What habit do you want to build?"
              />
            )}
          </form.AppField>

          {/* Description */}
          <form.AppField name="description">
            {(field) => (
              <field.TextAreaField
                label="Description (optional)"
                placeholder="Add any notes or details..."
              />
            )}
          </form.AppField>

          {/* Activity Type */}
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

          {/* Priority — always visible */}
          <form.AppField name="priority">
            {(field) => (
              <field.SelectField
                label="Priority"
                options={PRIORITY_OPTIONS}
                placeholder="Select priority"
              />
            )}
          </form.AppField>

          {/* Pomodoro toggle */}
          <form.AppField name="pomodoroEnabled">
            {(field) => (
              <View className="flex-row items-center justify-between rounded-lg border p-3">
                <View>
                  <Label
                    htmlFor="pomodoro-toggle"
                    className="text-sm font-medium"
                  >
                    Auto-generate pomodoros
                  </Label>
                  <Text className="text-xs text-muted-foreground">
                    Fill remaining time with timed work units
                  </Text>
                </View>
                <Switch
                  id="pomodoro-toggle"
                  checked={field.state.value}
                  onCheckedChange={(checked) => field.handleChange(checked)}
                />
              </View>
            )}
          </form.AppField>

          {/* Scheduling fields (hidden when pomodoro mode is on) or pomodoro config */}
          <form.Subscribe selector={(s) => s.values.pomodoroEnabled}>
            {(pomodoroEnabled) =>
              pomodoroEnabled ? (
                <View className="gap-3 rounded-lg border p-3">
                  <Text className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Pomodoro Settings
                  </Text>

                  <FieldRow>
                    <form.AppField name="pomodoroUnitLength">
                      {(field) => (
                        <field.InputField
                          label="Unit length (min)"
                          type="number"
                          min={1}
                          max={120}
                        />
                      )}
                    </form.AppField>

                    <form.AppField name="pomodoroShortBreakLength">
                      {(field) => (
                        <field.InputField
                          label="Short break (min)"
                          type="number"
                          min={1}
                          max={60}
                        />
                      )}
                    </form.AppField>

                    <form.AppField name="pomodoroUnitsBeforeLongBreak">
                      {(field) => (
                        <field.InputField
                          label="Units before long break"
                          type="number"
                          min={1}
                          max={20}
                        />
                      )}
                    </form.AppField>

                    <form.AppField name="pomodoroLongBreakLength">
                      {(field) => (
                        <field.InputField
                          label="Long break (min)"
                          type="number"
                          min={1}
                          max={120}
                        />
                      )}
                    </form.AppField>

                    <form.AppField name="pomodoroMaxPerDay">
                      {(field) => (
                        <field.InputField
                          label="Max per day (optional)"
                          type="number"
                          min={1}
                          max={100}
                          placeholder="No limit"
                        />
                      )}
                    </form.AppField>
                  </FieldRow>
                </View>
              ) : (
                <View className="gap-4">
                  {/* Duration */}
                  <form.AppField name="estimatedLength">
                    {(field) => (
                      <field.SelectField
                        label="Duration"
                        options={DURATION_OPTIONS}
                        placeholder="Select duration"
                      />
                    )}
                  </form.AppField>

                  {/* Frequency — count + unit side by side */}
                  <FieldRow>
                    <form.AppField name="frequencyCount">
                      {(field) => (
                        <field.InputField
                          label="Times"
                          type="number"
                          min={1}
                          max={30}
                        />
                      )}
                    </form.AppField>

                    <form.AppField name="frequencyUnit">
                      {(field) => (
                        <field.SelectField
                          label="Frequency"
                          options={FREQUENCY_UNIT_OPTIONS}
                          placeholder="Select frequency"
                        />
                      )}
                    </form.AppField>
                  </FieldRow>

                  {/* Minimum time between instances */}
                  <form.AppField name="minTimeBetweenInstances">
                    {(field) => (
                      <field.InputField
                        label="Min hours between sessions (optional)"
                        type="number"
                        min={0}
                        placeholder="e.g. 24"
                      />
                    )}
                  </form.AppField>
                </View>
              )
            }
          </form.Subscribe>

          <FormDialogFooter
            onCancel={() => onOpenChange(false)}
            error={deleteError}
            secondary={
              isEdit ? (
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={deleting}
                  onPress={
                    confirmingDelete
                      ? handleDelete
                      : () => setConfirmingDelete(true)
                  }
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  {deleting
                    ? 'Deleting…'
                    : confirmingDelete
                      ? 'Confirm delete'
                      : 'Delete'}
                </Button>
              ) : undefined
            }
          >
            <form.SubmitButton isEdit={isEdit} createLabel="Create Habit" />
          </FormDialogFooter>
        </Form>
      </form.AppForm>
    </FormDialog>
  );
}
