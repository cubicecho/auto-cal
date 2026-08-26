import type {
  ArchiveProjectMutation,
  ArchiveProjectMutationVariables,
  Project_ProjectDetailFragment,
  Todo_TodoListFragment,
} from '@/__generated__/graphql.js';
import { graphql } from '@/__generated__/index.js';
import { TodoListCard } from '@/components/domain/todo-list/TodoListCard';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DetailHeader, EditButton } from '@/components/ui/detail-header';
import { SectionHeading } from '@/components/ui/section-heading';
import { StatusChip } from '@/components/ui/status-chip';
import { invalidate } from '@/lib/cache';
import { useMutation } from '@apollo/client/react';
import { Archive } from 'lucide-react';
import { useState } from 'react';
import { ProjectNotesEditor } from './ProjectNotesEditor';

export const PROJECT_DETAIL_FRAGMENT = graphql(`
  fragment Project_ProjectDetail on Project {
    id
    name
    status
    activityType {
      id
      name
      color
    }
    notes {
      ...ProjectNote_Editor
    }
    list {
      ...TodoList_TodoListList
    }
  }
`);

const ARCHIVE_PROJECT = graphql(`
  mutation ArchiveProject($id: ID!) {
    myArchiveProject(id: $id) {
      id
      status
    }
  }
`);

type Project = Project_ProjectDetailFragment;
type Todo = Todo_TodoListFragment;

type ProjectDetailProps = {
  project: Project;
  todos: Todo[];
  onBack: () => void;
  onEdit: (project: Project) => void;
};

export function ProjectDetail({
  project,
  todos,
  onBack,
  onEdit,
}: ProjectDetailProps) {
  const [archiveOpen, setArchiveOpen] = useState(false);

  const [archiveProject, { loading: archiving }] = useMutation<
    ArchiveProjectMutation,
    ArchiveProjectMutationVariables
  >(ARCHIVE_PROJECT, {
    // The status change drops it out of `myProjects` unless the caller asked
    // for archived ones, so this is a membership change, not just a patch.
    update: (cache) => invalidate(cache, 'myProjects'),
  });

  const listTodos = project.list
    ? todos.filter((t) => t.list?.id === project.list?.id)
    : [];

  async function handleArchive() {
    await archiveProject({ variables: { id: project.id } });
    setArchiveOpen(false);
  }

  return (
    <div className="space-y-4">
      <DetailHeader
        onBack={onBack}
        backLabel="Back to projects"
        color={project.activityType?.color}
        colorLabel={project.activityType?.name}
        title={project.name}
        badge={<StatusChip status={project.status} />}
        subtitle={
          project.activityType
            ? `Activity type: ${project.activityType.name}`
            : undefined
        }
        actions={
          <>
            <EditButton onClick={() => onEdit(project)} />
            {project.status !== 'archived' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setArchiveOpen(true)}
              >
                <Archive className="mr-1.5 h-3.5 w-3.5" />
                Archive
              </Button>
            )}
          </>
        }
      />

      {/* Notes and tasks sit side by side on medium+ screens and stack on
          narrow ones. */}
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_18rem] lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0">
          <SectionHeading className="mb-2">Notes</SectionHeading>
          <ProjectNotesEditor projectId={project.id} notes={project.notes} />
        </div>

        <div className="min-w-0">
          <SectionHeading className="mb-2">Tasks</SectionHeading>
          {project.list ? (
            <TodoListCard list={project.list} todos={listTodos} />
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              This project has no todo list.
            </p>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title="Archive project?"
        description={
          <>
            &ldquo;{project.name}&rdquo; will be hidden from the default project
            list. Nothing is deleted.
          </>
        }
        confirmLabel="Archive"
        loading={archiving}
        onConfirm={handleArchive}
      />
    </div>
  );
}
