import { graphql } from '@/__generated__/index.js';
import { ActivityTypeSelect } from '@/components/domain/activity-type/ActivityTypeSelect';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Code } from '@/components/ui/code';
import { ColorDot } from '@/components/ui/color-dot';
import { FilePicker } from '@/components/ui/file-picker';
import {
  ArrowLeft,
  CircleCheck,
  ListChecks,
  TriangleAlert,
} from '@/components/ui/icons';
import { Input } from '@/components/ui/input';
import { Page } from '@/components/ui/page';
import { DERIVED, invalidate } from '@/lib/cache';
import { ACTIVITY_COLORS } from '@/lib/form-constants';
import {
  GoogleTasksParseError,
  type ParsedList,
  parseGoogleTasks,
} from '@/lib/google-tasks';
import { cn } from '@/lib/utils';
import { useMutation } from '@apollo/client/react';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

const CREATE_ACTIVITY_TYPE_IMPORT = graphql(`
  mutation CreateActivityTypeForImport($input: CreateActivityTypeArgs!) {
    myCreateActivityType(input: $input) {
      id
      name
      color
    }
  }
`);

const IMPORT_TODOS = graphql(`
  mutation ImportTodos($input: ImportTodosArgs!) {
    myImportTodos(input: $input) {
      listsCreated
      todosCreated
    }
  }
`);

const DEFAULT_LIST_DURATION = 30;

type Assignment =
  | { mode: 'new'; name: string; color: string }
  | { mode: 'existing'; activityTypeId: string }
  | { mode: 'skip' };

type ImportResult = { listsCreated: number; todosCreated: number };

