import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent } from '@testing-library/react-native';

import { ToastProvider } from '@/shared/ui';

import { purchaseRequestApi } from '../api/purchaseRequestApi';
import type { PurchaseRequestDetail, PurchaseRequestLine } from '../types';
import { ReceiveActions } from './receive-actions';

jest.mock('../api/purchaseRequestApi', () => ({ purchaseRequestApi: { receive: jest.fn() } }));

const receiveMock = purchaseRequestApi.receive as jest.Mock;

function line(id: number, name: string, canReceive: boolean) {
  return {
    id,
    item_description: name,
    item_no: null,
    item_code: `C${id}`,
    can_receive: canReceive,
  } as unknown as PurchaseRequestLine;
}

function detail(items: PurchaseRequestLine[], status = 'COMPLETED') {
  return { uuid: 'pr-1', status, items } as unknown as PurchaseRequestDetail;
}

const LAPTOP = line(1, 'Laptop', true);
const MOUSE = line(2, 'Mouse', true);
const DESK = line(3, 'Desk', false);

function renderActions(items: PurchaseRequestLine[], online = true) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ReceiveActions detail={detail(items)} online={online} />
      </ToastProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => receiveMock.mockReset());

it('renders nothing when no item can be received', async () => {
  await renderActions([line(3, 'Desk', false)]);

  expect(screen.queryByRole('button', { name: 'Receive' })).not.toBeOnTheScreen();
});

it('lists only the receivable items, unticked, with the confirm button disabled', async () => {
  await renderActions([LAPTOP, MOUSE, DESK]);

  await userEvent.press(screen.getByRole('button', { name: 'Receive' }));

  expect(screen.getByRole('checkbox', { name: 'Laptop' })).not.toBeChecked();
  expect(screen.getByRole('checkbox', { name: 'Mouse' })).not.toBeChecked();
  expect(screen.queryByRole('checkbox', { name: 'Desk' })).not.toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Confirm receive' })).toBeDisabled();
});

it('sends only the ticked items', async () => {
  receiveMock.mockResolvedValueOnce(detail([LAPTOP, MOUSE], 'COMPLETED'));
  await renderActions([LAPTOP, MOUSE]);

  await userEvent.press(screen.getByRole('button', { name: 'Receive' }));
  await userEvent.press(screen.getByRole('checkbox', { name: 'Mouse' }));
  await userEvent.press(screen.getByRole('button', { name: 'Confirm receive' }));

  expect(receiveMock).toHaveBeenCalledWith('pr-1', [2]);
});

it('selects every item with Select all', async () => {
  receiveMock.mockResolvedValueOnce(detail([], 'RECEIVED'));
  await renderActions([LAPTOP, MOUSE]);

  await userEvent.press(screen.getByRole('button', { name: 'Receive' }));
  await userEvent.press(screen.getByRole('checkbox', { name: 'Select all' }));
  await userEvent.press(screen.getByRole('button', { name: 'Confirm receive' }));

  expect(receiveMock).toHaveBeenCalledWith('pr-1', [1, 2]);
});

it('cannot be used offline', async () => {
  await renderActions([LAPTOP], false);

  expect(screen.getByRole('button', { name: 'Receive' })).toBeDisabled();
  expect(screen.getByText('Connect to the internet to receive items.')).toBeOnTheScreen();
});
