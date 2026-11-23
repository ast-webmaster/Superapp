import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent } from '@testing-library/react-native';

import { ConfirmProvider } from '@/shared/ui';

import { purchaseRequestApi } from '../api/purchaseRequestApi';
import type { PurchaseRequestAction, PurchaseRequestDetail } from '../types';
import { ApprovalActions } from './approval-actions';

jest.mock('../api/purchaseRequestApi', () => ({ purchaseRequestApi: { act: jest.fn() } }));

const actMock = purchaseRequestApi.act as jest.Mock;

function detail(allowed: PurchaseRequestAction[]) {
  return {
    uuid: 'pr-1',
    status: 'AWAITING',
    updated_at: '2026-11-08T10:00:00+07:00',
    allowed_actions: allowed,
  } as unknown as PurchaseRequestDetail;
}

function renderActions(allowed: PurchaseRequestAction[], online = true) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ConfirmProvider>
        <ApprovalActions detail={detail(allowed)} online={online} />
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
  await renderActions(['process', 'revise']);

  expect(screen.getByRole('button', { name: 'Process' })).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Revise' })).toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: 'Reject' })).not.toBeOnTheScreen();
});

it('renders nothing when the user has no action and nothing to report', async () => {
  await renderActions([]);

  expect(screen.toJSON()).toBeNull();
});

it('asks for a reason in the dialog before rejecting, without calling the server', async () => {
  await renderActions(['approve', 'revise', 'reject']);

  await userEvent.press(screen.getByRole('button', { name: 'Reject' }));
  await confirmDialog('Reject');

  expect(screen.getByText('Enter a reason to reject or send back this request.')).toBeOnTheScreen();
  expect(actMock).not.toHaveBeenCalled();
});

it('sends the reason and the updated_at the user saw, then shows the server status', async () => {
  actMock.mockResolvedValueOnce({ ...detail([]), status: 'REVISE' });
  await renderActions(['approve', 'revise', 'reject']);

  await userEvent.press(screen.getByRole('button', { name: 'Revise' }));
  await userEvent.type(screen.getByLabelText('Reason'), '  Add a quote  ');
  await confirmDialog('Revise');

  expect(await screen.findByText('Saved. Status is now Needs revision.')).toBeOnTheScreen();
  expect(actMock).toHaveBeenCalledWith('pr-1', {
    action: 'revise',
    remarks: 'Add a quote',
    updatedAt: '2026-11-08T10:00:00+07:00',
  });
});

it('disables the actions offline', async () => {
  await renderActions(['approve'], false);

  expect(screen.getByRole('button', { name: 'Approve' })).toBeDisabled();
  expect(screen.getByText('Connect to the internet to act on this request.')).toBeOnTheScreen();
});
