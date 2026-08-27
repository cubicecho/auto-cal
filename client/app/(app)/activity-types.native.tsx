import type { ActivityType_ActivityTypeListFragment } from '@/__generated__/graphql.js';
import { graphql } from '@/__generated__/index.js';
import { ACTIVITY_TYPE_LIST_FRAGMENT } from '@/components/domain/activity-type/ActivityTypeList';
import { confirmDestructive } from '@/components/native/confirm';
import { FieldLabel, TextField } from '@/components/native/field';
import { FormModal } from '@/components/native/form-modal';
import { ListScreen } from '@/components/native/list-screen';
import { RowAction } from '@/components/native/row-action';
import { DERIVED, evictEntity, invalidate } from '@/lib/cache';
import { hexToDesaturated } from '@/lib/utils';
import { useMutation, useQuery } from '@apollo/client/react';
import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

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
    <FormModal
      title={isEdit ? 'Edit Activity Type' : 'New Activity Type'}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitDisabled={loading || !name.trim()}
      submitLabel={loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create'}
    >
      <TextField
        label="Name"
        placeholder="e.g. Work, Exercise, Learning"
        value={name}
        onChangeText={setName}
        autoFocus={!isEdit}
      />

      <FieldLabel>Color</FieldLabel>
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
      <TextField
        className="font-mono"
        placeholder="#6366f1"
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
    </FormModal>
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
    confirmDestructive({
      title: 'Delete activity type?',
      message: `"${item.name}" will be permanently deleted.`,
      onConfirm: () => deleteAt({ variables: { id: item.id } }),
    });
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
        <RowAction label="Edit" onPress={() => onEdit(item)} />
        <RowAction label="Delete" onPress={handleDelete} destructive />
      </View>
    </View>
  );
}

export default function ActivityTypesScreen() {
  const [modalItem, setModalItem] = useState<ActivityType | 'new' | null>(null);
  const { data, loading } = useQuery(GET_MY_ACTIVITY_TYPES, {
    fetchPolicy: 'cache-and-network',
  });

  return (
    <ListScreen
      items={data?.myActivityTypes}
      loading={loading}
      newLabel="New Activity Type"
      onNew={() => setModalItem('new')}
      emptyLabel="No activity types yet."
      renderItem={(item) => (
        <ActivityTypeRow item={item} onEdit={setModalItem} />
      )}
    >
      {modalItem !== null && (
        <ActivityTypeModal
          activityType={modalItem === 'new' ? null : modalItem}
          onClose={() => setModalItem(null)}
        />
      )}
    </ListScreen>
  );
}
