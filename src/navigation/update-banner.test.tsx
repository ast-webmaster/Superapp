import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as Updates from 'expo-updates';

import { UpdateBanner } from './update-banner';

jest.mock('expo-updates', () => ({
  isEnabled: false,
  useUpdates: jest.fn(),
  checkForUpdateAsync: jest.fn(),
  fetchUpdateAsync: jest.fn(),
  reloadAsync: jest.fn(),
}));

const useUpdates = jest.mocked(Updates.useUpdates);
const reload = jest.mocked(Updates.reloadAsync);

function updates(pending: boolean, updateId = 'update-1') {
  useUpdates.mockReturnValue({
    isUpdatePending: pending,
    downloadedUpdate: pending ? { updateId } : undefined,
  } as ReturnType<typeof Updates.useUpdates>);
}

describe('UpdateBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    reload.mockResolvedValue();
  });

  it('shows nothing while no update has been downloaded', async () => {
    updates(false);
    await render(<UpdateBanner />);

    expect(screen.queryByText('Update ready')).not.toBeOnTheScreen();
  });

  it('offers a restart once an update is downloaded', async () => {
    updates(true);
    await render(<UpdateBanner />);

    expect(screen.getByText('Update ready')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Restart' }));

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('hides for this version on Later and returns for a newer one', async () => {
    updates(true, 'update-1');
    const view = await render(<UpdateBanner />);

    await fireEvent.press(screen.getByRole('button', { name: 'Later' }));
    expect(screen.queryByText('Update ready')).not.toBeOnTheScreen();

    updates(true, 'update-2');
    await act(async () => view.rerender(<UpdateBanner />));

    expect(screen.getByText('Update ready')).toBeOnTheScreen();
  });

  it('can be tried again when the restart fails', async () => {
    updates(true);
    reload.mockRejectedValueOnce(new Error('ERR_UPDATES_RELOAD'));
    await render(<UpdateBanner />);

    await fireEvent.press(screen.getByRole('button', { name: 'Restart' }));

    expect(screen.getByRole('button', { name: 'Restart' })).toBeEnabled();
  });
});
