import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent } from '@testing-library/react-native';
import { router } from 'expo-router';

import { ConfirmProvider } from '@/shared/ui';

import { productBorrowingApi } from '../api/productBorrowingApi';
import type { ProductBorrowingDetail } from '../types';
import { DetailActions } from './detail-actions';

jest.mock('../api/productBorrowingApi', () => ({ productBorrowingApi: { act: jest.fn() } }));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

const actMock = productBorrowingApi.act as jest.Mock;

function detail(allowed: string[] = [], patch: Partial<ProductBorrowingDetail> = {}) {
  return {
    uuid: 'pb-1',
    status: 'AWAITING APPROVAL',
    updated_at: '2026-11-19T09:15:00+07:00',
    allowed_actions: allowed,
    items: [],
    ...patch,
  } as unknown as ProductBorrowingDetail;
}

function renderActions(value: ProductBorrowingDetail, online = true) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ConfirmProvider>
        <DetailActions detail={value} online={online} />
      </ConfirmProvider>
    </QueryClientProvider>,
  );
}

async function confirmDialog(name: string) {
  await userEvent.press(screen.getAllByRole('button', { name }).at(-1)!);
}

beforeEach(() => {
  actMock.mockReset();
  (router.push as jest.Mock).mockReset();
});

it('offers only the actions the server allows', async () => {
  await renderActions(detail(['approve', 'revise']));

  expect(screen.getByRole('button', { name: 'Approve' })).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Revise' })).toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: 'Reject' })).not.toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeOnTheScreen();
});

it('renders nothing when the user has no action and nothing to report', async () => {
  await renderActions(detail());

  expect(screen.toJSON()).toBeNull();
});

it('asks for a reason of at least six characters before rejecting, without calling the server', async () => {
  await renderActions(detail(['approve', 'reject']));

  await userEvent.press(screen.getByRole('button', { name: 'Reject' }));
  await confirmDialog('Reject');

  expect(screen.getByText('Enter a reason of at least 6 characters.')).toBeOnTheScreen();
  expect(actMock).not.toHaveBeenCalled();
});

it('approves without a reason and shows the status the server answers with', async () => {
  actMock.mockResolvedValueOnce({ ...detail(), status: 'AWAITING PROCESS' });
  await renderActions(detail(['approve']));

  await userEvent.press(screen.getByRole('button', { name: 'Approve' }));
  await confirmDialog('Approve');

  expect(await screen.findByText('Saved. Status is now Awaiting process.')).toBeOnTheScreen();
  expect(actMock).toHaveBeenCalledWith('pb-1', {
    action: 'approve',
    // The dialog gives an empty reason; the api layer leaves it out of the request.
    remarks: '',
    updatedAt: '2026-11-19T09:15:00+07:00',
  });
});

it('keeps the extension decision apart from the approval of the document', async () => {
  await renderActions(detail(['approve_extend', 'reject_extend']));

  expect(screen.getByRole('button', { name: 'Approve extension' })).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Reject extension' })).toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeOnTheScreen();
});

it('sends the requester to the resubmit form for a returned borrowing', async () => {
  await renderActions(detail(['edit', 'cancel'], { status: 'REVISE' }));

  await userEvent.press(screen.getByRole('button', { name: 'Revise and resubmit' }));

  expect(router.push).toHaveBeenCalledWith('/product-borrowing/resubmit/pb-1');
});

it('offers an extension of a borrowed document', async () => {
  await renderActions(detail(['extend'], { status: 'BORROWED' }));

  expect(screen.getByRole('button', { name: 'Extend' })).toBeOnTheScreen();
});

it('disables the buttons offline', async () => {
  await renderActions(detail(['cancel', 'extend']), false);

  expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Extend' })).toBeDisabled();
  expect(screen.getByText('Connect to the internet to act on this borrowing.')).toBeOnTheScreen();
});
