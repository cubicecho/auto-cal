/**
 * Parser for Google Tasks JSON exports (Google Takeout → Tasks.json).
 *
 * The export nests task lists under a top-level `items` array, and each list
 * nests its tasks under its own `items` array. Subtasks appear nested inside a
 * parent task (under `items`/`subtasks`/`children` depending on export vintage),
 * so we walk them recursively and flatten, indenting subtask titles so the
 * hierarchy isn't entirely lost. The format has drifted over the years, so the
 * parser is deliberately lenient about shapes and key names.
 */

export type ParsedTodo = {
  title: string;
  description?: string;
  dueAt?: string;
  completedAt?: string;
};

export type ParsedList = {
  name: string;
  todos: ParsedTodo[];
};

type Json = Record<string, unknown>;

function isObject(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function taskChildren(task: Json): unknown[] {
  for (const key of ['items', 'subtasks', 'children']) {
    if (Array.isArray(task[key])) return task[key] as unknown[];
  }
  return [];
}

function walkTasks(raw: unknown[], out: ParsedTodo[], depth: number): void {
  for (const entry of raw) {
    if (!isObject(entry)) continue;
    const title = str(entry.title) ?? str(entry.name);
    if (title) {
      const description = str(entry.notes) ?? str(entry.description);
      const dueAt = str(entry.due) ?? str(entry.dueAt);
      const completed = str(entry.completed) ?? str(entry.completedAt);
      // Some exports omit `completed` but set status to "completed".
      const isCompleted =
        completed !== undefined || str(entry.status) === 'completed';
      const todo: ParsedTodo = {
        title: depth > 0 ? `${'— '.repeat(depth)}${title}` : title,
      };
      if (description) todo.description = description;
      if (dueAt) todo.dueAt = dueAt;
      if (isCompleted)
        todo.completedAt = completed ?? new Date(0).toISOString();
      out.push(todo);
    }
    const children = taskChildren(entry);
    if (children.length > 0) walkTasks(children, out, depth + 1);
  }
}

/** Pull the array of task lists out of whatever top-level shape was uploaded. */
function findLists(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (isObject(data)) {
    for (const key of ['items', 'taskLists', 'lists']) {
      if (Array.isArray(data[key])) return data[key] as unknown[];
    }
  }
  return [];
}

export class GoogleTasksParseError extends Error {}

/**
 * Parse a Google Tasks JSON string into normalized lists. Throws
 * GoogleTasksParseError with a human-readable message on malformed input or
 * when no importable lists are found.
 */
export function parseGoogleTasks(text: string): ParsedList[] {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new GoogleTasksParseError(
      "That doesn't look like valid JSON. Upload the Tasks.json file from Google Takeout.",
    );
  }

  const rawLists = findLists(data);
  if (rawLists.length === 0) {
    throw new GoogleTasksParseError(
      'No task lists found in this file. Export your tasks from Google Takeout and upload the resulting Tasks.json.',
    );
  }

  const lists: ParsedList[] = [];
  for (const rawList of rawLists) {
    if (!isObject(rawList)) continue;
    const name = str(rawList.title) ?? str(rawList.name) ?? 'Imported list';
    const todos: ParsedTodo[] = [];
    const rawTasks = Array.isArray(rawList.items)
      ? rawList.items
      : Array.isArray(rawList.tasks)
        ? rawList.tasks
        : [];
    walkTasks(rawTasks, todos, 0);
    lists.push({ name, todos });
  }

  if (lists.length === 0) {
    throw new GoogleTasksParseError('No task lists found in this file.');
  }
  return lists;
}
