# Plan: #7 — Weekly navigation on the dashboard

**Branch:** `feat/weekly-nav`
**Scope:** Add prev/next week controls to the dashboard with shareable URLs.

## Goal

Today the dashboard is locked to the current week. Add prev/next/today controls and persist the selected week in the URL via TanStack Router search params. Mostly a client-only change — the `mySchedule` query already accepts `weekStart`.

## Decisions (locked)

1. **URL param**: `?weekStart=2026-04-27` (Monday-anchor ISO date). Matches the GraphQL `mySchedule(weekStart: String)` arg name.
2. **Day-level navigation**: yes, also wire up day-level navigation (`?day=2026-04-30`).
3. **Header placement**: in the dashboard header, above the calendar/schedule grid. Custom WeekNavigator component.

## Work units

1. **Route search params** (`client/src/routes/dashboard.tsx`)
   - Add `validateSearch` with Zod schema: `{ weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() }`
   - Default `weekStart` to "this week's Monday" computed at render time
   - When `day` is set, the calendar should snap to day view for that date; `weekStart` derives from the day if both are present, with `day` taking precedence for view-mode
   - Expose both to the dashboard component via `Route.useSearch()`

2. **Pass `weekStart` to `mySchedule`**
   - The `mySchedule` query already accepts `weekStart: String` — wire the search param through so the query refetches when week changes
   - Both `CalendarView` and `ScheduleView` already consume `mySchedule` data; no fragment changes needed
   - When `day` is set, derive `weekStart` from it for the query (the schedule is still week-scoped; day param only changes the view)

3. **Header component with prev/today/next**
   - New `WeekNavigator` component in `client/src/components/domain/dashboard/`
   - Shows: `[<] [Today] [>]  Week of Mon, Apr 27 – Sun, May 3` (or day label when day-mode)
   - Buttons update the URL via `useNavigate({ search: { weekStart: nextWeekStr } })` (or `day` when day-mode)
   - "Today" sets `weekStart` to current Monday (and clears `day`)
   - Granularity follows current view mode: prev/next steps by 1 day in day-mode, 1 week otherwise

4. **Sync calendar view date and mode**
   - react-big-calendar has `date` and `view` props — drive both from URL params:
     - If `day` is present → `view='day'`, `date=parsed(day)`
     - Else → `view='week'`, `date=parsed(weekStart)`
   - When the user changes view mode in the calendar's own toolbar, mirror that into the URL (drop or add the `day` param accordingly)

5. **Keyboard shortcuts (optional)**
   - `[` / `]` for prev/next, `t` for today
   - Skip if it complicates testing or conflicts with existing shortcuts

## Quality gates

- `npm run typecheck`
- `npm run lint`
- Manual smoke: navigate to `/dashboard?week=2026-04-27`, see the right week; click prev/next, URL and view both update

## Out of scope

- Day-level navigation
- Week navigation on routes other than `/dashboard` (e.g. `/stats` already has its own date filter — leave alone)
- Persisting the user's preferred view mode (week/day/month)

## Risk

- **react-big-calendar's controlled-vs-uncontrolled date prop** — need to confirm the `date` prop is the right knob and doesn't conflict with internal navigation. Quick spike before committing the whole approach.
