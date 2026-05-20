import type { ActivityType, ApiKeyScope, DB, TodoList } from '@auto-cal/db';
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
  };
}
