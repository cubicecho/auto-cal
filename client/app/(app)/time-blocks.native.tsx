import type { TimeBlock_TimeBlockListFragment } from '@/__generated__/graphql.js';
import { graphql } from '@/__generated__/index.js';
import { TIME_BLOCK_LIST_FRAGMENT } from '@/components/domain/time-block/TimeBlockList';
import { ActivityTypePicker } from '@/components/native/activity-type-picker';
import { confirmDestructive } from '@/components/native/confirm';
import { FieldLabel, TextField } from '@/components/native/field';
import { FormModal } from '@/components/native/form-modal';
import { ListScreen } from '@/components/native/list-screen';
import { RowAction } from '@/components/native/row-action';
import { DERIVED, evictEntity, invalidate } from '@/lib/cache';
import { DAY_NAMES } from '@/lib/form-constants';
import { hexToDesaturated } from '@/lib/utils';
import { useMutation, useQuery } from '@apollo/client/react';
import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

const _tbf = TIME_BLOCK_LIST_FRAGMENT;

const GET_MY_TIME_BLOCKS = graphql(`
  query GetMyTimeBlocksNative {
    myTimeBlocks {
      ...TimeBlock_TimeBlockList
    }
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

function TimeBlockModal({ onClose }: { onClose: () => void }) {
  const [activityTypeId, setActivityTypeId] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5]);

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
    <FormModal
      title="New Time Block"
      onClose={onClose}
      onSubmit={handleSubmit}
      submitDisabled={loading || !activityTypeId || daysOfWeek.length === 0}
      submitLabel={loading ? 'Creating…' : 'Create Time Block'}
    >
      <ActivityTypePicker
        selectedId={activityTypeId}
        onSelect={setActivityTypeId}
      />

      <FieldLabel>Days</FieldLabel>
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

      <View className="flex-row gap-4">
        <TextField
          containerClassName="flex-1"
          label="Start"
          value={startTime}
          onChangeText={setStartTime}
          placeholder="HH:MM"
        />
        <TextField
          containerClassName="flex-1"
          label="End"
          value={endTime}
          onChangeText={setEndTime}
          placeholder="HH:MM"
        />
      </View>
    </FormModal>
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
    confirmDestructive({
      title: 'Delete time block?',
      message: 'This cannot be undone.',
      onConfirm: () => deleteBlock({ variables: { id: timeBlock.id } }),
    });
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
        <RowAction label="Delete" onPress={handleDelete} destructive />
      </View>
    </View>
  );
}

export default function TimeBlocksScreen() {
  const [showModal, setShowModal] = useState(false);
  const { data, loading } = useQuery(GET_MY_TIME_BLOCKS, {
    fetchPolicy: 'cache-and-network',
  });

  return (
    <ListScreen
      items={data?.myTimeBlocks}
      loading={loading}
      newLabel="New Time Block"
      onNew={() => setShowModal(true)}
      emptyLabel="No time blocks yet."
      renderItem={(item) => <TimeBlockRow timeBlock={item} />}
    >
      {showModal && <TimeBlockModal onClose={() => setShowModal(false)} />}
    </ListScreen>
  );
}
