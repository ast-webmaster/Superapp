import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent } from '@testing-library/react-native';

import { ConfirmProvider } from '@/shared/ui';

import { auditApi } from '../api/auditApi';
import type { AuditAction, AuditDetail } from '../types';
import { AuditActions } from './audit-actions';

jest.mock('../api/auditApi', () => ({ auditApi: { act: jest.fn() } }));

const actMock = auditApi.act as jest.Mock;

function detail(allowed: AuditAction[]) {
  return {
    uuid: 'audit-1',
    status: 'AWAITING APPROVAL',
    allowed_actions: allowed,
  } as unknown as AuditDetail;
}

function renderActions(allowed: AuditAction[], online = true) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ConfirmProvider>
        <AuditActions detail={detail(allowed)} online={online} />
      </ConfirmProvider>
    </QueryClientProvider>,
  );
}

// Presses the confirm button of the sheet, which is rendered after (below) the trigger button.
async function confirmDialog(name: string) {
  await userEvent.press(screen.getAllByRole('button', { name }).at(-1)!);
}

beforeEach(() => actMock.mockReset());

it('offers only the actions the server allows', async () => {
  await renderActions(['approve', 'reject']);

  expect(screen.getByRole('button', { name: 'Approve' })).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Reject' })).toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: 'Start audit' })).not.toBeOnTheScreen();
});

it('renders nothing when the user has no action and nothing to report', async () => {
  await renderActions([]);

  expect(screen.toJSON()).toBeNull();
});

it('asks for a reason before rejecting, without calling the server', async () => {
  await renderActions(['approve', 'reject']);

  await userEvent.press(screen.getByRole('button', { name: 'Reject' }));
  await confirmDialog('Reject');

  expect(screen.getByText('Enter a reason of at least 6 characters.')).toBeOnTheScreen();
  expect(actMock).not.toHaveBeenCalled();
});

it('sends the action and shows the status the server answered with', async () => {
  actMock.mockResolvedValueOnce({ ...detail([]), status: 'COMPLETED' });
  await renderActions(['approve', 'reject']);

  await userEvent.press(screen.getByRole('button', { name: 'Approve' }));
  await confirmDialog('Approve');

  expect(actMock).toHaveBeenCalledWith('audit-1', { action: 'approve', remarks: '' });
  expect(await screen.findByText('Saved. Status is now Completed.')).toBeOnTheScreen();
});

it('shows the reason the server gave for a refused action', async () => {
  const { AppError } = jest.requireActual('@/core/errors');
  actMock.mockRejectedValueOnce(
    new AppError(
      'There are still 2 audit finding(s) without an Auditee Response.',
      'validation',
      422,
    ),
  );
  await renderActions(['follow_up']);

  await userEvent.press(screen.getByRole('button', { name: 'Send follow up' }));
  await confirmDialog('Send follow up');

  // The confirm sheet slides to the error, and the page's alert keeps it after the sheet closes.
  expect(await screen.findByText('Something went wrong')).toBeOnTheScreen();
  expect(
    screen.getAllByText('There are still 2 audit finding(s) without an Auditee Response.'),
  ).toHaveLength(2);
});

it('disables the actions offline and says why', async () => {
  await renderActions(['follow_up'], false);

  expect(screen.getByRole('button', { name: 'Send follow up' })).toBeDisabled();
  expect(screen.getByText('Connect to the internet to act on this audit.')).toBeOnTheScreen();
});
