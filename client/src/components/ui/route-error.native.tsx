import { Text, TouchableOpacity, View } from 'react-native';

/**
 * Native counterpart of `route-error.tsx`. Metro picks this on iOS/Android, so
 * the shared layouts can mount one `<RouteError>` on both platforms — the web
 * file renders `<div>`/`<button>`, which would crash a native render.
 *
 * Kept deliberately dependency-free: this is what shows when the tree below it
 * has already thrown, so it must not rely on Apollo, the router, or theme state.
 */
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
    <View className="flex-1 items-center justify-center gap-4 bg-background px-8">
      <Text className="text-lg font-semibold text-foreground">
        Something went wrong
      </Text>
      <Text className="text-center text-sm text-muted-foreground">
        {friendlyMessage(error)}
      </Text>
      <TouchableOpacity
        onPress={reset}
        className="rounded-lg border border-border px-4 py-2"
      >
        <Text className="text-sm font-medium text-foreground">Try again</Text>
      </TouchableOpacity>
    </View>
  );
}
