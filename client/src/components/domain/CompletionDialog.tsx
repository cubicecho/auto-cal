import type {
  CompleteHabitFromDialogMutation,
  CompleteHabitFromDialogMutationVariables,
  CompleteTodoFromDialogMutation,
  CompleteTodoFromDialogMutationVariables,
} from '@/__generated__/graphql.js';
import { graphql } from '@/__generated__/index.js';
import { Button } from '@/components/ui/button';
import { DateTimeInput } from '@/components/ui/date-time-input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useMutation } from '@apollo/client/react';
import { useEffect, useState } from 'react';

const COMPLETE_TODO = graphql(`
  mutation CompleteTodoFromDialog($id: ID!, $completedAt: String) {
    myCompleteTodo(id: $id, completedAt: $completedAt) {
      id
      completedAt
      scheduledAt
    }
  }
`);

const COMPLETE_HABIT = graphql(`
  mutation CompleteHabitFromDialog($input: CompleteHabitArgs!) {
    myCompleteHabit(input: $input) {
      id
      completedAt
      scheduledAt
    }
  }
`);

export type CompletionDialogTarget =
  | { kind: 'todo'; id: string; title: string }
  | { kind: 'habit'; habitId: string; title: string; scheduledAt?: string };

interface CompletionDialogProps {
  target: CompletionDialogTarget | null;
  onOpenChange: (open: boolean) => void;
  /** Apollo refetchQueries to run after the mutation succeeds. */
  refetchQueries?: string[];
}

/** Format a Date to a naive local datetime string ('YYYY-MM-DDTHH:mm:ss'). */
function toNaiveLocal(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:00`
  );
}

export function CompletionDialog({
  target,
  onOpenChange,
  refetchQueries,
}: CompletionDialogProps) {
  const [completedAt, setCompletedAt] = useState<Date>(() => new Date());

  // Reset the time picker to "now" each time a new target opens
  useEffect(() => {
    if (target) setCompletedAt(new Date());
  }, [target]);

  const [completeTodo, { loading: todoLoading }] = useMutation<
    CompleteTodoFromDialogMutation,
    CompleteTodoFromDialogMutationVariables
  >(COMPLETE_TODO, refetchQueries ? { refetchQueries } : {});
  const [completeHabit, { loading: habitLoading }] = useMutation<
    CompleteHabitFromDialogMutation,
    CompleteHabitFromDialogMutationVariables
  >(COMPLETE_HABIT, refetchQueries ? { refetchQueries } : {});
  const loading = todoLoading || habitLoading;

  async function handleConfirm() {
    if (!target) return;
    const completedAtStr = toNaiveLocal(completedAt);
    if (target.kind === 'todo') {
      await completeTodo({
        variables: { id: target.id, completedAt: completedAtStr },
      });
    } else {
      await completeHabit({
        variables: {
          input: {
            habitId: target.habitId,
            completedAt: completedAtStr,
            scheduledAt: target.scheduledAt,
          },
        },
      });
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={target !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Complete</DialogTitle>
          <DialogDescription>
            {target?.title
              ? `Mark "${target.title}" complete. The calendar entry will move to the time you set.`
              : 'Mark this item complete.'}
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <DateTimeInput value={completedAt} onChange={setCompletedAt} />
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" disabled={loading} onClick={handleConfirm}>
            {loading ? 'Saving…' : 'Mark complete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
