import type {
  CreateActivityTypeMutation,
  CreateActivityTypeMutationVariables,
  GetActivityTypesForOnboardingQuery,
} from '@/__generated__/graphql.js';
import { graphql } from '@/__generated__/index.js';
import {
  CreatedList,
  OnboardingStep,
} from '@/components/domain/onboarding/OnboardingStep';
import { ColorDot } from '@/components/ui/color-dot';
import { FieldWrapper, Form } from '@/components/ui/form';
import { Plus } from '@/components/ui/icons';
import { Input } from '@/components/ui/input';
import { useAppForm } from '@/hooks/form-hook';
import { DERIVED, invalidate } from '@/lib/cache';
import { DEFAULT_ACTIVITY_COLOR } from '@/lib/form-constants';
import { useMutation, useQuery } from '@apollo/client/react';
import { z } from 'zod';

const GET_MY_ACTIVITY_TYPES = graphql(`
  query GetActivityTypesForOnboarding {
    myActivityTypes {
      id
      name
      color
    }
  }
`);

const CREATE_ACTIVITY_TYPE = graphql(`
  mutation CreateActivityTypeOnboarding($input: CreateActivityTypeArgs!) {
    myCreateActivityType(input: $input) {
      id
      name
      color
    }
  }
`);

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color'),
});

type FormValues = z.infer<typeof schema>;
type ActivityType =
  GetActivityTypesForOnboardingQuery['myActivityTypes'][number];

interface StepActivityTypesProps {
  onNext: () => void;
}

export function StepActivityTypes({ onNext }: StepActivityTypesProps) {
  const { data } = useQuery(GET_MY_ACTIVITY_TYPES);
  const activityTypes: ActivityType[] = data?.myActivityTypes ?? [];

  const [createActivityType] = useMutation<
    CreateActivityTypeMutation,
    CreateActivityTypeMutationVariables
  >(CREATE_ACTIVITY_TYPE, {
    // One field name in place of three query names — and it also covers the
    // several other `myActivityTypes` pickers that were never listed here.
    update: (cache) => invalidate(cache, 'myActivityTypes', ...DERIVED),
  });

  const form = useAppForm({
    defaultValues: { name: '', color: DEFAULT_ACTIVITY_COLOR } as FormValues,
    validators: { onChange: schema },
    onSubmit: async ({ value, formApi }) => {
      await createActivityType({
        variables: { input: { name: value.name, color: value.color } },
      });
      formApi.reset();
    },
  });

  return (
    <OnboardingStep
      title="Create your activity types"
      description="Activity types categorize everything — your todos, habits, and time blocks. Create one for each area of your life (e.g. Work, Exercise, Learning)."
      onNext={onNext}
      nextDisabled={activityTypes.length === 0}
    >
      <form.AppForm>
        <Form className="space-y-4">
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
                      onChangeText={(text) => field.handleChange(text)}
                      onBlur={field.handleBlur}
                      className="font-mono"
                    />
                  </div>
                }
              />
            )}
          </form.AppField>

          <form.SubmitButton
            icon={<Plus className="mr-1 h-4 w-4" />}
            createLabel="Add activity type"
            savingLabel="Adding…"
          />
        </Form>
      </form.AppForm>

      <CreatedList count={activityTypes.length} layout="chips">
        {activityTypes.map((at) => (
          <span
            key={at.id}
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium"
          >
            <ColorDot color={at.color} size="sm" />
            {at.name}
          </span>
        ))}
      </CreatedList>
    </OnboardingStep>
  );
}
