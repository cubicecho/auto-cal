/** Truthy env-var values: "1", "true", "yes" (case-insensitive). */
function envFlag(value: string | undefined): boolean {
  return ['1', 'true', 'yes'].includes((value ?? '').trim().toLowerCase());
}

/**
 * Whether the magic link should be returned directly in the API response
 * instead of only being emailed/logged server-side.
 *
 * Enabled automatically outside production (the dev login flow), or in any
 * environment when `EXPOSE_MAGIC_LINK` is set. Turn it on for local or
 * secure-network deployments that have no email provider configured and want
 * the dev-style passwordless login. Do NOT enable it on a public deployment —
 * anyone who knows an email address could sign in as that user.
 */
export function magicLinkExposed(): boolean {
  return (
    process.env.NODE_ENV !== 'production' ||
    envFlag(process.env.EXPOSE_MAGIC_LINK)
  );
}
