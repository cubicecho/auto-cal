import { graphql } from '@/__generated__/index.js';
import { ProjectDetail } from '@/components/domain/project/ProjectDetail';
import { ProjectForm } from '@/components/domain/project/ProjectForm';
import { DetailPage } from '@/components/ui/detail-page';
import { useQuery } from '@apollo/client/react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

const GET_PROJECT_DETAIL = graphql(`
  query GetProjectDetail($id: UUID!) {
    myProject(where: { id: { eq: $id } }) {
      ...Project_ProjectDetail
    }
    myTodos {
      ...Todo_TodoList
    }
  }
`);

export default function ProjectDetailPage() {
  const router = useRouter();
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const [formOpen, setFormOpen] = useState(false);

  const { data, loading } = useQuery(GET_PROJECT_DETAIL, {
    variables: { id: projectId },
    fetchPolicy: 'cache-and-network',
  });

  return (
    <DetailPage
      entity={data?.myProject}
      loading={loading}
      notFoundLabel="Project not found."
      className="px-3 py-4"
    >
      {(project) => (
        <>
          <ProjectDetail
            project={project}
            todos={data?.myTodos ?? []}
            onBack={() => router.push('/projects')}
            onEdit={() => setFormOpen(true)}
          />
          <ProjectForm
            project={{
              id: project.id,
              name: project.name,
              status: project.status,
            }}
            open={formOpen}
            onOpenChange={setFormOpen}
          />
        </>
      )}
    </DetailPage>
  );
}
