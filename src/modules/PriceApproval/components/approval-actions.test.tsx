import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, within } from '@testing-library/react-native';

import { ConfirmProvider } from '@/shared/ui';

import { priceApprovalApi } from '../api/priceApprovalApi';
import type { PriceApprovalAction, PriceApprovalDetail } from '../types';
import { ApprovalActions } from './approval-actions';

jest.mock('../api/priceApprovalApi', () => ({ priceApprovalApi: { act: jest.fn() } }));

const actMock = priceApprovalApi.act as jest.Mock;

function detail(allowed: PriceApprovalAction[]) {
  return {
    pa_uuid: 'pa-1',
    status: 'AWAITING',
    updated_at: '2026-11-08T10:00:00+07:00',
    allowed_actions: allowed,
  } as unknown as PriceApprovalDetail;
}

function renderActions(allowed: PriceApprovalAction[], online = true) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ConfirmProvider>
        <ApprovalActions detail={detail(allowed)} online={online} />
      </ConfirmProvider>
    </QueryClientProvider>,
  );
}

// Presses the confirm button of the dialog.
async function confirmDialog(name: string) {
  const dialog = screen.getByRole('alertdialog');
  await userEvent.press(within(dialog).getByRole('button', { name }));
}

beforeEach(() => {
  actMock.mockReset();
});

it('offers only the actions the server allows', async () => {
  await renderActions(['approve']);

  expect(screen.getByRole('button', { name: 'Approve' })).toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: 'Reject' })).not.toBeOnTheScreen();
  expect(screen.queryByLabelText('Reason')).not.toBeOnTheScreen();
});

it('renders nothing when the user has no action and nothing to report', async () => {
  await renderActions([]);

  expect(screen.toJSON()).toBeNull();
});

it('asks for a reason before rejecting, without calling the server', async () => {
  await renderActions(['approve', 'reject', 'pending']);

  await userEvent.press(screen.getByRole('button', { name: 'Reject' }));

  expect(screen.getByText('Enter a reason to reject or hold this request.')).toBeOnTheScreen();
  expect(screen.queryByRole('alertdialog')).not.toBeOnTheScreen();
  expect(actMock).not.toHaveBeenCalled();
});

it('sends the reason and the updated_at the user saw, then shows the server status', async () => {
  actMock.mockResolvedValueOnce({ ...detail([]), status: 'REJECTED' });
  await renderActions(['approve', 'reject']);

  await userEvent.type(screen.getByLabelText('Reason'), '  Price too low  ');
  await userEvent.press(screen.getByRole('button', { name: 'Reject' }));
  await confirmDialog('Reject');

  expect(await screen.findByText('Saved. Status is now Rejected.')).toBeOnTheScreen();
  expect(actMock).toHaveBeenCalledWith('pa-1', {
    action: 'reject',
    remarks: 'Price too low',
    updatedAt: '2026-11-08T10:00:00+07:00',
  });
});

it('disables the actions offline', async () => {
  await renderActions(['approve'], false);

  expect(screen.getByRole('button', { name: 'Approve' })).toBeDisabled();
  expect(screen.getByText('Connect to the internet to act on this request.')).toBeOnTheScreen();
});