export default function ImportTodosPage() {
  const router = useRouter();

  const [parsed, setParsed] = useState<ParsedList[] | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const [createActivityType] = useMutation(CREATE_ACTIVITY_TYPE_IMPORT, {
    update: (cache) => invalidate(cache, 'myActivityTypes'),
  });
  const [importTodos] = useMutation(IMPORT_TODOS, {
    // An import creates lists and todos in bulk, so nearly everything the
    // schedule is built from moved.
    update: (cache) =>
      invalidate(
        cache,
        'myActivityTypes',
        'myTodoLists',
        'myTodos',
        ...DERIVED,
      ),
  });

  function loadText(text: string): void {
    setError(null);
    try {
      const lists = parseGoogleTasks(text);
      setParsed(lists);
      setAssignments(
        lists.map((list, i) => ({
          mode: 'new',
          name: list.name,
          color: ACTIVITY_COLORS[i % ACTIVITY_COLORS.length] as string,
        })),
      );
    } catch (err) {
      setParsed(null);
      setAssignments([]);
      setError(
        err instanceof GoogleTasksParseError
          ? err.message
          : 'Could not parse that file.',
      );
    }
  }

  function updateAssignment(index: number, next: Assignment): void {
    setAssignments((prev) => prev.map((a, i) => (i === index ? next : a)));
  }

  function reset(): void {
    setParsed(null);
    setAssignments([]);
    setError(null);
    setResult(null);
  }

  const importable =
    parsed?.filter((_, i) => assignments[i]?.mode !== 'skip') ?? [];

  async function handleImport(): Promise<void> {
    if (!parsed) return;
    setError(null);

    // Validate assignments before touching the server.
    for (let i = 0; i < parsed.length; i++) {
      const a = assignments[i];
      if (!a || a.mode === 'skip') continue;
      if (a.mode === 'new' && !a.name.trim()) {
        setError(`Give the new activity type for "${parsed[i]?.name}" a name.`);
        return;
      }
      if (a.mode === 'existing' && !a.activityTypeId) {
        setError(`Pick an activity type for "${parsed[i]?.name}".`);
        return;
      }
    }
    if (importable.length === 0) {
      setError('Select at least one list to import.');
      return;
    }

    setImporting(true);
    try {
      // Create any new activity types first, deduping by name so two lists
      // that both create "Work" share a single type.
      const newTypeIds = new Map<string, string>();
      const lists: {
        name: string;
        activityTypeId: string;
        defaultPriority: number;
        defaultEstimatedLength: number;
        todos: ParsedList['todos'];
      }[] = [];

      for (let i = 0; i < parsed.length; i++) {
        const a = assignments[i];
        const list = parsed[i];
        if (!a || !list || a.mode === 'skip') continue;

        let activityTypeId: string;
        if (a.mode === 'existing') {
          activityTypeId = a.activityTypeId;
        } else {
          const key = a.name.trim().toLowerCase();
          const cached = newTypeIds.get(key);
          if (cached) {
            activityTypeId = cached;
          } else {
            const { data } = await createActivityType({
              variables: { input: { name: a.name.trim(), color: a.color } },
            });
            const id = data?.myCreateActivityType?.id;
            if (!id) throw new Error('Failed to create activity type');
            newTypeIds.set(key, id);
            activityTypeId = id;
          }
        }

        lists.push({
          name: list.name,
          activityTypeId,
          defaultPriority: 0,
          defaultEstimatedLength: DEFAULT_LIST_DURATION,
          todos: list.todos,
        });
      }

      const { data } = await importTodos({ variables: { input: { lists } } });
      if (data?.myImportTodos) setResult(data.myImportTodos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed.');
    } finally {
      setImporting(false);
    }
  }

  return (
    <Page width="narrow" className="py-8">
      <Pressable
        onPress={() => router.push('/settings')}
        className="mb-4 flex-row items-center gap-1"
      >
        <ArrowLeft className="h-4 w-4" />
        <Text className="text-sm text-muted-foreground">Settings</Text>
      </Pressable>

      <Text className="mb-1 text-xl font-semibold">Import todos</Text>
      <Text className="mb-6 text-sm text-muted-foreground">
        Import your tasks from a Google Tasks JSON export. In{' '}
        <a
          href="https://takeout.google.com/"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          Google Takeout
        </a>
        , select <Text>Tasks</Text>, download the archive, and upload the{' '}
        <Code className="rounded bg-muted px-1 py-0.5 text-xs">Tasks.json</Code>{' '}
        file below.
      </Text>

      {result ? (
        <ImportSuccess
          result={result}
          onDone={() => router.push('/todo-lists')}
          onAgain={reset}
        />
      ) : parsed ? (
        <>
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-sm text-muted-foreground">
              {parsed.length} list{parsed.length === 1 ? '' : 's'} found. Choose
              an activity type for each.
            </Text>
            <Button variant="ghost" size="sm" onPress={reset}>
              Choose another file
            </Button>
          </View>

          <View className="gap-3">
            {parsed.map((list, i) => (
              <ListAssignmentCard
                key={`${list.name}-${i}`}
                list={list}
                assignment={assignments[i] ?? { mode: 'skip' }}
                onChange={(next) => updateAssignment(i, next)}
              />
            ))}
          </View>

          {error && (
            <View className="mt-4 flex-row items-center gap-1.5">
              <TriangleAlert className="h-4 w-4" />
              <Text className="text-sm text-destructive">{error}</Text>
            </View>
          )}

          <View className="mt-6 flex-row items-center justify-end gap-2">
            <Button variant="outline" onPress={() => router.push('/settings')}>
              Cancel
            </Button>
            <Button
              onPress={handleImport}
              disabled={importing || importable.length === 0}
            >
              {importing
                ? 'Importing…'
                : `Import ${importable.length} list${importable.length === 1 ? '' : 's'}`}
            </Button>
          </View>
        </>
      ) : (
        <>
          <FilePicker
            accept="application/json,.json"
            label="Drop your Tasks.json here or click to browse"
            hint="JSON files only"
            onPick={loadText}
          />
          {error && (
            <View className="mt-4 flex-row items-center gap-1.5">
              <TriangleAlert className="h-4 w-4" />
              <Text className="text-sm text-destructive">{error}</Text>
            </View>
          )}
        </>
      )}
    </Page>
  );
}

function ListAssignmentCard({
  list,
  assignment,
  onChange,
}: {
  list: ParsedList;
  assignment: Assignment;
  onChange: (next: Assignment) => void;
}) {
  const completed = list.todos.filter((t) => t.completedAt).length;

  return (
    <Card className={assignment.mode === 'skip' ? 'opacity-60' : undefined}>
      <CardHeader className="pb-3">
        <View className="flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">{list.name}</CardTitle>
          <Text className="shrink-0 text-xs text-muted-foreground">
            {list.todos.length} task{list.todos.length === 1 ? '' : 's'}
            {completed > 0 ? ` · ${completed} done` : ''}
          </Text>
        </View>
      </CardHeader>
      <CardContent className="gap-3">
        <View className="flex-row gap-1 rounded-md border p-0.5">
          {(['new', 'existing', 'skip'] as const).map((mode) => (
            <Button
              key={mode}
              size="sm"
              variant={assignment.mode === mode ? 'default' : 'ghost'}
              className="h-7 flex-1 text-xs capitalize"
              onPress={() => {
                if (mode === assignment.mode) return;
                if (mode === 'new')
                  onChange({
                    mode: 'new',
                    name: list.name,
                    color: ACTIVITY_COLORS[0],
                  });
                else if (mode === 'existing')
                  onChange({ mode: 'existing', activityTypeId: '' });
                else onChange({ mode: 'skip' });
              }}
            >
              {mode === 'new'
                ? 'New type'
                : mode === 'existing'
                  ? 'Existing'
                  : 'Skip'}
            </Button>
          ))}
        </View>

        {assignment.mode === 'new' && (
          <View className="gap-2">
            <Input
              value={assignment.name}
              placeholder="Activity type name"
              onChangeText={(text) => onChange({ ...assignment, name: text })}
            />
            <View className="flex-row flex-wrap gap-1.5">
              {ACTIVITY_COLORS.map((color) => (
                <Pressable
                  key={color}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: assignment.color === color }}
                  accessibilityLabel={`Use color ${color}`}
                  onPress={() => onChange({ ...assignment, color })}
                  className={cn(
                    'h-7 w-7 flex-row items-center justify-center rounded-full border-2',
                    assignment.color === color
                      ? 'border-foreground'
                      : 'border-transparent',
                  )}
                >
                  <ColorDot color={color} size="md" />
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {assignment.mode === 'existing' && (
          <ActivityTypeSelect
            value={assignment.activityTypeId || undefined}
            onValueChange={(v) =>
              onChange({ mode: 'existing', activityTypeId: v ?? '' })
            }
          />
        )}

        {assignment.mode === 'skip' && (
          <Text className="text-sm text-muted-foreground">
            This list will not be imported.
          </Text>
        )}
      </CardContent>
    </Card>
  );
}

function ImportSuccess({
  result,
  onDone,
  onAgain,
}: {
  result: ImportResult;
  onDone: () => void;
  onAgain: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <View className="flex-row items-center gap-2">
          <CircleCheck className="h-5 w-5 text-green-600" />
          <CardTitle>Import complete</CardTitle>
        </View>
        <CardDescription>
          Created {result.listsCreated} list
          {result.listsCreated === 1 ? '' : 's'} and {result.todosCreated} todo
          {result.todosCreated === 1 ? '' : 's'}. They’ll be auto-scheduled into
          your calendar.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-row gap-2">
        <Button onPress={onDone}>
          <ListChecks className="mr-2 h-4 w-4" />
          View todos
        </Button>
        <Button variant="outline" onPress={onAgain}>
          Import another file
        </Button>
      </CardContent>
    </Card>
  );
}
