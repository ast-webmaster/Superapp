import { render, screen } from '@testing-library/react-native';

import type { ModuleManifest } from '@/shared/types/module';

import { AppGrid } from './app-tile';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

const app = (id: string): ModuleManifest => ({
  id,
  title: `App ${id}`,
  description: `About ${id}`,
  route: `/${id}`,
});

describe('AppGrid', () => {
  it('shows every app as a button with its title and no description', async () => {
    await render(<AppGrid manifests={['a', 'b', 'c', 'd', 'e'].map(app)} />);

    expect(screen.getAllByRole('button')).toHaveLength(5);
    expect(screen.getByText('App e')).toBeOnTheScreen();
    expect(screen.queryByText('About a')).toBeNull();
  });
});
