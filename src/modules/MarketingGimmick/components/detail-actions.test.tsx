import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent } from '@testing-library/react-native';

import { ConfirmProvider } from '@/shared/ui';

import { marketingGimmickApi } from '../api/marketingGimmickApi';
import { flows } from '../flows';
import type { FlowConfig } from '../flows';
import type { GimmickDetail } from '../types';
import { DetailActions } from './detail-actions';

jest.mock('../api/marketingGimmickApi', () => ({ marketingGimmickApi: { act: jest.fn() } }));

const actMock = marketingGimmickApi.act as jest.Mock;

function detail(allowed: string[] = [], patch: Partial<GimmickDetail> = {}) {
  return {
    uuid: 'doc-1',
    status: 'AWAITING',
    updated_at: '2026-11-20T09:15:00+07:00',
    allowed_actions: allowed,
    items: [],
    ...patch,
  } as unknown as GimmickDetail;
}

function renderActions(value: GimmickDetail, flow: FlowConfig = flows.request, online = true) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ConfirmProvider>
        <DetailActions flow={flow} detail={value} online={online} />
      </ConfirmProvider>
    </QueryClientProvider>,
  );
}

async function confirmDialog(name: string) {
  await userEvent.press(screen.getAllByRole('button', { name }).at(-1)!);
}

beforeEach(() => actMock.mockReset());

it('offers only the actions the server allows, forward action first', async () => {
  await renderActions(detail(['reject', 'approve']));

  const [first, second] = screen.getAllByRole('button');
  expect(first).toHaveTextContent('Approve');
  expect(second).toHaveTextContent('Reject');
  expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeOnTheScreen();
});

it('ignores an action the app does not know', async () => {
  await renderActions(detail(['edit']));

  expect(screen.toJSON()).toBeNull();
});

it('renders nothing when the user has no action and nothing to report', async () => {
  await renderActions(detail());

  expect(screen.toJSON()).toBeNull();
});

it('asks for a remark before rejecting, without calling the server', async () => {
  await renderActions(detail(['approve', 'reject']));

  await userEvent.press(screen.getByRole('button', { name: 'Reject' }));
  await confirmDialog('Reject');

  expect(screen.getByText('Enter a remark.')).toBeOnTheScreen();
  expect(actMock).not.toHaveBeenCalled();
});

it('asks for a remark before a request is approved', async () => {
  await renderActions(detail(['approve']), flows.request);

  await userEvent.press(screen.getByRole('button', { name: 'Approve' }));
  await confirmDialog('Approve');

  expect(screen.getByText('Enter a remark.')).toBeOnTheScreen();
  expect(actMock).not.toHaveBeenCalled();
});

it('lets an inbound be approved without a remark and shows the status the server answers with', async () => {
  actMock.mockResolvedValueOnce(detail([], { status: 'SUCCESS' }));
  await renderActions(detail(['approve']), flows.inbound);

  await userEvent.press(screen.getByRole('button', { name: 'Approve' }));
  await confirmDialog('Approve');

  expect(await screen.findByText('Saved. Status is now Approved.')).toBeOnTheScreen();
  expect(actMock).toHaveBeenCalledWith('inbound', 'doc-1', {
    action: 'approve',
    // The dialog gives an empty remark; the api layer leaves it out of the request.
    remarks: '',
    updatedAt: '2026-11-20T09:15:00+07:00',
  });
});

it('cancels without asking for a remark', async () => {
  actMock.mockResolvedValueOnce(detail([], { status: 'CANCEL' }));
  await renderActions(detail(['cancel']));

  await userEvent.press(screen.getByRole('button', { name: 'Cancel' }));
  await confirmDialog('Cancel document');

  expect(await screen.findByText('Saved. Status is now Canceled.')).toBeOnTheScreen();
});

it('disables the buttons offline and says why', async () => {
  await renderActions(detail(['approve', 'cancel']), flows.request, false);

  expect(screen.getByRole('button', { name: 'Approve' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  expect(screen.getByText('Connect to the internet to act on this document.')).toBeOnTheScreen();
});
