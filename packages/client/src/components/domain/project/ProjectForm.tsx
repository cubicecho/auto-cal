import type {
  CreateProjectMutation,
  CreateProjectMutationVariables,
  UpdateProjectMutation,
  UpdateProjectMutationVariables,
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
import { useAppForm } from '@/hooks/form-hook';
import { useMutation } from '@apollo/client/react';
import { z } from 'zod';

const CREATE_PROJECT = graphql(`
  mutation CreateProject($input: CreateProjectArgs!) {
    myCreateProject(input: $input) {
      id
      name
      status
      activityType { id name color }
      list { id name }
    }
  }
`);

const UPDATE_PROJECT = graphql(`
  mutation UpdateProject($input: UpdateProjectArgs!) {
    myUpdateProject(input: $input) {
      id
      name
      status
      activityType { id name color }
      list { id name }
    }
  }
`);

const STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Completed', value: 'completed' },
  { label: 'Archived', value: 'archived' },
] as const;

// Create and edit diverge: creation picks a parent activity type (a dedicated
// child type is auto-created server-side); editing exposes name + status only.
const createSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  parentActivityTypeId: z.string().uuid('Pick a parent activity type'),
});

const editSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  status: z.string().min(1),
});

// The form only touches these fields in edit mode; accepting a structural
// subset lets both the list card (full fragment) and the detail page pass
// their objects directly without narrowing.
type EditableProject = {
  id: string;
  name: string;
  status: string;
};

type ProjectFormProps = {
  project?: EditableProject;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ProjectForm({ project, open, onOpenChange }: ProjectFormProps) {
  const isEdit = project !== undefined;

  const [createProject] = useMutation<
    CreateProjectMutation,
    CreateProjectMutationVariables
  >(CREATE_PROJECT, {
    refetchQueries: ['GetProjectsPage'],
  });

  const [updateProject] = useMutation<
    UpdateProjectMutation,
    UpdateProjectMutationVariables
  >(UPDATE_PROJECT, {
    refetchQueries: ['GetProjectsPage', 'GetProjectDetail'],
  });

  const createForm = useAppForm({
    defaultValues: { name: '', parentActivityTypeId: '' },
    validators: { onChange: createSchema },
    onSubmit: async ({ value }) => {
      await createProject({
        variables: {
          input: {
            name: value.name,
            parentActivityTypeId: value.parentActivityTypeId,
          },
        },
      });
      onOpenChange(false);
    },
  });

  const editForm = useAppForm({
    defaultValues: {
      name: project?.name ?? '',
      status: project?.status ?? 'active',
    },
    validators: { onChange: editSchema },
    onSubmit: async ({ value }) => {
      if (!project) return;
      await updateProject({
        variables: {
          input: { id: project.id, name: value.name, status: value.status },
        },
      });
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Project' : 'New Project'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the project name and status.'
              : 'A dedicated activity type and todo list are created automatically under the parent you choose.'}
          </DialogDescription>
        </DialogHeader>

        {isEdit ? (
          <editForm.AppForm>
            <Form className="space-y-4">
              <editForm.AppField name="name">
                {(field) => (
                  <field.InputField label="Name" placeholder="Project name" />
                )}
              </editForm.AppField>

              <editForm.AppField name="status">
                {(field) => (
                  <field.SelectField
                    label="Status"
                    options={STATUS_OPTIONS}
                    placeholder="Select status"
                  />
                )}
              </editForm.AppField>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <editForm.Subscribe
                  selector={(s) => [s.canSubmit, s.isSubmitting]}
                >
                  {([canSubmit, isSubmitting]) => (
                    <Button
                      type="submit"
                      disabled={!canSubmit || !!isSubmitting}
                    >
                      {isSubmitting ? 'Saving…' : 'Save changes'}
                    </Button>
                  )}
                </editForm.Subscribe>
              </DialogFooter>
            </Form>
          </editForm.AppForm>
        ) : (
          <createForm.AppForm>
            <Form className="space-y-4">
              <createForm.AppField name="name">
                {(field) => (
                  <field.InputField
                    label="Name"
                    placeholder="e.g. Website redesign"
                  />
                )}
              </createForm.AppField>

              <createForm.AppField name="parentActivityTypeId">
                {(field) => (
                  <FieldWrapper
                    label="Parent activity type"
                    control={
                      <ActivityTypeSelect
                        value={field.state.value || undefined}
                        onValueChange={(v) => field.handleChange(v ?? '')}
                        onBlur={field.handleBlur}
                      />
                    }
                  />
                )}
              </createForm.AppField>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <createForm.Subscribe
                  selector={(s) => [s.canSubmit, s.isSubmitting]}
                >
                  {([canSubmit, isSubmitting]) => (
                    <Button
                      type="submit"
                      disabled={!canSubmit || !!isSubmitting}
                    >
                      {isSubmitting ? 'Creating…' : 'Create project'}
                    </Button>
                  )}
                </createForm.Subscribe>
              </DialogFooter>
            </Form>
          </createForm.AppForm>
        )}
      </DialogContent>
    </Dialog>
  );
}
