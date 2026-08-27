import type { Habit_HabitListFragment } from '@/__generated__/graphql.js';
import { graphql } from '@/__generated__/index.js';
import { HABIT_LIST_FRAGMENT } from '@/components/domain/habit/HabitList';
import { DERIVED, evictEntity, invalidate } from '@/lib/cache';
import { hexToDesaturated } from '@/lib/utils';
import { useMutation, useQuery } from '@apollo/client/react';
import { useRouter } from 'expo-router';
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

const GET_ACTIVITY_TYPES_FOR_HABITS = graphql(`
  query GetActivityTypesForHabitsNative {
    myActivityTypes { id name color }
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

  const { data: atData } = useQuery(GET_ACTIVITY_TYPES_FOR_HABITS);
  const activityTypes = atData?.myActivityTypes ?? [];
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
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-background p-6">
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-xl font-bold text-foreground">
            {isEdit ? 'Edit Habit' : 'New Habit'}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Text className="text-primary text-base">Cancel</Text>
          </TouchableOpacity>
        </View>

        <Text className="text-sm font-medium text-foreground mb-1">Title</Text>
        <TextInput
          className="border border-border rounded-lg px-3 py-2 mb-4 text-foreground bg-card"
          placeholder="e.g. Morning run"
          placeholderTextColor="#9ca3af"
          value={title}
          onChangeText={setTitle}
          autoFocus={!isEdit}
        />

        <Text className="text-sm font-medium text-foreground mb-2">
          Frequency
        </Text>
        <View className="flex-row gap-3 mb-4">
          <TextInput
            className="border border-border rounded-lg px-3 py-2 bg-card text-foreground w-20 text-center"
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

        <Text className="text-sm font-medium text-foreground mb-2">
          Activity Type
        </Text>
        <View className="flex-row flex-wrap gap-2 mb-6">
          {activityTypes.map((at) => (
            <TouchableOpacity
              key={at.id}
              onPress={() => setActivityTypeId(at.id)}
              className={`rounded-lg px-3 py-2 border ${activityTypeId === at.id ? 'border-primary' : 'border-border'}`}
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
          disabled={loading || !title.trim() || !activityTypeId}
        >
          <Text className="text-primary-foreground font-semibold">
            {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Habit'}
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
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
    Alert.alert(
      'Delete habit?',
      `"${habit.title}" will be permanently deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteHabit({ variables: { id: habit.id } }),
        },
      ],
    );
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
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation?.();
              onEdit(habit);
            }}
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

  const habits = data?.myHabits ?? [];

  return (
    <View className="flex-1 bg-background">
      {loading && !data && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      )}

      <FlatList
        data={habits}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4 py-4"
        ListHeaderComponent={
          <TouchableOpacity
            className="bg-primary rounded-xl py-3 items-center mb-4"
            onPress={() => setModalHabit('new')}
          >
            <Text className="text-primary-foreground font-semibold">
              + New Habit
            </Text>
          </TouchableOpacity>
        }
        ListEmptyComponent={
          !loading ? (
            <Text className="text-center text-muted-foreground mt-8">
              No habits yet. Create one to get started.
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <HabitRow
            habit={item}
            onEdit={setModalHabit}
            onSelect={(h) => router.push(`/habits/${h.id}`)}
          />
        )}
      />

      {modalHabit !== null && (
        <HabitModal
          habit={modalHabit === 'new' ? null : modalHabit}
          onClose={() => setModalHabit(null)}
        />
      )}
    </View>
  );
}
