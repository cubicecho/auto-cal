import type {
  CreateTimeBlockMutation,
  CreateTimeBlockMutationVariables,
  GetMyTimeblocksForOnboardingQuery,
} from '@/__generated__/graphql.js';
import { graphql } from '@/__generated__/index.js';
import { ActivityTypeSelect } from '@/components/domain/activity-type/ActivityTypeSelect';
import {
  CreatedList,
  CreatedRow,
  OnboardingStep,
} from '@/components/domain/onboarding/OnboardingStep';
import { Button } from '@/components/ui/button';
import { FieldWrapper, Form } from '@/components/ui/form';
import { Plus } from '@/components/ui/icons';
import { useAppForm } from '@/hooks/form-hook';
import { DERIVED, invalidate } from '@/lib/cache';
import { DAY_NAMES, WEEKDAYS, WEEKEND } from '@/lib/form-constants';
import { cn } from '@/lib/utils';
import { useMutation, useQuery } from '@apollo/client/react';
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
    update: (cache) => invalidate(cache, 'myTimeBlocks', ...DERIVED),
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
    <OnboardingStep
      title="Set up your weekly time blocks"
      description="Time blocks are recurring slots in your week where the scheduler places todos and habits. Add one for each regular commitment."
      onBack={onBack}
      onNext={onNext}
      nextDisabled={timeBlocks.length === 0}
    >
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
                        variant="outline"
                        size="sm"
                        onPress={() => field.handleChange([...WEEKDAYS])}
                      >
                        Weekdays
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onPress={() => field.handleChange([...WEEKEND])}
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

          <form.SubmitButton
            icon={<Plus className="mr-1 h-4 w-4" />}
            createLabel="Add time block"
            savingLabel="Adding…"
          />
        </Form>
      </form.AppForm>

      <CreatedList count={timeBlocks.length}>
        {timeBlocks.map((tb) => (
          <CreatedRow
            key={tb.id}
            activityType={tb.activityType}
            title={tb.activityType?.name ?? 'No type'}
            detail={[...tb.daysOfWeek]
              .sort((a, b) => a - b)
              .map((d) => DAY_NAMES[d])
              .join(', ')}
            meta={`${tb.startTime} – ${tb.endTime}`}
          />
        ))}
      </CreatedList>
    </OnboardingStep>
  );
}
