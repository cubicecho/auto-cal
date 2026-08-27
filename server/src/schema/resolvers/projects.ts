import type { ProjectNote, TodoList } from '@auto-cal/db';
import {
  activityTypes,
  projectNotes,
  projects,
  todoLists,
} from '@auto-cal/db/schema';
import { and, eq } from 'drizzle-orm';
import { badUserInput, requireUser } from '../../errors.ts';
import { runSchedulerWriteback } from '../../services/scheduler-writeback.ts';
import {
  CreateProjectInput,
  CreateProjectNoteInput,
  ReorderProjectNotesInput,
  UpdateProjectInput,
  UpdateProjectNoteInput,
} from '../validators.ts';
import { loadOwned } from './load.ts';
import { publishDataChanged, publishTodoListEvent } from './subscriptions.ts';
import type { FieldMap, MutationMap } from './types.ts';

const DEFAULT_ACTIVITY_COLOR = '#6366f1';

export const projectMutations: MutationMap<
  | 'myCreateProject'
  | 'myUpdateProject'
  | 'myArchiveProject'
  | 'myCreateProjectNote'
  | 'myUpdateProjectNote'
  | 'myReorderProjectNotes'
  | 'myDeleteProjectNote'
> = {
  myCreateProject: async (_parent, args, context) => {
    const userId = requireUser(context);
    const input = CreateProjectInput.parse(args.input);

    // Validate the chosen parent activity type belongs to the user and pick a
    // default color from it when none is supplied (keeps children visually
    // grouped with their parent).
    let color = input.color ?? DEFAULT_ACTIVITY_COLOR;
    if (input.parentActivityTypeId) {
      const parent = await loadOwned(
        context,
        'activityTypes',
        input.parentActivityTypeId,
        userId,
      );
      if (!input.color) color = parent.color;
    }

    const { project, list } = await context.db.transaction(
      async (tx: typeof context.db) => {
        const [activityType] = await tx
          .insert(activityTypes)
          .values({
            userId,
            name: input.name,
            color,
            parentId: input.parentActivityTypeId ?? null,
          })
          .returning();
        if (!activityType) throw new Error('Failed to create activity type');

        const [created] = await tx
          .insert(projects)
          .values({
            userId,
            name: input.name,
            activityTypeId: activityType.id,
          })
          .returning();
        if (!created) throw new Error('Failed to create project');

        let list: TodoList | undefined;
        if (input.createList) {
          [list] = await tx
            .insert(todoLists)
            .values({
              userId,
              name: input.name,
              activityTypeId: activityType.id,
              projectId: created.id,
            })
            .returning();
          if (!list) throw new Error('Failed to create todo list');
        }

        return { project: created, list };
      },
    );

    // A newly-attached list can hold todos later; recompute is cheap and safe.
    runSchedulerWriteback(context.db, userId).catch(console.error);
    // Creating a project also mints a backing activity type (and maybe a list).
    publishDataChanged(userId, 'project', [project.id]);
    publishDataChanged(userId, 'activityType', [project.activityTypeId]);
    // The list is a real `todoLists` row, so it belongs on the typed stream the
    // todo pages listen to — `dataChanged` has no `todoList` entity, and a
    // project event tells those pages nothing.
    if (list) publishTodoListEvent(userId, { type: 'created', entity: list });
    return project;
  },

  myUpdateProject: async (_parent, args, context) => {
    const userId = requireUser(context);
    const input = UpdateProjectInput.parse(args.input);
    await loadOwned(context, 'projects', input.id, userId);

    const [updated] = await context.db
      .update(projects)
      .set({
        ...(input.name !== undefined && { name: input.name }),
        ...(input.status !== undefined && { status: input.status }),
        updatedAt: new Date(),
      })
      .where(eq(projects.id, input.id))
      .returning();
    if (!updated) throw new Error(`Failed to update project ${input.id}`);
    publishDataChanged(userId, 'project', [updated.id]);
    return updated;
  },

  myArchiveProject: async (_parent, args, context) => {
    const userId = requireUser(context);
    await loadOwned(context, 'projects', args.id, userId);

    const [updated] = await context.db
      .update(projects)
      .set({ status: 'archived', updatedAt: new Date() })
      .where(eq(projects.id, args.id))
      .returning();
    if (!updated) throw new Error(`Failed to archive project ${args.id}`);
    publishDataChanged(userId, 'project', [updated.id]);
    return updated;
  },

  // ─── Notes ─────────────────────────────────────────────────────────────
  myCreateProjectNote: async (_parent, args, context) => {
    const userId = requireUser(context);
    const input = CreateProjectNoteInput.parse(args.input);
    await loadOwned(context, 'projects', input.projectId, userId);

    // Append to the end of the note list.
    const siblings = await context.db.query.projectNotes.findMany({
      where: { projectId: input.projectId },
    });
    const position =
      siblings.reduce(
        (max: number, n: ProjectNote) => Math.max(max, n.position),
        -1,
      ) + 1;

    const [note] = await context.db
      .insert(projectNotes)
      .values({
        userId,
        projectId: input.projectId,
        title: input.title,
        content: input.content,
        position,
      })
      .returning();
    if (!note) throw new Error('Failed to create project note');
    publishDataChanged(userId, 'project', [input.projectId]);
    return note;
  },

  myUpdateProjectNote: async (_parent, args, context) => {
    const userId = requireUser(context);
    const input = UpdateProjectNoteInput.parse(args.input);
    const existing = await loadOwned(context, 'projectNotes', input.id, userId);

    const [updated] = await context.db
      .update(projectNotes)
      .set({
        ...(input.title !== undefined && { title: input.title }),
        ...(input.content !== undefined && { content: input.content }),
        updatedAt: new Date(),
      })
      .where(eq(projectNotes.id, input.id))
      .returning();
    if (!updated) throw new Error(`Failed to update project note ${input.id}`);
    publishDataChanged(userId, 'project', [existing.projectId]);
    return updated;
  },

  myReorderProjectNotes: async (_parent, args, context) => {
    const userId = requireUser(context);
    const input = ReorderProjectNotesInput.parse(args.input);
    await loadOwned(context, 'projects', input.projectId, userId);

    // Every id must belong to this project — reject a mismatched set outright.
    const existing = await context.db.query.projectNotes.findMany({
      where: { projectId: input.projectId },
    });
    const existingIds = new Set(existing.map((n: ProjectNote) => n.id));
    if (
      input.noteIds.length !== existingIds.size ||
      !input.noteIds.every((id) => existingIds.has(id))
    ) {
      throw badUserInput('noteIds must list exactly the notes in this project');
    }

    await context.db.transaction(async (tx: typeof context.db) => {
      await Promise.all(
        input.noteIds.map((id, index) =>
          tx
            .update(projectNotes)
            .set({ position: index, updatedAt: new Date() })
            .where(eq(projectNotes.id, id)),
        ),
      );
    });

    publishDataChanged(userId, 'project', [input.projectId]);
    return context.db.query.projectNotes.findMany({
      where: { projectId: input.projectId },
      orderBy: { position: 'asc' },
    });
  },

  myDeleteProjectNote: async (_parent, args, context) => {
    const userId = requireUser(context);
    const existing = await loadOwned(context, 'projectNotes', args.id, userId);
    await context.db
      .delete(projectNotes)
      .where(
        and(eq(projectNotes.id, args.id), eq(projectNotes.userId, userId)),
      );
    publishDataChanged(userId, 'project', [existing.projectId]);
    return true;
  },
};

export const projectFields: FieldMap<'Project', 'notes' | 'list'> = {
  // Overrides the generated relation resolver: notes must come back in
  // position order (myReorderProjectNotes), which the generated lazy batch
  // loader does not apply.
  notes: (parent, _args, context) =>
    context.loaders.projectNotes.load(parent.id),

  // Custom SDL field. A project has at most one list, but the FK lives on
  // `todoLists`, so the loader batches by project and this takes the head.
  list: async (parent, _args, context) => {
    const lists = await context.loaders.todoListsByProject.load(parent.id);
    return lists[0] ?? null;
  },
};
