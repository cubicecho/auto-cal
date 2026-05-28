import type {
  CreateHabitMutation,
  CreateHabitMutationVariables,
  Habit_HabitListFragment,
  UpdateHabitMutation,
  UpdateHabitMutationVariables,
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
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAppForm } from '@/hooks/form-hook';
import { useMutation } from '@apollo/client/react';
import { useEffect } from 'react';
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
};

// ─── Component ─────────────────────────────────────────────────────────────

export function HabitForm({ habit, open, onOpenChange }: HabitFormProps) {
  const isEdit = habit !== undefined;

  const [createHabit] = useMutation<
    CreateHabitMutation,
    CreateHabitMutationVariables
  >(CREATE_HABIT, {
    refetchQueries: ['GetMyHabits'],
  });

  const [updateHabit] = useMutation<
    UpdateHabitMutation,
    UpdateHabitMutationVariables
  >(UPDATE_HABIT, {
    refetchQueries: ['GetMyHabits'],
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
          }
        : {
            pomodoroEnabled: false,
            pomodoroUnitLength: null,
            pomodoroShortBreakLength: null,
            pomodoroUnitsBeforeLongBreak: null,
            pomodoroLongBreakLength: null,
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

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally keyed on habit?.id — we reset when a different habit is selected, not on every individual field change; form.reset is stable
  useEffect(() => {
    if (open) {
      form.reset({
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
      });
    }
  }, [open, habit?.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Habit' : 'New Habit'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the details of this habit.'
              : 'Add a recurring habit to your schedule.'}
          </DialogDescription>
        </DialogHeader>

        <form.AppForm>
          <Form className="space-y-4">
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

            {/* Priority + Duration — two columns */}
            <div className="grid grid-cols-2 gap-4">
              {/* Priority */}
              <form.AppField name="priority">
                {(field) => (
                  <field.SelectField
                    label="Priority"
                    options={PRIORITY_OPTIONS}
                    placeholder="Select priority"
                  />
                )}
              </form.AppField>

              {/* Estimated Length */}
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

            {/* Frequency — count + unit side by side */}
            <div className="grid grid-cols-2 gap-4">
              {/* Frequency Count */}
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

              {/* Frequency Unit */}
              <form.AppField name="frequencyUnit">
                {(field) => (
                  <field.SelectField
                    label="Frequency"
                    options={FREQUENCY_UNIT_OPTIONS}
                    placeholder="Select frequency"
                  />
                )}
              </form.AppField>
            </div>

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

            {/* Pomodoro toggle */}
            <form.AppField name="pomodoroEnabled">
              {(field) => (
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <Label
                      htmlFor="pomodoro-toggle"
                      className="text-sm font-medium"
                    >
                      Auto-generate pomodoros
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Fill remaining time with timed work units
                    </p>
                  </div>
                  <Switch
                    id="pomodoro-toggle"
                    checked={field.state.value}
                    onCheckedChange={(checked) => field.handleChange(checked)}
                  />
                </div>
              )}
            </form.AppField>

            {/* Pomodoro config — only shown when enabled */}
            <form.Subscribe selector={(s) => s.values.pomodoroEnabled}>
              {(pomodoroEnabled) =>
                pomodoroEnabled ? (
                  <div className="space-y-3 rounded-lg border p-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Pomodoro Settings
                    </p>

                    <div className="grid grid-cols-2 gap-3">
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
                    </div>
                  </div>
                ) : null
              }
            </form.Subscribe>

            <DialogFooter>
              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
              >
                {([canSubmit, isSubmitting]) => (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={!canSubmit}>
                      {isSubmitting
                        ? 'Saving...'
                        : isEdit
                          ? 'Save Changes'
                          : 'Create Habit'}
                    </Button>
                  </>
                )}
              </form.Subscribe>
            </DialogFooter>
          </Form>
        </form.AppForm>
      </DialogContent>
    </Dialog>
  );
}
