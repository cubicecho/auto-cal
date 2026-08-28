import type {
  ActivityType,
  ApiKey,
  Habit,
  ManualEvent,
  Project,
  ProjectNote,
  TimeBlock,
  Todo,
  TodoList,
} from '@auto-cal/db';
import type { Context } from '../../context.ts';
import { requireOwner } from '../../errors.ts';

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
 * Load a row by id and assert the caller owns it, in the guard order CLAUDE.md
 * documents: existence (NOT_FOUND), then ownership (FORBIDDEN).
 *
 * This is the `findFirst` + {@link requireOwner} pair that every mutation
 * touching an existing row opens with. Collapsing it is worth more than the
 * line count: `context.db` is typed `any` (it is a dual-backend instance, see
 * `db/src/index.ts`), so the inline form infers the row as `any` and silently
 * gives up type-checking on everything read from it afterwards. Going through
 * here pins the row to its Drizzle type.
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
  const row = (await context.db.query[table].findFirst({ where: { id } })) as
    | OwnedRow[K]
    | undefined;
  return requireOwner(row, ENTITY_LABEL[table], id, userId);
}
