### Auto Cal

## Purpose

The purpose of this application is to allow users to create todo's and habits.
Those are then automatically scheduled based on priority within a time block the user creates.
Time blocks are sections of time (5pm-7pm) that are labeled for certain kinds of activities.
Habits are tagged with an activity type. Todos belong to a **todo list** that carries
the activity type (and default priority / duration) on their behalf.

The app will use the activity types to schedule the tasks and habits within a time block.
If new tasks or habits are generated that are higher priority, it will reschedule all
tasks/habits to fit.


A **todo list** has a name, description, activity type, default priority, and default
estimated length. New todos seeded into a list pick up the list's defaults as form
starting values; the todo persists its own copy so later edits to the list don't cascade.

Todo's are a single time task that needs to be completed.
They belong to a list and have a title, description, priority, estimated length,
and an optional due date. The activity type is inherited from the list.

Habits are repeated tasks that should be completed X times per week or month.
They have a title, description, priority, estimated length and activity type.

The app should track how well habits are being done.
The app should track the number of completed todo's by activity type (resolved
through the todo's list).

---

## Completion Behavior

### Todos

**Completing a todo**
- When a user marks a todo as complete, a dialog appears to confirm (or edit) the completion
  datetime, defaulting to now. This becomes `completedAt`.
- The todo's `scheduledAt` is updated to match `completedAt` — the calendar record moves to
  reflect *when the work actually happened*, not when it was originally planned.
- If `completedAt` is earlier than the original `scheduledAt` (completed early), the original
  scheduled slot is freed and the scheduler runs immediately to fill it with the next
  highest-priority unscheduled item.
- If `completedAt` is at or after the original `scheduledAt` (on-time or late), the slot
  was already "used" and no rescheduling is needed.
- On the calendar, completed todos render with a checkmark overlay and remain interactive
  (can be clicked to view details or uncompleted).

**Uncompleting a todo**
- Clears `completedAt` and clears `scheduledAt` (returns the item to the unscheduled pool).
- The scheduler runs to assign it a new future slot based on current priority and availability.
- The old calendar position is freed.

### Habits

**Completing a habit occurrence**
- Each completion creates a `habit_completions` row. The user is shown a dialog to confirm
  (or edit) the completion datetime, defaulting to now; this becomes `completedAt` on the row.
- The scheduled occurrence moves on the calendar to the actual `completedAt` time, with a
  checkmark overlay.
- If completed early (before the scheduled slot), the original slot is freed and the scheduler
  may fill it with another item.

**Uncompleting a habit occurrence**
- The `habit_completions` row is deleted (or soft-deleted).
- The slot is returned to the pool; the scheduler re-evaluates whether to place another
  occurrence there.

### Calendar display rules

| State                          | Calendar appearance                        | Interactive? |
|--------------------------------|--------------------------------------------|-------------|
| Scheduled, not complete        | Normal card                                | Yes         |
| Completed on-time / late       | Card at `completedAt` time, checkmark      | Yes         |
| Completed early (future freed) | Card at `completedAt` time, checkmark      | Yes         |
| Overdue (past slot, no complete) | Card with red/amber tint, overdue badge  | Yes         |

### Overdue items
- Items past their scheduled slot with no `completedAt` are **overdue**.
- They are automatically moved to the next available slot by the scheduler but flagged
  visually as overdue (red/amber tint + badge) so the user knows they are running late.
- They do not stay pinned to the missed slot; yesterday's calendar should not accumulate
  unactioned items.

### Completion time outside time blocks
- `completedAt` is recorded exactly as the user enters it, regardless of whether that time
  falls within any defined time block.
- The calendar renders the completed item floating at its exact `completedAt` time — there
  is no snapping to time block boundaries.

### Habit occurrence matching
- Habit completions are not matched to specific scheduled occurrences.
- A completion record is created with the user-entered `completedAt` timestamp.
- Period credit (e.g. "3 times this week") is calculated purely by counting completion
  timestamps that fall within the period window — no occurrence ID is tracked.

### Todo re-completion
- A todo is a single-time task. It has at most one `completedAt` value at any given time.
- Uncompleting and re-completing is valid (e.g. to correct the timestamp), but the latest
  `completedAt` always wins — there is no completion history log.

---

## Scheduler

### Horizon
- The scheduler looks ahead **2 months** from the current date when placing items.
- This may be made configurable in the future.

### Conflict resolution (priority bumping)
- When a higher-priority item needs a slot occupied by a lower-priority item, the
  lower-priority item is bumped to its next available slot.
- If no future slot exists within the 2-month horizon, the bumped item is marked
  **unschedulable** and shown with the same amber warning triangle used for items
  with no matching time block.
- Users are not prompted to resolve conflicts manually — the scheduler handles it.

### Write-back triggers
- The scheduler runs **after every mutation that could affect the schedule**: create/update/
  delete of a todo, habit, time block, or completion record.
