import { render, screen, userEvent } from '@testing-library/react-native';

import { useAuthStore } from '@/core/auth';

import { useLaporanPenjualanAmounts } from '../store/laporanPenjualanAmountStore';
import { Amount } from './amount';
import { FullAmountsRow } from './full-amounts-row';

// The store resets on sign-out, so it loads the auth store, which needs no server here.
jest.mock('@/core/api', () => ({
  apiClient: {},
  setAccessToken: jest.fn(),
  setUnauthorizedHandler: jest.fn(),
  setForbiddenHandler: jest.fn(),
}));

beforeEach(() => useLaporanPenjualanAmounts.setState({ fullAmounts: false }));

it('is short by default and still read out in full', async () => {
  await render(<Amount value={1250000000} />);

  expect(screen.getByText('Rp 1.3 Mil')).toBeOnTheScreen();
  expect(screen.getByLabelText('Rp 1,250,000,000')).toBeOnTheScreen();
});

it('keeps the prefix in the text and in what is read out', async () => {
  await render(<Amount prefix="Target" value={2000000} />);

  expect(screen.getByText('Target Rp 2 Jt')).toBeOnTheScreen();
  expect(screen.getByLabelText('Target Rp 2,000,000')).toBeOnTheScreen();
});

it('shows full amounts once the row is switched on', async () => {
  await render(
    <>
      <FullAmountsRow />
      <Amount value={1250000000} />
    </>,
  );
  const toggle = screen.getByRole('switch', { name: 'Full amounts' });
  expect(toggle).not.toBeChecked();

  await userEvent.press(toggle);

  expect(toggle).toBeChecked();
  expect(screen.getByText('Rp 1,250,000,000')).toBeOnTheScreen();
});

it('goes back to short amounts after sign-out', () => {
  useAuthStore.setState({ status: 'authenticated' });
  useLaporanPenjualanAmounts.setState({ fullAmounts: true });

  useAuthStore.setState({ status: 'unauthenticated' });

  expect(useLaporanPenjualanAmounts.getState().fullAmounts).toBe(false);
});
