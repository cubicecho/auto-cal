/**
 * The in-app half of notifications: one toast, once a day, naming the habits
 * still scheduled for today.
 *
 * It reads the schedule the Today screen already fetched rather than issuing a
 * query of its own — the digest is a summary of what is on screen, so a second
 * round trip would only introduce a way for the two to disagree.
 *
 * "Once a day" is per browser, keyed by local date in `storage`, so a reload
 * or a navigation back to Today does not re-nag. Off web `storage` is a no-op
 * that always reads null, which would make it fire on every mount; the hook is
 * therefore web-only by the same `Platform` check `storage` itself uses.
 */
import { useToast } from '@/components/ui/toast';
import { isoDate } from '@/lib/date';
import { storage } from '@/storage';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

const STORAGE_KEY = 'habit_digest_shown';

type DigestItem = {
  kind: string;
  title: string;
  completedAt?: string | null | undefined;
};

/** "Meditate", "Meditate and Run", "Meditate, Run and 2 more". */
function phrase(titles: string[]): string {
  if (titles.length === 1) return titles[0] as string;
  if (titles.length === 2) return `${titles[0]} and ${titles[1]}`;
  return `${titles[0]}, ${titles[1]} and ${titles.length - 2} more`;
}

export function useHabitDigest(
  items: readonly DigestItem[],
  enabled: boolean,
): void {
  const toast = useToast();
  // The schedule arrives over two renders (cache, then network) and the toast
  // must not fire twice within one mount even if the day key were somehow
  // rewritten underneath us.
  const fired = useRef(false);

  useEffect(() => {
    if (!enabled || fired.current) return;
    if (Platform.OS !== 'web') return;

    const today = isoDate(new Date());
    if (storage.getItem(STORAGE_KEY) === today) return;

    const due = items.filter((i) => i.kind === 'habit' && !i.completedAt);
    if (due.length === 0) return;

    fired.current = true;
    storage.setItem(STORAGE_KEY, today);
    toast(
      `${due.length} habit${due.length === 1 ? '' : 's'} due today: ${phrase(
        due.map((i) => i.title),
      )}`,
      'success',
    );
  }, [items, enabled, toast]);
}
