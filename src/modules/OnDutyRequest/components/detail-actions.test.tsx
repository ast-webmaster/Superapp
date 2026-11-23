import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent } from '@testing-library/react-native';
import { router } from 'expo-router';

import { ConfirmProvider } from '@/shared/ui';

import { onDutyRequestApi } from '../api/onDutyRequestApi';
import type { OnDutyRequestAction, OnDutyRequestDetail } from '../types';
import { DetailActions } from './detail-actions';

jest.mock('../api/onDutyRequestApi', () => ({ onDutyRequestApi: { act: jest.fn() } }));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

const actMock = onDutyRequestApi.act as jest.Mock;

function detail(patch: Partial<OnDutyRequestDetail> = {}, allowed: OnDutyRequestAction[] = []) {
  return {
    uuid: 'odr-1',
    status: 'AWAITING',
    updated_at: '2026-11-18T09:00:00+07:00',
    allowed_actions: allowed,
    can_resubmit: false,
    can_declare: false,
    declaration: null,
    ...patch,
  } as unknown as OnDutyRequestDetail;
}

function renderActions(value: OnDutyRequestDetail, online = true) {
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
  await renderActions(detail({}, ['approve', 'revise']));

  expect(screen.getByRole('button', { name: 'Approve' })).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Revise' })).toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: 'Reject' })).not.toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeOnTheScreen();
});

it('renders nothing when the user has no action and nothing to report', async () => {
  await renderActions(detail());

  expect(screen.toJSON()).toBeNull();
});

it('asks for a reason before rejecting, without calling the server', async () => {
  await renderActions(detail({}, ['approve', 'reject']));

  await userEvent.press(screen.getByRole('button', { name: 'Reject' }));
  await confirmDialog('Reject');

  expect(screen.getByText('Enter a reason to reject or send back.')).toBeOnTheScreen();
  expect(actMock).not.toHaveBeenCalled();
});

it('cancels without a reason and shows the status the server answers with', async () => {
  actMock.mockResolvedValueOnce({ ...detail(), status: 'CANCELED' });
  await renderActions(detail({}, ['cancel']));

  await userEvent.press(screen.getByRole('button', { name: 'Cancel' }));
  await confirmDialog('Cancel request');

  expect(await screen.findByText('Saved. Status is now Canceled.')).toBeOnTheScreen();
  expect(actMock).toHaveBeenCalledWith('odr-1', {
    action: 'cancel',
    // The dialog gives an empty reason; the api layer leaves it out of the request.
    remarks: '',
    updatedAt: '2026-11-18T09:00:00+07:00',
  });
});

it('says a cancel takes back the declaration while one is open', async () => {
  await renderActions(detail({ status: 'AWAITING APPROVAL DECLARATION' }, ['cancel']));

  await userEvent.press(screen.getByRole('button', { name: 'Cancel' }));

  expect(screen.getByText('Cancel this declaration?')).toBeOnTheScreen();
});

it('sends the requester to the resubmit form for a returned request', async () => {
  await renderActions(detail({ status: 'REVISE', can_resubmit: true }, ['cancel']));

  await userEvent.press(screen.getByRole('button', { name: 'Revise and resubmit' }));

  expect(router.push).toHaveBeenCalledWith('/on-duty-request/resubmit/odr-1');
});

it('offers to send the declaration of an approved request', async () => {
  await renderActions(detail({ status: 'APPROVED', can_declare: true }));

  await userEvent.press(screen.getByRole('button', { name: 'Send declaration' }));

  expect(router.push).toHaveBeenCalledWith('/on-duty-request/declaration/odr-1');
});

it('offers to edit a declaration that was already sent', async () => {
  await renderActions(
    detail({
      status: 'AWAITING APPROVAL DECLARATION',
      can_declare: true,
      declaration: { status: 'AWAITING' } as OnDutyRequestDetail['declaration'],
    }),
  );
  await userEvent.press(screen.getByRole('button', { name: 'Edit declaration' }));

  expect(router.push).toHaveBeenCalledWith('/on-duty-request/declaration/odr-1');
});

it('disables the buttons offline', async () => {
  await renderActions(detail({ can_declare: true, status: 'APPROVED' }, ['cancel']), false);

  expect(screen.getByRole('button', { name: 'Send declaration' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  expect(screen.getByText('Connect to the internet to act on this request.')).toBeOnTheScreen();
});
