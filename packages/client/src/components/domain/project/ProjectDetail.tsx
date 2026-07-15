import type {
  ArchiveProjectMutation,
  ArchiveProjectMutationVariables,
  Project_ProjectDetailFragment,
  Todo_TodoListFragment,
} from '@/__generated__/graphql.js';
import { graphql } from '@/__generated__/index.js';
import { TodoListCard } from '@/components/domain/todo-list/TodoListCard';
import { Button } from '@/components/ui/button';
import { ColorDot } from '@/components/ui/color-dot';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useMutation } from '@apollo/client/react';
import { Archive, ArrowLeft, Pencil } from 'lucide-react';
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

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-primary/10 text-primary',
  completed: 'bg-green-500/10 text-green-600',
  archived: 'bg-muted text-muted-foreground',
};

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
    refetchQueries: ['GetProjectsPage', 'GetProjectDetail'],
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
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          aria-label="Back to projects"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {project.activityType && (
              <ColorDot
                color={project.activityType.color}
                title={project.activityType.name}
              />
            )}
            <h2 className="text-2xl font-bold">{project.name}</h2>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[11px] font-medium capitalize',
                STATUS_STYLES[project.status] ?? STATUS_STYLES.active,
              )}
            >
              {project.status}
            </span>
          </div>
          {project.activityType && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              Activity type: {project.activityType.name}
            </p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => onEdit(project)}>
          <Pencil className="mr-1.5 h-3.5 w-3.5" />
          Edit
        </Button>
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
      </div>

      <Tabs defaultValue="notes">
        <TabsList>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="notes" className="pt-2">
          <ProjectNotesEditor projectId={project.id} notes={project.notes} />
        </TabsContent>

        <TabsContent value="tasks" className="pt-2">
          {project.list ? (
            <div className="max-w-md">
              <TodoListCard list={project.list} todos={listTodos} />
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              This project has no todo list.
            </p>
          )}
        </TabsContent>
      </Tabs>

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
