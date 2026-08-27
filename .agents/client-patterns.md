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
- `route-error` — what the layouts' `ErrorBoundary` exports render; has a
  `.native.tsx` sibling
- `toast` — `ToastProvider` + `useToast`, for failures with nowhere else to go

## Error Handling Conventions

- **Form validation errors** → inline, beneath the relevant field
- **Mutation errors** → at the point of action where there is one:
  `FormDialogFooter`'s `error` prop in a dialog, or the card itself elsewhere;
  a toast when the control that failed has no room for a message. See
  [Mutation Errors](#mutation-errors).
- **Route/render crashes** → the named `ErrorBoundary` exported from
  `app/_layout.tsx` and `app/(app)/_layout.tsx`, rendering `<RouteError>`

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

## Live Updates

`client/src/hooks/useLiveUpdates.ts` is the **only** subscriber to the server's
change streams, mounted once in `app/(app)/_layout.tsx`. It translates each
event into the same `lib/cache.ts` calls a local mutation would make, so a
change from another tab, another device, or an API key takes the same route.

**Pages do not subscribe.** They just read the cache and let it go stale or not.
Adding `useSubscription` + `refetch()` to a screen is the pattern this replaced:
per-page entity lists nothing checked, and a `refetch()` that only refreshed the
screen you happened to be on.

The `dataChanged` mapping lives in one `Record<DataEntity, readonly RootField[]>`,
so a new entity in the SDL fails to compile until someone says what it
invalidates:

```typescript
const DATA_FIELDS: Record<DataEntity, readonly RootField[]> = {
  activityType: ['myActivityTypes', ...DERIVED],
  habit: ['myHabits', ...DERIVED],
  project: ['myProjects', 'myProject'],
  timeBlock: ['myTimeBlocks', ...DERIVED],
};
```

The typed `myTodosUpdated` / `myTodoListsUpdated` streams carry the whole
entity, so Apollo has normalized it before the handler runs — an `updated`
event only has to drop `DERIVED`. Membership changes also evict the list field,
and deletes evict the entity.

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

All four steps are the same shape — add something, see what you have added, move
on — so the chrome lives in `components/domain/onboarding/OnboardingStep.tsx`
and only the form differs:

```tsx
<OnboardingStep
  title="Build habits"
  description="…"
  onBack={onBack}          // omitted on step 1
  onSkip={onSkip}          // only the optional steps
  onNext={onNext}
  nextLabel="Finish setup" // step 4; pair with isFinal
  isFinal                  // leading check instead of a trailing arrow
  nextDisabled={…}         // the required steps hold until something exists
>
```

`CreatedList` renders the "Created (n)" block (nothing at zero) as bordered rows
or, with `layout="chips"`, wrapping pills; `CreatedRow` is one row of
dot / title / detail / right-aligned meta. The step's form ends with
`<form.SubmitButton icon={<Plus …/>} createLabel="Add habit" savingLabel="Adding…" />`
rather than a hand-rolled `form.Subscribe`.

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
  query GetMyTodos($where: TodoFilters) {
    myTodos(where: $where) {
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
// Most my* queries take the generated `where`/`orderBy` inputs — the server
// AND-s the caller scope onto them. See graphql-patterns.md.
const { data, loading } = useQuery(MY_TODOS, {
  variables: { where: { completedAt: { isNull: true } } },
});
const [createTodo] = useMutation(CREATE_TODO, {
  update: (cache) => invalidate(cache, 'myTodos', ...DERIVED),
});
```

**Filter in the query, not in JS.** A detail route asks for the one row it
needs — `myHabits(where: { id: { eq: $id } }, limit: 1)` — rather than fetching
every habit and `.find()`ing. The scope is AND-ed server-side, so a foreign id
comes back as `[]`, not an error.

Where the id only becomes known once a parent query resolves, take the second
round trip (`skip: !listId`) instead of selecting the relation. `invalidate`
evicts `ROOT_QUERY` fields, and a relation field such as `TodoList.todos` has no
entry there — creating a todo would never show up. `projects/[projectId].tsx`
carries the worked example.

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

Every form constant lives in `src/lib/form-constants.ts` — nothing is re-declared
per file. They were, once: `PRIORITY_OPTIONS` in four files, `DURATION_OPTIONS`
in three, `DAY_NAMES` in three, and the copies had drifted (TodoListForm's
duration list was missing the 4+ hour option that TodoForm and HabitForm offered,
so a list's default estimated length could not be set to what a todo's could).

| Export | Used by |
|--------|---------|
| `PRIORITY_OPTIONS` | Todo, habit, and list forms + `StepTodos` — values `'0'`/`'25'`/`'50'`/`'100'`, matching `priorityLabel` in `lib/utils.ts` |
| `DURATION_OPTIONS` | Todo, habit, and list forms — 15 min → `'480'` ("4+ hours") |
| `DAY_NAMES` | Day toggle buttons (`'Sun'`…), index = the `daysOfWeek` value |
| `DAY_NAMES_LONG` | Prose rather than buttons — `TimeBlockItem`'s card description |
| `WEEKDAYS` / `WEEKEND` | The `[1,2,3,4,5]` / `[0,6]` presets |
| `DEFAULT_ACTIVITY_COLOR` | `'#6366f1'`, mirroring the server default |
| `ACTIVITY_COLORS` | Swatch pickers and the cycle `import-todos` assigns from |

Option values are strings because `SelectField` round-trips through the DOM; call
sites `Number(...)` them on submit. The module imports nothing from React or
react-native, so the `.native` screens use it too.

Use these in new forms rather than re-declaring. `InlineLengthEdit` allows
free-form entry (1–1440 min) for quick edits on list items.

## Resetting a Dialog Form

Every form dialog is a single instance reused across create and edit targets, so
`defaultValues` — which TanStack Form only applies on mount — is stale from the
second open onward. `src/hooks/useResetOnOpen.ts` holds the one effect that fixes
it, replacing six hand-written copies that each carried their own dependency-array
suppression:

```typescript
useResetOnOpen(open, todo?.id, () => form.reset(defaultValues));
```

The second argument is the selected entity's id (`undefined` when creating);
`reset` is deliberately *not* a dependency, since it closes over values derived
from the current render and would otherwise wipe the form mid-edit.

`ProjectForm` is the one dialog with two form instances — resetting only the edit
one left a cancelled "New Project" holding its typed-in name — so its callback
resets both.

## Mutation Errors

A rejected mutation surfaces where the user triggered it, and falls back to a
toast when that place is a bare icon:

- **In a dialog** — pass `error` to `FormDialogFooter`, which renders it above the
  buttons. Field validation stays inline beneath its field; this slot is for what
  only the server knows, such as a delete the database refuses.
- **In a card** — render the message in the card itself (see `TimeBlockItem`).
- **Everywhere else** — `useToast()`. The completion checkbox, the inline length
  editor and drag-to-reschedule have no space of their own, and the optimistic
  ones are worse than silent: the UI rolls back to where it started, which is
  indistinguishable from the click never registering.

```tsx
const toast = useToast();
// A mutation with its own onError:
const [pinTodo] = useMutation(PIN_TODO, {
  onError: (err) => toast(err.message || 'Could not move this todo'),
});
// A bare call site:
updateTodo({ variables }).catch((err) =>
  toast(errorMessage(err, 'Could not save the length')),
);
```

`toast(message, tone?)` takes `'error'` (the default, 6s) or `'success'` (3s).
`ToastProvider` is mounted once in `app/_layout.tsx`, outside `AuthGuard` so a
message survives the redirect to `/auth/login`; `useToast` throws without it,
because a toast that never appears is the bug the module exists to fix. It is
built on react-native primitives with nativewind classes, so one component
serves web and native — only the viewport's `position` branches on `Platform`.

`errorMessage(err, fallback)` in `lib/utils.ts` pulls the server's message out of
the Apollo error ("Cannot delete a list that still contains todos") and falls back
otherwise. Deletes especially need this: every FK to `activity_types` is
`onDelete: 'restrict'`, so deleting an in-use activity type always rejects, and
without a catch it failed silently.

## Error Boundaries

`app/_layout.tsx` and `app/(app)/_layout.tsx` each export a named `ErrorBoundary`
— expo-router's convention, which mounts it around that segment's tree. Both
render `RouteError` (`error` ← `error`, `reset` ← `retry`). Without them a render
crash unmounted the app to a blank page with the error only in the console.

`components/ui/route-error.tsx` renders `<div>`/`<button>`; `route-error.native.tsx`
is its react-native counterpart, so the shared layouts can mount one component on
both platforms. Keep both dependency-free — they render after the tree below has
already thrown.

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
  native/         — RN primitives for the .native.tsx screens (see below)

client/src/
  apollo-client.ts — the single ApolloClient (link split, typePolicies)
  storage.ts       — key-value store; no-ops off web
  lib/cache.ts     — cache invalidation helpers (see above)
  lib/date.ts      — weekStart (ISO Monday) / isoDate (local YYYY-MM-DD)
  lib/form-constants.ts — every shared form constant (see above)
  hooks/           — form-hook (useAppForm), useLiveUpdates, useListSection,
                     useDarkMode, useSyncTimezone, useResetOnOpen
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

## Cross-Platform Primitives (in progress)

`button.tsx`, `card.tsx`, `input.tsx` and `icons.tsx` have been converted to
react-native primitives and now render on both platforms. The rest of
`components/ui/` is still web-only. The conversion rules, which every further
primitive follows:

**File naming inverts.** The old convention was *plain = web, `.native.tsx` =
native*. A converted primitive is *plain = shared*, with a `.web.tsx` **only**
where the web behaviour genuinely has no native equivalent. `input` is the one
case so far: `type="time"`/`type="number"` with `min`/`max` are real DOM input
behaviour `TextInput` cannot reproduce. Both files export the same `InputProps`,
so call sites never branch.

**The shared contract goes in a third module.** `input-base.ts` exists because
Metro resolves `./input` to `input.web.tsx` on web — the web file importing the
shared types from `./input` would import itself. Any `.tsx`/`.web.tsx` pair that
needs shared types needs a `-base.ts` alongside them. `icons-base.ts` is the
second instance.

**Only `input.tsx` is typechecked against call sites.** TypeScript resolves the
plain `.tsx`, so `input.web.tsx` is only checked standalone. A drifted `.web.tsx`
compiles cleanly and breaks at runtime — `npx expo export --platform web` is the
check that catches it.

| DOM | Cross-platform |
|-----|----------------|
| `onClick` | `onPress` |
| `onChange={(e) => f(e.target.value)}` | `onChangeText={f}` |
| `onKeyDown` Enter | `onSubmitEditing` |
| `type="submit"` | `onPress={() => form.handleSubmit()}` |
| `title="…"` (hover tooltip) | `aria-label="…"`, or a real `<Tooltip>` |
| `useRef<HTMLInputElement>` | `useRef<InputHandle>` (`focus`, optional `select`) |
| `<Button asChild><Link/></Button>` | `<Link asChild><Button/></Link>` |

**Text must be wrapped.** A bare string inside a `<View>` throws on native
while rendering fine on web, so the two platforms disagree silently. `Button`
wraps string children in a `<Text>` for you; `CardTitle`/`CardDescription` are
`<Text>`. Anywhere else, wrap it yourself.

**Text colour does not inherit on native.** Each `cva` variant therefore splits
in two — container classes and `*TextVariants` classes applied to the `<Text>`.
The container keeps its `text-*` class so web icons still pick up
`currentColor`.

**`disabled:` and other pseudo-class variants do not apply** to a `Pressable`
on either platform. Apply the state directly: `disabled && 'opacity-50'`.

**Give an interactive `Pressable` a `role`.** react-native-web renders one as a
plain `<div>` otherwise — no tab stop, no Enter/Space, nothing announced. `role`
is what restores what `<button>` gave for free. Biome's `useSemanticElements`
fires on it and needs a `biome-ignore`.

### Icons

**Import icons from `@/components/ui/icons`, never from lucide directly.**
`client/test/icons.test.ts` enforces that — nothing else can, since the two
implementations are a Metro platform pair and TypeScript only sees the native
one.

`icons.web.tsx` is a plain re-export of `lucide-react`. `icons.tsx` wraps
`lucide-react-native` in `cssInterop`, mapping `className` to `width`/`height`/
`color`, so `<Trash2 className="h-4 w-4" />` means the same thing on both
platforms.

**Native deep-imports; web uses the barrel.** `lucide-react-native/icons/<kebab-name>`
per icon, because the barrel re-exports ~1600 modules and Metro does not
tree-shake. Web keeps the barrel — `lucide-react` ships no `exports` map, and
the web bundler tree-shakes anyway. Adding an icon means one deep import plus
one `export const X = icon(XSource)` in `icons.tsx`, and one name in the
`icons.web.tsx` export list; the test fails if you do only one of the two.

**Icon colour is a native-only problem.** On web an `<svg>` inherits
`currentColor` from its parent, hover states included. Native has no
inheritance, so a container that sets its own text colour publishes that class
through `IconClassContext` (`icons-base.ts`) and every icon below merges it in.
`icons.web.tsx` ignores the context deliberately — injecting a colour there
would pin the icon through the container's `hover:text-*`. `Button` is the
provider today.

Icon *names* are the canonical lucide ones, not the deprecated aliases
(`CircleAlert` not `AlertCircle`, `TriangleAlert` not `AlertTriangle`,
`CircleCheck` not `CheckCircle2`, `LoaderCircle` not `Loader2`, `WandSparkles`
not `Wand2`) — the aliases are dropped upstream on majors.

**Still to convert:** the eight radix-backed primitives (`dialog`, `popover`,
`select`, `tabs`, `tooltip`, `switch`, plus `date-time-input` and
`CalendarView`) keep a `.web.tsx`. See `.agents/todo.md`.

## Shared Native Primitives

`components/native/` is the RN-primitive equivalent of the not-yet-converted
half of `components/ui/`, which renders `<div>`/`<button>` and cannot be used
from a `.native.tsx` screen. Every native list screen is built from it. It is
meant to be folded into the shared set as the conversion above proceeds.

| Primitive | Purpose |
|-----------|---------|
| `list-screen.tsx` — `ListScreen<T>` | `FlatList` + header with a "New …" button + empty state. Pass `items={data?.myX}` **undefined, not `?? []`** — the spinner is gated on `items === undefined`, so an `?? []` default shows "no items" during the first load. `children` render above the list (modals). |
| `form-modal.tsx` — `FormModal` | Page-sheet `Modal` with a title/Cancel row and a primary submit button. **Render it conditionally** (`{open && <FormModal …>}`) so unmounting discards field state — no manual `setName('')` resets. |
| `field.tsx` — `FieldLabel`, `TextField` | Labelled `TextInput` with the shared border/padding and placeholder color. `containerClassName` tunes the default `mb-4` wrapper (`cn` lets `mb-0` win). |
| `activity-type-picker.tsx` — `ActivityTypePicker` | Single-select activity-type chips. Owns its own query, so all four sheets share one cache entry, and it carries the "create one first" empty state. |
| `row-action.tsx` — `RowAction` | Edit/Archive/Delete pill inside a pressable row. Its `onPress` receives the event because a pill inside a pressable row has to `stopPropagation` on web. |
| `confirm.ts` — `confirmDestructive` | The `Alert.alert(title, message, [Cancel, destructive])` triple, once. |

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

// client/src/lib/date.ts
weekStart(date)  // Monday of that week — the ISO week the scheduler works in
isoDate(date)    // local YYYY-MM-DD — the shape every date argument in the API takes
```

Every `weekStart:` query variable and every day-grouping key goes through these.
Do not hand-roll `getDay() === 0 ? -6 : 1 - day` or a bare
`format(d, 'yyyy-MM-dd')`; the calendar, today, and schedule views have to agree
on where a week starts.

Two hooks carry cross-screen behaviour that used to be copy-pasted:

- `hooks/useSyncTimezone.ts` — returns the device timezone and pushes it to the
  profile once per mount. Both schedule screens need it, because the server
  schedules and renders the iCal feed in the *stored* timezone.
- `hooks/useDarkMode.ts` — `[dark, setDark]` against `storage`, applied to
  `documentElement` on web and inert on native. It persists **only** on
  `setDark`, so reading the OS preference never freezes it into storage.

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
