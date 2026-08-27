import type {
  TodoList_TodoListListFragment,
  Todo_TodoListFragment,
} from '@/__generated__/graphql.js';
import { graphql } from '@/__generated__/index.js';
import { Button } from '@/components/ui/button';
import { Download, ListTodo, Plus } from '@/components/ui/icons';
import { CardGrid, EmptyState, PageHeader } from '@/components/ui/page';
import { Switch } from '@/components/ui/switch';
import { Link } from 'expo-router';
import { useState } from 'react';
import { TodoListCard } from './TodoListCard';
import { TodoListForm } from './TodoListForm';

export const TODO_LIST_LIST_FRAGMENT = graphql(`
  fragment TodoList_TodoListList on TodoList {
    id
    name
    description
    defaultPriority
    defaultEstimatedLength
    activityType {
      id
      name
      color
    }
    project {
      id
      name
    }
  }
`);

type TodoList = TodoList_TodoListListFragment;
type Todo = Todo_TodoListFragment;

type TodoListListProps = {
  lists: TodoList[];
  todosByListId: Map<string, Todo[]>;
};

export function TodoListList({ lists, todosByListId }: TodoListListProps) {
  const [creatingList, setCreatingList] = useState(false);
  // Project-owned lists are managed from the project view; hide them here by
  // default to keep the standalone todo-lists page focused.
  const [hideProjectLists, setHideProjectLists] = useState(true);

  const hasProjectLists = lists.some((l) => l.project);
  const displayLists =
    hideProjectLists && hasProjectLists
      ? lists.filter((l) => !l.project)
      : lists;

  return (
    <>
      <PageHeader
        title="Todos"
        subtitle="One card per list. Click a list title to edit it; click the pencil on a todo to open the full form."
        actions={
          <>
            {hasProjectLists && (
              <label
                htmlFor="hide-project-lists"
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Switch
                  id="hide-project-lists"
                  checked={hideProjectLists}
                  onCheckedChange={setHideProjectLists}
                />
                Hide project lists
              </label>
            )}
            <Link href="/import-todos" asChild>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Import
              </Button>
            </Link>
            <Button size="sm" onPress={() => setCreatingList(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New List
            </Button>
          </>
        }
      />

      {lists.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title="No todo lists yet"
          description="Create one to start adding todos"
          action={
            <Button size="sm" onPress={() => setCreatingList(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create list
            </Button>
          }
        />
      ) : (
        <CardGrid>
          {displayLists.map((list) => (
            <TodoListCard
              key={list.id}
              list={list}
              todos={todosByListId.get(list.id) ?? []}
            />
          ))}
        </CardGrid>
      )}

      <TodoListForm open={creatingList} onOpenChange={setCreatingList} />
    </>
  );
}
