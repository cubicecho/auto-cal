import type {
  CreateTimeBlockMutation,
  CreateTimeBlockMutationVariables,
  TimeBlock_TimeBlockListFragment,
  UpdateTimeBlockMutation,
  UpdateTimeBlockMutationVariables,
} from '@/__generated__/graphql.js';
import { graphql } from '@/__generated__/index.js';
import { ActivityTypeSelect } from '@/components/domain/activity-type/ActivityTypeSelect';
import { FieldRow, FieldWrapper, Form } from '@/components/ui/form';
import { FormDialog, FormDialogFooter } from '@/components/ui/form-dialog';
import { ToggleChip } from '@/components/ui/toggle-chip';
import { useAppForm } from '@/hooks/form-hook';
import { useResetOnOpen } from '@/hooks/useResetOnOpen';
import { DERIVED, invalidate } from '@/lib/cache';
import { DAY_NAMES, WEEKDAYS, WEEKEND } from '@/lib/form-constants';
import { useMutation } from '@apollo/client/react';
import { Text, View } from 'react-native';
import { z } from 'zod';

// ─── GraphQL Operations ────────────────────────────────────────────────────

const CREATE_TIME_BLOCK = graphql(`
  mutation CreateTimeBlock($input: CreateTimeBlockArgs!) {
    myCreateTimeBlock(input: $input) {
      id
      activityType {
        id
        name
        color
      }
      daysOfWeek
      startTime
      endTime
    }
  }
`);

const UPDATE_TIME_BLOCK = graphql(`
  mutation UpdateTimeBlock($input: UpdateTimeBlockArgs!) {
    myUpdateTimeBlock(input: $input) {
      id
      activityType {
        id
        name
        color
      }
      daysOfWeek
      startTime
      endTime
    }
  }
`);

// ─── Validation Schema ──────────────────────────────────────────────────────

const timeBlockSchema = z
  .object({
    activityTypeId: z.string().uuid('Activity type is required'),
    daysOfWeek: z
      .array(z.number().int().min(0).max(6))
      .min(1, 'Select at least one day')
      .max(7)
      .refine((days) => new Set(days).size === days.length, {
        message: 'Days of week must be unique',
      }),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
    priority: z.number().int().min(0).max(100),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: 'End time must be after start time',
    path: ['endTime'],
  });

type TimeBlockFormValues = z.infer<typeof timeBlockSchema>;

// ─── Props ─────────────────────────────────────────────────────────────────

type TimeBlockFormProps = {
  timeBlock?: TimeBlock_TimeBlockListFragment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// ─── Component ─────────────────────────────────────────────────────────────

export function TimeBlockForm({
  timeBlock,
  open,
  onOpenChange,
}: TimeBlockFormProps) {
  const isEdit = timeBlock !== undefined;

  const [createTimeBlock] = useMutation<
    CreateTimeBlockMutation,
    CreateTimeBlockMutationVariables
  >(CREATE_TIME_BLOCK, {
    update: (cache) => invalidate(cache, 'myTimeBlocks', ...DERIVED),
  });

  const [updateTimeBlock] = useMutation<
    UpdateTimeBlockMutation,
    UpdateTimeBlockMutationVariables
  >(UPDATE_TIME_BLOCK, {
    // The mutation returns the block, so the normalized entity — and every
    // list holding it — patches itself. Only the schedule has to be dropped.
    update: (cache) => invalidate(cache, ...DERIVED),
  });

  const defaultValues: TimeBlockFormValues = {
    activityTypeId: timeBlock?.activityType?.id ?? '',
    daysOfWeek: timeBlock?.daysOfWeek ?? [1],
    startTime: timeBlock?.startTime ?? '09:00',
    endTime: timeBlock?.endTime ?? '10:00',
    priority: timeBlock?.priority ?? 0,
  };

  const form = useAppForm({
    defaultValues,
    validators: {
      onChange: timeBlockSchema,
    },
    onSubmit: async ({ value }) => {
      if (isEdit && timeBlock) {
        await updateTimeBlock({
          variables: {
            input: {
              id: timeBlock.id,
              activityTypeId: value.activityTypeId,
              daysOfWeek: value.daysOfWeek,
              startTime: value.startTime,
              endTime: value.endTime,
              priority: value.priority,
            },
          },
        });
      } else {
        await createTimeBlock({
          variables: {
            input: {
              activityTypeId: value.activityTypeId,
              daysOfWeek: value.daysOfWeek,
              startTime: value.startTime,
              endTime: value.endTime,
              priority: value.priority,
            },
          },
        });
      }
      onOpenChange(false);
    },
  });

  useResetOnOpen(open, timeBlock?.id, () => form.reset(defaultValues));

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Edit Time Block' : 'New Time Block'}
      description={
        isEdit
          ? 'Update the details of this time block.'
          : 'Define a recurring time slot for a specific activity type.'
      }
    >
      <form.AppForm>
        <Form className="gap-4">
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

          {/* Days of Week — toggle button group */}
          <form.AppField name="daysOfWeek">
            {(field) => (
              <View className="gap-2">
                <Text className="text-sm font-medium leading-none text-foreground">
                  Days of Week
                </Text>
                <View className="flex-row gap-1 flex-wrap">
                  <ToggleChip
                    size="sm"
                    onPress={() => field.handleChange([...WEEKDAYS])}
                  >
                    Weekdays
                  </ToggleChip>
                  <ToggleChip
                    size="sm"
                    onPress={() => field.handleChange([...WEEKEND])}
                  >
                    Weekend
                  </ToggleChip>
                </View>
                <View className="flex-row gap-1 flex-wrap">
                  {DAY_NAMES.map((day, index) => {
                    const current = field.state.value as number[];
                    const selected = current.includes(index);
                    const isLastSelected = selected && current.length === 1;
                    return (
                      <ToggleChip
                        key={day}
                        size="sm"
                        selected={selected}
                        disabled={isLastSelected}
                        onPress={() => {
                          if (selected) {
                            field.handleChange(
                              current.filter((d) => d !== index),
                            );
                          } else {
                            field.handleChange(
                              [...current, index].sort((a, b) => a - b),
                            );
                          }
                        }}
                      >
                        {day}
                      </ToggleChip>
                    );
                  })}
                </View>
                {field.state.meta.errors.length > 0 && (
                  <Text className="text-sm text-destructive">
                    {(() => {
                      const err = field.state.meta.errors[0];
                      if (typeof err === 'string') return err;
                      if (err && typeof err === 'object' && 'message' in err)
                        return String((err as { message: unknown }).message);
                      return String(err);
                    })()}
                  </Text>
                )}
              </View>
            )}
          </form.AppField>

          {/* Start + End Time — two columns */}
          <FieldRow>
            {/* Start Time */}
            <form.AppField name="startTime">
              {(field) => <field.InputField label="Start Time" type="time" />}
            </form.AppField>

            {/* End Time */}
            <form.AppField name="endTime">
              {(field) => <field.InputField label="End Time" type="time" />}
            </form.AppField>
          </FieldRow>

          {/* Priority */}
          <form.AppField name="priority">
            {(field) => (
              <field.InputField
                label="Priority (0 = lowest)"
                type="number"
                min={0}
                max={100}
              />
            )}
          </form.AppField>

          <FormDialogFooter onCancel={() => onOpenChange(false)}>
            <form.SubmitButton
              isEdit={isEdit}
              createLabel="Create Time Block"
            />
          </FormDialogFooter>
        </Form>
      </form.AppForm>
    </FormDialog>
  );
}
