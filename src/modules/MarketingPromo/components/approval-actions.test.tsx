import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, within } from '@testing-library/react-native';

import { ConfirmProvider } from '@/shared/ui';

import { marketingPromoApi } from '../api/marketingPromoApi';
import type { MarketingPromoAction, MarketingPromoDetail } from '../types';
import { ApprovalActions } from './approval-actions';

jest.mock('../api/marketingPromoApi', () => ({ marketingPromoApi: { act: jest.fn() } }));

const actMock = marketingPromoApi.act as jest.Mock;

function detail(allowed: MarketingPromoAction[]) {
  return {
    uuid: 'mp-1',
    status: 'AWAITING',
    updated_at: '2026-11-08T10:00:00+07:00',
    allowed_actions: allowed,
  } as unknown as MarketingPromoDetail;
}

function renderActions(allowed: MarketingPromoAction[], online = true) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ConfirmProvider>
        <ApprovalActions kind="single" detail={detail(allowed)} online={online} />
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
  await renderActions(['approve', 'cancel']);

  expect(screen.getByRole('button', { name: 'Approve' })).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Cancel promo' })).toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: 'Reject' })).not.toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: 'Revise' })).not.toBeOnTheScreen();
});

it('renders nothing when the user has no action and nothing to report', async () => {
  await renderActions([]);

  expect(screen.toJSON()).toBeNull();
});

it.each(['Reject', 'Revise', 'Cancel promo'])(
  'refuses a %s reason shorter than the server accepts, without calling it',
  async (label) => {
    await renderActions(['approve', 'revise', 'reject', 'cancel']);

    await userEvent.press(screen.getByRole('button', { name: label }));
    await userEvent.type(screen.getByLabelText('Reason'), 'no');
    await confirmDialog(label);

    expect(screen.getByText(/at least 6 characters/)).toBeOnTheScreen();
    expect(actMock).not.toHaveBeenCalled();
  },
);

it('sends the reason and the updated_at the user saw, then shows the server status', async () => {
  actMock.mockResolvedValueOnce({ ...detail([]), status: 'REVISE' });
  await renderActions(['approve', 'revise', 'reject']);

  await userEvent.press(screen.getByRole('button', { name: 'Revise' }));
  await userEvent.type(screen.getByLabelText('Reason'), '  Add a quote  ');
  await confirmDialog('Revise');

  expect(await screen.findByText('Saved. Status is now Needs revision.')).toBeOnTheScreen();
  expect(actMock).toHaveBeenCalledWith('single', 'mp-1', {
    action: 'revise',
    remarks: 'Add a quote',
    updatedAt: '2026-11-08T10:00:00+07:00',
  });
});

it('disables the actions offline', async () => {
  await renderActions(['approve'], false);

  expect(screen.getByRole('button', { name: 'Approve' })).toBeDisabled();
  expect(screen.getByText('Connect to the internet to act on this promo.')).toBeOnTheScreen();
});
