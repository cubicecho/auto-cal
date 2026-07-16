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
      <p className="text-sm text-destructive">
        {errorLabel}: {error.message}
      </p>
    );
  }
  if (loading) {
    return <p className="text-sm text-muted-foreground">{loadingLabel}</p>;
  }
  return null;
}
