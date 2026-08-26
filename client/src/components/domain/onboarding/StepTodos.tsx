import type {
  CreateTodoMutation,
  CreateTodoMutationVariables,
} from '@/__generated__/graphql.js';
import { graphql } from '@/__generated__/index.js';
import { TodoListSelect } from '@/components/domain/todo-list/TodoListSelect';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppForm } from '@/hooks/form-hook';
import { DERIVED, invalidate } from '@/lib/cache';
import { useMutation, useQuery } from '@apollo/client/react';
import { ArrowLeft, CheckCircle2, Plus, SkipForward } from 'lucide-react';
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

const PRIORITY_OPTIONS = [
  { label: 'Low', value: '0' },
  { label: 'Medium', value: '25' },
  { label: 'High', value: '50' },
  { label: 'Urgent', value: '100' },
] as const;

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
    <Card>
      <CardHeader>
        <CardTitle>Add your first todos</CardTitle>
        <CardDescription>
          Todos are one-time tasks the scheduler places into your time blocks.
          Each todo belongs to a list. This step is optional — you can add todos
          any time.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
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

            <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
              {([canSubmit, isSubmitting]) => (
                <Button type="submit" disabled={!canSubmit || !!isSubmitting}>
                  <Plus className="mr-1 h-4 w-4" />
                  {isSubmitting ? 'Adding…' : 'Add todo'}
                </Button>
              )}
            </form.Subscribe>
          </Form>
        </form.AppForm>

        {todos.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Created ({todos.length})
            </p>
            <div className="divide-y rounded-md border">
              {todos.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 px-3 py-2 text-sm"
                >
                  {t.activityType && (
                    <ColorDot
                      color={t.activityType.color}
                      size="sm"
                      title={t.activityType.name}
                    />
                  )}
                  <span className="font-medium">{t.title}</span>
                  <span className="ml-auto text-muted-foreground text-xs">
                    priority {t.priority}
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
          <Button onClick={onFinish}>
            <CheckCircle2 className="mr-1 h-4 w-4" />
            Finish setup
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
