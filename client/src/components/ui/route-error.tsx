/**
 * What shows when the tree below a route has thrown.
 *
 * Deliberately dependency-free beyond `ui/`: it must not rely on Apollo, the
 * router, or theme state, since any of those could be what failed.
 */
import { Button } from '@/components/ui/button';
import { CircleAlert } from '@/components/ui/icons';
import { Text, View } from 'react-native';

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
      return 'Your session has expired. Please sign in again.';
    }
    return error.message;
  }
  return 'An unexpected error occurred.';
}

export function RouteError({ error, reset }: RouteErrorProps) {
  return (
    <View className="flex-1 items-center justify-center gap-4 px-8 py-20">
      <View className="rounded-full bg-destructive/10 p-4">
        <CircleAlert className="h-7 w-7 text-destructive" />
      </View>
      <View className="max-w-sm items-center">
        <Text className="font-semibold text-foreground">Failed to load</Text>
        <Text className="mt-1 text-center text-sm text-muted-foreground">
          {friendlyMessage(error)}
        </Text>
      </View>
      <Button variant="outline" size="sm" onPress={reset}>
        Try again
      </Button>
    </View>
  );
}
