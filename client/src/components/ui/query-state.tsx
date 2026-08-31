import { Text } from 'react-native';

// Inline loading / error text for a query whose data may still render
// alongside it. Renders the error (priority) or the loading line, else null.
export function QueryState({
  loading,
  error,
  loadingLabel = 'Loading…',
  errorLabel = 'Error',
}: {
  loading?: boolean | undefined;
  error?: { message: string } | null | undefined;
  loadingLabel?: string;
  errorLabel?: string;
}) {
  if (error) {
    return (
      <Text className="text-sm text-destructive">
        {errorLabel}: {error.message}
      </Text>
    );
  }
  if (loading) {
    return (
      <Text className="text-sm text-muted-foreground">{loadingLabel}</Text>
    );
  }
  return null;
}
