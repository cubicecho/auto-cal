import type {
  CreateHabitMutation,
  CreateHabitMutationVariables,
  GetMyHabitsForOnboardingQuery,
} from '@/__generated__/graphql.js';
import { graphql } from '@/__generated__/index.js';
import { ActivityTypeSelect } from '@/components/domain/activity-type/ActivityTypeSelect';
import {
  CreatedList,
  CreatedRow,
  OnboardingStep,
} from '@/components/domain/onboarding/OnboardingStep';
import { FieldRow, FieldWrapper, Form } from '@/components/ui/form';
import { Plus } from '@/components/ui/icons';
import { useAppForm } from '@/hooks/form-hook';
import { DERIVED, invalidate } from '@/lib/cache';
import { useMutation, useQuery } from '@apollo/client/react';
import { z } from 'zod';

const GET_HABITS = graphql(`
  query GetMyHabitsForOnboarding {
    myHabits {
      id
      title
      frequencyCount
      frequencyUnit
      activityType { id name color }
    }
  }
`);

const CREATE_HABIT = graphql(`
  mutation CreateHabitOnboarding($input: CreateHabitArgs!) {
    myCreateHabit(input: $input) {
      id
      title
    }
  }
`);

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  activityTypeId: z.uuid('Activity type is required'),
  frequencyCount: z.number().int().min(1).max(30),
  frequencyUnit: z.enum(['week', 'month']),
});

type FormValues = z.infer<typeof schema>;
type Habit = GetMyHabitsForOnboardingQuery['myHabits'][number];

interface StepHabitsProps {
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
}

export function StepHabits({ onBack, onNext, onSkip }: StepHabitsProps) {
  const { data } = useQuery(GET_HABITS);
  const habits: Habit[] = data?.myHabits ?? [];

  const [createHabit] = useMutation<
    CreateHabitMutation,
    CreateHabitMutationVariables
  >(CREATE_HABIT, {
    update: (cache) => invalidate(cache, 'myHabits', ...DERIVED),
  });

  const form = useAppForm({
    defaultValues: {
      title: '',
      activityTypeId: '',
      frequencyCount: 3,
      frequencyUnit: 'week',
    } as FormValues,
    validators: { onChange: schema },
    onSubmit: async ({ value, formApi }) => {
      await createHabit({
        variables: {
          input: {
            title: value.title,
            activityTypeId: value.activityTypeId,
            frequencyCount: value.frequencyCount,
            frequencyUnit: value.frequencyUnit,
            priority: 0,
          },
        },
      });
      formApi.reset();
    },
  });

  return (
    <OnboardingStep
      title="Build habits"
      description="Habits are recurring goals the scheduler fits into your time blocks automatically. This step is optional — you can add habits any time."
      onBack={onBack}
      onSkip={onSkip}
      onNext={onNext}
    >
      <form.AppForm>
        <Form className="gap-4">
          {/* Title */}
          <form.AppField name="title">
            {(field) => (
              <field.InputField
                label="Title"
                placeholder="e.g. Read, Meditate, Exercise"
              />
            )}
          </form.AppField>

          {/* Frequency */}
          <FieldRow>
            <form.AppField name="frequencyCount">
              {(field) => (
                <field.InputField
                  label="Times per"
                  type="number"
                  min={1}
                  max={30}
                />
              )}
            </form.AppField>

            <form.AppField name="frequencyUnit">
              {(field) => (
                <field.SelectField
                  label="Period"
                  options={[
                    { label: 'Week', value: 'week' },
                    { label: 'Month', value: 'month' },
                  ]}
                />
              )}
            </form.AppField>
          </FieldRow>

          {/* Activity type */}
          <form.AppField name="activityTypeId">
            {(field) => (
              <FieldWrapper
                label="Activity type"
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

          <form.SubmitButton
            icon={<Plus className="mr-1 h-4 w-4" />}
            createLabel="Add habit"
            savingLabel="Adding…"
          />
        </Form>
      </form.AppForm>

      <CreatedList count={habits.length}>
        {habits.map((h) => (
          <CreatedRow
            key={h.id}
            activityType={h.activityType}
            title={h.title}
            meta={`${h.frequencyCount}× / ${h.frequencyUnit}`}
          />
        ))}
      </CreatedList>
    </OnboardingStep>
  );
}
