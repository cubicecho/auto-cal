# Client Patterns

Expo + expo-router + React Native Web + Apollo Client + TanStack Form +
ShadCN/Radix + NativeWind/Tailwind.

Routes live in `client/app/`; everything else (components, hooks, lib, the
Apollo client) lives in `client/src/` and is imported via the `@/` alias.

**Web and native are separate files.** `todo-lists.tsx` is the web screen and
`todo-lists.native.tsx` the native one; Metro resolves `.native` first on
iOS/Android and ignores it on web. A change to a screen that exists in both
usually has to land in both — grep for the `.native` sibling before assuming
you are done.

**Never touch `window`, `document`, or `localStorage` directly.** They do not
exist on native. `client/src/storage.ts` is the sanctioned key-value store and
no-ops off web.

## Installed ShadCN Components

Only use components that are already installed — do not add new ones without checking first. Files live in `client/src/components/ui/`.

ShadCN primitives (13): `button` `calendar` `card` `dialog` `field` `form` `input` `label` `popover` `select` `switch` `tabs` `textarea` `tooltip`

Custom (the rest — keep tagged as such): `color-bar` `color-dot`
`confirm-dialog` `date-time-input` `detail-header` `detail-page`
`form-dialog` `page` `query-state` `section-heading` `segmented`
`status-chip`, plus:
- `inline-length-edit` — quick-edit duration chip used on list items
- `route-error` — error boundary used by route components

## Error Handling Conventions

- **Mutation errors** → toast notification
- **Form validation errors** → inline, beneath the relevant field
- **Route/render crashes** → `<RouteError>` error boundary (`src/components/ui/route-error.tsx`)

## Apollo Client Setup

`client/src/apollo-client.ts` exports a single `apolloClient`; `app/_layout.tsx`
wraps the tree in `<ApolloProvider>`. Four things there are worth knowing:

- **The link is split.** Subscriptions go over `GraphQLWsLink`, everything else
  over HTTP. The WS URL is derived from `EXPO_PUBLIC_API_URL`, or from
  `window.location` when that is unset (production serves the bundle and the
  API from the same Express process).
- **`ErrorLink` matches `extensions.code`**, not the message —
  `UNAUTHENTICATED` or `FORBIDDEN` clears the token and bounces to
  `/auth/login`. It used to string-match `'Not authenticated'`, so rewording a
  server error silently disabled session expiry.
- **`ScheduledItem` is not normalized** (`typePolicies: { ScheduledItem:
  { keyFields: false } }`). Its `id` is the id of the todo or habit behind it,
  so the same id recurs across weeks; normalizing it made one week's schedule
  overwrite another's.
- **Default `fetchPolicy` is `cache-and-network`**, which is why an evicted
  root field re-fetches on its own.

## Cache Invalidation

`refetchQueries: ['SomeOperationName']` is banned — see `client/src/lib/cache.ts`
for why and what replaced it. In short: mutations return the entity they
changed and Apollo's normalized cache patches every view holding it, so most
mutations need nothing at all. The exceptions:

```typescript
import { DERIVED, evictEntity, invalidate } from '@/lib/cache';

// Membership changed — evict the root field, not the pages reading it.
useMutation(CREATE_TODO, {
  update: (cache) => invalidate(cache, 'myTodos', ...DERIVED),
});

// Deleted — drop the entity; Apollo filters dangling refs out of every list.
useMutation(DELETE_TODO, {
  update: (cache, _result, { variables }) => {
    if (variables) evictEntity(cache, 'Todo', variables.id);
    invalidate(cache, ...DERIVED);
  },
});
```

`DERIVED` is the set of server-computed fields (`mySchedule` and the stats
queries) that no mutation result can patch. Spread it into any write that could
move the schedule. `RootField` is a checked union and `cache.test.ts` asserts it
against the SDL.

## Nav Structure

Top nav (hidden during onboarding): **Dashboard · Todos · Todo Lists · Habits · Time Blocks · Activity Types · Stats** + Settings icon + Sign out + dark mode toggle.

Dark mode is fully supported — the choice is stored under `theme` via `storage`, falling back to `prefers-color-scheme`. All new UI **must** include `dark:` Tailwind variants. On web the `dark` class is toggled on `document.documentElement` by `useDarkMode` in `app/_layout.tsx`; the effect is a no-op on native.

## Onboarding Flow

