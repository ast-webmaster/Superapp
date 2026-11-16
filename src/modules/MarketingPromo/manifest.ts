import type { ModuleManifest } from '@/shared/types/module';

import { COMBINATION_SLUG, marketingPromoRoutes } from './navigation/routes';

export const marketingPromoManifest: ModuleManifest = {
  id: 'marketing-promo',
  title: 'Marketing Promo',
  description: 'Review and approve marketing promos',
  route: marketingPromoRoutes.list,
  // Combination documents are notified under their own slug but open in this module.
  aliases: [COMBINATION_SLUG],
  detailRoute: (docUuid, slug) =>
    marketingPromoRoutes.detail(docUuid, slug === COMBINATION_SLUG ? 'combination' : 'single'),
  icon: 'star',
  // The API answers 403 without one of these; hide the entry instead of opening an error screen.
  permission: [
    'create_marketing_promo_marcom',
    'create_marketing_promo_marcom_asusnb',
    'approve_marketing_promo_as_product_manager',
    'approve_marketing_promo_as_manager',
    'approve_marketing_promo_as_director',
    'approve_marketing_promo_as_finance_staf',
    'approve_marketing_promo_as_finance_manager',
    'approve_marketing_promo_as_president_director',
    'read_only_all_marketing_promo',
  ],
};
