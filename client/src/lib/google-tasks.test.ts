import { describe, expect, it } from 'vitest';
import { GoogleTasksParseError, parseGoogleTasks } from './google-tasks.js';

describe('parseGoogleTasks', () => {
  it('parses the Google Takeout shape (lists → items → tasks)', () => {
    const json = JSON.stringify({
      kind: 'tasks#taskLists',
      items: [
        {
          kind: 'tasks#taskList',
          title: 'Groceries',
          items: [
            { title: 'Milk', notes: '2%' },
            {
              title: 'Eggs',
              status: 'completed',
              completed: '2026-07-01T10:00:00.000Z',
              due: '2026-07-02T00:00:00.000Z',
            },
          ],
        },
      ],
    });

    const lists = parseGoogleTasks(json);
    expect(lists).toHaveLength(1);
    expect(lists[0]?.name).toBe('Groceries');
    expect(lists[0]?.todos).toHaveLength(2);
    expect(lists[0]?.todos[0]).toEqual({ title: 'Milk', description: '2%' });
    expect(lists[0]?.todos[1]).toEqual({
      title: 'Eggs',
      completedAt: '2026-07-01T10:00:00.000Z',
      dueAt: '2026-07-02T00:00:00.000Z',
    });
  });

  it('flattens nested subtasks with indentation', () => {
    const json = JSON.stringify({
      items: [
        {
          title: 'Project',
          items: [{ title: 'Parent', items: [{ title: 'Child' }] }],
        },
      ],
    });
    const lists = parseGoogleTasks(json);
    expect(lists[0]?.todos.map((t) => t.title)).toEqual(['Parent', '— Child']);
  });

  it('treats status "completed" without a completed date as done', () => {
    const json = JSON.stringify({
      items: [{ title: 'L', items: [{ title: 'x', status: 'completed' }] }],
    });
    const lists = parseGoogleTasks(json);
    expect(lists[0]?.todos[0]?.completedAt).toBeDefined();
  });

  it('throws on non-JSON', () => {
    expect(() => parseGoogleTasks('not json')).toThrow(GoogleTasksParseError);
  });

  it('throws when there are no lists', () => {
    expect(() => parseGoogleTasks(JSON.stringify({ foo: 1 }))).toThrow(
      GoogleTasksParseError,
    );
  });
});
