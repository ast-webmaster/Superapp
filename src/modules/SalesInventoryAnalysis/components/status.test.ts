import { achievementBadge, mohBadge } from './status';

describe('mohBadge', () => {
  it('maps the known statuses to a tone', () => {
    expect(mohBadge('NEED_ORDER', 'Need Order').tone).toBe('danger');
    expect(mohBadge('OVERSTOCK', 'Overstock / Slow Moving').tone).toBe('warning');
  });

  it('shows an unknown status with the label the server sent', () => {
    expect(mohBadge('NEW_STATUS', 'Something new')).toMatchObject({
      label: 'Something new',
      tone: 'neutral',
    });
  });
});

describe('achievementBadge', () => {
  it('labels the known statuses', () => {
    expect(achievementBadge('CRITICAL')).toMatchObject({ label: 'Critical', tone: 'danger' });
  });

  it('sentence-cases an unknown status', () => {
    expect(achievementBadge('BRAND_NEW').label).toBe('Brand_new');
  });
});
