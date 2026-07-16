import { graphql } from '@/__generated__/index.js';
import { ProjectList } from '@/components/domain/project/ProjectList';
import { Page } from '@/components/ui/page';
import { useDataChanged } from '@/hooks/useDataChanged';
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
  const { data, refetch } = useQuery(GET_PROJECTS_PAGE, {
    fetchPolicy: 'cache-and-network',
  });
  useDataChanged('project', () => {
    refetch();
  });

  return (
    <Page>
      <ProjectList
        items={data?.myProjects ?? []}
        onSelect={(project) => router.push(`/projects/${project.id}`)}
      />
    </Page>
  );
}
