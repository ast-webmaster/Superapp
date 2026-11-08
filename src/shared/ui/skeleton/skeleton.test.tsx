import { render, screen } from '@testing-library/react-native';

import { Skeleton, SkeletonGroup } from './skeleton';

describe('SkeletonGroup', () => {
  it('is announced once as a busy progress bar with a label', async () => {
    await render(
      <SkeletonGroup label="Loading requests">
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
      </SkeletonGroup>,
    );

    expect(screen.getByRole('progressbar', { name: 'Loading requests' })).toBeOnTheScreen();
  });
});
