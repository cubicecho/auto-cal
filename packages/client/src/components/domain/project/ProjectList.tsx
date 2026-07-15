import type { Project_ProjectListFragment } from '@/__generated__/graphql.js';
import { graphql } from '@/__generated__/index.js';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { FolderKanban, Plus } from 'lucide-react';
import { useState } from 'react';
import { ProjectCard } from './ProjectCard';
import { ProjectForm } from './ProjectForm';

export const PROJECT_LIST_FRAGMENT = graphql(`
  fragment Project_ProjectList on Project {
    id
    name
    status
    createdAt
    activityType {
      id
      name
      color
    }
    list {
      id
      name
    }
  }
`);

type Project = Project_ProjectListFragment;

type ProjectListProps = {
  items: Project[];
  onSelect: (project: Project) => void;
};

export function ProjectList({ items, onSelect }: ProjectListProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const visible = showArchived
    ? items
    : items.filter((p) => p.status !== 'archived');

  function openCreate() {
    setEditingProject(null);
    setFormOpen(true);
  }

  function openEdit(project: Project) {
    setEditingProject(project);
    setFormOpen(true);
  }

  function handleFormOpenChange(open: boolean) {
    setFormOpen(open);
    if (!open) setEditingProject(null);
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Projects</h2>
          <p className="text-sm text-muted-foreground">
            Goals with dedicated notes, tasks, and reserved time blocks
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label
            htmlFor="show-archived-projects"
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <Switch
              id="show-archived-projects"
              checked={showArchived}
              onCheckedChange={setShowArchived}
            />
            Show archived
          </label>
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <div className="rounded-full bg-muted p-3">
            <FolderKanban className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-sm">No projects yet</p>
            <p className="text-sm text-muted-foreground">
              Create a project to group notes, tasks, and dedicated time
            </p>
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onSelect={onSelect}
              onEdit={openEdit}
            />
          ))}
        </div>
      )}

      <ProjectForm
        {...(editingProject !== null ? { project: editingProject } : {})}
        open={formOpen}
        onOpenChange={handleFormOpenChange}
      />
    </>
  );
}
