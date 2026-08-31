import type { Project_ProjectListFragment } from '@/__generated__/graphql.js';
import { graphql } from '@/__generated__/index.js';
import { Button } from '@/components/ui/button';
import { FolderKanban, Plus } from '@/components/ui/icons';
import { CardGrid, EmptyState, PageHeader } from '@/components/ui/page';
import { SwitchField } from '@/components/ui/switch-field';
import { useListSection } from '@/hooks/useListSection';
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
  const { formOpen, editing, openCreate, openEdit, handleOpenChange } =
    useListSection<Project>();
  const [showArchived, setShowArchived] = useState(false);

  const visible = showArchived
    ? items
    : items.filter((p) => p.status !== 'archived');

  return (
    <>
      <PageHeader
        title="Projects"
        subtitle="Goals with dedicated notes, tasks, and reserved time blocks"
        actions={
          <>
            <SwitchField
              id="show-archived-projects"
              label="Show archived"
              checked={showArchived}
              onCheckedChange={setShowArchived}
            />
            <Button size="sm" onPress={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </>
        }
      />

      {visible.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Create a project to group notes, tasks, and dedicated time"
          action={
            <Button size="sm" onPress={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              New project
            </Button>
          }
        />
      ) : (
        <CardGrid>
          {visible.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onSelect={onSelect}
              onEdit={openEdit}
            />
          ))}
        </CardGrid>
      )}

      <ProjectForm
        {...(editing !== null ? { project: editing } : {})}
        open={formOpen}
        onOpenChange={handleOpenChange}
      />
    </>
  );
}
