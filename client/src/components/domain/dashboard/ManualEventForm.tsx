import type { ManualEvent_CalendarViewFragment } from '@/__generated__/graphql.js';
import { graphql } from '@/__generated__/index.js';
import { Button } from '@/components/ui/button';
import { FieldWrapper, Form } from '@/components/ui/form';
import { FormDialog, FormDialogFooter } from '@/components/ui/form-dialog';
import { Trash2 } from '@/components/ui/icons';
import { Input } from '@/components/ui/input';
import { useAppForm } from '@/hooks/form-hook';
import { DERIVED, invalidate } from '@/lib/cache';
import { useMutation } from '@apollo/client/react';
import { useEffect } from 'react';
import { z } from 'zod';

// ─── GraphQL Operations ────────────────────────────────────────────────────

const CREATE_MANUAL_EVENT = graphql(`
  mutation CreateManualEvent($input: CreateManualEventArgs!) {
    myCreateManualEvent(input: $input) {
      id
      title
      description
      color
      startAt
      endAt
    }
  }
`);

const UPDATE_MANUAL_EVENT = graphql(`
  mutation UpdateManualEvent($input: UpdateManualEventArgs!) {
    myUpdateManualEvent(input: $input) {
      id
      title
      description
      color
      startAt
      endAt
    }
  }
`);

const DELETE_MANUAL_EVENT = graphql(`
  mutation DeleteManualEvent($id: ID!) {
    myDeleteManualEvent(id: $id)
  }
`);

// ─── Validation ──────────────────────────────────────────────────────────────

const manualEventSchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(200),
    description: z.string().max(2000),
    color: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color like #3b82f6'),
    startAt: z.string().min(1, 'Start is required'),
    endAt: z.string().min(1, 'End is required'),
  })
  .refine((d) => d.endAt > d.startAt, {
    message: 'End must be after start',
    path: ['endAt'],
  });

type ManualEventFormValues = z.infer<typeof manualEventSchema>;

// An event blocks time, so writing one moves the schedule as well as the
// overlay — hence `DERIVED` alongside the list field. Both are root fields, so
// evicting them is enough; see lib/cache.ts for why this is not a refetch.
const INVALIDATED = ['myManualEvents', ...DERIVED] as const;

/** "YYYY-MM-DDTHH:mm:ss(.sssZ)" → the "YYYY-MM-DDTHH:mm" the input expects. */
function toDateTimeLocal(value: string | null | undefined): string {
  if (!value) return '';
  return value.replace(/Z$/, '').slice(0, 16);
}

// ─── Component ─────────────────────────────────────────────────────────────

type ManualEventFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: ManualEvent_CalendarViewFragment | undefined;
  /** Prefill for drag-to-create; "YYYY-MM-DDTHH:mm" local strings. */
  defaultStart?: string | undefined;
  defaultEnd?: string | undefined;
};

export function ManualEventForm({
  open,
  onOpenChange,
  event,
  defaultStart,
  defaultEnd,
}: ManualEventFormProps) {
  const isEdit = event !== undefined;

  const [createEvent] = useMutation(CREATE_MANUAL_EVENT, {
    update: (cache) => invalidate(cache, ...INVALIDATED),
  });
  const [updateEvent] = useMutation(UPDATE_MANUAL_EVENT, {
    update: (cache) => invalidate(cache, ...INVALIDATED),
  });
  const [deleteEvent] = useMutation(DELETE_MANUAL_EVENT, {
    update: (cache) => invalidate(cache, ...INVALIDATED),
  });

  const defaultValues: ManualEventFormValues = {
    title: event?.title ?? '',
    description: event?.description ?? '',
    color: event?.color ?? '#3b82f6',
    startAt:
      toDateTimeLocal(event?.startAt as string | null) || defaultStart || '',
    endAt: toDateTimeLocal(event?.endAt as string | null) || defaultEnd || '',
  };

  const form = useAppForm({
    defaultValues,
    validators: { onChange: manualEventSchema },
    onSubmit: async ({ value }) => {
      // Send naive local datetimes (no Z), matching how pinned todos are stored.
      const startAt = `${value.startAt}:00`;
      const endAt = `${value.endAt}:00`;
      if (isEdit) {
        await updateEvent({
          variables: {
            input: {
              id: event.id,
              title: value.title,
              description: value.description || null,
              color: value.color,
              startAt,
              endAt,
            },
          },
        });
      } else {
        await createEvent({
          variables: {
            input: {
              title: value.title,
              description: value.description || null,
              color: value.color,
              startAt,
              endAt,
            },
          },
        });
      }
      onOpenChange(false);
    },
  });

  // Reset when the dialog opens or a different event / prefill is targeted.
  // biome-ignore lint/correctness/useExhaustiveDependencies: keyed on identity of the target, not every field
  useEffect(() => {
    if (open) form.reset(defaultValues);
  }, [open, event?.id, defaultStart, defaultEnd]);

  async function handleDelete() {
    if (!isEdit) return;
    await deleteEvent({ variables: { id: event.id } });
    onOpenChange(false);
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      className="sm:max-w-[420px]"
      title={isEdit ? 'Edit Event' : 'New Event'}
      description={
        isEdit
          ? 'Update this calendar event.'
          : 'Add a calendar event. It blocks time from being auto-scheduled.'
      }
    >
      <form.AppForm>
        <Form className="space-y-4">
          <form.AppField name="title">
            {(field) => (
              <field.InputField label="Title" placeholder="e.g. Dentist" />
            )}
          </form.AppField>

          <form.AppField name="description">
            {(field) => (
              <field.TextAreaField
                label="Description (optional)"
                placeholder="Add any notes or details..."
              />
            )}
          </form.AppField>

          <div className="grid grid-cols-2 gap-4">
            <form.AppField name="startAt">
              {(field) => (
                <field.InputField label="Start" type="datetime-local" />
              )}
            </form.AppField>
            <form.AppField name="endAt">
              {(field) => (
                <field.InputField label="End" type="datetime-local" />
              )}
            </form.AppField>
          </div>

          <form.AppField name="color">
            {(field) => (
              <FieldWrapper
                label="Color"
                control={
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      className="h-10 w-16 cursor-pointer rounded border border-input bg-background p-1"
                    />
                    <Input
                      placeholder="#3b82f6"
                      value={field.state.value}
                      onChangeText={(text) => field.handleChange(text)}
                      onBlur={field.handleBlur}
                      className="font-mono"
                    />
                  </div>
                }
              />
            )}
          </form.AppField>

          <FormDialogFooter
            onCancel={() => onOpenChange(false)}
            secondary={
              isEdit ? (
                <Button variant="destructive" size="sm" onPress={handleDelete}>
                  <Trash2 className="mr-1 h-4 w-4" />
                  Delete
                </Button>
              ) : undefined
            }
          >
            <form.SubmitButton isEdit={isEdit} createLabel="Create Event" />
          </FormDialogFooter>
        </Form>
      </form.AppForm>
    </FormDialog>
  );
}
