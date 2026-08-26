import type { Project, ProjectNote } from '@auto-cal/db';
import {
  activityTypes,
  projectNotes,
  projects,
  todoLists,
} from '@auto-cal/db/schema';
import { and, eq } from 'drizzle-orm';
import type { GraphQLObjectType } from 'graphql';
import type { Context } from '../../context.ts';
import { requireOwner, requireUser } from '../../errors.ts';
import { runSchedulerWriteback } from '../../services/scheduler-writeback.ts';
import {
  CreateProjectInput,
  CreateProjectNoteInput,
  ReorderProjectNotesInput,
  UpdateProjectInput,
  UpdateProjectNoteInput,
} from '../validators.ts';
import { publishDataChanged } from './subscriptions.ts';

type Fields = ReturnType<GraphQLObjectType['getFields']>;

const DEFAULT_ACTIVITY_COLOR = '#6366f1';

export function applyProjectResolvers(
  queryFields: Fields,
  mutationFields: Fields,
): void {
  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  queryFields.myProjects!.resolve = async (
    _parent,
    args: { includeArchived?: boolean },
    context: Context,
  ) => {
    const userId = requireUser(context);
    const rows = await context.db.query.projects.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' },
    });
    if (args.includeArchived) return rows;
    return rows.filter((p: Project) => p.status !== 'archived');
  };

  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  queryFields.myProject!.resolve = async (
    _parent,
    args: { id: string },
    context: Context,
  ) => {
    const userId = requireUser(context);
    const project = requireOwner(
      await context.db.query.projects.findFirst({
        where: { id: args.id },
      }),
      'Project',
      args.id,
      userId,
    );
    return project;
  };

  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  mutationFields.myCreateProject!.resolve = async (
    _parent,
    args: { input: unknown },
    context: Context,
  ) => {
    const userId = requireUser(context);
    const input = CreateProjectInput.parse(args.input);

    // Validate the chosen parent activity type belongs to the user and pick a
    // default color from it when none is supplied (keeps children visually
    // grouped with their parent).
    let color = input.color ?? DEFAULT_ACTIVITY_COLOR;
    if (input.parentActivityTypeId) {
      const parent = requireOwner(
        await context.db.query.activityTypes.findFirst({
          where: { id: input.parentActivityTypeId },
        }),
        'ActivityType',
        input.parentActivityTypeId,
        userId,
      );
      if (!input.color) color = parent.color;
    }

    const project = await context.db.transaction(
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

        if (input.createList) {
          await tx.insert(todoLists).values({
            userId,
            name: input.name,
            activityTypeId: activityType.id,
            projectId: created.id,
          });
        }

        return created;
      },
    );

    // A newly-attached list can hold todos later; recompute is cheap and safe.
    runSchedulerWriteback(context.db, userId).catch(console.error);
    // Creating a project also mints a backing activity type (and maybe a list).
    publishDataChanged(userId, 'project', [project.id]);
    publishDataChanged(userId, 'activityType', [project.activityTypeId]);
    return project;
  };

  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  mutationFields.myUpdateProject!.resolve = async (
    _parent,
    args: { input: unknown },
    context: Context,
  ) => {
    const userId = requireUser(context);
    const input = UpdateProjectInput.parse(args.input);
    requireOwner(
      await context.db.query.projects.findFirst({
        where: { id: input.id },
      }),
      'Project',
      input.id,
      userId,
    );

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
  };

  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  mutationFields.myArchiveProject!.resolve = async (
    _parent,
    args: { id: string },
    context: Context,
  ) => {
    const userId = requireUser(context);
    requireOwner(
      await context.db.query.projects.findFirst({
        where: { id: args.id },
      }),
      'Project',
      args.id,
      userId,
    );

    const [updated] = await context.db
      .update(projects)
      .set({ status: 'archived', updatedAt: new Date() })
      .where(eq(projects.id, args.id))
      .returning();
    if (!updated) throw new Error(`Failed to archive project ${args.id}`);
    publishDataChanged(userId, 'project', [updated.id]);
    return updated;
  };

  // ─── Notes ─────────────────────────────────────────────────────────────

  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  mutationFields.myCreateProjectNote!.resolve = async (
    _parent,
    args: { input: unknown },
    context: Context,
  ) => {
    const userId = requireUser(context);
    const input = CreateProjectNoteInput.parse(args.input);
    requireOwner(
      await context.db.query.projects.findFirst({
        where: { id: input.projectId },
      }),
      'Project',
      input.projectId,
      userId,
    );

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
        userId: userId,
        projectId: input.projectId,
        title: input.title,
        content: input.content,
        position,
      })
      .returning();
    if (!note) throw new Error('Failed to create project note');
    publishDataChanged(userId, 'project', [input.projectId]);
    return note;
  };

  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  mutationFields.myUpdateProjectNote!.resolve = async (
    _parent,
    args: { input: unknown },
    context: Context,
  ) => {
    const userId = requireUser(context);
    const input = UpdateProjectNoteInput.parse(args.input);
    const existing = requireOwner(
      await context.db.query.projectNotes.findFirst({
        where: { id: input.id },
      }),
      'ProjectNote',
      input.id,
      userId,
    );

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
  };

  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  mutationFields.myReorderProjectNotes!.resolve = async (
    _parent,
    args: { input: unknown },
    context: Context,
  ) => {
    const userId = requireUser(context);
    const input = ReorderProjectNotesInput.parse(args.input);
    requireOwner(
      await context.db.query.projects.findFirst({
        where: { id: input.projectId },
      }),
      'Project',
      input.projectId,
      userId,
    );

    // Every id must belong to this project — reject a mismatched set outright.
    const existing = await context.db.query.projectNotes.findMany({
      where: { projectId: input.projectId },
    });
    const existingIds = new Set(existing.map((n: ProjectNote) => n.id));
    if (
      input.noteIds.length !== existingIds.size ||
      !input.noteIds.every((id) => existingIds.has(id))
    ) {
      throw new Error('noteIds must list exactly the notes in this project');
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
  };

  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  mutationFields.myDeleteProjectNote!.resolve = async (
    _parent,
    args: { id: string },
    context: Context,
  ) => {
    const userId = requireUser(context);
    const existing = requireOwner(
      await context.db.query.projectNotes.findFirst({
        where: { id: args.id },
      }),
      'ProjectNote',
      args.id,
      userId,
    );
    await context.db
      .delete(projectNotes)
      .where(
        and(eq(projectNotes.id, args.id), eq(projectNotes.userId, userId)),
      );
    publishDataChanged(userId, 'project', [existing.projectId]);
    return true;
  };
}
