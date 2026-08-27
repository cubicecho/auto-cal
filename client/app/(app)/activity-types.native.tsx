import type { ActivityType_ActivityTypeListFragment } from '@/__generated__/graphql.js';
import { graphql } from '@/__generated__/index.js';
import { ACTIVITY_TYPE_LIST_FRAGMENT } from '@/components/domain/activity-type/ActivityTypeList';
import { DERIVED, evictEntity, invalidate } from '@/lib/cache';
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

const _atf = ACTIVITY_TYPE_LIST_FRAGMENT;

const GET_MY_ACTIVITY_TYPES = graphql(`
  query GetMyActivityTypesNative {
    myActivityTypes {
      ...ActivityType_ActivityTypeList
    }
  }
`);

const CREATE_ACTIVITY_TYPE = graphql(`
  mutation CreateActivityTypeNative($input: CreateActivityTypeArgs!) {
    myCreateActivityType(input: $input) {
      ...ActivityType_ActivityTypeList
    }
  }
`);

const UPDATE_ACTIVITY_TYPE = graphql(`
  mutation UpdateActivityTypeNative($input: UpdateActivityTypeArgs!) {
    myUpdateActivityType(input: $input) {
      ...ActivityType_ActivityTypeList
    }
  }
`);

const DELETE_ACTIVITY_TYPE = graphql(`
  mutation DeleteActivityTypeNative($id: ID!) {
    myDeleteActivityType(id: $id)
  }
`);

type ActivityType = ActivityType_ActivityTypeListFragment;

const PRESET_COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#3b82f6',
  '#6b7280',
];

function ActivityTypeModal({
  activityType,
  onClose,
}: {
  activityType: ActivityType | null;
  onClose: () => void;
}) {
  const isEdit = activityType !== null;
  const [name, setName] = useState(activityType?.name ?? '');
  const [color, setColor] = useState(activityType?.color ?? '#6366f1');

  const [create, { loading: creating }] = useMutation(CREATE_ACTIVITY_TYPE, {
    update: (cache) => invalidate(cache, 'myActivityTypes'),
    onCompleted: onClose,
  });
  const [update, { loading: updating }] = useMutation(UPDATE_ACTIVITY_TYPE, {
    update: (cache) => invalidate(cache, ...DERIVED),
    onCompleted: onClose,
  });

  const loading = creating || updating;

  function handleSubmit() {
    if (!name.trim()) return;
    if (isEdit) {
      update({
        variables: { input: { id: activityType.id, name: name.trim(), color } },
      });
    } else {
      create({ variables: { input: { name: name.trim(), color } } });
    }
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
          <Text className="text-xl font-bold text-foreground">
            {isEdit ? 'Edit Activity Type' : 'New Activity Type'}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Text className="text-primary text-base">Cancel</Text>
          </TouchableOpacity>
        </View>

        <Text className="text-sm font-medium text-foreground mb-1">Name</Text>
        <TextInput
          className="border border-border rounded-lg px-3 py-2 mb-4 text-foreground bg-card"
          placeholder="e.g. Work, Exercise, Learning"
          placeholderTextColor="#9ca3af"
          value={name}
          onChangeText={setName}
          autoFocus={!isEdit}
        />

        <Text className="text-sm font-medium text-foreground mb-2">Color</Text>
        <View className="flex-row flex-wrap gap-2 mb-2">
          {PRESET_COLORS.map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => setColor(c)}
              className="h-9 w-9 rounded-full items-center justify-center"
              style={{ backgroundColor: c }}
            >
              {color === c && <Text className="text-white text-lg">✓</Text>}
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          className="border border-border rounded-lg px-3 py-2 mb-6 text-foreground bg-card font-mono"
          placeholder="#6366f1"
          placeholderTextColor="#9ca3af"
          value={color}
          onChangeText={setColor}
          autoCapitalize="none"
        />

        {isEdit && (
          <View
            className="rounded-lg px-4 py-3 mb-4 items-center"
            style={{ backgroundColor: hexToDesaturated(color) }}
          >
            <Text className="text-foreground font-medium">
              {name || 'Preview'}
            </Text>
          </View>
        )}

        <TouchableOpacity
          className="bg-primary rounded-lg py-3 items-center"
          onPress={handleSubmit}
          disabled={loading || !name.trim()}
        >
          <Text className="text-primary-foreground font-semibold">
            {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create'}
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

function ActivityTypeRow({
  item,
  onEdit,
}: {
  item: ActivityType;
  onEdit: (at: ActivityType) => void;
}) {
  const [deleteAt] = useMutation(DELETE_ACTIVITY_TYPE, {
    update: (cache, _result, { variables }) => {
      if (variables) evictEntity(cache, 'ActivityType', variables.id);
      invalidate(cache, 'myActivityTypes', ...DERIVED);
    },
  });

  function handleDelete() {
    Alert.alert(
      'Delete activity type?',
      `"${item.name}" will be permanently deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteAt({ variables: { id: item.id } }),
        },
      ],
    );
  }

  return (
    <View
      className="rounded-xl border border-border mb-3 px-4 py-3 flex-row items-center"
      style={{ backgroundColor: hexToDesaturated(item.color) }}
    >
      <View
        className="h-4 w-4 rounded-full mr-3"
        style={{ backgroundColor: item.color }}
      />
      <Text className="flex-1 font-medium text-foreground">{item.name}</Text>
      <View className="flex-row gap-2">
        <TouchableOpacity
          onPress={() => onEdit(item)}
          className="px-3 py-1 rounded-lg border border-border bg-background/60"
        >
          <Text className="text-xs text-foreground">Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleDelete}
          className="px-3 py-1 rounded-lg border border-destructive/40"
        >
          <Text className="text-xs text-destructive">Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ActivityTypesScreen() {
  const [modalItem, setModalItem] = useState<ActivityType | 'new' | null>(null);
  const { data, loading } = useQuery(GET_MY_ACTIVITY_TYPES, {
    fetchPolicy: 'cache-and-network',
  });
  const items = data?.myActivityTypes ?? [];

  return (
    <View className="flex-1 bg-background">
      {loading && !data && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      )}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4 py-4"
        ListHeaderComponent={
          <TouchableOpacity
            className="bg-primary rounded-xl py-3 items-center mb-4"
            onPress={() => setModalItem('new')}
          >
            <Text className="text-primary-foreground font-semibold">
              + New Activity Type
            </Text>
          </TouchableOpacity>
        }
        ListEmptyComponent={
          !loading ? (
            <Text className="text-center text-muted-foreground mt-8">
              No activity types yet.
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <ActivityTypeRow item={item} onEdit={setModalItem} />
        )}
      />
      {modalItem !== null && (
        <ActivityTypeModal
          activityType={modalItem === 'new' ? null : modalItem}
          onClose={() => setModalItem(null)}
        />
      )}
    </View>
  );
}
