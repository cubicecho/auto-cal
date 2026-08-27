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
  }
`);

/**
 * The project's tasks, fetched in a second round trip because the list id only
 * becomes known once the project resolves.
 *
 * Selecting `list { todos }` on the project would avoid the waterfall, but a
 * relation field lives on the `TodoList` entity rather than `ROOT_QUERY`, and
 * `invalidate` reaches only root fields — creating a todo would not show up
 * here. Fetching every todo the user owns and filtering in JS, which is what
 * this replaced, was worse than one extra request.
 */
const GET_PROJECT_TODOS = graphql(`
  query GetProjectTodos($listId: UUID!) {
    myTodos(where: { listId: { eq: $listId } }) {
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

  const listId = data?.myProject?.list?.id;
  const { data: todoData } = useQuery(GET_PROJECT_TODOS, {
    variables: { listId: listId ?? '' },
    skip: !listId,
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
            todos={todoData?.myTodos ?? []}
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
