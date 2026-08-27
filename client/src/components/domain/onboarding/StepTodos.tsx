import type {
  CreateTodoMutation,
  CreateTodoMutationVariables,
} from '@/__generated__/graphql.js';
import { graphql } from '@/__generated__/index.js';
import {
  CreatedList,
  CreatedRow,
  OnboardingStep,
} from '@/components/domain/onboarding/OnboardingStep';
import { TodoListSelect } from '@/components/domain/todo-list/TodoListSelect';
import { FieldWrapper, Form } from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppForm } from '@/hooks/form-hook';
import { DERIVED, invalidate } from '@/lib/cache';
import { PRIORITY_OPTIONS } from '@/lib/form-constants';
import { useMutation, useQuery } from '@apollo/client/react';
import { Plus } from 'lucide-react';
import { z } from 'zod';

const GET_TODOS = graphql(`
  query GetMyTodosForOnboarding {
    myTodos {
      id
      title
      priority
      list { id name }
      activityType { id name color }
    }
  }
`);

const CREATE_TODO = graphql(`
  mutation CreateTodoOnboarding($input: CreateTodoArgs!) {
    myCreateTodo(input: $input) {
      id
      title
    }
  }
`);

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  listId: z.string().uuid('List is required'),
  priority: z.number().int().min(0).max(100),
});

type FormValues = z.infer<typeof schema>;

interface StepTodosProps {
  onBack: () => void;
  onFinish: () => void;
  onSkip: () => void;
}

export function StepTodos({ onBack, onFinish, onSkip }: StepTodosProps) {
  const { data } = useQuery(GET_TODOS);
  const todos = data?.myTodos ?? [];

  const [createTodo] = useMutation<
    CreateTodoMutation,
    CreateTodoMutationVariables
  >(CREATE_TODO, {
    update: (cache) => invalidate(cache, 'myTodos', ...DERIVED),
  });

  const form = useAppForm({
    defaultValues: {
      title: '',
      listId: '',
      priority: 0,
    } as FormValues,
    validators: { onChange: schema },
    onSubmit: async ({ value, formApi }) => {
      await createTodo({
        variables: {
          input: {
            title: value.title,
            listId: value.listId,
            priority: value.priority,
            estimatedLength: 30,
          },
        },
      });
      formApi.reset();
    },
  });

  return (
    <OnboardingStep
      title="Add your first todos"
      description="Todos are one-time tasks the scheduler places into your time blocks. Each todo belongs to a list. This step is optional — you can add todos any time."
      onBack={onBack}
      onSkip={onSkip}
      onNext={onFinish}
      nextLabel="Finish setup"
      isFinal
    >
      <form.AppForm>
        <Form className="space-y-4">
          <form.AppField name="title">
            {(field) => (
              <field.InputField
                label="Title"
                placeholder="e.g. Review Q2 report, Call dentist"
              />
            )}
          </form.AppField>

          <div className="grid grid-cols-2 gap-4">
            <form.AppField name="priority">
              {(field) => (
                <FieldWrapper
                  label="Priority"
                  control={
                    <Select
                      value={String(field.state.value)}
                      onValueChange={(v) => field.handleChange(Number(v))}
                    >
                      <SelectTrigger onBlur={field.handleBlur}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITY_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  }
                />
              )}
            </form.AppField>

            <form.AppField name="listId">
              {(field) => (
                <FieldWrapper
                  label="List"
                  control={
                    <TodoListSelect
                      value={field.state.value || undefined}
                      onValueChange={(v) => field.handleChange(v ?? '')}
                      onBlur={field.handleBlur}
                    />
                  }
                />
              )}
            </form.AppField>
          </div>

          <form.SubmitButton
            icon={<Plus className="mr-1 h-4 w-4" />}
            createLabel="Add todo"
            savingLabel="Adding…"
          />
        </Form>
      </form.AppForm>

      <CreatedList count={todos.length}>
        {todos.map((t) => (
          <CreatedRow
            key={t.id}
            activityType={t.activityType}
            title={t.title}
            meta={`priority ${t.priority}`}
          />
        ))}
      </CreatedList>
    </OnboardingStep>
  );
}
