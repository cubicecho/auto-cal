# Client Patterns

Expo + expo-router + React Native Web + Apollo Client + TanStack Form +
ShadCN/Radix + NativeWind/Tailwind.

Routes live in `client/app/`; everything else (components, hooks, lib, the
Apollo client) lives in `client/src/` and is imported via the `@/` alias.

**One screen serves both platforms.** Every route under `client/app/` is a
single react-native file; there are no `.native.tsx` screens left, and
`components/native/` is gone. Screens are built from `components/ui/`, whose
primitives are all cross-platform (see "Cross-Platform Primitives"). A
`.web.tsx` sibling exists only for the handful of primitives whose web
behaviour has no native equivalent.

**Never touch `window`, `document`, `localStorage`, or `navigator` directly.**
They do not exist on native. `client/src/storage.ts` is the sanctioned
key-value store and no-ops off web; `client/src/lib/clipboard.ts` wraps
`expo-clipboard` for copy-to-clipboard, which works on both.

## Installed ShadCN Components

Only use components that are already installed — do not add new ones without checking first. Files live in `client/src/components/ui/`.

ShadCN primitives (14): `button` `calendar` `card` `dialog` `field` `form` `input` `label` `popover` `select` `switch` `tabs` `textarea` `tooltip` — all of them cross-platform, several as a `.tsx`/`.web.tsx` pair (see "Cross-Platform Primitives")

Custom (the rest — keep tagged as such): `color-bar` `color-dot`
`confirm-dialog` `date-time-input` `detail-header` `detail-page`
`form-dialog` `page` `query-state` `section-heading` `segmented`
`status-chip` `code` `color-picker` `confirm` `file-picker` `form-element`
`switch-field` `toggle-chip`, plus:
- `inline-length-edit` — quick-edit duration chip used on list items
- `route-error` — what the layouts' `ErrorBoundary` exports render
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

## Notifications

Two unrelated halves, both switched on from the same settings card
(`components/domain/settings/NotificationSettings.tsx`):

