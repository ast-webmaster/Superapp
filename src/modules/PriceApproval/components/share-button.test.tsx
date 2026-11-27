import { fireEvent, render, screen } from '@testing-library/react-native';
import * as Clipboard from 'expo-clipboard';
import { Platform, Share } from 'react-native';

import { ShareButton } from './share-button';

jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn().mockResolvedValue(true) }));
jest.mock('@/core/config', () => ({ env: { webUrl: 'https://example.test' } }));

const os = Platform.OS;
const url = 'https://example.test/priceapproval/show/abc';

function renderButton() {
  return render(<ShareButton uuid="abc" paNo="PA-1" customerName="Acme" />);
}

afterEach(() => {
  Platform.OS = os;
  jest.restoreAllMocks();
});

test('opens the share sheet with the number, customer and web link', async () => {
  const share = jest.spyOn(Share, 'share').mockResolvedValue({
    action: Share.sharedAction,
    activityType: undefined,
  });
  await renderButton();

  await fireEvent.press(screen.getByLabelText('Share PA-1'));

  expect(share).toHaveBeenCalledWith({ message: `Price Approval PA-1\nAcme\n${url}` });
});

test('copies the link in a browser that cannot share', async () => {
  Platform.OS = 'web';
  const share = jest.spyOn(Share, 'share');
  await renderButton();

  await fireEvent.press(screen.getByLabelText('Share PA-1'));

  expect(Clipboard.setStringAsync).toHaveBeenCalledWith(url);
  expect(share).not.toHaveBeenCalled();
  expect(await screen.findByLabelText('Link copied')).toBeOnTheScreen();
});
