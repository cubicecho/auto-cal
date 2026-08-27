import { MapperKind, mapSchema } from '@graphql-tools/utils';
import type { GraphQLSchema } from 'graphql';
import type { Context } from '../context.ts';
import { requireUser } from '../errors.ts';

/**
 * A filter, in the generated `<Table>Filters` input shape, that restricts a
 * table to rows belonging to `userId`.
 */
export type ScopeRule = (userId: string) => Record<string, unknown>;

export type ScopedField = {
  /** Name the field is exposed under. Always `my`-prefixed. */
  as: string;
  scope: ScopeRule;
};

/**
 * Generated root query fields that are exposed, renamed, and scoped to the
 * caller. Everything drizzle-graphql generates is either in here or in
 * {@link UNEXPOSED}; a name in neither throws at boot.
 *
 * The rules are deliberately not uniform. `users` has no `userId` column — it
 * scopes by `id` — and `apiKeys` hides revoked keys as part of its scope.
 */
export const QUERY_SCOPE: Record<string, ScopedField> = {
  user: {
    as: 'myProfile',
    // No `userId` column — the caller *is* the row.
    scope: (userId) => ({ id: { eq: userId } }),
  },
  activityTypes: {
    as: 'myActivityTypes',
    scope: (userId) => ({ userId: { eq: userId } }),
  },
  todoLists: {
    as: 'myTodoLists',
    scope: (userId) => ({ userId: { eq: userId } }),
  },
  todos: {
    as: 'myTodos',
    scope: (userId) => ({ userId: { eq: userId } }),
  },
  habits: {
    as: 'myHabits',
    scope: (userId) => ({ userId: { eq: userId } }),
  },
  timeBlocks: {
    as: 'myTimeBlocks',
    scope: (userId) => ({ userId: { eq: userId } }),
  },
  apiKeys: {
    as: 'myApiKeys',
    // Revoked keys are not "the caller's keys" for any purpose the API has, and
    // folding it into the scope keeps a revoked key from being resurrected by a
    // caller-supplied `where`.
    scope: (userId) => ({
      userId: { eq: userId },
      revokedAt: { isNull: true },
    }),
  },
  projects: {
    as: 'myProjects',
    scope: (userId) => ({ userId: { eq: userId } }),
  },
  project: {
    as: 'myProject',
    scope: (userId) => ({ userId: { eq: userId } }),
  },
};

/**
 * Generated root query fields deliberately not served. Nothing queries these as
 * root fields today, and each is already reachable — correctly scoped — by
 * traversing a relation from something that is.
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
  'apiKey',
  'habitCompletions',
  'habitCompletion',
  'habit',
  'projectNotes',
  'projectNote',
  'timeBlock',
  'todoList',
  'todo',
  'users',
]);

/**
 * Rewrap the generated root query resolvers so each one filters to the caller,
 * and rename them to their `my*` form.
 *
 * The generated resolvers already do everything the hand-written `my*` queries
 * did — filtering, ordering, limit/offset, relation loading — so the only thing
 * missing was the tenant predicate. Wrapping the resolver already attached to
 * the field keeps them intact: no second schema, no delegation, and the field
 * still returns plain Drizzle rows, which the codegen `mappers` and the
 * `FieldMap` field resolvers both depend on.
 *
 * Two invariants hold this up:
 *
 * - **The caller's filter is AND-ed, never merged.** Spreading the two into one
 *   object puts them on the same keys, so `where: { userId: { eq: <them> } }`
 *   silently replaces the scope. Wrapping both in `AND` keeps them as separate
 *   operands, which can only ever narrow. (`OR`/`NOT` do not widen either way —
 *   generated filters AND sibling fields with `OR` branches — but that is the
 *   dependency's semantics, not something worth depending on here.)
 * - **Unknown fields are removed, not guarded.** A generated field with no rule
 *   is deleted from the schema, so naming it fails validation rather than
 *   execution — and, because {@link UNEXPOSED} must list it explicitly, adding a
 *   Drizzle table fails at boot instead of quietly producing a hidden field.
 *
 * Default ordering is not applied here — `defaults` in `build-config.ts` holds
 * it, where it covers relation reads of the same table as well.
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
            `Generated query "${fieldName}" is neither scoped in QUERY_SCOPE nor listed in UNEXPOSED (server/src/schema/scope.ts)`,
          );
        }
        return null;
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
          ) =>
            inner(
              parent,
              {
                ...args,
                where: {
                  AND: [
                    rule.scope(requireUser(context)),
                    ...(args.where ? [args.where] : []),
                  ],
                },
              },
              context,
              info,
            ),
        },
      ];
    },
  });
}
