import { act, fireEvent, render, screen, userEvent } from '@testing-library/react-native';

import { AppText } from '../text/text';
import { Sheet } from './sheet';

const layOut = async () => {
  // The sheet opens once it knows its own height, which Jest never measures.
  await act(async () => {
    fireEvent(screen.getByLabelText('Filter').parent!, 'layout', {
      nativeEvent: { layout: { height: 320 } },
    });
  });
};

const advance = (ms: number) => act(async () => void jest.advanceTimersByTime(ms));

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('Sheet', () => {
  it('shows its title and content while visible', async () => {
    await render(
      <Sheet visible title="Filter" onClose={jest.fn()}>
        <AppText>Body</AppText>
      </Sheet>,
    );

    expect(screen.getByLabelText('Filter')).toBeOnTheScreen();
    expect(screen.getByText('Body')).toBeOnTheScreen();
  });

  it('asks to close from the close button and the back button', async () => {
    const onClose = jest.fn();
    jest.useRealTimers();
    await render(
      <Sheet visible title="Filter" onClose={onClose}>
        <AppText>Body</AppText>
      </Sheet>,
    );

    await userEvent.press(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent(screen.root!, 'requestClose');
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('stays mounted until the closing animation has finished', async () => {
    const { rerender } = await render(
      <Sheet visible title="Filter" onClose={jest.fn()}>
        <AppText>Body</AppText>
      </Sheet>,
    );
    await layOut();
    await advance(400);

    await rerender(
      <Sheet visible={false} title="Filter" onClose={jest.fn()}>
        <AppText>Body</AppText>
      </Sheet>,
    );
    await advance(100);
    expect(screen.queryByText('Body')).toBeOnTheScreen();

    await advance(300);
    expect(screen.queryByText('Body')).not.toBeOnTheScreen();
  });

  it('opens again after it has closed', async () => {
    const { rerender } = await render(
      <Sheet visible title="Filter" onClose={jest.fn()}>
        <AppText>Body</AppText>
      </Sheet>,
    );
    await layOut();
    await advance(400);
    await rerender(
      <Sheet visible={false} title="Filter" onClose={jest.fn()}>
        <AppText>Body</AppText>
      </Sheet>,
    );
    await advance(500);
    expect(screen.queryByText('Body')).not.toBeOnTheScreen();

    await rerender(
      <Sheet visible title="Filter" onClose={jest.fn()}>
        <AppText>Body</AppText>
      </Sheet>,
    );

    expect(screen.getByText('Body')).toBeOnTheScreen();
  });

  it('renders nothing while it has never been opened', async () => {
    await render(
      <Sheet visible={false} title="Filter" onClose={jest.fn()}>
        <AppText>Body</AppText>
      </Sheet>,
    );

    expect(screen.queryByText('Body')).not.toBeOnTheScreen();
  });
});