**Browser push** goes through `client/src/lib/push.ts`, wrapped the way
`src/storage.ts` wraps localStorage — every entry point is safe to call
anywhere and reports "unsupported" off web rather than throwing on a missing
global. `client/public/sw.js` is the service worker; it is served verbatim from
the site root (a worker's scope cannot be broader than its own path), so it is
**not** bundled by Metro and must stay plain JavaScript with no imports.

The card renders nothing when `myPushPublicKey` is null — a server with no VAPID
keys cannot deliver anything, and a toggle that silently does nothing is worse
than an absent one.

**The in-app habit digest** is `hooks/useHabitDigest.ts`: one toast a day naming
the habits still scheduled for today. It reads the schedule the Today screen has
already fetched rather than querying for itself, so the digest cannot disagree
with what is on screen, and it is keyed by local date in `storage` so a reload
does not re-nag. It is web-only for that reason — off web `storage` always reads
null, which would fire the toast on every mount.

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
Every file below serves both platforms.

| File | Path | Notes |
|------|------|-------|
| `_layout.tsx` | — | ApolloProvider + toast + confirm + dark mode + auth guard (→ `/auth/login`) |
| `auth/login.tsx` | `/auth/login` | Magic-link request form |
| `auth/verify.tsx` | `/auth/verify` | Consumes the token, stores the JWT, redirects |
| `(app)/_layout.tsx` | — | Nav (web) / tabs (native) + onboarding guard |
| `(app)/index.tsx` | `/` | Landing/redirect |
| `(app)/onboarding.tsx` | `/onboarding?step=1` | 4-step setup wizard |
| `(app)/today.tsx` | `/today` | Today's schedule |
| `(app)/calendar.tsx` | `/calendar` | Week calendar |
| `(app)/todo-lists.tsx` | `/todo-lists` | Lists + their todos |
| `(app)/projects/` | `/projects`, `/projects/[projectId]` | Project list + detail with notes |
| `(app)/habits/` | `/habits`, `/habits/[habitId]` | Habit list + detail (rates, periods) |
| `(app)/time-blocks.tsx` | `/time-blocks` | Time block management |
| `(app)/activity-types.tsx` | `/activity-types` | Activity type management |
| `(app)/stats.tsx` | `/stats` | Analytics (composite score, charts) |
| `(app)/import-todos.tsx` | `/import-todos` | Bulk import (Google Tasks export); the file picker itself is web-only |
| `(app)/settings.tsx` | `/settings` | iCal feed URL, API keys, re-run onboarding |

The only platform branch left in a route is `(app)/_layout.tsx`, which picks a
web header + `<Slot/>` or a native `<Tabs>` — a genuinely different navigation
shape, not a duplicated screen.

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

`components/ui/route-error.tsx` is a single shared react-native file. Keep it
dependency-free — it renders after the tree below it has already thrown.

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
| `page.tsx` — `Page` | Page shell. Variants: `fill` (full-height flex col for inner-scroll views), `scroll` (default on, renders a `ScrollView`), `width="narrow"` (max-w-2xl). |
| `page.tsx` — `PageHeader` | Title / subtitle / actions row at the top of list pages. |
| `page.tsx` — `EmptyState` | Centered icon / title / description / action for empty lists. |
| `page.tsx` — `CardGrid` | Responsive 1→2→3→4 column card grid. |
| `query-state.tsx` — `QueryState` | Inline loading/error text (error takes priority) for a query whose data may still render alongside it. |
| `section-heading.tsx` — `SectionHeading` | `default` / `overline` section labels. |
| `detail-page.tsx` — `DetailPage<T>` | `<Page>` + loading/not-found guard via a render-prop so the entity is non-null inside `children`. |
| `detail-header.tsx` — `DetailHeader`, `EditButton` | Back-link header + color/badge/actions; standard pencil Edit button. |
| `form-dialog.tsx` — `FormDialog` | Dialog wrapper for the create/edit form pattern. |
| `status-chip.tsx`, `color-dot.tsx`, `confirm-dialog.tsx` | Status badge, activity-type color dot, destructive-action confirm. |
| `confirm.tsx` — `ConfirmProvider`, `useConfirm()` | `await confirm({title, description})` → `boolean`. Mounted once in `app/_layout.tsx`; prefer it over a per-component `<ConfirmDialog>` + `open` state. |
| `form-element.tsx` / `.web.tsx` — `FormElement` | The element `<Form>` renders: a real `<form>` on web (so Enter submits), a `View` on native. |
| `form.tsx` — `FieldRow` | Fields two to a row — what `grid grid-cols-2` did on web. `grid` has no native equivalent. |
| `toggle-chip.tsx` — `ToggleChip` | Selectable pill (day toggles, scope chips). |
| `switch-field.tsx` — `SwitchField` | Label + `Switch`; `htmlFor` does not associate off web, so the label is a `Pressable`. |
| `color-picker.tsx` — `ColorPicker` | Swatch row + hex field. Replaces `<input type="color">`, which has no native counterpart. |
| `file-picker.tsx` / `.web.tsx` — `FilePicker` | Drop zone + hidden `<input type="file">` on web; a "web only" note on native until `expo-document-picker` lands. Hands the caller decoded text, never a `File`. |
| `segmented.tsx` — `SegmentedButton` | Pressable pill for a segmented control. `segmentedItemClass` stays for expo-router `<Link>`s, which render a `Text` and so do inherit colour. |
| `code.tsx` — `Code` | Inline monospace run. `<code>` has no native counterpart, and it appears inside sentences, so it is a `Text`. |

Companion hook: `hooks/useListSection.ts` — owns the create/edit dialog open
state (`formOpen`, `editing`, `openCreate`, `openEdit`, `handleOpenChange`) that
every list component needs.

## Cross-Platform Primitives

Every primitive in `components/ui/` now renders on both platforms. The
radix-backed ones (`popover`, `select`, `tabs`, `tooltip`, `switch`) and
`calendar` keep a `.web.tsx`; `button`, `card`, `field`, `label`, `input`,
`icons`, `dialog`, `date-time-input` and the layout primitives are shared
files. The conversion rules, which every further primitive follows:

**Plain is shared; `.web.tsx` is the exception.** There are no `.native.tsx`
files left anywhere in the client. A primitive is a plain `.tsx` unless the web
behaviour genuinely has no native equivalent, in which case it is a
`.tsx`/`.web.tsx` pair — `input`
(`type="time"`/`type="number"` with `min`/`max` are real DOM input behaviour
`TextInput` cannot reproduce), `icons`, `dialog` (radix's focus trap, scroll
lock and animations, none worth faking on a `Modal` that already owns the
screen), `form-element` (a real `<form>` so Enter submits) and `file-picker`
(`<input type="file">`). Both halves export the same names, so call sites never
branch.

**The shared contract goes in a third module.** `input-base.ts` exists because
Metro resolves `./input` to `input.web.tsx` on web — the web file importing the
shared types from `./input` would import itself. Any `.tsx`/`.web.tsx` pair that
needs shared types needs a `-base.ts` alongside them; `icons-base.ts` and
`dialog-base.ts` are the other two. Keep the contract narrower than the web
library's own props: `dialog-base.ts` declares the four props the call sites
actually pass rather than re-exporting radix's, which is what makes the pair
comparable at all.

**Only the plain `.tsx` is typechecked against call sites.** TypeScript resolves
it and never looks at the platform sibling, so a drifted `.web.tsx` compiles
cleanly and breaks at runtime. Two things catch that: `client/test/platform-pairs.test.ts`
compares the exported *names* of every pair, and `npx expo export` — run it for
**both** `web` and `android` — is the only check on the shapes behind them.

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

**NativeWind does not implement all of Tailwind.** These have no effect on
native and are silently dropped, so a screen laid out with them looks right on
web and wrong on a device:

| Not supported | Use instead |
|---------------|-------------|
| `grid`, `grid-cols-*` | `flex-row flex-wrap` with `flex-1` on each cell (`FieldRow`), or `lg:flex-row` for a sidebar split |
| `divide-x/y-*` | `border-b border-border` on each row |
| `space-x/y-*` | `gap-*` on the flex container |
| `overflow-x/y-auto` | a `ScrollView` (`horizontal` for the x axis) |
| `min-h-screen`, `h-screen` | `flex-1` inside a `flex-1` parent |
| `hover:`, `group-hover:` | `HOVER_REVEAL` from `@/lib/utils` — the web classes, `''` off web, so a control hidden until hover is simply always visible on native |
| `<table>` | flex-row `View`s with fixed-width (`w-16`) and `flex-1` cells |

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

### Dialog

`dialog.web.tsx` is radix; `dialog.tsx` is a transparent `Modal` with a dimmed
backdrop and a centred card. `Escape` becomes `onRequestClose` (the Android back
button); `open === false` renders nothing on either platform, so a dialog's body
unmounts between openings and the native sheets no longer need the
render-conditionally trick.

Two native details worth not re-deriving. The backdrop is a `Pressable` laid out
*underneath* the card rather than wrapping it — `Pressable` has no
`stopPropagation`, so nesting the card inside would close the dialog on every
press. And `space-y-*`/`space-x-*` are child-combinator utilities nativewind
does not implement; use `gap`.

### Label and Field

`label` splits because radix's one job — clicking the label focuses the control
named by `htmlFor` — has no native counterpart. `label.tsx` accepts `htmlFor`
and ignores it rather than pretending.

`field.tsx` does **not** split. None of the label/description/error furniture
did anything a `<div>` did that a `View` cannot, so it is shared with no
`.web.tsx` at all — the first primitive to convert outright. Not everything
needs a pair; reach for one only when the web behaviour is genuinely absent on
native.

One thing was dropped in that conversion: `FieldLabel`'s
`group-data-[disabled=true]/field:opacity-50`. `data-*` attributes and group
variants are DOM-only, and nothing was setting that attribute.

### Popover, Select and Calendar

The three that open something over the page share one decision: **native does
not anchor**. Anchoring means measuring the trigger and flipping the panel
against the viewport, which is a chunk of layout code to reproduce a
pointer-era affordance — and every native platform shows choices in a sheet
anyway. `popover.tsx` and `select.tsx` are both a `Modal` with a dimmed
backdrop; `PopoverContent`'s `align` is accepted and ignored off web.

`SelectValue` wraps a bare-string child in a `<Text>` for the caller. That is
the one divergence a shared primitive should absorb rather than push out: an
unwrapped string renders fine on web and throws inside a `View`.

`calendar.tsx` is a month grid built from date-fns rather than
react-native-calendars — the whole surface is single-date selection, and a
calendar library brings a theming system that would sit outside the tailwind
tokens. `calendar-base.ts` drops react-day-picker's `mode`: range and multi
selection have no native implementation behind them, so they are not in the
contract.

Because all four compose cleanly, `date-time-input.tsx` is shared with **no**
`.web.tsx` at all.

### Tooltip

Hover does not exist on a touch screen, so `tooltip.tsx` shows the bubble on
**long press** and dismisses it after 2.5s. Dropping the content instead would
lose the only place some labels are written down. `Tooltip` wraps its children
in a relatively-positioned `View` so the bubble can be placed against the
trigger; radix's root is a fragment, so that wrapper exists on native only.

`TooltipProvider` is a pass-through off web — kept so `app/(app)/_layout.tsx`
does not have to branch.

### Switch

Not react-native's `Switch`: that takes `trackColor`/`thumbColor` as raw colour
values, which would pin the one control outside the tailwind theme and stop it
following dark mode with everything else. `switch.tsx` is a `Pressable` track
with a `View` thumb, and `switch-base.ts` exports the track/thumb classes both
halves apply so they cannot drift visually.

### CalendarView

`CalendarView.web.tsx` is FullCalendar; `CalendarView.tsx` is a themed agenda —
one section per day in the visible range, the day's time blocks above the
events scheduled inside them. FullCalendar is drag-and-drop over absolute pixel
offsets, none of which has a native counterpart worth reproducing, and an
agenda answers the same question on a phone. `date` and `view` come from the
same navigator, so both platforms always show the same span.

The `DateTime` scalar generates as `unknown`, so timestamps off a fragment are
narrowed through one `asDate` helper rather than asserted at each use.

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

## Testing Client Code

Screens and hooks are tested in the same vitest run as the server — no jest, no
babel, no nativewind transform. Three pieces of `vitest.config.ts` make that
work:

- `resolve.alias` maps `react-native` → `react-native-web`, so a component
  importing `View`/`Text` renders to DOM nodes, and `@` → `client/src`, matching
  the tsconfig path.
- `resolve.extensions` lists `.web.tsx`/`.web.ts` **first**, so a platform-split
  primitive resolves to the web variant exactly as Metro would on web.
- `test.environment` stays `node`; a client test opts into jsdom with a
  `// @vitest-environment jsdom` docblock on the first line.

Tests live in `client/test/`, mirroring the source tree
(`components/`, `hooks/`, `lib/`, plus `support/` for helpers).

**Mount through `renderWithProviders`** (`client/test/support/render.tsx`),
which supplies the `MockedProvider` plus the Toast, Confirm and Tooltip
providers `app/(app)/_layout.tsx` supplies. A component that reaches for a
missing provider throws rather than degrading — `useConfirm` is the usual one.

**Mocks must reference the same DocumentNode the component uses.** Either
export the operation from the module under test (`export const MY_TODAY = …`)
or import the generated one (`GetTodoListsPageDocument` from
`@/__generated__/graphql`). A re-declared copy of the same query text is a
different object and will not match. Give every mock
`maxUsageCount: Number.POSITIVE_INFINITY` when the screen re-reads under
`cache-and-network`.

Two things every screen mount also does, and every test therefore has to
answer: `useSyncTimezone` fires `UpdateProfileTimezone`, and any screen with a
route link needs `expo-router` stubbed (`vi.mock('expo-router', …)` returning a
pass-through `Link`, `useRouter`, `usePathname`) because the page is rendered
directly rather than through a navigator.

For subscriptions, drive `useLiveUpdates` with a `MockSubscriptionLink` and
`link.simulateResult(...)` — see `client/test/hooks/live-updates.test.tsx`. It
broadcasts one payload to every active subscription, so include a null for each
field the three documents select, and await a real timer tick (not just a
microtask) for delivery.

Coverage thresholds are enforced by `npm run test:coverage`, which is what CI
runs; they cover `server/src/services/scheduler.ts` and
`server/src/schema/resolvers/**` only. Client coverage is not thresholded —
smoke tests are there to catch a screen that stopped rendering, not to hit a
number.
