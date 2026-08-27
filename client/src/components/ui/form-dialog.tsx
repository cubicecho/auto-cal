import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type FormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  className?: string;
  children: ReactNode;
};

// Dialog chrome shared by every form dialog: Dialog + sized content + header.
// The caller keeps ownership of the <form.AppForm><Form>…</Form> body and the
// footer (via FormDialogFooter) — TanStack's form generics make wrapping the
// form itself more trouble than it saves.
export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  className,
  children,
}: FormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('sm:max-w-[480px]', className)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

type FormDialogFooterProps = {
  onCancel: () => void;
  cancelLabel?: string;
  /** Left-aligned action (e.g. Delete / Mark complete) shown only when set. */
  secondary?: ReactNode;
  /**
   * A rejected mutation's message, shown above the buttons. Field validation
   * stays inline beneath its field — this is for what only the server knows,
   * such as a delete the database refuses (`onDelete: 'restrict'`).
   */
  error?: string | null;
  /** The submit control — typically <form.SubmitButton …/>. */
  children: ReactNode;
};

export function FormDialogFooter({
  onCancel,
  cancelLabel = 'Cancel',
  secondary,
  error,
  children,
}: FormDialogFooterProps) {
  return (
    <>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <DialogFooter
        className={cn('items-center', secondary && 'sm:justify-between')}
      >
        {secondary ? <div>{secondary}</div> : null}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            {cancelLabel}
          </Button>
          {children}
        </div>
      </DialogFooter>
    </>
  );
}
