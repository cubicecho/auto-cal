import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

type RouteErrorProps = {
  error: unknown;
  reset: () => void;
};

function friendlyMessage(error: unknown): string {
  if (error instanceof Error) {
    if (
      error.message.includes('Failed to fetch') ||
      error.message.includes('NetworkError') ||
      error.message.includes('network')
    ) {
      return 'Could not reach the server. Check your connection and try again.';
    }
    if (error.message.includes('Not authenticated')) {
      return 'Your session has expired. Please reload the page.';
    }
    return error.message;
  }
  return 'An unexpected error occurred.';
}

export function RouteError({ error, reset }: RouteErrorProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <div className="rounded-full bg-destructive/10 p-4">
        <AlertCircle className="h-7 w-7 text-destructive" />
      </div>
      <div className="max-w-sm">
        <p className="font-semibold">Failed to load</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {friendlyMessage(error)}
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