New users are redirected to `/onboarding` automatically if `onboarding_done` is not set. The wizard has 4 steps:

1. Activity Types (required)
2. Time Blocks (required)
3. Habits (optional — skippable)
4. Todos (optional — skippable; requires at least one todo list to exist before adding a todo — link out to `/todo-lists` if empty)

Completion sets `onboarding_done = '1'` via `storage`. Re-runnable from Settings
with `?force=true`. The guard in `app/(app)/_layout.tsx` handles the redirect —
do not replicate this logic elsewhere.

## Routes

File-based routes under `client/app/`. `(app)` is a route group — it does not
appear in the URL, it exists so every authenticated screen shares one layout.
Screens marked ✕ have a `.native.tsx` sibling that must be kept in step.

| File | Path | Native | Notes |
|------|------|--------|-------|
| `_layout.tsx` | — | | ApolloProvider + dark mode + auth guard (→ `/auth/login`) |
| `auth/login.tsx` | `/auth/login` | | Magic-link request form |
| `auth/verify.tsx` | `/auth/verify` | | Consumes the token, stores the JWT, redirects |
| `(app)/_layout.tsx` | — | | Nav (web) / tabs (native) + onboarding guard |
| `(app)/index.tsx` | `/` | | Landing/redirect |
| `(app)/onboarding.tsx` | `/onboarding?step=1` | | 4-step setup wizard |
| `(app)/today.tsx` | `/today` | | Today's schedule |
| `(app)/calendar.tsx` | `/calendar` | | Week calendar |
| `(app)/todo-lists.tsx` | `/todo-lists` | ✕ | Lists + their todos |
| `(app)/projects/` | `/projects`, `/projects/[projectId]` | ✕ | Project list + detail with notes |
| `(app)/habits/` | `/habits`, `/habits/[habitId]` | ✕ | Habit list + detail (rates, periods) |
| `(app)/time-blocks.tsx` | `/time-blocks` | ✕ | Time block management |
| `(app)/activity-types.tsx` | `/activity-types` | ✕ | Activity type management |
| `(app)/stats.tsx` | `/stats` | | Analytics (composite score, charts) |
| `(app)/import-todos.tsx` | `/import-todos` | | Bulk import (Google Tasks export) |
| `(app)/settings.tsx` | `/settings` | ✕ | iCal feed URL, API keys, re-run onboarding |

Auth flow: `requestMagicLink` → link logged to the server console (and returned
when `magicLinkExposed()`) → user visits `/auth/verify?token=…` →
`verifyMagicLink` returns `{ token, userId }` → stored as `auth_token` via
`storage` → redirect.

## expo-router

Navigation is `<Link href="…">` and `useRouter()` from `expo-router`; params
come from `useLocalSearchParams()`. Directory names in brackets are dynamic
segments — `habits/[habitId].tsx` serves `/habits/:habitId`.

```typescript
// client/app/_layout.tsx — the auth guard, in full
function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const token = storage.getItem('auth_token');
  if (!token && !pathname.startsWith('/auth')) {
    return <Redirect href="/auth/login" />;
  }
  return <>{children}</>;
}
```

There is no router context and no route loaders — screens fetch with `useQuery`
directly.

## GraphQL Operations (Colocated)

Operations live next to the component that uses them. Use `graphql()` from codegen output:

```typescript
import { graphql } from '@/__generated__/index.js';
import { useMutation, useQuery } from '@apollo/client';

const MY_TODOS = graphql(`
  query GetMyTodos($completed: Boolean) {
    myTodos(completed: $completed) {
      id
      title
      priority
      estimatedLength
      dueAt
      completedAt
      list { id name }
      activityType { id name color }
    }
  }
`);

const CREATE_TODO = graphql(`
  mutation CreateTodo($input: CreateTodoArgs!) {
    myCreateTodo(input: $input) {
      id
      title
      priority
      estimatedLength
      list { id name }
      activityType { id name color }
    }
  }
`);

// Usage
const { data, loading } = useQuery(MY_TODOS, { variables: { completed: false } });
const [createTodo] = useMutation(CREATE_TODO, {
  update: (cache) => invalidate(cache, 'myTodos', ...DERIVED),
});
```

## Fragment Colocation

```typescript
// Colocate data requirements with the component
const TODO_ITEM_FRAGMENT = graphql(`
  fragment Todo_TodoListFragment on Todo {
    id
    title
    priority
    estimatedLength
    completedAt
    activityType { id name color }
  }
