import type { TimeBlock_TimeBlockListFragment } from '@/__generated__/graphql.js';
import { graphql } from '@/__generated__/index.js';
import { TIME_BLOCK_LIST_FRAGMENT } from '@/components/domain/time-block/TimeBlockList';
import { useDataChanged } from '@/hooks/useDataChanged';
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

const _tbf = TIME_BLOCK_LIST_FRAGMENT;

const GET_MY_TIME_BLOCKS = graphql(`
  query GetMyTimeBlocksNative {
    myTimeBlocks {
      ...TimeBlock_TimeBlockList
    }
  }
`);

const GET_ACTIVITY_TYPES_FOR_TB = graphql(`
  query GetActivityTypesForTimeBlocksNative {
    myActivityTypes { id name color }
  }
`);

const CREATE_TIME_BLOCK = graphql(`
  mutation CreateTimeBlockNative($input: CreateTimeBlockArgs!) {
    myCreateTimeBlock(input: $input) {
      ...TimeBlock_TimeBlockList
    }
  }
`);

const DELETE_TIME_BLOCK = graphql(`
  mutation DeleteTimeBlockNative($id: ID!) {
    myDeleteTimeBlock(id: $id)
  }
`);

type TimeBlock = TimeBlock_TimeBlockListFragment;

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

function TimeBlockModal({ onClose }: { onClose: () => void }) {
  const [activityTypeId, setActivityTypeId] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5]);

  const { data: atData } = useQuery(GET_ACTIVITY_TYPES_FOR_TB);
  const activityTypes = atData?.myActivityTypes ?? [];

  const [createTimeBlock, { loading }] = useMutation(CREATE_TIME_BLOCK, {
    update: (cache) => invalidate(cache, 'myTimeBlocks', ...DERIVED),
    onCompleted: onClose,
  });

  function toggleDay(day: number) {
    setDaysOfWeek((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day].sort((a, b) => a - b),
    );
  }

  function handleSubmit() {
    if (!activityTypeId || daysOfWeek.length === 0) return;
    createTimeBlock({
      variables: {
        input: { activityTypeId, daysOfWeek, startTime, endTime, priority: 0 },
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
          <Text className="text-xl font-bold text-foreground">
            New Time Block
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Text className="text-primary text-base">Cancel</Text>
          </TouchableOpacity>
        </View>

        <Text className="text-sm font-medium text-foreground mb-2">
          Activity Type
        </Text>
        <View className="flex-row flex-wrap gap-2 mb-4">
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
        </View>

        <Text className="text-sm font-medium text-foreground mb-2">Days</Text>
        <View className="flex-row gap-1 mb-4">
          {DAY_NAMES.map((name, i) => (
            <TouchableOpacity
              key={name}
              onPress={() => toggleDay(i)}
              className={`flex-1 rounded-lg py-2 items-center border ${daysOfWeek.includes(i) ? 'bg-primary border-primary' : 'border-border bg-card'}`}
            >
              <Text
                className={`text-xs font-medium ${daysOfWeek.includes(i) ? 'text-primary-foreground' : 'text-foreground'}`}
              >
                {name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View className="flex-row gap-4 mb-6">
          <View className="flex-1">
            <Text className="text-sm font-medium text-foreground mb-1">
              Start
            </Text>
            <TextInput
              className="border border-border rounded-lg px-3 py-2 text-foreground bg-card"
              value={startTime}
              onChangeText={setStartTime}
              placeholder="HH:MM"
              placeholderTextColor="#9ca3af"
            />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-medium text-foreground mb-1">
              End
            </Text>
            <TextInput
              className="border border-border rounded-lg px-3 py-2 text-foreground bg-card"
              value={endTime}
              onChangeText={setEndTime}
              placeholder="HH:MM"
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>

        <TouchableOpacity
          className="bg-primary rounded-lg py-3 items-center"
          onPress={handleSubmit}
          disabled={loading || !activityTypeId || daysOfWeek.length === 0}
        >
          <Text className="text-primary-foreground font-semibold">
            {loading ? 'Creating…' : 'Create Time Block'}
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

function TimeBlockRow({ timeBlock }: { timeBlock: TimeBlock }) {
  const [deleteBlock] = useMutation(DELETE_TIME_BLOCK, {
    update: (cache, _result, { variables }) => {
      if (variables) evictEntity(cache, 'TimeBlock', variables.id);
      invalidate(cache, ...DERIVED);
    },
  });

  const days = timeBlock.daysOfWeek.map((d) => DAY_NAMES[d]).join(', ');

  function handleDelete() {
    Alert.alert('Delete time block?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteBlock({ variables: { id: timeBlock.id } }),
      },
    ]);
  }

  return (
    <View
      className="rounded-xl border border-border mb-3 px-4 py-3"
      style={{
        backgroundColor: timeBlock.activityType
          ? hexToDesaturated(timeBlock.activityType.color)
          : undefined,
      }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="font-semibold text-base text-foreground">
            {timeBlock.activityType?.name ?? 'Unassigned'}
          </Text>
          <Text className="text-xs text-muted-foreground mt-0.5">
            {timeBlock.startTime} – {timeBlock.endTime} · {days}
          </Text>
        </View>
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

export default function TimeBlocksScreen() {
  const [showModal, setShowModal] = useState(false);
  const { data, loading, refetch } = useQuery(GET_MY_TIME_BLOCKS, {
    fetchPolicy: 'cache-and-network',
  });
  useDataChanged('timeBlock', () => {
    refetch();
  });
  const timeBlocks = data?.myTimeBlocks ?? [];

  return (
    <View className="flex-1 bg-background">
      {loading && !data && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      )}
      <FlatList
        data={timeBlocks}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4 py-4"
        ListHeaderComponent={
          <TouchableOpacity
            className="bg-primary rounded-xl py-3 items-center mb-4"
            onPress={() => setShowModal(true)}
          >
            <Text className="text-primary-foreground font-semibold">
              + New Time Block
            </Text>
          </TouchableOpacity>
        }
        ListEmptyComponent={
          !loading ? (
            <Text className="text-center text-muted-foreground mt-8">
              No time blocks yet.
            </Text>
          ) : null
        }
        renderItem={({ item }) => <TimeBlockRow timeBlock={item} />}
      />
      {showModal && <TimeBlockModal onClose={() => setShowModal(false)} />}
    </View>
  );
}
