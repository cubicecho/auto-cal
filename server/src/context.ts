import type {
  ActivityType,
  ApiKeyScope,
  DB,
  ProjectNote,
  TodoList,
} from '@auto-cal/db';
import DataLoader from 'dataloader';

export interface Context {
  db: DB;
  userId?: string; // undefined = not authenticated
  apiKey?: { id: string; scopes: ApiKeyScope[] };
  loaders: ReturnType<typeof createLoaders>;
  appBaseUrl: string;
}

export function createLoaders(db: DB) {
  return {
    activityType: new DataLoader<string, ActivityType | null>(async (ids) => {
      const rows = (await db.query.activityTypes.findMany({
        where: { id: { in: [...ids] } },
      })) as ActivityType[];
      const byId = new Map(rows.map((r) => [r.id, r]));
      return ids.map((id) => byId.get(id) ?? null);
    }),
    todoList: new DataLoader<string, TodoList | null>(async (ids) => {
      const rows = (await db.query.todoLists.findMany({
        where: { id: { in: [...ids] } },
      })) as TodoList[];
      const byId = new Map(rows.map((r) => [r.id, r]));
      return ids.map((id) => byId.get(id) ?? null);
    }),
    // to-many: notes grouped by projectId, ordered by position then creation.
    projectNotes: new DataLoader<string, ProjectNote[]>(async (projectIds) => {
      const rows = (await db.query.projectNotes.findMany({
        where: { projectId: { in: [...projectIds] } },
        orderBy: { position: 'asc', createdAt: 'asc' },
      })) as ProjectNote[];
      const byProject = new Map<string, ProjectNote[]>();
      for (const row of rows) {
        const bucket = byProject.get(row.projectId) ?? [];
        bucket.push(row);
        byProject.set(row.projectId, bucket);
      }
      return projectIds.map((id) => byProject.get(id) ?? []);
    }),
    // to-many: child activity types grouped by parentId.
    activityTypeByParent: new DataLoader<string, ActivityType[]>(
      async (parentIds) => {
        const rows = (await db.query.activityTypes.findMany({
          where: { parentId: { in: [...parentIds] } },
          orderBy: { name: 'asc' },
        })) as ActivityType[];
        const byParent = new Map<string, ActivityType[]>();
        for (const row of rows) {
          if (!row.parentId) continue;
          const bucket = byParent.get(row.parentId) ?? [];
          bucket.push(row);
          byParent.set(row.parentId, bucket);
        }
        return parentIds.map((id) => byParent.get(id) ?? []);
      },
    ),
    // to-many: lists grouped by projectId (one-per-project business rule, but
    // batched to-many so Project.list resolves without an N+1).
    todoListsByProject: new DataLoader<string, TodoList[]>(
      async (projectIds) => {
        const rows = (await db.query.todoLists.findMany({
          where: { projectId: { in: [...projectIds] } },
          orderBy: { createdAt: 'asc' },
        })) as TodoList[];
        const byProject = new Map<string, TodoList[]>();
        for (const row of rows) {
          if (!row.projectId) continue;
          const bucket = byProject.get(row.projectId) ?? [];
          bucket.push(row);
          byProject.set(row.projectId, bucket);
        }
        return projectIds.map((id) => byProject.get(id) ?? []);
      },
    ),
  };
}
