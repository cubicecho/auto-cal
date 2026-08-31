import type {
  CreateProjectMutation,
  CreateProjectMutationVariables,
  UpdateProjectMutation,
  UpdateProjectMutationVariables,
} from '@/__generated__/graphql.js';
import { graphql } from '@/__generated__/index.js';
import { ActivityTypeSelect } from '@/components/domain/activity-type/ActivityTypeSelect';
import { FieldWrapper, Form } from '@/components/ui/form';
import { FormDialog, FormDialogFooter } from '@/components/ui/form-dialog';
import { useAppForm } from '@/hooks/form-hook';
import { useResetOnOpen } from '@/hooks/useResetOnOpen';
import { DERIVED, invalidate } from '@/lib/cache';
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
  parentActivityTypeId: z.uuid('Pick a parent activity type'),
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
    update: (cache) => invalidate(cache, 'myProjects'),
  });

  const [updateProject] = useMutation<
    UpdateProjectMutation,
    UpdateProjectMutationVariables
  >(UPDATE_PROJECT, {
    // Returns the project, so both pages patch themselves; its activity type
    // is what the scheduler reads, hence the derived fields.
    update: (cache) => invalidate(cache, ...DERIVED),
  });

  const createDefaultValues = { name: '', parentActivityTypeId: '' };

  const createForm = useAppForm({
    defaultValues: createDefaultValues,
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

  const editDefaultValues = {
    name: project?.name ?? '',
    status: project?.status ?? 'active',
  };

  const editForm = useAppForm({
    defaultValues: editDefaultValues,
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

  // Both forms, not just the edit one: this dialog is the only place with two
  // form instances, and resetting only `editForm` left a cancelled "New
  // Project" holding its typed-in name the next time it opened.
  useResetOnOpen(open, project?.id, () => {
    createForm.reset(createDefaultValues);
    editForm.reset(editDefaultValues);
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Edit Project' : 'New Project'}
      description={
        isEdit
          ? 'Update the project name and status.'
          : 'A dedicated activity type and todo list are created automatically under the parent you choose.'
      }
    >
      {isEdit ? (
        <editForm.AppForm>
          <Form className="gap-4">
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

            <FormDialogFooter onCancel={() => onOpenChange(false)}>
              <editForm.SubmitButton isEdit />
            </FormDialogFooter>
          </Form>
        </editForm.AppForm>
      ) : (
        <createForm.AppForm>
          <Form className="gap-4">
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

            <FormDialogFooter onCancel={() => onOpenChange(false)}>
              <createForm.SubmitButton
                createLabel="Create project"
                savingLabel="Creating…"
              />
            </FormDialogFooter>
          </Form>
        </createForm.AppForm>
      )}
    </FormDialog>
  );
}
