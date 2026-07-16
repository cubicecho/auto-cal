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
import { runSchedulerWriteback } from '../../services/scheduler-writeback.ts';
import {
  CreateProjectInput,
  CreateProjectNoteInput,
  ReorderProjectNotesInput,
  UpdateProjectInput,
  UpdateProjectNoteInput,
} from '../validators.ts';

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
    if (!context.userId) throw new Error('Not authenticated');
    const rows = await context.db.query.projects.findMany({
      where: { userId: context.userId },
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
    if (!context.userId) throw new Error('Not authenticated');
    const project = await context.db.query.projects.findFirst({
      where: { id: args.id },
    });
    if (!project) throw new Error(`Project ${args.id} not found`);
    if (project.userId !== context.userId) throw new Error('Forbidden');
    return project;
  };

  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  mutationFields.myCreateProject!.resolve = async (
    _parent,
    args: { input: unknown },
    context: Context,
  ) => {
    if (!context.userId) throw new Error('Not authenticated');
    const userId = context.userId;
    const input = CreateProjectInput.parse(args.input);

    // Validate the chosen parent activity type belongs to the user and pick a
    // default color from it when none is supplied (keeps children visually
    // grouped with their parent).
    let color = input.color ?? DEFAULT_ACTIVITY_COLOR;
    if (input.parentActivityTypeId) {
      const parent = await context.db.query.activityTypes.findFirst({
        where: { id: input.parentActivityTypeId },
      });
      if (!parent) {
        throw new Error(`ActivityType ${input.parentActivityTypeId} not found`);
      }
      if (parent.userId !== userId) throw new Error('Forbidden');
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
    return project;
  };

  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  mutationFields.myUpdateProject!.resolve = async (
    _parent,
    args: { input: unknown },
    context: Context,
  ) => {
    if (!context.userId) throw new Error('Not authenticated');
    const input = UpdateProjectInput.parse(args.input);
    const existing = await context.db.query.projects.findFirst({
      where: { id: input.id },
    });
    if (!existing) throw new Error(`Project ${input.id} not found`);
    if (existing.userId !== context.userId) throw new Error('Forbidden');

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
    return updated;
  };

  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  mutationFields.myArchiveProject!.resolve = async (
    _parent,
    args: { id: string },
    context: Context,
  ) => {
    if (!context.userId) throw new Error('Not authenticated');
    const existing = await context.db.query.projects.findFirst({
      where: { id: args.id },
    });
    if (!existing) throw new Error(`Project ${args.id} not found`);
    if (existing.userId !== context.userId) throw new Error('Forbidden');

    const [updated] = await context.db
      .update(projects)
      .set({ status: 'archived', updatedAt: new Date() })
      .where(eq(projects.id, args.id))
      .returning();
    if (!updated) throw new Error(`Failed to archive project ${args.id}`);
    return updated;
  };

  // ─── Notes ─────────────────────────────────────────────────────────────

  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  mutationFields.myCreateProjectNote!.resolve = async (
    _parent,
    args: { input: unknown },
    context: Context,
  ) => {
    if (!context.userId) throw new Error('Not authenticated');
    const input = CreateProjectNoteInput.parse(args.input);
    const project = await context.db.query.projects.findFirst({
      where: { id: input.projectId },
    });
    if (!project) throw new Error(`Project ${input.projectId} not found`);
    if (project.userId !== context.userId) throw new Error('Forbidden');

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
        userId: context.userId,
        projectId: input.projectId,
        title: input.title,
        content: input.content,
        position,
      })
      .returning();
    if (!note) throw new Error('Failed to create project note');
    return note;
  };

  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  mutationFields.myUpdateProjectNote!.resolve = async (
    _parent,
    args: { input: unknown },
    context: Context,
  ) => {
    if (!context.userId) throw new Error('Not authenticated');
    const input = UpdateProjectNoteInput.parse(args.input);
    const existing = await context.db.query.projectNotes.findFirst({
      where: { id: input.id },
    });
    if (!existing) throw new Error(`ProjectNote ${input.id} not found`);
    if (existing.userId !== context.userId) throw new Error('Forbidden');

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
    return updated;
  };

  // biome-ignore lint/style/noNonNullAssertion: field is defined in SDL above
  mutationFields.myReorderProjectNotes!.resolve = async (
    _parent,
    args: { input: unknown },
    context: Context,
  ) => {
    if (!context.userId) throw new Error('Not authenticated');
    const userId = context.userId;
    const input = ReorderProjectNotesInput.parse(args.input);
    const project = await context.db.query.projects.findFirst({
      where: { id: input.projectId },
    });
    if (!project) throw new Error(`Project ${input.projectId} not found`);
    if (project.userId !== userId) throw new Error('Forbidden');

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
    if (!context.userId) throw new Error('Not authenticated');
    const existing = await context.db.query.projectNotes.findFirst({
      where: { id: args.id },
    });
    if (!existing) throw new Error(`ProjectNote ${args.id} not found`);
    if (existing.userId !== context.userId) throw new Error('Forbidden');
    await context.db
      .delete(projectNotes)
      .where(
        and(
          eq(projectNotes.id, args.id),
          eq(projectNotes.userId, context.userId),
        ),
      );
    return true;
  };
}
