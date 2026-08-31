import type {
  ActivityType,
  ApiKey,
  DB,
  Habit,
  ManualEvent,
  Project,
  ProjectNote,
  TimeBlock,
  Todo,
  TodoList,
} from '@auto-cal/db';
import type { Context } from '../../context.ts';
import { forbidden, notFound, requireOwner } from '../../errors.ts';

/**
 * The tables with a `userId` column, mapped to the row each returns.
 *
 * Same eight `QUERY_SCOPE` scopes by `userId` in `../scope.ts`, for the same
 * reason: `habitCompletions` has no such column (it is owned through its habit)
 * and `users` *is* the owner. Neither can be loaded through here.
 */
type OwnedRow = {
  activityTypes: ActivityType;
  apiKeys: ApiKey;
  habits: Habit;
  manualEvents: ManualEvent;
  projectNotes: ProjectNote;
  projects: Project;
  timeBlocks: TimeBlock;
  todoLists: TodoList;
  todos: Todo;
};

/** Label the entity carries in `NOT_FOUND` messages and extensions. */
const ENTITY_LABEL: Record<keyof OwnedRow, string> = {
  activityTypes: 'ActivityType',
  apiKeys: 'ApiKey',
  habits: 'Habit',
  manualEvents: 'ManualEvent',
  projectNotes: 'ProjectNote',
  projects: 'Project',
  timeBlocks: 'TimeBlock',
  todoLists: 'TodoList',
  todos: 'Todo',
};

/**
 * Per-table `findFirst` by id.
 *
 * Spelled out rather than indexed generically (`db.query[table].findFirst(...)`)
 * because indexing with a type parameter collapses the nine query builders into
 * a union, and the argument then has to satisfy the *intersection* of nine
 * different relation configs — which nothing does. Each entry below is a
 * concrete call that type-checks on its own, so `loadOwned` needs no cast.
 */
const FIND_BY_ID: {
  [K in keyof OwnedRow]: (
    db: DB,
    id: string,
  ) => Promise<OwnedRow[K] | undefined>;
} = {
  activityTypes: (db, id) =>
    db.query.activityTypes.findFirst({ where: { id } }),
  apiKeys: (db, id) => db.query.apiKeys.findFirst({ where: { id } }),
  habits: (db, id) => db.query.habits.findFirst({ where: { id } }),
  manualEvents: (db, id) => db.query.manualEvents.findFirst({ where: { id } }),
  projectNotes: (db, id) => db.query.projectNotes.findFirst({ where: { id } }),
  projects: (db, id) => db.query.projects.findFirst({ where: { id } }),
  timeBlocks: (db, id) => db.query.timeBlocks.findFirst({ where: { id } }),
  todoLists: (db, id) => db.query.todoLists.findFirst({ where: { id } }),
  todos: (db, id) => db.query.todos.findFirst({ where: { id } }),
};

/**
 * Per-table `findMany` by id list — the batch twin of {@link FIND_BY_ID}, and
 * spelled out for the same reason. `db.query[table].findMany(...)` with a type
 * parameter collapses the nine builders into a union whose argument has to
 * satisfy the intersection of nine relation configs; it only ever compiled
 * while `db` was typed `any`.
 */
const FIND_BY_IDS: {
  [K in keyof OwnedRow]: (db: DB, ids: string[]) => Promise<OwnedRow[K][]>;
} = {
  activityTypes: (db, ids) =>
    db.query.activityTypes.findMany({ where: { id: { in: ids } } }),
  apiKeys: (db, ids) =>
    db.query.apiKeys.findMany({ where: { id: { in: ids } } }),
  habits: (db, ids) => db.query.habits.findMany({ where: { id: { in: ids } } }),
  manualEvents: (db, ids) =>
    db.query.manualEvents.findMany({ where: { id: { in: ids } } }),
  projectNotes: (db, ids) =>
    db.query.projectNotes.findMany({ where: { id: { in: ids } } }),
  projects: (db, ids) =>
    db.query.projects.findMany({ where: { id: { in: ids } } }),
  timeBlocks: (db, ids) =>
    db.query.timeBlocks.findMany({ where: { id: { in: ids } } }),
  todoLists: (db, ids) =>
    db.query.todoLists.findMany({ where: { id: { in: ids } } }),
  todos: (db, ids) => db.query.todos.findMany({ where: { id: { in: ids } } }),
};

/**
 * Load a row by id and assert the caller owns it, in the guard order CLAUDE.md
 * documents: existence (NOT_FOUND), then ownership (FORBIDDEN).
 *
 * This is the `findFirst` + {@link requireOwner} pair that every mutation
 * touching an existing row opens with.
 *
 * Takes `userId` rather than re-deriving it from the context because callers
 * have already called `requireUser` — they need the id for the write itself.
 */
export async function loadOwned<K extends keyof OwnedRow>(
  context: Context,
  table: K,
  id: string,
  userId: string,
): Promise<OwnedRow[K]> {
  const row = await FIND_BY_ID[table](context.db, id);
  return requireOwner(row, ENTITY_LABEL[table], id, userId);
}

/**
 * The batch form of {@link loadOwned}: one query for the whole id list, and the
 * same guard order — a missing id is NOT_FOUND, someone else's is FORBIDDEN.
 *
 * Checking explicitly rather than just ANDing `userId` into the write matters
 * for a bulk action: a scoped `IN (…)` silently drops the ids the caller does
 * not own, so a request that half-worked reports success. Rows come back in
 * `ids` order so the caller can rely on the pairing.
 */
export async function loadOwnedMany<K extends keyof OwnedRow>(
  context: Context,
  table: K,
  ids: readonly string[],
  userId: string,
): Promise<OwnedRow[K][]> {
  const rows = await FIND_BY_IDS[table](context.db, [...ids]);
  const byId = new Map(rows.map((row) => [row.id, row]));

  return ids.map((id) => {
    const row = byId.get(id);
    if (!row) throw notFound(ENTITY_LABEL[table], id);
    if (row.userId !== userId) throw forbidden();
    return row;
  });
}
