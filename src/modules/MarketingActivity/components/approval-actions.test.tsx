import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent } from '@testing-library/react-native';

import { ConfirmProvider } from '@/shared/ui';

import { marketingActivityApi } from '../api/marketingActivityApi';
import type { MarketingActivityAction, MarketingActivityDetail } from '../types';
import { ApprovalActions } from './approval-actions';

jest.mock('../api/marketingActivityApi', () => ({ marketingActivityApi: { act: jest.fn() } }));

const actMock = marketingActivityApi.act as jest.Mock;

function detail(allowed: MarketingActivityAction[]) {
  return {
    activity_uuid: 'ma-1',
    status: 'AWAITING',
    updated_at: '2026-11-08T10:00:00+07:00',
    allowed_actions: allowed,
  } as unknown as MarketingActivityDetail;
}

function renderActions(allowed: MarketingActivityAction[], online = true) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ConfirmProvider>
        <ApprovalActions kind="single" detail={detail(allowed)} online={online} />
      </ConfirmProvider>
    </QueryClientProvider>,
  );
}

// Presses the confirm button of the sheet, which is rendered after (below) the trigger button.
async function confirmDialog(name: string) {
  await userEvent.press(screen.getAllByRole('button', { name }).at(-1)!);
}

beforeEach(() => {
  actMock.mockReset();
});

it('offers only the actions the server allows', async () => {
  await renderActions(['complete', 'finish_realization']);

  expect(screen.getByRole('button', { name: 'Complete' })).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Finish realization' })).toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: 'Claim' })).not.toBeOnTheScreen();
});

it('renders nothing when the user has no action and nothing to report', async () => {
  await renderActions([]);

  expect(screen.toJSON()).toBeNull();
});

it('refuses a reason shorter than the server accepts, without calling it', async () => {
  await renderActions(['approve', 'revise', 'reject']);

  await userEvent.press(screen.getByRole('button', { name: 'Reject' }));
  await userEvent.type(screen.getByLabelText('Reason'), 'no');
  await confirmDialog('Reject');

  expect(screen.getByText(/at least 6 characters/)).toBeOnTheScreen();
  expect(actMock).not.toHaveBeenCalled();
});

it('sends the reason and the updated_at the user saw, then shows the server status', async () => {
  actMock.mockResolvedValueOnce({ ...detail([]), status: 'REVISE' });
  await renderActions(['approve', 'revise', 'reject']);

  await userEvent.press(screen.getByRole('button', { name: 'Revise' }));
  await userEvent.type(screen.getByLabelText('Reason'), '  Add a quote  ');
  await confirmDialog('Revise');

  expect(await screen.findByText('Saved. Status is now Needs revision.')).toBeOnTheScreen();
  expect(actMock).toHaveBeenCalledWith('single', 'ma-1', {
    action: 'revise',
    remarks: 'Add a quote',
    updatedAt: '2026-11-08T10:00:00+07:00',
  });
});

it('opens the proof file sheet for a claim instead of a plain confirmation', async () => {
  await renderActions(['claim']);

  await userEvent.press(screen.getByRole('button', { name: 'Claim' }));

  expect(screen.getByText(/Proof file/)).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Submit claim' })).toBeDisabled();
  expect(actMock).not.toHaveBeenCalled();
});

it('disables the actions offline', async () => {
  await renderActions(['approve'], false);

  expect(screen.getByRole('button', { name: 'Approve' })).toBeDisabled();
  expect(screen.getByText('Connect to the internet to act on this activity.')).toBeOnTheScreen();
});
