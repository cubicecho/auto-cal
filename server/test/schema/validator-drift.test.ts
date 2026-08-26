/**
 * Drift check between the SDL's mutation inputs and the Zod validators.
 *
 * The SDL and `validators.ts` describe the same inputs twice, and nothing but
 * habit keeps them in step. A field added to `CreateHabitArgs` but not to
 * `CreateHabitInput` type-checks, resolves, and reaches the database
 * unvalidated — Zod strips unknown keys silently, so the symptom is a setting
 * that does nothing rather than an error anyone would notice. A field deleted
 * from the SDL but left in Zod is the harmless direction, but it is also how
 * validators accumulate rules for fields that no longer exist.
 *
 * So: every input type reachable from a mutation argument must have a
 * validator, and the two must agree field for field.
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  type GraphQLInputObjectType,
  buildSchema,
  isInputObjectType,
} from 'graphql';
import { describe, expect, it } from 'vitest';
import type { z } from 'zod';
import {
  CompleteHabitInput,
  CreateActivityTypeInput,
  CreateHabitInput,
  CreateProjectInput,
  CreateProjectNoteInput,
  CreateTimeBlockInput,
  CreateTodoInput,
  CreateTodoListInput,
  ImportTodoInput,
  ImportTodoListInput,
  ImportTodosInput,
  MyCreateApiKeyInput,
  ReorderProjectNotesInput,
  UpdateActivityTypeInput,
  UpdateHabitInput,
  UpdateProjectInput,
  UpdateProjectNoteInput,
  UpdateTimeBlockInput,
  UpdateTodoInput,
  UpdateTodoListInput,
} from '../../src/schema/validators.ts';

/**
 * SDL input type name → validator. The names differ by convention (the SDL
 * suffixes `Args`, the validators suffix `Input`), so the pairing has to be
 * written out; the tests below then prove it is complete in both directions.
 */
const VALIDATORS: Record<string, z.ZodTypeAny> = {
  CompleteHabitArgs: CompleteHabitInput,
  CreateActivityTypeArgs: CreateActivityTypeInput,
  CreateHabitArgs: CreateHabitInput,
  CreateProjectArgs: CreateProjectInput,
  CreateProjectNoteArgs: CreateProjectNoteInput,
  CreateTimeBlockArgs: CreateTimeBlockInput,
  CreateTodoArgs: CreateTodoInput,
  CreateTodoListArgs: CreateTodoListInput,
  ImportTodoInput: ImportTodoInput,
  ImportTodoListInput: ImportTodoListInput,
  ImportTodosArgs: ImportTodosInput,
  MyCreateApiKeyInput: MyCreateApiKeyInput,
  ReorderProjectNotesArgs: ReorderProjectNotesInput,
  UpdateActivityTypeArgs: UpdateActivityTypeInput,
  UpdateHabitArgs: UpdateHabitInput,
  UpdateProjectArgs: UpdateProjectInput,
  UpdateProjectNoteArgs: UpdateProjectNoteInput,
  UpdateTimeBlockArgs: UpdateTimeBlockInput,
  UpdateTodoArgs: UpdateTodoInput,
  UpdateTodoListArgs: UpdateTodoListInput,
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const schema = buildSchema(
  readFileSync(
    resolve(__dirname, '../../src/__generated__/schema.graphql'),
    'utf8',
  ),
);

/**
 * Every input object type a mutation can be handed, directly or nested.
 *
 * Reachability from `Mutation` rather than "every input in the SDL" is what
 * keeps drizzle-graphql's generated filter and order-by inputs out: those are
 * query-side, and nothing hand-written validates them.
 */
function reachableMutationInputs(): Map<string, GraphQLInputObjectType> {
  const found = new Map<string, GraphQLInputObjectType>();
  const visit = (type: unknown): void => {
    if (!isInputObjectType(type) || found.has(type.name)) return;
    found.set(type.name, type);
    for (const field of Object.values(type.getFields())) {
      visit(unwrap(field.type));
    }
  };
  for (const field of Object.values(
    schema.getMutationType()?.getFields() ?? {},
  )) {
    for (const arg of field.args) visit(unwrap(arg.type));
  }
  return found;
}

/** Strip `!` and `[]` down to the named type. */
function unwrap(type: unknown): unknown {
  let t = type as { ofType?: unknown };
  while (t?.ofType) t = t.ofType as { ofType?: unknown };
  return t;
}

/**
 * `.refine()` wraps the object in a `ZodEffects`, which has no `.shape` —
 * `CreateTimeBlockInput` is one, and reading its keys means unwrapping first.
 */
function keysOf(validator: z.ZodTypeAny): string[] {
  let v = validator;
  while ('innerType' in v && typeof v.innerType === 'function') {
    v = (v as unknown as { innerType(): z.ZodTypeAny }).innerType();
  }
  const shape = (v as unknown as { shape?: Record<string, unknown> }).shape;
  if (!shape) throw new Error('not a ZodObject');
  return Object.keys(shape).sort();
}

const reachable = reachableMutationInputs();

describe('mutation inputs', () => {
  it('all have a validator', () => {
    const unvalidated = [...reachable.keys()]
      .filter((name) => !VALIDATORS[name])
      .sort();
    expect(unvalidated).toEqual([]);
  });

  it('have no validator for an input no mutation takes', () => {
    const orphaned = Object.keys(VALIDATORS)
      .filter((name) => !reachable.has(name))
      .sort();
    expect(orphaned).toEqual([]);
  });
});

describe.each([...reachable.keys()].sort())('%s', (name) => {
  const validator = VALIDATORS[name];
  // The suite above reports a missing validator once; skip the pair rather
  // than failing again here with a less legible message.
  if (!validator) return;

  it('validates exactly the fields the SDL declares', () => {
    const sdlFields = Object.keys(
      (reachable.get(name) as GraphQLInputObjectType).getFields(),
    ).sort();
    expect(keysOf(validator)).toEqual(sdlFields);
  });
});
