import { render, screen, userEvent } from '@testing-library/react-native';

import { DEFAULT_FILTERS, usePriceApprovalFilter } from '../store/priceApprovalFilterStore';
import { FilterSheet } from './filter-sheet';

// The store only needs the auth store to reset itself on sign-out; keep the real one (and the API
// config it pulls in) out of this test.
jest.mock('@/core/auth', () => ({ useAuthStore: { subscribe: jest.fn() } }));

beforeEach(() => usePriceApprovalFilter.setState({ filters: DEFAULT_FILTERS }));

describe('FilterSheet', () => {
  it('applies the draft only on Apply', async () => {
    const onClose = jest.fn();
    await render(<FilterSheet visible onClose={onClose} />);

    await userEvent.press(screen.getByRole('button', { name: 'Sales admin' }));
    await userEvent.type(screen.getByLabelText('Min'), '1000');
    expect(usePriceApprovalFilter.getState().filters.tier).toBe('all');

    await userEvent.press(screen.getByRole('button', { name: 'Apply' }));

    expect(usePriceApprovalFilter.getState().filters).toMatchObject({
      tier: 'SALES ADMIN',
      minTotal: 1000,
      maxTotal: null,
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('refuses a max below the min', async () => {
    await render(<FilterSheet visible onClose={jest.fn()} />);

    await userEvent.type(screen.getByLabelText('Min'), '500');
    await userEvent.type(screen.getByLabelText('Max'), '100');

    expect(screen.getByText('Max must be at least the min.')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
  });

  it('picks a date range from the calendar', async () => {
    await render(<FilterSheet visible onClose={jest.fn()} />);

    await userEvent.press(screen.getByRole('button', { name: /^From date/ }));
    await userEvent.press(screen.getByRole('button', { name: /^1 / }));
    await userEvent.press(screen.getByRole('button', { name: /^20 / }));
    await userEvent.press(screen.getByRole('button', { name: 'Apply' }));

    const { dateFrom, dateTo } = usePriceApprovalFilter.getState().filters;
    expect(dateFrom?.endsWith('-01')).toBe(true);
    expect(dateTo?.endsWith('-20')).toBe(true);
  });
});
