import { graphql } from '@/__generated__/index.js';
import { useMutation } from '@apollo/client/react';
import { useEffect } from 'react';

const UPDATE_PROFILE_TIMEZONE = graphql(`
  mutation UpdateProfileTimezone($timezone: String!) {
    myUpdateProfile(timezone: $timezone)
  }
`);

/**
 * The device's timezone, pushed to the profile once per mount.
 *
 * The server schedules and renders the iCal feed in the stored timezone, so it
 * has to learn about a move before the next scheduler run. Both schedule
 * screens were doing this themselves, each with its own copy of the mutation
 * and its own `useExhaustiveDependencies` suppression.
 *
 * A failure is logged and swallowed: the screen still renders correctly against
 * the timezone it passes with the query, and the next mount tries again.
 */
export function useSyncTimezone(): string {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [updateProfile] = useMutation(UPDATE_PROFILE_TIMEZONE);

  useEffect(() => {
    updateProfile({ variables: { timezone } }).catch(console.error);
  }, [timezone, updateProfile]);

  return timezone;
}
