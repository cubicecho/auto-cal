/**
 * The web dialog: radix, unchanged in behaviour from before the split. It keeps
 * the focus trap, the scroll lock, the `Escape` handler and the enter/exit
 * animations, none of which have a native counterpart worth faking.
 *
 * The exported surface is `dialog-base.ts`'s, not radix's — see that file.
 */
import type {
  DialogProps,
  DialogSectionProps,
} from '@/components/ui/dialog-base';
import { X } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import * as DialogPrimitive from '@radix-ui/react-dialog';

function Dialog({ open, onOpenChange, children }: DialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </DialogPrimitive.Root>
  );
}

function DialogContent({ className, children }: DialogSectionProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80" />
      <DialogPrimitive.Content
        className={cn(
          'bg-background text-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200 sm:rounded-lg',
          className,
        )}
      >
        {children}
        <DialogPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

function DialogHeader({ className, children }: DialogSectionProps) {
  return (
    <div
      className={cn(
        'flex flex-col space-y-1.5 text-center sm:text-left',
        className,
      )}
    >
      {children}
    </div>
  );
}

function DialogFooter({ className, children }: DialogSectionProps) {
  return (
    <div
      className={cn(
        'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
        className,
      )}
    >
      {children}
    </div>
  );
}

function DialogTitle({ className, children }: DialogSectionProps) {
  return (
    <DialogPrimitive.Title
      className={cn(
        'text-lg font-semibold leading-none tracking-tight',
        className,
      )}
    >
      {children}
    </DialogPrimitive.Title>
  );
}

function DialogDescription({ className, children }: DialogSectionProps) {
  return (
    <DialogPrimitive.Description
      className={cn('text-muted-foreground text-sm', className)}
    >
      {children}
    </DialogPrimitive.Description>
  );
}

export {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
};
