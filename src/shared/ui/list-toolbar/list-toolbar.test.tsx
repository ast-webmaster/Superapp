import { render, screen, userEvent } from '@testing-library/react-native';
import { useState } from 'react';

import { Fab } from '../fab/fab';
import { AppText } from '../text/text';
import { ListToolbar } from './list-toolbar';

function Searchable({ onChange }: { onChange?: (value: string) => void }) {
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(true);
  return (
    <ListToolbar
      search={{
        open,
        onClose: () => setOpen(false),
        value,
        onChange: (next) => {
          setValue(next);
          onChange?.(next);
        },
        placeholder: 'Search requests',
      }}
    />
  );
}

describe('ListToolbar', () => {
  it('shows only the buttons it is given', async () => {
    await render(<ListToolbar />);

    expect(screen.queryByRole('button', { name: 'Filter' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Actions' })).toBeNull();
  });

  it('renders the module chips beside the buttons', async () => {
    await render(
      <ListToolbar onFilter={jest.fn()}>
        <AppText>Awaiting</AppText>
      </ListToolbar>,
    );

    expect(screen.getByRole('button', { name: 'Filter' })).toBeOnTheScreen();
    expect(screen.getByText('Awaiting')).toBeOnTheScreen();
  });

  it('opens the filter from its button', async () => {
    const onFilter = jest.fn();
    await render(<ListToolbar onFilter={onFilter} />);

    await userEvent.press(screen.getByRole('button', { name: 'Filter' }));

    expect(onFilter).toHaveBeenCalledTimes(1);
  });

  it('shows the search field while open, and Cancel clears it and closes it', async () => {
    const onChange = jest.fn();
    await render(<Searchable onChange={onChange} />);

    await userEvent.type(screen.getByPlaceholderText('Search requests'), 'PA-1');
    expect(onChange).toHaveBeenLastCalledWith('PA-1');

    await userEvent.press(screen.getByRole('button', { name: 'Cancel search' }));

    expect(onChange).toHaveBeenLastCalledWith('');
    expect(screen.queryByPlaceholderText('Search requests')).toBeNull();
  });

  it('lists the actions in a menu and runs the one chosen', async () => {
    const onExport = jest.fn();
    await render(
      <ListToolbar actions={[{ key: 'export', label: 'Export', icon: 'download', onPress: onExport }]} />,
    );

    await userEvent.press(screen.getByRole('button', { name: 'Actions' }));
    await userEvent.press(screen.getByRole('button', { name: 'Export' }));

    expect(onExport).toHaveBeenCalledTimes(1);
  });
});

describe('Fab', () => {
  it('is named by its label and fires onPress', async () => {
    const onPress = jest.fn();
    await render(<Fab label="New request" onPress={onPress} />);

    await userEvent.press(screen.getByRole('button', { name: 'New request' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
