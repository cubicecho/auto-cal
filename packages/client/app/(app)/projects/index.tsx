import { graphql } from '@/__generated__/index.js';
import { ProjectList } from '@/components/domain/project/ProjectList';
import { useQuery } from '@apollo/client/react';
import { useRouter } from 'expo-router';

const GET_PROJECTS_PAGE = graphql(`
  query GetProjectsPage {
    myProjects(includeArchived: true) {
      ...Project_ProjectList
    }
  }
`);

export default function ProjectsPage() {
  const router = useRouter();
  const { data } = useQuery(GET_PROJECTS_PAGE, {
    fetchPolicy: 'cache-and-network',
  });

  return (
    <div className="container mx-auto flex-1 overflow-y-auto px-4 py-6">
      <ProjectList
        items={data?.myProjects ?? []}
        onSelect={(project) => router.push(`/projects/${project.id}`)}
      />
    </div>
  );
}
