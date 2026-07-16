import type {
  ScheduledItem_CalendarViewFragment,
  TimeBlock_CalendarViewFragment,
} from '@/__generated__/graphql.js';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

// TODO: Replace with a proper native calendar (e.g. react-native-calendars).
// This is the native fallback; on web Metro picks CalendarView.web.tsx instead.

interface Props {
  timeBlocks: readonly TimeBlock_CalendarViewFragment[];
  schedule: readonly ScheduledItem_CalendarViewFragment[];
  date: Date;
  view: 'day' | 'week' | 'month';
}

export function CalendarView({ schedule }: Props) {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.heading}>Calendar</Text>
        {schedule.length === 0 ? (
          <Text style={styles.empty}>No scheduled items.</Text>
        ) : (
          schedule.map((item) => (
            <View key={item.id} style={styles.card}>
              <Text style={styles.title}>{item.title}</Text>
              {item.scheduledStart ? (
                <Text style={styles.time}>
                  {new Date(item.scheduledStart as string).toLocaleTimeString(
                    [],
                    { hour: '2-digit', minute: '2-digit' },
                  )}
                </Text>
              ) : null}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { padding: 16 },
  heading: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  empty: { fontSize: 14, color: '#64748b' },
  card: {
    marginBottom: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    padding: 12,
  },
  title: { fontWeight: '500' },
  time: { fontSize: 12, color: '#64748b', marginTop: 2 },
});
