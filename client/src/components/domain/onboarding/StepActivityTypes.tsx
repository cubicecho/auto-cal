import type {
  CreateActivityTypeMutation,
  CreateActivityTypeMutationVariables,
  GetActivityTypesForOnboardingQuery,
} from '@/__generated__/graphql.js';
import { graphql } from '@/__generated__/index.js';
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
import { Input } from '@/components/ui/input';
import { useAppForm } from '@/hooks/form-hook';
import { useMutation, useQuery } from '@apollo/client/react';
import { ArrowRight, Plus } from 'lucide-react';
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
    refetchQueries: [
      'GetActivityTypesForOnboarding',
      'GetMyActivityTypes',
      'GetActivityTypesForSelect',
    ],
  });

  const form = useAppForm({
    defaultValues: { name: '', color: '#6366f1' } as FormValues,
    validators: { onChange: schema },
    onSubmit: async ({ value, formApi }) => {
      await createActivityType({
        variables: { input: { name: value.name, color: value.color } },
      });
      formApi.reset();
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your activity types</CardTitle>
        <CardDescription>
          Activity types categorize everything — your todos, habits, and time
          blocks. Create one for each area of your life (e.g. Work, Exercise,
          Learning).
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Inline form */}
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
                        placeholder="#6366f1"
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

            <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
              {([canSubmit, isSubmitting]) => (
                <Button type="submit" disabled={!canSubmit || !!isSubmitting}>
                  <Plus className="mr-1 h-4 w-4" />
                  {isSubmitting ? 'Adding…' : 'Add activity type'}
                </Button>
              )}
            </form.Subscribe>
          </Form>
        </form.AppForm>

        {/* Created list */}
        {activityTypes.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Created ({activityTypes.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {activityTypes.map((at) => (
                <span
                  key={at.id}
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium"
                >
                  <ColorDot color={at.color} size="sm" />
                  {at.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-end">
        <Button onClick={onNext} disabled={activityTypes.length === 0}>
          Next
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
