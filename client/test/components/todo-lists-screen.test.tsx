// @vitest-environment jsdom
/**
 * The todo-lists route: the query it issues, how it buckets todos under their
 * list, and the two pieces of display logic that live in the screen rather
 * than on the server — the completed-last ordering, and hiding lists that
 * belong to a project.
 *
 * expo-router is stubbed because the page is rendered directly rather than
 * through a navigator; `Link` only has to render its children.
 */
import { fireEvent, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('expo-router', () => ({
  Link: ({ children }: { children: ReactNode }) => <>{children}</>,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => '/todo-lists',
}));

import { GetTodoListsPageDocument } from '@/__generated__/graphql';
import TodoListsPage from '../../app/(app)/todo-lists';
import { renderWithProviders } from '../support/render';

function list(overrides: Record<string, unknown> = {}) {
  return {
    __typename: 'TodoList' as const,
    id: 'list-1',
    name: 'Inbox',
    description: null,
    defaultPriority: 3,
    defaultEstimatedLength: 30,
    activityType: null,
    project: null,
    ...overrides,
  };
}

function todo(overrides: Record<string, unknown> = {}) {
  return {
    __typename: 'Todo' as const,
    id: 'todo-1',
    title: 'Write the report',
    description: null,
    priority: 3,
    estimatedLength: 30,
    list: { __typename: 'TodoList' as const, id: 'list-1', name: 'Inbox' },
    activityType: null,
    dueAt: null,
    scheduledAt: null,
    completedAt: null,
    createdAt: '2026-08-30T09:00:00.000Z',
    ...overrides,
  };
}

function pageMock(
  lists: ReturnType<typeof list>[],
  todos: ReturnType<typeof todo>[],
) {
  return {
    request: { query: GetTodoListsPageDocument },
    maxUsageCount: Number.POSITIVE_INFINITY,
    result: { data: { myTodoLists: lists, myTodos: todos } },
  };
}

function renderPage(mock: ReturnType<typeof pageMock>) {
  return renderWithProviders(<TodoListsPage />, [mock]);
}

describe('Todo lists screen', () => {
  it('offers a way in when there are no lists yet', async () => {
    renderPage(pageMock([], []));

    expect(await screen.findByText('No todo lists yet')).toBeTruthy();
  });

  it('shows each list with the todos that belong to it', async () => {
    renderPage(
      pageMock(
        [list(), list({ id: 'list-2', name: 'Errands' })],
        [
          todo(),
          todo({
            id: 'todo-2',
            title: 'Buy milk',
            list: {
              __typename: 'TodoList' as const,
              id: 'list-2',
              name: 'Errands',
            },
          }),
        ],
      ),
    );

    expect(await screen.findByText('Write the report')).toBeTruthy();
    expect(screen.getByText('Buy milk')).toBeTruthy();
    expect(screen.getByText('Inbox')).toBeTruthy();
    expect(screen.getByText('Errands')).toBeTruthy();
  });

  it('keeps completed todos out of the way until asked for', async () => {
    renderPage(
      pageMock(
        [list()],
        [
          todo({
            id: 'todo-done',
            title: 'Already done',
            completedAt: '2026-08-30T10:00:00.000Z',
          }),
          todo({ id: 'todo-open', title: 'Still open' }),
        ],
      ),
    );

    expect(await screen.findByText('Still open')).toBeTruthy();
    expect(screen.queryByText('Already done')).toBeNull();

    fireEvent.click(screen.getByText('Show completed (1)'));

    expect(screen.getByText('Already done')).toBeTruthy();
  });

  it('sinks completed todos below the open ones', async () => {
    renderPage(
      pageMock(
        [list()],
        [
          todo({
            id: 'todo-done',
            title: 'Already done',
            completedAt: '2026-08-30T10:00:00.000Z',
            // Newer than the open todo, so only the completed-last rule can
            // put it second.
            createdAt: '2026-08-30T12:00:00.000Z',
          }),
          todo({ id: 'todo-open', title: 'Still open' }),
        ],
      ),
    );

    fireEvent.click(await screen.findByText('Show completed (1)'));

    const position = screen
      .getByText('Still open')
      .compareDocumentPosition(screen.getByText('Already done'));
    // DOCUMENT_POSITION_FOLLOWING
    expect(position & 4).toBeTruthy();
  });

  it('hides project-owned lists until asked for them', async () => {
    renderPage(
      pageMock(
        [
          list(),
          list({
            id: 'list-3',
            name: 'Kitchen remodel',
            project: {
              __typename: 'Project' as const,
              id: 'p1',
              name: 'House',
            },
          }),
        ],
        [],
      ),
    );

    expect(await screen.findByText('Inbox')).toBeTruthy();
    // Managed from the project view instead.
    expect(screen.queryByText('Kitchen remodel')).toBeNull();
  });

  it('leaves a todo with no list out of every card', async () => {
    renderPage(
      pageMock([list()], [todo({ id: 'orphan', title: 'Orphan', list: null })]),
    );

    expect(await screen.findByText('Inbox')).toBeTruthy();
    expect(screen.queryByText('Orphan')).toBeNull();
  });
});
