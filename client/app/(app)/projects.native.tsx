import { graphql } from '@/__generated__/index.js';
import { ActivityTypePicker } from '@/components/native/activity-type-picker';
import { confirmDestructive } from '@/components/native/confirm';
import { TextField } from '@/components/native/field';
import { FormModal } from '@/components/native/form-modal';
import { ListScreen } from '@/components/native/list-screen';
import { RowAction } from '@/components/native/row-action';
import { invalidate } from '@/lib/cache';
import { hexToDesaturated } from '@/lib/utils';
import { useMutation, useQuery } from '@apollo/client/react';
import { useState } from 'react';
import { Text, View } from 'react-native';

// ─── GraphQL ─────────────────────────────────────────────────────────────────

const GET_PROJECTS = graphql(`
  query GetProjectsNative {
    # Archived projects stay out of the list (see the archive confirmation copy).
    myProjects(where: { status: { ne: "archived" } }) {
      id
      name
      status
      activityType { id name color }
    }
  }
`);

const CREATE_PROJECT = graphql(`
  mutation CreateProjectNative($input: CreateProjectArgs!) {
    myCreateProject(input: $input) {
      id
      name
      status
      activityType { id name color }
    }
  }
`);

const ARCHIVE_PROJECT = graphql(`
  mutation ArchiveProjectNative($id: ID!) {
    myArchiveProject(id: $id) { id status }
  }
`);

// ─── Create Project Modal ─────────────────────────────────────────────────────

function ProjectModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [parentActivityTypeId, setParentActivityTypeId] = useState('');

  const [createProject, { loading }] = useMutation(CREATE_PROJECT, {
    update: (cache) => invalidate(cache, 'myProjects'),
    onCompleted: onClose,
  });

  function handleSubmit() {
    if (!name.trim() || !parentActivityTypeId) return;
    createProject({
      variables: {
        input: { name: name.trim(), parentActivityTypeId },
      },
    });
  }

  return (
    <FormModal
      title="New Project"
      onClose={onClose}
      onSubmit={handleSubmit}
      submitDisabled={loading || !name.trim() || !parentActivityTypeId}
      submitLabel={loading ? 'Creating…' : 'Create Project'}
    >
      <TextField
        label="Name"
        placeholder="e.g. Website redesign"
        value={name}
        onChangeText={setName}
        autoFocus
      />

      <ActivityTypePicker
        label="Parent activity type"
        selectedId={parentActivityTypeId}
        onSelect={setParentActivityTypeId}
      />
    </FormModal>
  );
}

// ─── Project Row ──────────────────────────────────────────────────────────────

type Project = {
  id: string;
  name: string;
  status: string;
  activityType: { id: string; name: string; color: string } | null;
};

function ProjectRow({ project }: { project: Project }) {
  const [archiveProject] = useMutation(ARCHIVE_PROJECT, {
    update: (cache) => invalidate(cache, 'myProjects'),
  });

  function handleArchive() {
    confirmDestructive({
      title: 'Archive project?',
      message: `"${project.name}" will be hidden from the list. Nothing is deleted.`,
      confirmLabel: 'Archive',
      onConfirm: () => archiveProject({ variables: { id: project.id } }),
    });
  }

  return (
    <View
      className="rounded-xl border border-border mb-3 px-4 py-3 overflow-hidden"
      style={{
        backgroundColor: project.activityType
          ? hexToDesaturated(project.activityType.color)
          : undefined,
      }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="font-semibold text-base text-foreground">
            {project.name}
          </Text>
          <Text className="text-xs text-muted-foreground mt-0.5 capitalize">
            {project.status}
            {project.activityType ? ` · ${project.activityType.name}` : ''}
          </Text>
        </View>
        {project.status !== 'archived' && (
          <RowAction label="Archive" onPress={handleArchive} />
        )}
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProjectsScreen() {
  const [modalOpen, setModalOpen] = useState(false);
  const { data, loading } = useQuery(GET_PROJECTS, {
    fetchPolicy: 'cache-and-network',
  });

  return (
    <ListScreen
      items={data?.myProjects}
      loading={loading}
      newLabel="New Project"
      onNew={() => setModalOpen(true)}
      emptyLabel="No projects yet. Create one to get started."
      renderItem={(item) => <ProjectRow project={item} />}
    >
      {modalOpen && <ProjectModal onClose={() => setModalOpen(false)} />}
    </ListScreen>
  );
}
