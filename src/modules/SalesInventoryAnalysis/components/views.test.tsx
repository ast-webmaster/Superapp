import { fireEvent, render, screen } from '@testing-library/react-native';

import type { InactiveDealers, Inventory } from '../types';
import { InactiveView } from './inactive-view';
import { InventoryView } from './inventory-view';

const month = { key: '2026-10', label: 'Okt 2026' };

const inventory: Inventory = {
  periode: { bulan: [month], start: '2026-10-01', end: '2026-10-31', months: 1 },
  rows: [
    {
      group: 'ASUS NB',
      stock_available: 120,
      sales: { '2026-10': 60 },
      total_sales: 60,
      avg_run_rate: 60,
      moh: 2,
      status: 'NORMAL',
      status_label: 'Normal',
      action: 'Monitor',
    },
    {
      group: 'LOGITECH',
      stock_available: 0,
      sales: {},
      total_sales: 0,
      avg_run_rate: 0,
      moh: null,
      status: 'NO_MOVEMENT',
      status_label: 'No Movement',
      action: 'Investigate',
    },
  ],
  summary: { NEED_ORDER: 0, NORMAL: 1, OVERSTOCK: 0, NO_MOVEMENT: 1 },
  meta: { last_posting_date: null, last_stock_updated_at: '2026-11-21 08:45:00', scope: 'All' },
};

describe('InventoryView', () => {
  it('narrows the groups to the chosen status', async () => {
    await render(<InventoryView data={inventory} />);
    expect(screen.getByText('ASUS NB')).toBeOnTheScreen();
    expect(screen.getByText('LOGITECH')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'No Movement 1' }));

    expect(screen.queryByText('ASUS NB')).not.toBeOnTheScreen();
    expect(screen.getByText('LOGITECH')).toBeOnTheScreen();
  });

  it('says when the stock was last updated', async () => {
    await render(<InventoryView data={inventory} />);
    expect(screen.getByText('Stock as of 21 Nov 2026 08:45.')).toBeOnTheScreen();
  });
});

const dealer = (branch: string, name: string) => ({
  branch,
  customer_code: 'C-1',
  customer_name: name,
  customer_group: null,
  customer_city: null,
  items: [],
  item_count: 0,
  max_hari_tanpa_transaksi: 144,
});

const inactive: InactiveDealers = {
  acuan: { tanggal: '2026-11-21', satuan: 'bulan' },
  groups: [{ group: 'ASUS NB', batas: 3, batas_label: '3 bulan', cutoff: '2026-08-21' }],
  branches: [
    { branch: 'JAKARTA', dealer_count: 1, dealers: [dealer('JAKARTA', 'PT Satu')] },
    { branch: 'BANDUNG', dealer_count: 1, dealers: [dealer('BANDUNG', 'PT Dua')] },
  ],
  summary: { branches: 2, dealers: 2, items: 2 },
  meta: { last_posting_date: null, scope: 'All' },
};

describe('InactiveView', () => {
  it('draws a branch only while it is open', async () => {
    await render(<InactiveView data={inactive} />);
    expect(screen.queryByText('PT Satu')).not.toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'JAKARTA, 1 dealers' }));

    expect(screen.getByText('PT Satu')).toBeOnTheScreen();
    expect(screen.queryByText('PT Dua')).not.toBeOnTheScreen();
  });

  it('explains an empty analysis when no brand group has a limit', async () => {
    await render(<InactiveView data={{ ...inactive, groups: [], branches: [] }} />);
    expect(screen.getByText('No transaction limit set')).toBeOnTheScreen();
  });
});
