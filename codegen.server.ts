import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: './server/src/__generated__/schema.graphql',
  generates: {
    'server/src/__generated__/resolvers.ts': {
      plugins: ['typescript', 'typescript-resolvers'],
      config: {
        scalars: { UUID: 'string' },
        inputMaybeValue: 'T | undefined',
        contextType: '../context.ts#Context',
        // String unions rather than TS enums, matching the hand-written enum
        // convention in db/src/models/enums.ts — and TS enums are nominal, so
        // a resolver could not return the plain 'created' it publishes.
        enumsAsTypes: true,
        // Resolvers return plain Drizzle rows and let the generated relation
        // resolvers fill in the rest, so the parent/return type of a table-
        // backed field is the DB row, not the fully-resolved GraphQL object.
        // Without these mappers every resolver would have to satisfy
        // `children: ActivityType[]` and friends.
        // Aliased to `*Row`: the mapper name would otherwise collide with the
        // same-named type the typescript plugin generates from the SDL.
        mappers: {
          ActivityType: '@auto-cal/db#ActivityType as ActivityTypeRow',
          ApiKey: '@auto-cal/db#ApiKey as ApiKeyRow',
          Habit: '@auto-cal/db#Habit as HabitRow',
          HabitCompletion: '@auto-cal/db#HabitCompletion as HabitCompletionRow',
          Project: '@auto-cal/db#Project as ProjectRow',
          ProjectNote: '@auto-cal/db#ProjectNote as ProjectNoteRow',
          TimeBlock: '@auto-cal/db#TimeBlock as TimeBlockRow',
          Todo: '@auto-cal/db#Todo as TodoRow',
          TodoList: '@auto-cal/db#TodoList as TodoListRow',
          User: '@auto-cal/db#User as UserRow',
        },
        avoidOptionals: {
          field: true,
          inputValue: false,
        },
      },
    },
  },
};

export default config;