`);

type TodoItemProps = {
  todo: Todo_TodoListFragment;
};
```

## Form Constants

Shared constants used across domain forms:

```typescript
const PRIORITY_OPTIONS = [
  { label: 'Low',    value: '0'   },
  { label: 'Medium', value: '25'  },
  { label: 'High',   value: '50'  },
  { label: 'Urgent', value: '100' },
];

const DURATION_OPTIONS = [
  { label: '15 minutes', value: '15'  },
  { label: '30 minutes', value: '30'  },
  { label: '45 minutes', value: '45'  },
  { label: '1 hour',     value: '60'  },
  { label: '1.5 hours',  value: '90'  },
  { label: '2 hours',    value: '120' },
  { label: '3 hours',    value: '180' },
  { label: '4+ hours',   value: '480' },
];

// Time blocks only
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']; // index = daysOfWeek value
const WEEKDAYS = [1, 2, 3, 4, 5];
const WEEKEND  = [0, 6];
```

Use these same constants in new forms. `InlineLengthEdit` allows free-form entry (1–1440 min) for quick edits on list items.

## Form Pattern (TanStack Form)

`useAppForm` wraps TanStack Form with project-specific field components. Available fields:

| Component | Usage |
|-----------|-------|
| `form.InputField` | Text / number inputs |
| `form.TextAreaField` | Multi-line text |
| `form.SelectField` | Dropdown select |
| `form.Field` | Raw field wrapper (custom UI) |

```typescript
import { useAppForm } from '@/hooks/form-hook';

const form = useAppForm({
  defaultValues: { title: '', priority: 0, estimatedLength: 30 },
  onSubmit: async ({ value }) => {
    await createTodo({ variables: { input: value } });
  },
});

// In JSX:
<form.Field name="title">
  {(field) => <form.InputField field={field} label="Title" />}
</form.Field>
```

## Component Structure

```
client/src/components/
  ui/             — ShadCN primitives (Button, Card, Input, etc.)
  domain/         — Feature components organized by entity
    activity-type/ — ActivityTypeForm, ActivityTypeList, ActivityTypeSelect
    todo-list/    — TodoListForm, TodoListList, TodoListSelect
    todo/         — TodoItem, TodoForm, TodoList
    habit/        — HabitItem, HabitForm
    time-block/   — TimeBlockItem, TimeBlockForm
    project/      — ProjectForm, ProjectDetail, ProjectNotesEditor
    settings/     — ApiKeyManager
    dashboard/    — CalendarView, ScheduleView
    onboarding/   — Step*.tsx wizard panels
    CompletionDialog.tsx — shared complete-with-actual-length prompt

client/src/
  apollo-client.ts — the single ApolloClient (link split, typePolicies)
  storage.ts       — key-value store; no-ops off web
  lib/cache.ts     — cache invalidation helpers (see above)
  hooks/           — form-hook (useAppForm), useDataChanged,
                     useListSection, useTodosUpdated, useTodoListsUpdated
```

## Shared UI Primitives

Beyond the raw ShadCN primitives, `components/ui/` holds a set of shared layout
primitives extracted to kill hand-rolled boilerplate. **Prefer these over
re-implementing the same markup** — every list/detail page is built from them.

| Primitive | Purpose |
|-----------|---------|
| `page.tsx` — `Page` | Page shell. Variants: `fill` (full-height flex col for inner-scroll views), `scroll` (default on), `width="narrow"` (max-w-2xl). Web-only (`<div>`) — do not use in `.native.tsx`. |
| `page.tsx` — `PageHeader` | Title / subtitle / actions row at the top of list pages. |
| `page.tsx` — `EmptyState` | Centered icon / title / description / action for empty lists. |
| `page.tsx` — `CardGrid` | Responsive 1→2→3→4 column card grid. |
| `query-state.tsx` — `QueryState` | Inline loading/error text (error takes priority) for a query whose data may still render alongside it. |
| `section-heading.tsx` — `SectionHeading` | `default` / `overline` section labels. |
| `detail-page.tsx` — `DetailPage<T>` | `<Page>` + loading/not-found guard via a render-prop so the entity is non-null inside `children`. |
| `detail-header.tsx` — `DetailHeader`, `EditButton` | Back-link header + color/badge/actions; standard pencil Edit button. |
| `form-dialog.tsx` — `FormDialog` | Dialog wrapper for the create/edit form pattern. |
| `status-chip.tsx`, `color-dot.tsx`, `confirm-dialog.tsx` | Status badge, activity-type color dot, destructive-action confirm. |

