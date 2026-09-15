/** Truthy env-var values: "1", "true", "yes" (case-insensitive). */
function envFlag(value: string | undefined): boolean {
  return ['1', 'true', 'yes'].includes((value ?? '').trim().toLowerCase());
}

/** Falsy env-var values: "0", "false", "no" (case-insensitive). */
function envDisabled(value: string | undefined): boolean {
  return ['0', 'false', 'no'].includes((value ?? '').trim().toLowerCase());
}

/**
 * Whether signing in requires following a magic link at all.
 *
 * With `AUTH_MAGIC_LINK=false`, `requestMagicLink` hands back a live session
 * (a normal 30-day JWT) for whatever address it is given: there is no link to
 * follow and no second factor. That is a deliberate convenience for a
 * self-hosted instance on a secure local network. Anyone who can reach the
 * port can then sign in as anyone, so it must never be set on an instance
 * exposed to the internet.
 */
export function magicLinkRequired(): boolean {
  return !envDisabled(process.env.AUTH_MAGIC_LINK);
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
