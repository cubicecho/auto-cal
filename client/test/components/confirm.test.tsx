// @vitest-environment jsdom
/**
 * The `useConfirm()` contract.
 *
 * Every destructive action in the app is gated on the promise this hook hands
 * back, and the failure modes are all silent ones: a promise nothing settles
 * leaves the caller's `await` hanging forever, and a dismissal that resolved
 * `true` would delete a row the user just declined to delete. Neither shows up
 * in a screen test, which only ever takes the happy path.
 *
 * Rendered without `renderWithProviders` on purpose — the provider under test
 * is the thing being mounted, and one case needs it deliberately absent.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import {
  type ConfirmOptions,
  ConfirmProvider,
  useConfirm,
} from '@/components/ui/confirm';

/** Records what the promise settled to, so a test can read it off the DOM. */
function Harness({ prompts }: { prompts: ConfirmOptions[] }) {
  const confirm = useConfirm();
  const [answers, setAnswers] = useState<string[]>([]);

  return (
    <>
      {prompts.map((options, i) => (
        <button
          key={options.title}
          type="button"
          onClick={async () => {
            const ok = await confirm(options);
            setAnswers((prev) => [...prev, `${i}:${ok}`]);
          }}
        >
          ask {i}
        </button>
      ))}
      <div data-testid="answers">{answers.join(',')}</div>
    </>
  );
}

const DELETE_LIST: ConfirmOptions = {
  title: 'Delete list?',
  description: 'This removes every todo on it.',
};

function mount(prompts: ConfirmOptions[] = [DELETE_LIST]) {
  return render(
    <ConfirmProvider>
      <Harness prompts={prompts} />
    </ConfirmProvider>,
  );
}

const answers = () => screen.getByTestId('answers').textContent;

describe('useConfirm', () => {
  it('shows nothing until a caller asks', () => {
    mount();
    expect(screen.queryByText('Delete list?')).toBeNull();
  });

  it('renders the title and description it was given', async () => {
    mount();
    fireEvent.click(screen.getByText('ask 0'));
    expect(await screen.findByText('Delete list?')).toBeTruthy();
    expect(screen.getByText('This removes every todo on it.')).toBeTruthy();
  });

  it('resolves true and closes when the destructive button is pressed', async () => {
    mount();
    fireEvent.click(screen.getByText('ask 0'));
    fireEvent.click(await screen.findByText('Delete'));

    await screen.findByText('0:true');
    expect(answers()).toBe('0:true');
    expect(screen.queryByText('Delete list?')).toBeNull();
  });

  it('resolves false when cancelled — a dismissal is not a confirmation', async () => {
    mount();
    fireEvent.click(screen.getByText('ask 0'));
    fireEvent.click(await screen.findByText('Cancel'));

    await screen.findByText('0:false');
    expect(answers()).toBe('0:false');
    expect(screen.queryByText('Delete list?')).toBeNull();
  });

  it('uses the caller-supplied labels over the defaults', async () => {
    mount([
      { ...DELETE_LIST, confirmLabel: 'Archive it', cancelLabel: 'Keep it' },
    ]);
    fireEvent.click(screen.getByText('ask 0'));

    expect(await screen.findByText('Archive it')).toBeTruthy();
    expect(screen.getByText('Keep it')).toBeTruthy();
    expect(screen.queryByText('Delete')).toBeNull();
  });

  it('settles the older caller when a second prompt supersedes it', async () => {
    mount([DELETE_LIST, { title: 'Delete todo?', description: 'Gone.' }]);
    fireEvent.click(screen.getByText('ask 0'));
    await screen.findByText('Delete list?');

    // The first caller must not be left awaiting a promise nothing will
    // settle. It is told no; the second prompt is the one on screen.
    fireEvent.click(screen.getByText('ask 1'));
    await screen.findByText('0:false');
    expect(await screen.findByText('Delete todo?')).toBeTruthy();

    fireEvent.click(screen.getByText('Delete'));
    await screen.findByText('0:false,1:true');
  });

  it('throws without a provider rather than silently answering no', () => {
    // A delete that never happens and never says why is worse than a crash in
    // development, so the hook does not fall back to a default `false`.
    expect(() => render(<Harness prompts={[DELETE_LIST]} />)).toThrow(
      /useConfirm must be used inside <ConfirmProvider>/,
    );
  });
});