Companion hook: `hooks/useListSection.ts` — owns the create/edit dialog open
state (`formOpen`, `editing`, `openCreate`, `openEdit`, `handleOpenChange`) that
every list component needs.

## ShadCN + Tailwind Conventions

```typescript
import { cn } from '@/lib/utils';

// cn() merges class names with tailwind-merge + clsx
className={cn('base-classes', condition && 'conditional-class', className)}
```

Card layout pattern:
```tsx
<Card>
  <CardHeader className="pb-2">
    <CardTitle>{title}</CardTitle>
    <CardDescription>{description}</CardDescription>
  </CardHeader>
  <CardContent className="space-y-2">
    {/* content */}
  </CardContent>
  <CardFooter>
    {/* actions */}
  </CardFooter>
</Card>
```

## Utility Functions

```typescript
// client/src/lib/utils.ts
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function priorityLabel(priority: number): string {
  if (priority >= 100) return 'Urgent';
  if (priority >= 50) return 'High';
  if (priority >= 25) return 'Medium';
  return 'Low';
}
```

## Dashboard Architecture

The dashboard is a two-panel layout (`lg:grid-cols-[1fr_320px]`):
- **Left / main**: `CalendarView` — react-big-calendar with DnD, day/week/month views
- **Right / sidebar**: `ScheduleView` — chronological list grouped by day

Both consume the same `mySchedule` data. The schedule query is **always week-scoped** (ISO Monday anchor) regardless of the calendar view mode. Timezone is synced to the user profile on every dashboard mount (fire-and-forget `myUpdateProfile`).

Time blocks load via `preloadQuery` in the route loader for faster initial paint. Schedule loads reactively as `weekStart` changes.

### CalendarView Conventions

react-big-calendar + DnD addon (`withDragAndDrop`). Week starts on Monday (`weekStartsOn: 1`), matching the server's ISO week convention.

**Event ID formats:**
- Background (time block): `${block.id}-${dayIndex}`
- Scheduled todo: `scheduled-todo-${todo.id}`
- Scheduled habit: `scheduled-habit-${habit.id}-${instanceIndex}`
- Completed todo: `completed-todo-${todo.id}`

**Event appearance:**
- Time blocks → background events (shaded, no border); hidden in month view
- Todos → prefixed `✓ `, bold border, line-through when completed
- Habits → prefixed `↻ `
- Past/completed → desaturated via `desaturateColor()` utility in CalendarView

**Drag-to-schedule:** currently only enabled for todos (`kind === 'todo'`). On drop, calls `myUpdateTodo({ id, scheduledAt: "YYYY-MM-DDTHH:mm:ss", manuallyScheduled: true })`. Naive local datetime (no `Z`). Habit drag is deferred — planned but not yet implemented.

**Filtering:** Incomplete items whose scheduled end has already passed are hidden from the calendar (they'll be rescheduled by the next writeback). They still appear in ScheduleView's unschedulable section.

**Completed todos** appear on the calendar at their actual `completedAt` time with the original estimated duration. Completed habits do not appear on the calendar.

### Uncompleting a Todo

```typescript
myUpdateTodo({ input: { id, completedAt: null } })
```

No dedicated mutation — use `myUpdateTodo` with `completedAt: null`.

### Unschedulable Items

Items with `!isScheduled` appear in ScheduleView under an "Unschedulable" heading with an amber warning icon linking to `/time-blocks`. The tooltip explains the reason (no matching time block, or estimated length too long). A todo's activity type is sourced from its list, so the previous "no activity type" branch is gone.

### TodoForm Defaults Snapshot

When the user picks a list in `TodoForm`, the form snapshots that list's `defaultPriority` / `defaultEstimatedLength` into the priority and duration fields — only when those fields still hold the form's initial values. Editing an existing todo never overwrites them. The todo persists its own copy of priority/duration; later edits to the list's defaults do **not** propagate.

## Codegen

After adding/editing GraphQL operations:
```bash
npm run codegen   # regenerates client/src/__generated__/
```

Types from `@/__generated__/graphql.js` are auto-imported — never write them by hand.
