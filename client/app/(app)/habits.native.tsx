import type { Habit_HabitListFragment } from '@/__generated__/graphql.js';
import { graphql } from '@/__generated__/index.js';
import { HABIT_LIST_FRAGMENT } from '@/components/domain/habit/HabitList';
import { ActivityTypePicker } from '@/components/native/activity-type-picker';
import { confirmDestructive } from '@/components/native/confirm';
import { FieldLabel, TextField } from '@/components/native/field';
import { FormModal } from '@/components/native/form-modal';
import { ListScreen } from '@/components/native/list-screen';
import { RowAction } from '@/components/native/row-action';
import { DERIVED, evictEntity, invalidate } from '@/lib/cache';
import { hexToDesaturated } from '@/lib/utils';
import { useMutation, useQuery } from '@apollo/client/react';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

// ─── GraphQL ─────────────────────────────────────────────────────────────────

const _hf = HABIT_LIST_FRAGMENT;

const GET_MY_HABITS = graphql(`
  query GetMyHabitsNative {
    myHabits {
      ...Habit_HabitList
    }
  }
`);

const CREATE_HABIT = graphql(`
  mutation CreateHabitNative($input: CreateHabitArgs!) {
    myCreateHabit(input: $input) {
      ...Habit_HabitList
    }
  }
`);

const UPDATE_HABIT = graphql(`
  mutation UpdateHabitNative($input: UpdateHabitArgs!) {
    myUpdateHabit(input: $input) {
      ...Habit_HabitList
    }
  }
`);

const DELETE_HABIT = graphql(`
  mutation DeleteHabitNative($id: ID!) {
    myDeleteHabit(id: $id)
  }
`);

type Habit = Habit_HabitListFragment;

// ─── Habit Form Modal ─────────────────────────────────────────────────────────

function HabitModal({
  habit,
  onClose,
}: {
  habit: Habit | null; // null = create mode
  onClose: () => void;
}) {
  const isEdit = habit !== null;
  const [title, setTitle] = useState(habit?.title ?? '');
  const [frequencyCount, setFrequencyCount] = useState(
    String(habit?.frequencyCount ?? 3),
  );
  const [frequencyUnit, setFrequencyUnit] = useState<'week' | 'month'>(
    (habit?.frequencyUnit as 'week' | 'month') ?? 'week',
  );
  const [activityTypeId, setActivityTypeId] = useState(
    habit?.activityType?.id ?? '',
  );

  const [createHabit, { loading: creating }] = useMutation(CREATE_HABIT, {
    update: (cache) => invalidate(cache, 'myHabits', ...DERIVED),
    onCompleted: onClose,
  });
  const [updateHabit, { loading: updating }] = useMutation(UPDATE_HABIT, {
    update: (cache) => invalidate(cache, ...DERIVED),
    onCompleted: onClose,
  });

  const loading = creating || updating;

  function handleSubmit() {
    if (!title.trim() || !activityTypeId) return;
    const count = Number.parseInt(frequencyCount, 10) || 1;
    if (isEdit) {
      updateHabit({
        variables: {
          input: {
            id: habit.id,
            title: title.trim(),
            frequencyCount: count,
            frequencyUnit,
            activityTypeId,
          },
        },
      });
    } else {
      createHabit({
        variables: {
          input: {
            title: title.trim(),
            frequencyCount: count,
            frequencyUnit,
            activityTypeId,
            priority: 0,
            estimatedLength: 30,
          },
        },
      });
    }
  }

  return (
    <FormModal
      title={isEdit ? 'Edit Habit' : 'New Habit'}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitDisabled={loading || !title.trim() || !activityTypeId}
      submitLabel={
        loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Habit'
      }
    >
      <TextField
        label="Title"
        placeholder="e.g. Morning run"
        value={title}
        onChangeText={setTitle}
        autoFocus={!isEdit}
      />

      <FieldLabel>Frequency</FieldLabel>
      <View className="flex-row gap-3 mb-4">
        <TextField
          containerClassName="mb-0"
          className="w-20 text-center"
          keyboardType="number-pad"
          value={frequencyCount}
          onChangeText={setFrequencyCount}
        />
        <View className="flex-row gap-2 flex-1">
          {(['week', 'month'] as const).map((unit) => (
            <TouchableOpacity
              key={unit}
              onPress={() => setFrequencyUnit(unit)}
              className={`flex-1 rounded-lg py-2 items-center border ${frequencyUnit === unit ? 'bg-primary border-primary' : 'border-border bg-card'}`}
            >
              <Text
                className={
                  frequencyUnit === unit
                    ? 'text-primary-foreground font-medium'
                    : 'text-foreground'
                }
              >
                per {unit}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ActivityTypePicker
        selectedId={activityTypeId}
        onSelect={setActivityTypeId}
      />
    </FormModal>
  );
}

// ─── Habit Row ────────────────────────────────────────────────────────────────

function HabitRow({
  habit,
  onEdit,
  onSelect,
}: {
  habit: Habit;
  onEdit: (h: Habit) => void;
  onSelect: (h: Habit) => void;
}) {
  const [deleteHabit] = useMutation(DELETE_HABIT, {
    update: (cache, _result, { variables }) => {
      if (variables) evictEntity(cache, 'Habit', variables.id);
      invalidate(cache, 'myHabits', ...DERIVED);
    },
  });

  function handleDelete() {
    confirmDestructive({
      title: 'Delete habit?',
      message: `"${habit.title}" will be permanently deleted.`,
      onConfirm: () => deleteHabit({ variables: { id: habit.id } }),
    });
  }

  return (
    <TouchableOpacity
      className="rounded-xl border border-border mb-3 px-4 py-3 overflow-hidden"
      style={{
        backgroundColor: habit.activityType
          ? hexToDesaturated(habit.activityType.color)
          : undefined,
      }}
      onPress={() => onSelect(habit)}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="font-semibold text-base text-foreground">
            {habit.title}
          </Text>
          <Text className="text-xs text-muted-foreground mt-0.5">
            {habit.frequencyCount}× per {habit.frequencyUnit}
            {habit.activityType ? ` · ${habit.activityType.name}` : ''}
          </Text>
        </View>
        <View className="flex-row gap-2">
          <RowAction
            label="Edit"
            onPress={(e) => {
              e.stopPropagation?.();
              onEdit(habit);
            }}
          />
          <RowAction label="Delete" onPress={handleDelete} destructive />
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HabitsScreen() {
  const router = useRouter();
  const [modalHabit, setModalHabit] = useState<Habit | 'new' | null>(null);

  const { data, loading } = useQuery(GET_MY_HABITS, {
    fetchPolicy: 'cache-and-network',
  });

  return (
    <ListScreen
      items={data?.myHabits}
      loading={loading}
      newLabel="New Habit"
      onNew={() => setModalHabit('new')}
      emptyLabel="No habits yet. Create one to get started."
      renderItem={(item) => (
        <HabitRow
          habit={item}
          onEdit={setModalHabit}
          onSelect={(h) => router.push(`/habits/${h.id}`)}
        />
      )}
    >
      {modalHabit !== null && (
        <HabitModal
          habit={modalHabit === 'new' ? null : modalHabit}
          onClose={() => setModalHabit(null)}
        />
      )}
    </ListScreen>
  );
}
