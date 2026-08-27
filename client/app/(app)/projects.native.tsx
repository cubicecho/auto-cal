import { graphql } from '@/__generated__/index.js';
import { invalidate } from '@/lib/cache';
import { hexToDesaturated } from '@/lib/utils';
import { useMutation, useQuery } from '@apollo/client/react';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

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

const GET_ACTIVITY_TYPES_FOR_PROJECTS = graphql(`
  query GetActivityTypesForProjectsNative {
    myActivityTypes { id name color }
  }
`);

// ─── Create Project Modal ─────────────────────────────────────────────────────

function ProjectModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const { data: atData } = useQuery(GET_ACTIVITY_TYPES_FOR_PROJECTS);
  const activityTypes = atData?.myActivityTypes ?? [];
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
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-background p-6">
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-xl font-bold text-foreground">New Project</Text>
          <TouchableOpacity onPress={onClose}>
            <Text className="text-primary text-base">Cancel</Text>
          </TouchableOpacity>
        </View>

        <Text className="text-sm font-medium text-foreground mb-1">Name</Text>
        <TextInput
          className="border border-border rounded-lg px-3 py-2 mb-4 text-foreground bg-card"
          placeholder="e.g. Website redesign"
          placeholderTextColor="#9ca3af"
          value={name}
          onChangeText={setName}
          autoFocus
        />

        <Text className="text-sm font-medium text-foreground mb-2">
          Parent activity type
        </Text>
        <View className="flex-row flex-wrap gap-2 mb-6">
          {activityTypes.map((at) => (
            <TouchableOpacity
              key={at.id}
              onPress={() => setParentActivityTypeId(at.id)}
              className={`rounded-lg px-3 py-2 border ${parentActivityTypeId === at.id ? 'border-primary' : 'border-border'}`}
              style={{ backgroundColor: hexToDesaturated(at.color) }}
            >
              <Text className="text-sm text-foreground">{at.name}</Text>
            </TouchableOpacity>
          ))}
          {activityTypes.length === 0 && (
            <Text className="text-sm text-muted-foreground">
              No activity types — create one first
            </Text>
          )}
        </View>

        <TouchableOpacity
          className="bg-primary rounded-lg py-3 items-center"
          onPress={handleSubmit}
          disabled={loading || !name.trim() || !parentActivityTypeId}
        >
          <Text className="text-primary-foreground font-semibold">
            {loading ? 'Creating…' : 'Create Project'}
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
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
    Alert.alert(
      'Archive project?',
      `"${project.name}" will be hidden from the list. Nothing is deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: () => archiveProject({ variables: { id: project.id } }),
        },
      ],
    );
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
          <TouchableOpacity
            onPress={handleArchive}
            className="px-3 py-1 rounded-lg border border-border bg-background/60"
          >
            <Text className="text-xs text-foreground">Archive</Text>
          </TouchableOpacity>
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

  const projects = data?.myProjects ?? [];

  return (
    <View className="flex-1 bg-background">
      {loading && !data && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      )}

      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4 py-4"
        ListHeaderComponent={
          <TouchableOpacity
            className="bg-primary rounded-xl py-3 items-center mb-4"
            onPress={() => setModalOpen(true)}
          >
            <Text className="text-primary-foreground font-semibold">
              + New Project
            </Text>
          </TouchableOpacity>
        }
        ListEmptyComponent={
          !loading ? (
            <Text className="text-center text-muted-foreground mt-8">
              No projects yet. Create one to get started.
            </Text>
          ) : null
        }
        renderItem={({ item }) => <ProjectRow project={item} />}
      />

      {modalOpen && <ProjectModal onClose={() => setModalOpen(false)} />}
    </View>
  );
}
