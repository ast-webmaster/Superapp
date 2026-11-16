import type { ModuleManifest } from '@/shared/types/module';

import { resolveNotificationRoute } from './notification-route';

const withDetail: ModuleManifest = {
  id: 'price-approval',
  title: 'Price Approval',
  description: '',
  route: '/price-approval',
  detailRoute: (uuid) => `/price-approval/${uuid}`,
};
const withoutDetail: ModuleManifest = {
  id: 'plain',
  title: 'Plain',
  description: '',
  route: '/plain',
};
const manifests = [withDetail, withoutDetail];

describe('resolveNotificationRoute', () => {
  it('returns the document route of the matching module', () => {
    expect(resolveNotificationRoute({ module: 'price-approval', doc_uuid: 'abc' }, manifests)).toBe(
      '/price-approval/abc',
    );
  });

  it('matches a module by an alias and tells its route which slug came in', () => {
    const aliased: ModuleManifest = {
      id: 'marketing-activity',
      title: 'Marketing Activity',
      description: '',
      route: '/marketing-activity',
      aliases: ['marketing-activity-combination'],
      detailRoute: (uuid, slug) => `/marketing-activity/${uuid}?slug=${slug}`,
    };

    expect(
      resolveNotificationRoute({ module: 'marketing-activity-combination', doc_uuid: 'abc' }, [
        aliased,
      ]),
    ).toBe('/marketing-activity/abc?slug=marketing-activity-combination');
  });

  it('returns null for an unknown module', () => {
    expect(resolveNotificationRoute({ module: 'nope', doc_uuid: 'abc' }, manifests)).toBeNull();
  });

  it.each([[undefined], [''], [123], [null]])('returns null for doc_uuid %p', (doc_uuid) => {
    expect(resolveNotificationRoute({ module: 'price-approval', doc_uuid }, manifests)).toBeNull();
  });

  it.each([[undefined], [null], ['text'], [5]])('returns null for data %p', (data) => {
    expect(resolveNotificationRoute(data, manifests)).toBeNull();
  });

  it('returns null when the module has no detailRoute', () => {
    expect(resolveNotificationRoute({ module: 'plain', doc_uuid: 'abc' }, manifests)).toBeNull();
  });
});
