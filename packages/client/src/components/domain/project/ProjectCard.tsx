import type { Project_ProjectListFragment } from '@/__generated__/graphql.js';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Pencil } from 'lucide-react';

type Project = Project_ProjectListFragment;

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-primary/10 text-primary',
  completed: 'bg-green-500/10 text-green-600',
  archived: 'bg-muted text-muted-foreground',
};

type ProjectCardProps = {
  project: Project;
  onSelect: (project: Project) => void;
  onEdit: (project: Project) => void;
};

export function ProjectCard({ project, onSelect, onEdit }: ProjectCardProps) {
  return (
    <Card
      className="flex cursor-pointer flex-col transition-colors"
      accentColor={project.activityType?.color}
      accentLabel={project.activityType?.name}
      onClick={() => onSelect(project)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate text-base">{project.name}</CardTitle>
            {project.activityType && (
              <CardDescription className="text-xs">
                {project.activityType.name}
              </CardDescription>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[11px] font-medium capitalize',
                STATUS_STYLES[project.status] ?? STATUS_STYLES.active,
              )}
            >
              {project.status}
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(project);
              }}
              aria-label={`Edit ${project.name}`}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      {project.list && (
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground">
            List: {project.list.name}
          </p>
        </CardContent>
      )}
    </Card>
  );
}
