import type {
  CreateHabitMutation,
  CreateHabitMutationVariables,
  GetMyHabitsForOnboardingQuery,
} from '@/__generated__/graphql.js';
import { graphql } from '@/__generated__/index.js';
import { ActivityTypeSelect } from '@/components/domain/activity-type/ActivityTypeSelect';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ColorDot } from '@/components/ui/color-dot';
import { FieldWrapper, Form } from '@/components/ui/form';
import { useAppForm } from '@/hooks/form-hook';
import { useMutation, useQuery } from '@apollo/client/react';
import { ArrowLeft, ArrowRight, Plus, SkipForward } from 'lucide-react';
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
  activityTypeId: z.string().uuid('Activity type is required'),
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
    refetchQueries: ['GetMyHabitsForOnboarding', 'GetMyHabits'],
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
    <Card>
      <CardHeader>
        <CardTitle>Build habits</CardTitle>
        <CardDescription>
          Habits are recurring goals the scheduler fits into your time blocks
          automatically. This step is optional — you can add habits any time.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <form.AppForm>
          <Form className="space-y-4">
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
            <div className="grid grid-cols-2 gap-4">
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
            </div>

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

            <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
              {([canSubmit, isSubmitting]) => (
                <Button type="submit" disabled={!canSubmit || !!isSubmitting}>
                  <Plus className="mr-1 h-4 w-4" />
                  {isSubmitting ? 'Adding…' : 'Add habit'}
                </Button>
              )}
            </form.Subscribe>
          </Form>
        </form.AppForm>

        {/* Created list */}
        {habits.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Created ({habits.length})
            </p>
            <div className="divide-y rounded-md border">
              {habits.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center gap-3 px-3 py-2 text-sm"
                >
                  {h.activityType && (
                    <ColorDot
                      color={h.activityType.color}
                      className="h-2.5 w-2.5"
                    />
                  )}
                  <span className="font-medium">{h.title}</span>
                  <span className="ml-auto text-muted-foreground">
                    {h.frequencyCount}× / {h.frequencyUnit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onSkip}>
            <SkipForward className="mr-1 h-4 w-4" />
            Skip
          </Button>
          <Button onClick={onNext}>
            Next
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
