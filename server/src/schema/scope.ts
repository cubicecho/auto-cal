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
  /** Applied when the caller passes no `orderBy`, in the generated input shape. */
  defaultOrderBy?: Record<string, unknown>;
};

/** Generated `InnerOrder` shorthand: `{ direction, priority }`. */
export const desc = (priority: number) => ({ direction: 'desc', priority });
export const asc = (priority: number) => ({ direction: 'asc', priority });

/**
 * Generated root query fields that are exposed, renamed, and scoped to the
 * caller. Everything drizzle-graphql generates is either in here or in
 * {@link UNEXPOSED}; a name in neither throws at boot.
 *
 * The rules are deliberately not uniform. `users` has no `userId` column — it
 * scopes by `id` — and `apiKeys` hides revoked keys as part of its scope.
 */
export const QUERY_SCOPE: Record<string, ScopedField> = {};

/**
 * Generated root query fields deliberately not served.
 *
 * The single-row variants are redundant with their list form plus a `where`.
 * `habitCompletions` is different in kind: the table has no `userId` column and
 * generated filters are columns-only (no relation keys), so there is no filter
 * that scopes it. It stays reachable, correctly scoped, via `Habit.completions`,
 * where the generated loader ANDs the foreign-key predicate with the caller's
 * filter.
 */
export const UNEXPOSED: ReadonlySet<string> = new Set([
  'activityTypes',
  'activityType',
  'apiKeys',
  'apiKey',
  'habitCompletions',
  'habitCompletion',
  'habits',
  'habit',
  'projectNotes',
  'projectNote',
  'projects',
  'project',
  'timeBlocks',
  'timeBlock',
  'todoLists',
  'todoList',
  'todos',
  'todo',
  'users',
  'user',
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
 * - **The caller's filter is AND-ed, never merged.** Generated filters expose
 *   `OR`/`NOT` at every level, so a spread would let
 *   `where: { OR: [...] }` widen past the scope. `AND` can only narrow.
 * - **Unknown fields are removed, not guarded.** A generated field with no rule
 *   is deleted from the schema, so naming it fails validation rather than
 *   execution — and, because {@link UNEXPOSED} must list it explicitly, adding a
 *   Drizzle table fails at boot instead of quietly producing a hidden field.
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
                orderBy: args.orderBy ?? rule.defaultOrderBy,
              },
              context,
              info,
            ),
        },
      ];
    },
  });
}
