import { MapperKind, mapSchema } from '@graphql-tools/utils';
import type { ScopeConfig } from '@vantreeseba/drizzle-graphql';
import type { GraphQLSchema } from 'graphql';
import type { Context } from '../context.ts';
import { requireUser } from '../errors.ts';

/** Scopes a table to rows belonging to the caller, by their own `userId`. */
const ownedByUser = (context: Context) => ({
  userId: { eq: requireUser(context) },
});

/**
 * The tenant boundary: for each table, the predicate every generated read of it
 * is confined to. Passed to `buildSchema` as `scope` (see build-config.ts),
 * which ANDs it on last — after the caller's `where` — so a caller-supplied
 * filter can only ever narrow it.
 *
 * This is table-level, not field-level, and that is the point. A root-field
 * wrapper can only scope what passes through a root resolver, and a nested
 * relation field never does; before this, `Habit.completions` and
 * `Project.notes` were confined only by the foreign-key predicate the relation
 * loader ANDs in — correct, but incidental, and true only for as long as the
 * dependency keeps doing it. Here every path that reads a table — list and
 * single queries, relation fields batched or eager, cursor pages — carries the
 * owner predicate itself.
 *
 * The rules are deliberately not uniform:
 *
 * - `users` has no `userId` column. The caller *is* the row, so it scopes by `id`.
 * - `apiKeys` also hides revoked keys. They are not "the caller's keys" for any
 *   purpose the API has, and folding it in here keeps a revoked key from being
 *   resurrected by a caller-supplied `where`.
 * - `habitCompletions` has no owner column at all, and `projectNotes` owns none
 *   either; both scope through the relation to the parent that does.
 *
 * Every table in the Drizzle schema must appear here — `assertEveryTableScoped`
 * throws at boot otherwise, so adding a table cannot quietly produce an
 * unscoped one. Writes are unaffected: build-config disables every generated
 * mutation, so the only writes are hand-written resolvers going through Drizzle
 * directly, which enforce ownership with their own guard clauses.
 */
export const TABLE_SCOPE: ScopeConfig<Context> = {
  users: (context) => ({ id: { eq: requireUser(context) } }),
  activityTypes: ownedByUser,
  todoLists: ownedByUser,
  todos: ownedByUser,
  habits: ownedByUser,
  timeBlocks: ownedByUser,
  projects: ownedByUser,
  manualEvents: ownedByUser,
  apiKeys: (context) => ({
    userId: { eq: requireUser(context) },
    revokedAt: { isNull: true },
  }),
  habitCompletions: (context) => ({
    habit: { userId: { eq: requireUser(context) } },
  }),
  projectNotes: (context) => ({
    project: { userId: { eq: requireUser(context) } },
  }),
  notificationPreferences: ownedByUser,
  pushSubscriptions: ownedByUser,
  sentNotifications: ownedByUser,
};

/**
 * Throws unless every table in the Drizzle schema has a {@link TABLE_SCOPE}
 * entry. Called once at build time from build-config.ts with the schema keys,
 * so a new table fails the boot rather than serving unscoped rows.
 */
export function assertEveryTableScoped(tableKeys: readonly string[]): void {
  const missing = tableKeys.filter((key) => !(key in TABLE_SCOPE));
  if (missing.length > 0) {
    throw new Error(
      `Drizzle tables with no row scope: ${missing.join(', ')} — add them to TABLE_SCOPE (server/src/schema/scope.ts)`,
    );
  }
}

/** Name a generated root query is exposed under, and the table behind it. */
export type ScopedField = {
  /** Always `my`-prefixed. */
  as: string;
  /** Key in the Drizzle schema, so the scope can be checked to exist. */
  table: keyof typeof TABLE_SCOPE;
};

/**
 * Generated root query fields that are exposed, renamed, and served. Everything
 * drizzle-graphql generates is either in here or in {@link UNEXPOSED}; a name
 * in neither throws at boot.
 *
 * These entries no longer carry a filter — {@link TABLE_SCOPE} holds it, and
 * covers these fields along with every other path to the same table. `table`
 * names the entry that must exist for the field to be safe to serve.
 */
export const QUERY_SCOPE: Record<string, ScopedField> = {
  user: { as: 'myProfile', table: 'users' },
  activityTypes: { as: 'myActivityTypes', table: 'activityTypes' },
  todoLists: { as: 'myTodoLists', table: 'todoLists' },
  todos: { as: 'myTodos', table: 'todos' },
  habits: { as: 'myHabits', table: 'habits' },
  timeBlocks: { as: 'myTimeBlocks', table: 'timeBlocks' },
  apiKeys: { as: 'myApiKeys', table: 'apiKeys' },
  projects: { as: 'myProjects', table: 'projects' },
  project: { as: 'myProject', table: 'projects' },
  manualEvents: { as: 'myManualEvents', table: 'manualEvents' },
};