- It runs **in the background** (fire-and-forget) — the mutation response is not blocked.
- In the future, a GraphQL subscription may be added so the client receives the updated
  schedule automatically without polling.

### Manual scheduling override
- Users can manually drag a todo or habit onto any calendar slot, including slots outside
  any defined time block. The dragged position sets `scheduledAt` directly.
- A manually placed item is treated as **higher priority than any scheduler-assigned item**
  for the purpose of slot ownership — the scheduler will not evict it to place an
  auto-scheduled item there. However, a **higher-priority item** (by the item's own priority
  field) can still bump it.
- **`isPinnedSchedule` is removed** — the manual-vs-auto distinction is tracked implicitly
  (a dragged item sets a `manuallyScheduled` flag or similar); it does not affect priority
  bumping logic beyond the rule above.
- Delete triggers: when a todo or habit is deleted, its slot is immediately freed and the
  scheduler runs in the background to backfill it.

### Activity type requirement
- Activity type is **required** on habits, time blocks, and **todo lists**. Todos do
  not carry an activity type directly — they inherit it through their list, which is
  itself required. Without an activity type the scheduler cannot match an item to a
  time block.
- Users may still manually drag an item to a calendar slot regardless of activity type,
  but it will not be auto-scheduled.
- The UI should enforce list selection on a todo (which transitively requires an
  activity type via the list), and activity type selection on a habit / time block /
  todo list, before save.

### No time blocks — onboarding gate
- If a user has no time blocks, the scheduler cannot place any items.
- The **Dashboard and Schedule views** show a blocking empty state directing the user to
  create a time block. All other pages (Todos, Habits, Activity Types) remain fully usable.
- Once at least one time block exists the gate disappears and the scheduler runs normally.

### Habit period boundaries
- A "week" runs **Sunday → Saturday**.
- A "month" is the calendar month.
- If a period ends with fewer completions than the target frequency, it is recorded as a
  partial failure — no catch-up scheduling into the next period.
- The scheduler will not cram remaining occurrences into the final days of a period; it
  schedules evenly across available slots and accepts whatever completes naturally.
- Users may log **more completions than the target frequency** in a period. The UI does not
  block over-completion; extras are recorded and counted in analytics.

### Habit scheduler horizon
- The scheduler pre-creates tentative `habit_completions` rows (with `scheduledAt` set,
  `completedAt` null) for the full **2-month** lookahead window.
- For a daily habit this may produce ~60 rows; this is intentional and correct.

---

## Analytics

### Route structure
- A dedicated `/analytics` route is added to the nav.
- Habit per-period stats remain on `/habits/$id` (existing `HabitDetail`).
- Activity type stats remain on `/activity-types` (existing list).
- The current "Dashboard" nav link is **renamed to "Calendar"** — it is purely a
  scheduling/calendar view, not a stats surface.

### Time range filter
- Fixed presets only: **This week / This month / Last 3 months / All time**.
- No custom date range picker (can be added later).
- Filter applies to all sections on the page simultaneously.

### Data freshness
- All queries are real-time (no caching). May be pre-aggregated later.

### Page layout (top to bottom)

#### 1. Composite productivity score
- A single prominent number at the top of the page.
- Calculated as a weighted average of:
  - **Habit consistency** — average completion rate across all habits in the period
    (capped at 100% per habit; over-completion does not inflate the score)
  - **Todo completion rate** — completed todos / total todos created in the period
- Weighting TBD (start 50/50, tune later).
- Displayed as a percentage with a label and a brief plain-English interpretation
  (e.g. "Great week", "Room to improve").

#### 2. Habit consistency
- **Summary bar chart**: one bar per habit, showing completion rate % for the selected
  period. Capped at 100%. Color-coded by activity type color.
- **Trend expand**: clicking a habit bar expands a line chart below it showing
  week-by-week completion rate over the selected range.
- Uses shadcn/recharts3.

#### 3. Time distribution
- **Donut or grouped bar chart** showing time by activity type.
- Two series side-by-side per activity type: **scheduled time** vs **completed time**
  (in minutes, converted to hours for display).
- Gives a clear picture of where plans matched reality.
- Uses shadcn/recharts3.

#### 4. Todo throughput
- **Bar chart** of todos completed per time bucket.
- Toggle between **daily** and **weekly** x-axis.
- Secondary line overlay showing overdue count (todos past due with no `completedAt`).
- Uses shadcn/recharts3.

### Charting library
- **shadcn charts** (built on Recharts 3). Do not introduce a second charting library.

---

## Time Blocks

### Overlapping time blocks and priority
- Time blocks can overlap in day/time coverage.
- Each time block has an integer **priority** field (higher = preferred, default 0).
- When two blocks cover the same slot, the scheduler fills the higher-priority block first
  before using the lower-priority one.
- Users set time block priority manually in the time block form.
