# Client Patterns

React + Vite + Apollo Client + TanStack Router + TanStack Form + ShadCN/Radix + Tailwind.

## Installed ShadCN Components

Only use components that are already installed — do not add new ones without checking first. Files live in `client/src/components/ui/`.

ShadCN primitives (11): `button` `card` `dialog` `field` `form` `input` `label` `select` `tabs` `textarea` `tooltip`

Custom (2, not from ShadCN — keep tagged as such):
- `inline-length-edit` — quick-edit duration chip used on list items
- `route-error` — error boundary used in `__root.tsx` and route components

## Error Handling Conventions

- **Mutation errors** → toast notification
- **Form validation errors** → inline, beneath the relevant field
- **Route/render crashes** → `<RouteError>` error boundary (`src/components/ui/route-error.tsx`)

## Apollo Client Setup

```typescript
// client/src/main.tsx
const httpLink = new HttpLink({
  uri: '/graphql',
  fetch: (uri, options) => {
    const token = localStorage.getItem('auth_token');
    const headers = new Headers(options?.headers as HeadersInit | undefined);
    if (token) headers.set('authorization', `Bearer ${token}`);
    return fetch(uri as RequestInfo, { ...(options as RequestInit), headers });
  },
});

const errorLink = onError(({ graphQLErrors }) => {
  if (graphQLErrors?.some((e) => e.message.includes('Not authenticated'))) {
    localStorage.removeItem('auth_token');
    window.location.replace('/login');
  }
});

const client = new ApolloClient({
  link: from([errorLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: { watchQuery: { fetchPolicy: 'cache-and-network' } },
});
```

## Nav Structure

Top nav (hidden during onboarding): **Dashboard · Todos · Todo Lists · Habits · Time Blocks · Activity Types · Stats** + Settings icon + Sign out + dark mode toggle.

Dark mode is fully supported — toggle stored in `localStorage.theme`, falls back to `prefers-color-scheme`. All new UI **must** include `dark:` Tailwind variants. The `dark` class is toggled on `document.documentElement`.

## Onboarding Flow

New users are redirected to `/onboarding` automatically (before dashboard) if `localStorage.onboarding_done` is not set. The wizard has 4 steps:

1. Activity Types (required)
2. Time Blocks (required)
3. Habits (optional — skippable)
4. Todos (optional — skippable; requires at least one todo list to exist before adding a todo — link out to `/todo-lists` if empty)

Completion sets `localStorage.onboarding_done = '1'`. Re-runnable from Settings with `?force=true`. The auth guard in `__root.tsx` handles the redirect — do not replicate this logic elsewhere.

## Routes

File-based routes under `client/src/routes/`:

| File | Path | Notes |
|------|------|-------|
| `__root.tsx` | `/` | Layout + auth guard — redirects to `/login` if no token, `/onboarding` if not set up |
| `index.tsx` | `/` | Landing/redirect |
| `login.tsx` | `/login` | Magic-link request form |
| `auth.verify.tsx` | `/auth/verify` | Consumes magic-link token, stores JWT, redirects |
| `onboarding.tsx` | `/onboarding?step=1` | 4-step setup wizard |
| `dashboard.tsx` | `/dashboard` | Main schedule view |
| `todos.tsx` | `/todos` | Todo list |
| `todo-lists.tsx` | `/todo-lists` | Todo list (lists, not todos) CRUD |
| `habits.tsx` + `habits.index.tsx` | `/habits` | Habit list (parent + index) |
| `habits.$habitId.tsx` | `/habits/$habitId` | Habit detail (rates, periods) |
| `time-blocks.tsx` | `/time-blocks` | Time block management |
| `activity-types.tsx` | `/activity-types` | Activity type management |
| `stats.tsx` | `/stats` | Analytics surface (composite score, charts — see todo.md #9 for build-out) |
| `settings.tsx` | `/settings` | iCal feed URL + re-run onboarding wizard |

Auth flow: `requestMagicLink` → magic link logged to server console (and returned in dev) → user visits `/auth/verify?token=…` → `verifyMagicLink` returns `{ token, userId }` → store `token` as `auth_token` in `localStorage` → redirect to `/dashboard`.

## TanStack Router



```typescript
// client/src/routes/__root.tsx
export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: RootLayout,
  beforeLoad: async ({ location }) => {
    if (!localStorage.getItem('auth_token') && !location.pathname.startsWith('/login')) {
      throw redirect({ to: '/login' });
    }
  },
});
```

Router context carries `apolloClient` and `preloadQuery`:
```typescript
// client/src/main.tsx
const router = createRouter({
  routeTree,
  context: {
    apolloClient: client,
    preloadQuery: createQueryPreloader(client),
  },
});
```

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
const [createTodo] = useMutation(CREATE_TODO, { refetchQueries: ['GetMyTodos'] });
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
    dashboard/    — CalendarView, ScheduleView
    onboarding/   — Step*.tsx wizard panels
```

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