/**
 * Generated root query fields deliberately not served. Nothing queries these as
 * root fields today, and each is already reachable — correctly scoped — by
 * traversing a relation from something that is.
 *
 * `pushSubscriptions` and `sentNotifications` are server-side bookkeeping: the
 * first holds a browser's push keys, the second what the tick has already sent.
 * Neither has a caller. Push subscriptions are written through
 * `myRegisterPushSubscription` and read only by the notification service, and
 * `notificationPreference` is unexposed for a different reason: it is served,
 * but by a hand-written `myNotificationPreferences` that materialises the row
 * on first read, so callers never have to treat "never saved" as a null.
 *
 * The single-row variants are redundant with their list form plus a `where`.
 * `users` is the plural of the one table that scopes by `id`. `projectNotes` and
 * `habitCompletions` are leaves owned by a parent (`Project.notes`,
 * `Habit.completions`); `habitCompletions` has no `userId` column at all, so
 * exposing it would need the relation form, `{ habit: { userId: { eq } } }`.
 *
 * Adding an entry here is a deliberate choice not to serve a table. Adding a
 * Drizzle table and forgetting both maps throws at boot.
 */
export const UNEXPOSED: ReadonlySet<string> = new Set([
  'activityType',
  'notificationPreference',
  'notificationPreferences',
  'pushSubscription',
  'pushSubscriptions',
  'sentNotification',
  'sentNotifications',
  'apiKey',
  'habitCompletions',
  'habitCompletion',
  'habit',
  'manualEvent',
  'projectNotes',
  'projectNote',
  'timeBlock',
  'todoList',
  'todo',
  'users',
]);

/**
 * Rename the generated root query fields to their `my*` form, and remove the
 * ones that are not served.
 *
 * The generated resolvers already do everything the hand-written `my*` queries
 * did — filtering, ordering, limit/offset, relation loading — and since the
 * tenant predicate moved into {@link TABLE_SCOPE} they do the scoping too.
 * Rewrapping the resolver already attached to the field keeps all of it intact:
 * no second schema, no delegation, and the field still returns plain Drizzle
 * rows, which the codegen `mappers` and the `FieldMap` field resolvers both
 * depend on.
 *
 * What the wrapper still does is fail unauthenticated calls at the root, so
 * `myTodos` without a caller is one UNAUTHENTICATED error rather than whatever
 * the scope hook raises further in. The scope itself is no longer composed
 * here — the library ANDs it on after the caller's `where` — which is why
 * {@link ScopedField} names a table instead of carrying a filter, and why a
 * field whose table has no {@link TABLE_SCOPE} entry throws at boot rather than
 * being served unscoped.
 *
 * Unknown fields are removed, not guarded: a generated field with no rule is
 * deleted from the schema, so naming it fails validation rather than execution
 * — and, because {@link UNEXPOSED} must list it explicitly, adding a Drizzle
 * table fails at boot instead of quietly producing a hidden field.
 *
 * Default ordering is not applied here either — `defaults` in `build-config.ts`
 * holds it, where it covers relation reads of the same table as well.
 *
 * Does not prune: the `extensionSDL` applied afterwards references generated
 * input types that are unreferenced at this point. `finalizeSchema` prunes last.
 */
export function scopeRootFields(schema: GraphQLSchema): GraphQLSchema {
  return mapSchema(schema, {
    [MapperKind.QUERY_ROOT_FIELD]: (field, fieldName) => {
      const rule = QUERY_SCOPE[fieldName];
      if (!rule) {
        if (!UNEXPOSED.has(fieldName)) {
          throw new Error(
            `Generated query "${fieldName}" is neither exposed in QUERY_SCOPE nor listed in UNEXPOSED (server/src/schema/scope.ts)`,
          );
        }
        return null;
      }

      if (!TABLE_SCOPE[rule.table]) {
        throw new Error(
          `Query "${rule.as}" reads table "${rule.table}", which has no row scope — add it to TABLE_SCOPE (server/src/schema/scope.ts)`,
        );
      }

      const inner = field.resolve;
      if (!inner) {
        throw new Error(`Generated query "${fieldName}" has no resolver`);
      }

      return [
        rule.as,
        {
          ...field,
          resolve: (
            parent: unknown,
            args: Record<string, unknown>,
            context: Context,
            info: Parameters<typeof inner>[3],
          ) => {
            requireUser(context);
            return inner(parent, args, context, info);
          },
        },
      ];
    },
  });
}
