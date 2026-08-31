import type { Project_ProjectListFragment } from '@/__generated__/graphql.js';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Pencil } from '@/components/ui/icons';
import { StatusChip } from '@/components/ui/status-chip';
import { Text, View } from 'react-native';

type Project = Project_ProjectListFragment;

type ProjectCardProps = {
  project: Project;
  onSelect: (project: Project) => void;
  onEdit: (project: Project) => void;
};

export function ProjectCard({ project, onSelect, onEdit }: ProjectCardProps) {
  return (
    <Card
      className="cursor-pointer flex-col transition-colors"
      accentColor={project.activityType?.color}
      accentLabel={project.activityType?.name}
      onPress={() => onSelect(project)}
    >
      <CardHeader className="pb-3">
        <View className="flex-row items-start justify-between gap-2">
          <View className="min-w-0 flex-1">
            <CardTitle className="truncate text-base">{project.name}</CardTitle>
            {project.activityType && (
              <CardDescription className="text-xs">
                {project.activityType.name}
              </CardDescription>
            )}
          </View>
          <View className="flex-row shrink-0 items-center gap-1">
            <StatusChip status={project.status} />
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onPress={(e) => {
                e.stopPropagation();
                onEdit(project);
              }}
              aria-label={`Edit ${project.name}`}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </View>
        </View>
      </CardHeader>
      {project.list && (
        <CardContent className="pt-0">
          <Text className="text-xs text-muted-foreground">
            List: {project.list.name}
          </Text>
        </CardContent>
      )}
    </Card>
  );
}
