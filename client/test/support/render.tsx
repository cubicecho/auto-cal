import { ConfirmProvider } from '@/components/ui/confirm';
import { ToastProvider } from '@/components/ui/toast';
import { TooltipProvider } from '@/components/ui/tooltip';
/**
 * One place to mount a screen the way the app mounts it.
 *
 * Every route renders inside the providers `app/(app)/_layout.tsx` supplies,
 * and a component that reaches for one of them throws rather than degrading —
 * `useConfirm` is the usual culprit. Wrapping here means a test only says what
 * data the server returns.
 */
import type { MockedProviderProps } from '@apollo/client/testing/react';
import { MockedProvider } from '@apollo/client/testing/react';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';

export type Mocks = NonNullable<MockedProviderProps['mocks']>;

export function renderWithProviders(
  ui: ReactElement,
  mocks: Mocks,
): ReturnType<typeof render> {
  return render(
    <MockedProvider mocks={mocks}>
      <ToastProvider>
        <ConfirmProvider>
          <TooltipProvider>{ui}</TooltipProvider>
        </ConfirmProvider>
      </ToastProvider>
    </MockedProvider>,
  );
}
