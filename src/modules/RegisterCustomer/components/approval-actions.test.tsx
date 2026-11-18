import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, within } from '@testing-library/react-native';

import { ConfirmProvider } from '@/shared/ui';

import { registerCustomerApi } from '../api/registerCustomerApi';
import type {
  RegisterCustomerAction,
  RegisterCustomerDetail,
  RegisterCustomerStage,
} from '../types';
import { ApprovalActions } from './approval-actions';

jest.mock('../api/registerCustomerApi', () => ({ registerCustomerApi: { act: jest.fn() } }));

const actMock = registerCustomerApi.act as jest.Mock;
const SEEN = '2026-11-08T10:00:00+07:00';

function detail(allowed: RegisterCustomerAction[], stage: RegisterCustomerStage | null = 'MANAGER') {
  return {
    uuid: 'rc-1',
    status: 'AWAITING APPROVAL',
    updated_at: SEEN,
    allowed_actions: allowed,
    awaiting_stage: stage,
  } as unknown as RegisterCustomerDetail;
}

function renderActions(
  allowed: RegisterCustomerAction[],
  { online = true, stage = 'MANAGER' as RegisterCustomerStage | null } = {},
) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ConfirmProvider>
        <ApprovalActions detail={detail(allowed, stage)} online={online} />
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
});

it('renders nothing when the user has no action and nothing to report', async () => {
  await renderActions([], { stage: null });

  expect(screen.toJSON()).toBeNull();
});

it('refuses a reason shorter than six characters without calling the server', async () => {
  await renderActions(['approve', 'reject', 'revise']);

  await userEvent.press(screen.getByRole('button', { name: 'Reject' }));
  await userEvent.type(screen.getByLabelText('Reason'), 'no');
  await confirmDialog('Reject');

  expect(screen.getByText('Enter a reason of at least 6 characters.')).toBeOnTheScreen();
  expect(actMock).not.toHaveBeenCalled();
});

it('sends the reason and the updated_at the user saw, then shows the server status', async () => {
  actMock.mockResolvedValueOnce({ ...detail([]), status: 'REJECTED' });
  await renderActions(['approve', 'reject']);

  await userEvent.press(screen.getByRole('button', { name: 'Reject' }));
  await userEvent.type(screen.getByLabelText('Reason'), '  Documents are unclear  ');
  await confirmDialog('Reject');

  expect(await screen.findByText('Saved. Status is now Rejected.')).toBeOnTheScreen();
  expect(actMock).toHaveBeenCalledWith('rc-1', {
    action: 'reject',
    remarks: 'Documents are unclear',
    updatedAt: SEEN,
  });
});

it('asks finance for the customer code and sends it with the approval', async () => {
  actMock.mockResolvedValueOnce({ ...detail([]), status: 'COMPLETED' });
  await renderActions(['approve', 'reject', 'revise'], { stage: 'FINANCE' });

  await userEvent.press(screen.getByRole('button', { name: 'Approve' }));
  // A sheet, not the confirm dialog: nothing is sent until a code is entered.
  expect(screen.queryByRole('alertdialog')).not.toBeOnTheScreen();
  await userEvent.type(screen.getByLabelText('Customer code', { exact: false }), ' C-1001 ');
  await userEvent.press(screen.getAllByRole('button', { name: 'Approve' }).at(-1)!);

  expect(await screen.findByText('Saved. Status is now Completed.')).toBeOnTheScreen();
  expect(actMock).toHaveBeenCalledWith('rc-1', {
    action: 'approve',
    customerCode: 'C-1001',
    updatedAt: SEEN,
  });
});

it('does not send the finance approval without a customer code', async () => {
  await renderActions(['approve'], { stage: 'FINANCE' });

  await userEvent.press(screen.getByRole('button', { name: 'Approve' }));
  await userEvent.press(screen.getAllByRole('button', { name: 'Approve' }).at(-1)!);

  expect(screen.getByText('Enter the customer code.')).toBeOnTheScreen();
  expect(actMock).not.toHaveBeenCalled();
});

it('disables the actions offline', async () => {
  await renderActions(['approve'], { online: false });

  expect(screen.getByRole('button', { name: 'Approve' })).toBeDisabled();
  expect(
    screen.getByText('Connect to the internet to act on this registration.'),
  ).toBeOnTheScreen();
});
