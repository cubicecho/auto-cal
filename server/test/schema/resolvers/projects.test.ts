import { beforeAll, describe, expect, it } from 'vitest';
import { pubsub } from '../../../src/pubsub.ts';
import { TODO_LIST_EVENT } from '../../../src/schema/resolvers/subscriptions.ts';
import {
  type TestDb,
  type TestSchema,
  buildTestSchema,
  createTestDb,
  gql,
  seedActivityType,
  seedUser,
} from './test-helpers.ts';

/** Shape `publishTodoListEvent` puts on the bus (the type itself is internal). */
type TodoListEventPayload = {
  type: string;
  todoList: { id: string } | null;
  deletedId: string | null;
};

describe('project resolvers', () => {
  let db: TestDb;
  let testSchema: TestSchema;

  beforeAll(async () => {
    db = await createTestDb();
    testSchema = buildTestSchema(db);
  }, 30000);

  // ─── myCreateProject ─────────────────────────────────────────────────────────

  describe('myCreateProject', () => {
    it('throws when not authenticated', async () => {
      const result = await gql(
        testSchema,
        db,
        '',
        'mutation($input: CreateProjectArgs!) { myCreateProject(input: $input) { id } }',
        { input: { name: 'X' } },
      );
      expect(result.errors?.[0]?.message).toMatch(/not authenticated/i);
    });

    it('auto-creates a dedicated child activity type under the chosen parent', async () => {
      const { id: userId } = await seedUser(db, 'proj-create@example.com');
      const parent = await seedActivityType(db, userId, 'Work');

      const result = await gql(
        testSchema,
        db,
        userId,
        `mutation($input: CreateProjectArgs!) {
          myCreateProject(input: $input) {
            id
            name
            status
            activityType { id name color parent { id name } }
          }
        }`,
        { input: { name: 'Redesign', parentActivityTypeId: parent.id } },
      );
      expect(result.errors).toBeUndefined();
      const project = result.data?.myCreateProject as {
        name: string;
        status: string;
        activityType: {
          id: string;
          name: string;
          color: string;
          parent: { id: string; name: string } | null;
        };
      };
      expect(project.name).toBe('Redesign');
      expect(project.status).toBe('active');
      // Dedicated type named after the project, nested under the parent, and
      // inheriting the parent's color when none is supplied.
      expect(project.activityType.name).toBe('Redesign');
      expect(project.activityType.color).toBe('#6366f1');
      expect(project.activityType.parent?.id).toBe(parent.id);
    });

    it('auto-creates the project list by default', async () => {
      const { id: userId } = await seedUser(db, 'proj-list@example.com');
      const parent = await seedActivityType(db, userId, 'Work');

      const result = await gql(
        testSchema,
        db,
        userId,
        `mutation($input: CreateProjectArgs!) {
          myCreateProject(input: $input) {
            id
            list { id name projectId activityTypeId }
            activityType { id }
          }
        }`,
        { input: { name: 'With List', parentActivityTypeId: parent.id } },
      );
      expect(result.errors).toBeUndefined();
      const project = result.data?.myCreateProject as {
        id: string;
        list: {
          name: string;
          projectId: string;
          activityTypeId: string;
        } | null;
        activityType: { id: string };
      };
      expect(project.list).not.toBeNull();
      expect(project.list?.projectId).toBe(project.id);
      // The list points at the dedicated activity type, not the parent.
      expect(project.list?.activityTypeId).toBe(project.activityType.id);
    });

    it('announces the auto-created list on the todo-list stream', async () => {
      const { id: userId } = await seedUser(db, 'proj-list-event@example.com');
      const parent = await seedActivityType(db, userId, 'Work');

      // The list is a real `todoLists` row, and the todo pages learn about
      // lists from `myTodoListsUpdated` — not from the `project` data-changed
      // signal. Without this publish the new list only shows up on reload.
      const events: TodoListEventPayload[] = [];
      const subId = await pubsub.subscribe(
        TODO_LIST_EVENT(userId),
        (event: TodoListEventPayload) => events.push(event),
      );

      try {
        const result = await gql(
          testSchema,
          db,
          userId,
          `mutation($input: CreateProjectArgs!) {
            myCreateProject(input: $input) { list { id } }
          }`,
          { input: { name: 'Announced', parentActivityTypeId: parent.id } },
        );
        expect(result.errors).toBeUndefined();
        const listId = (
          result.data?.myCreateProject as { list: { id: string } | null }
        ).list?.id;

        expect(events).toHaveLength(1);
        expect(events[0]?.type).toBe('created');
        expect(events[0]?.todoList?.id).toBe(listId);
      } finally {
        pubsub.unsubscribe(subId);
      }
    });

    it('publishes no todo-list event when createList is false', async () => {
      const { id: userId } = await seedUser(
        db,
        'proj-nolist-event@example.com',
      );
      const parent = await seedActivityType(db, userId, 'Work');

      const events: TodoListEventPayload[] = [];
      const subId = await pubsub.subscribe(
        TODO_LIST_EVENT(userId),
        (event: TodoListEventPayload) => events.push(event),
      );

      try {
        const result = await gql(
          testSchema,
          db,
          userId,
          `mutation($input: CreateProjectArgs!) {
            myCreateProject(input: $input) { id }
          }`,
          {
            input: {
              name: 'Quiet',
              parentActivityTypeId: parent.id,
              createList: false,
            },
          },
        );
        expect(result.errors).toBeUndefined();
        expect(events).toEqual([]);
      } finally {
        pubsub.unsubscribe(subId);
      }
    });

    it('skips list creation when createList is false', async () => {
      const { id: userId } = await seedUser(db, 'proj-nolist@example.com');
      const parent = await seedActivityType(db, userId, 'Work');

      const result = await gql(
        testSchema,
        db,
        userId,
        `mutation($input: CreateProjectArgs!) {
          myCreateProject(input: $input) { list { id } }
        }`,
        {
          input: {
            name: 'No List',
            parentActivityTypeId: parent.id,
            createList: false,
          },
        },
      );
      expect(result.errors).toBeUndefined();
      const project = result.data?.myCreateProject as {
        list: { id: string } | null;
      };
      expect(project.list).toBeNull();
    });

    it('throws Forbidden when the parent activity type belongs to another user', async () => {
      const { id: userId } = await seedUser(db, 'proj-forbid@example.com');
      const { id: otherId } = await seedUser(
        db,
        'proj-forbid-other@example.com',
      );
      const otherAt = await seedActivityType(db, otherId, 'Theirs');

      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation($input: CreateProjectArgs!) { myCreateProject(input: $input) { id } }',
        { input: { name: 'Hack', parentActivityTypeId: otherAt.id } },
      );
      expect(result.errors?.[0]?.message).toMatch(/forbidden/i);
    });
  });

  // ─── myProjects / myProject ──────────────────────────────────────────────────

  async function createProject(userId: string, name: string) {
    const parent = await seedActivityType(db, userId, `${name}-parent`);
    const result = await gql(
      testSchema,
      db,
      userId,
      'mutation($input: CreateProjectArgs!) { myCreateProject(input: $input) { id name status } }',
      { input: { name, parentActivityTypeId: parent.id, createList: false } },
    );
    return result.data?.myCreateProject as {
      id: string;
      name: string;
      status: string;
    };
  }

  describe('myProjects', () => {
    it('throws when not authenticated', async () => {
      const result = await gql(
        testSchema,
        db,
        '',
        'query { myProjects { id } }',
      );
      expect(result.errors?.[0]?.message).toMatch(/not authenticated/i);
    });

    it('returns archived projects by default and hides them on request', async () => {
      const { id: userId } = await seedUser(db, 'proj-archive@example.com');
      const active = await createProject(userId, 'Active');
      const toArchive = await createProject(userId, 'Archived');

      await gql(
        testSchema,
        db,
        userId,
        'mutation($id: ID!) { myArchiveProject(id: $id) { id status } }',
        { id: toArchive.id },
      );

      const allResult = await gql(
        testSchema,
        db,
        userId,
        'query { myProjects { id status } }',
      );
      const allIds = (allResult.data?.myProjects as Array<{ id: string }>).map(
        (p) => p.id,
      );
      expect(allIds).toContain(active.id);
      expect(allIds).toContain(toArchive.id);

      // Hiding archived projects is now the caller's filter, not a server
      // default — this is the shape the project list screens send.
      const activeResult = await gql(
        testSchema,
        db,
        userId,
        'query { myProjects(where: { status: { ne: "archived" } }) { id } }',
      );
      const activeIds = (
        activeResult.data?.myProjects as Array<{ id: string }>
      ).map((p) => p.id);
      expect(activeIds).toContain(active.id);
      expect(activeIds).not.toContain(toArchive.id);
    });

    it("returns only the current user's projects", async () => {
      const { id: userId } = await seedUser(db, 'proj-iso@example.com');
      const { id: otherId } = await seedUser(db, 'proj-iso-other@example.com');
      const mine = await createProject(userId, 'Mine');
      const theirs = await createProject(otherId, 'Theirs');

      const result = await gql(
        testSchema,
        db,
        userId,
        'query { myProjects { id } }',
      );
      const ids = (result.data?.myProjects as Array<{ id: string }>).map(
        (p) => p.id,
      );
      expect(ids).toContain(mine.id);
      expect(ids).not.toContain(theirs.id);
    });
  });

  describe('myProject', () => {
    // The scope is a filter now, so another user's project is simply not in the
    // result set — null, not an error. That is the point: a FORBIDDEN here used
    // to reach the client's error link, which reads that code as an expired
    // session and logs the user out for opening someone else's project URL.
    it('returns null when the project belongs to another user', async () => {
      const { id: userId } = await seedUser(db, 'proj-get-forbid@example.com');
      const { id: otherId } = await seedUser(
        db,
        'proj-get-forbid-other@example.com',
      );
      const theirs = await createProject(otherId, 'Theirs');

      const result = await gql(
        testSchema,
        db,
        userId,
        'query($id: UUID!) { myProject(where: { id: { eq: $id } }) { id } }',
        { id: theirs.id },
      );
      expect(result.errors).toBeUndefined();
      expect(result.data?.myProject).toBeNull();
    });
  });

  // ─── notes ─────────────────────────────────────────────────────────────────

  describe('project notes', () => {
    async function createNote(
      userId: string,
      projectId: string,
      title: string,
    ) {
      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation($input: CreateProjectNoteArgs!) { myCreateProjectNote(input: $input) { id title position } }',
        { input: { projectId, title } },
      );
      return result.data?.myCreateProjectNote as {
        id: string;
        title: string;
        position: number;
      };
    }

    it('appends notes with increasing positions', async () => {
      const { id: userId } = await seedUser(db, 'note-append@example.com');
      const project = await createProject(userId, 'Notes');

      const first = await createNote(userId, project.id, 'First');
      const second = await createNote(userId, project.id, 'Second');
      expect(first.position).toBe(0);
      expect(second.position).toBe(1);
    });

    it('reorders notes and rejects a mismatched id set', async () => {
      const { id: userId } = await seedUser(db, 'note-reorder@example.com');
      const project = await createProject(userId, 'Reorder');
      const a = await createNote(userId, project.id, 'A');
      const b = await createNote(userId, project.id, 'B');

      const ok = await gql(
        testSchema,
        db,
        userId,
        'mutation($input: ReorderProjectNotesArgs!) { myReorderProjectNotes(input: $input) { id position } }',
        { input: { projectId: project.id, noteIds: [b.id, a.id] } },
      );
      expect(ok.errors).toBeUndefined();
      const reordered = ok.data?.myReorderProjectNotes as Array<{
        id: string;
        position: number;
      }>;
      const byId = new Map(reordered.map((n) => [n.id, n.position]));
      expect(byId.get(b.id)).toBe(0);
      expect(byId.get(a.id)).toBe(1);

      const bad = await gql(
        testSchema,
        db,
        userId,
        'mutation($input: ReorderProjectNotesArgs!) { myReorderProjectNotes(input: $input) { id } }',
        { input: { projectId: project.id, noteIds: [a.id] } },
      );
      expect(bad.errors?.[0]?.message).toMatch(/exactly/i);
    });

    it('updates and deletes a note', async () => {
      const { id: userId } = await seedUser(db, 'note-crud@example.com');
      const project = await createProject(userId, 'CRUD');
      const note = await createNote(userId, project.id, 'Draft');

      const updated = await gql(
        testSchema,
        db,
        userId,
        'mutation($input: UpdateProjectNoteArgs!) { myUpdateProjectNote(input: $input) { id title content } }',
        { input: { id: note.id, title: 'Final', content: '# Hello' } },
      );
      expect(updated.errors).toBeUndefined();
      const u = updated.data?.myUpdateProjectNote as {
        title: string;
        content: string;
      };
      expect(u.title).toBe('Final');
      expect(u.content).toBe('# Hello');

      const del = await gql(
        testSchema,
        db,
        userId,
        'mutation($id: ID!) { myDeleteProjectNote(id: $id) }',
        { id: note.id },
      );
      expect(del.errors).toBeUndefined();
      expect(del.data?.myDeleteProjectNote).toBe(true);
    });

    it('throws Forbidden when creating a note on another user’s project', async () => {
      const { id: userId } = await seedUser(db, 'note-forbid@example.com');
      const { id: otherId } = await seedUser(
        db,
        'note-forbid-other@example.com',
      );
      const theirs = await createProject(otherId, 'Theirs');

      const result = await gql(
        testSchema,
        db,
        userId,
        'mutation($input: CreateProjectNoteArgs!) { myCreateProjectNote(input: $input) { id } }',
        { input: { projectId: theirs.id, title: 'Intruder' } },
      );
      expect(result.errors?.[0]?.message).toMatch(/forbidden/i);
    });
  });
});
