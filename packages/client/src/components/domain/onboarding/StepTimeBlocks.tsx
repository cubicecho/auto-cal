import type {
  CreateTimeBlockMutation,
  CreateTimeBlockMutationVariables,
  GetMyTimeblocksForOnboardingQuery,
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
import { FieldWrapper, Form } from '@/components/ui/form';
import { useAppForm } from '@/hooks/form-hook';
import { cn } from '@/lib/utils';
import { useMutation, useQuery } from '@apollo/client/react';
import { ArrowLeft, ArrowRight, Plus } from 'lucide-react';
import { z } from 'zod';

const GET_TIME_BLOCKS = graphql(`
  query GetMyTimeblocksForOnboarding {
    myTimeBlocks {
      id
      activityType { id name color }
      daysOfWeek
      startTime
      endTime
    }
  }
`);

const CREATE_TIME_BLOCK = graphql(`
  mutation CreateTimeBlockOnboarding($input: CreateTimeBlockArgs!) {
    myCreateTimeBlock(input: $input) {
      id
      daysOfWeek
      startTime
      endTime
    }
  }
`);

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const WEEKDAYS = [1, 2, 3, 4, 5];
const WEEKEND = [0, 6];

const schema = z
  .object({
    activityTypeId: z.string().uuid('Activity type is required'),
    daysOfWeek: z
      .array(z.number().int().min(0).max(6))
      .min(1, 'Select at least one day'),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time'),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time'),
  })
  .refine((d) => d.endTime > d.startTime, {
    message: 'End time must be after start time',
    path: ['endTime'],
  });

type FormValues = z.infer<typeof schema>;
type TimeBlock = GetMyTimeblocksForOnboardingQuery['myTimeBlocks'][number];

interface StepTimeBlocksProps {
  onBack: () => void;
  onNext: () => void;
}

export function StepTimeBlocks({ onBack, onNext }: StepTimeBlocksProps) {
  const { data } = useQuery(GET_TIME_BLOCKS);
  const timeBlocks: TimeBlock[] = data?.myTimeBlocks ?? [];

  const [createTimeBlock] = useMutation<
    CreateTimeBlockMutation,
    CreateTimeBlockMutationVariables
  >(CREATE_TIME_BLOCK, {
    refetchQueries: [
      'GetMyTimeblocksForOnboarding',
      'GetMyTimeBlocks',
      'GetCalendarData',
    ],
  });

  const form = useAppForm({
    defaultValues: {
      activityTypeId: '',
      daysOfWeek: [...WEEKDAYS],
      startTime: '09:00',
      endTime: '17:00',
    } as FormValues,
    validators: { onChange: schema },
    onSubmit: async ({ value, formApi }) => {
      await createTimeBlock({
        variables: {
          input: {
            activityTypeId: value.activityTypeId,
            daysOfWeek: value.daysOfWeek,
            startTime: value.startTime,
            endTime: value.endTime,
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
        <CardTitle>Set up your weekly time blocks</CardTitle>
        <CardDescription>
          Time blocks are recurring slots in your week where the scheduler
          places todos and habits. Add one for each regular commitment.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <form.AppForm>
          <Form className="space-y-4">
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

            {/* Days of week */}
            <form.AppField name="daysOfWeek">
              {(field) => (
                <FieldWrapper
                  label="Days"
                  control={
                    <div className="space-y-2">
                      <div className="flex gap-1">
                        {DAY_NAMES.map((name, i) => {
                          const selected = field.state.value.includes(i);
                          return (
                            <button
                              key={name}
                              type="button"
                              onClick={() =>
                                field.handleChange(
                                  selected
                                    ? field.state.value.filter((d) => d !== i)
                                    : [...field.state.value, i].sort(
                                        (a, b) => a - b,
                                      ),
                                )
                              }
                              className={cn(
                                'flex-1 rounded py-1.5 text-xs font-medium transition-colors border',
                                selected
                                  ? 'bg-primary text-primary-foreground border-primary'
                                  : 'bg-background text-muted-foreground border-input hover:border-foreground',
                              )}
                            >
                              {name}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => field.handleChange([...WEEKDAYS])}
                        >
                          Weekdays
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => field.handleChange([...WEEKEND])}
                        >
                          Weekend
                        </Button>
                      </div>
                    </div>
                  }
                />
              )}
            </form.AppField>

            {/* Start / End time */}
            <div className="grid grid-cols-2 gap-4">
              <form.AppField name="startTime">
                {(field) => <field.InputField label="Start time" type="time" />}
              </form.AppField>

              <form.AppField name="endTime">
                {(field) => <field.InputField label="End time" type="time" />}
              </form.AppField>
            </div>

            <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
              {([canSubmit, isSubmitting]) => (
                <Button type="submit" disabled={!canSubmit || !!isSubmitting}>
                  <Plus className="mr-1 h-4 w-4" />
                  {isSubmitting ? 'Adding…' : 'Add time block'}
                </Button>
              )}
            </form.Subscribe>
          </Form>
        </form.AppForm>

        {/* Created list */}
        {timeBlocks.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Created ({timeBlocks.length})
            </p>
            <div className="divide-y rounded-md border">
              {timeBlocks.map((tb) => (
                <div
                  key={tb.id}
                  className="flex items-center gap-3 px-3 py-2 text-sm"
                >
                  {tb.activityType && (
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: tb.activityType.color }}
                    />
                  )}
                  <span className="font-medium">
                    {tb.activityType?.name ?? 'No type'}
                  </span>
                  <span className="text-muted-foreground">
                    {[...tb.daysOfWeek]
                      .sort((a, b) => a - b)
                      .map((d) => DAY_NAMES[d])
                      .join(', ')}
                  </span>
                  <span className="ml-auto text-muted-foreground">
                    {tb.startTime} – {tb.endTime}
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
        <Button onClick={onNext} disabled={timeBlocks.length === 0}>
          Next
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
