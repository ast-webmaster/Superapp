import { fireEvent, render, screen } from '@testing-library/react-native';

import { ColumnChart } from './column-chart';

it('caps a column with the short amount without Rp, so it fits, and reads it out in full', async () => {
  await render(
    <ColumnChart
      label="Sales per week"
      data={[{ key: 'W-1', label: 'W-1', value: 12500000000 }]}
    />,
  );
  const chart = screen.getByRole('img', { name: 'Sales per week. W-1 Rp 12,500,000,000' });

  // The values are drawn once the chart knows its width.
  await fireEvent(screen.getByTestId('column-plot'), 'layout', {
    nativeEvent: { layout: { width: 288 } },
  });

  expect(chart).toBeOnTheScreen();
  expect(screen.getByText('12.5 Mil')).toBeOnTheScreen();
});
