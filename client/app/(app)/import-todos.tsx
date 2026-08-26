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
import { ColorDot } from '@/components/ui/color-dot';
import { Input } from '@/components/ui/input';
import { Page } from '@/components/ui/page';
import { DERIVED, invalidate } from '@/lib/cache';
import {
  GoogleTasksParseError,
  type ParsedList,
  parseGoogleTasks,
} from '@/lib/google-tasks';
import { cn } from '@/lib/utils';
import { useMutation } from '@apollo/client/react';
import { useRouter } from 'expo-router';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ListChecks,
  Upload,
} from 'lucide-react';
import { useRef, useState } from 'react';

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

// Distinct default colors handed to new activity types so imported lists are
// visually separable out of the box.
const PALETTE = [
  '#6366f1',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#3b82f6',
  '#8b5cf6',
  '#ef4444',
  '#14b8a6',
  '#f97316',
  '#0ea5e9',
] as const;

const DEFAULT_LIST_DURATION = 30;

type Assignment =
  | { mode: 'new'; name: string; color: string }
  | { mode: 'existing'; activityTypeId: string }
  | { mode: 'skip' };

type ImportResult = { listsCreated: number; todosCreated: number };

export default function ImportTodosPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [parsed, setParsed] = useState<ParsedList[] | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
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

  function loadFile(file: File): void {
    setError(null);
    const reader = new FileReader();
    reader.onerror = () => setError('Could not read that file.');
    reader.onload = () => {
      try {
        const lists = parseGoogleTasks(String(reader.result ?? ''));
        setParsed(lists);
        setAssignments(
          lists.map((list, i) => ({
            mode: 'new',
            name: list.name,
            color: PALETTE[i % PALETTE.length] as string,
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
    };
    reader.readAsText(file);
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
      <button
        type="button"
        onClick={() => router.push('/settings')}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Settings
      </button>

      <h1 className="mb-1 text-xl font-semibold">Import todos</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Import your tasks from a Google Tasks JSON export. In{' '}
        <a
          href="https://takeout.google.com/"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          Google Takeout
        </a>
        , select <strong>Tasks</strong>, download the archive, and upload the{' '}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">Tasks.json</code>{' '}
        file below.
      </p>

      {result ? (
        <ImportSuccess
          result={result}
          onDone={() => router.push('/todo-lists')}
          onAgain={reset}
        />
      ) : parsed ? (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {parsed.length} list{parsed.length === 1 ? '' : 's'} found. Choose
              an activity type for each.
            </p>
            <Button variant="ghost" size="sm" onClick={reset}>
              Choose another file
            </Button>
          </div>

          <div className="space-y-3">
            {parsed.map((list, i) => (
              <ListAssignmentCard
                key={`${list.name}-${i}`}
                list={list}
                assignment={assignments[i] ?? { mode: 'skip' }}
                onChange={(next) => updateAssignment(i, next)}
              />
            ))}
          </div>

          {error && (
            <p className="mt-4 flex items-center gap-1.5 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </p>
          )}

          <div className="mt-6 flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => router.push('/settings')}>
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={importing || importable.length === 0}
            >
              {importing
                ? 'Importing…'
                : `Import ${importable.length} list${importable.length === 1 ? '' : 's'}`}
            </Button>
          </div>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) loadFile(file);
            }}
            className={cn(
              'flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors',
              dragging
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-muted-foreground/50',
            )}
          >
            <Upload className="h-8 w-8 text-muted-foreground" />
            <span className="font-medium text-sm">
              Drop your Tasks.json here or click to browse
            </span>
            <span className="text-xs text-muted-foreground">
              JSON files only
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) loadFile(file);
              // Allow re-selecting the same file after a reset.
              e.target.value = '';
            }}
          />
          {error && (
            <p className="mt-4 flex items-center gap-1.5 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </p>
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
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">{list.name}</CardTitle>
          <span className="shrink-0 text-xs text-muted-foreground">
            {list.todos.length} task{list.todos.length === 1 ? '' : 's'}
            {completed > 0 ? ` · ${completed} done` : ''}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-1 rounded-md border p-0.5">
          {(['new', 'existing', 'skip'] as const).map((mode) => (
            <Button
              key={mode}
              size="sm"
              variant={assignment.mode === mode ? 'default' : 'ghost'}
              className="h-7 flex-1 text-xs capitalize"
              onClick={() => {
                if (mode === assignment.mode) return;
                if (mode === 'new')
                  onChange({ mode: 'new', name: list.name, color: PALETTE[0] });
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
        </div>

        {assignment.mode === 'new' && (
          <div className="space-y-2">
            <Input
              value={assignment.name}
              placeholder="Activity type name"
              onChange={(e) =>
                onChange({ ...assignment, name: e.target.value })
              }
            />
            <div className="flex flex-wrap gap-1.5">
              {PALETTE.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Use color ${color}`}
                  onClick={() => onChange({ ...assignment, color })}
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full ring-offset-2 ring-offset-background transition',
                    assignment.color === color && 'ring-2 ring-foreground',
                  )}
                >
                  <ColorDot color={color} size="md" />
                </button>
              ))}
            </div>
          </div>
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
          <p className="text-sm text-muted-foreground">
            This list will not be imported.
          </p>
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
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <CardTitle>Import complete</CardTitle>
        </div>
        <CardDescription>
          Created {result.listsCreated} list
          {result.listsCreated === 1 ? '' : 's'} and {result.todosCreated} todo
          {result.todosCreated === 1 ? '' : 's'}. They’ll be auto-scheduled into
          your calendar.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex gap-2">
        <Button onClick={onDone}>
          <ListChecks className="mr-2 h-4 w-4" />
          View todos
        </Button>
        <Button variant="outline" onClick={onAgain}>
          Import another file
        </Button>
      </CardContent>
    </Card>
  );
}
