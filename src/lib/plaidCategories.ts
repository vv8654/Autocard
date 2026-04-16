import { Category } from '../types';

/**
 * Maps Plaid's personal finance category strings to AutoCard Category type.
 * Plaid returns categories as an array from most to least specific, e.g.
 * ["Food and Drink", "Restaurants"] or ["Travel", "Airlines and Aviation Services"]
 *
 * We check the most specific category first (last element), then fall back
 * to the primary category (first element).
 */
export function plaidCategoryToAutoCard(
  personalFinanceCategory?: string | null,
  legacyCategories?: string[] | null,
): Category {
  // Plaid "personal_finance_category" (newer enriched field) takes priority
  if (personalFinanceCategory) {
    const pfc = personalFinanceCategory.toLowerCase();
    if (pfc.includes('restaurant') || pfc.includes('food_and_drink') || pfc.includes('coffee'))
      return 'dining';
    if (pfc.includes('groceries') || pfc.includes('supermarket'))
      return 'grocery';
    if (pfc.includes('gas') || pfc.includes('fuel'))
      return 'gas';
    if (pfc.includes('pharmacy') || pfc.includes('drug'))
      return 'pharmacy';
    if (pfc.includes('travel') || pfc.includes('airline') || pfc.includes('hotel') || pfc.includes('lodging'))
      return 'travel';
    if (pfc.includes('transit') || pfc.includes('taxi') || pfc.includes('rideshare') || pfc.includes('public_transit'))
      return 'transit';
    if (pfc.includes('streaming') || pfc.includes('subscription') || pfc.includes('digital_entertainment'))
      return 'streaming';
    if (pfc.includes('online') || pfc.includes('e-commerce'))
      return 'online';
  }

  // Fall back to legacy categories array
  if (legacyCategories && legacyCategories.length > 0) {
    // Check specific (last) then general (first)
    const all = [...legacyCategories].reverse().map(s => s.toLowerCase());
    for (const c of all) {
      if (c.includes('restaurant') || c.includes('food') || c.includes('coffee') || c.includes('bar'))
        return 'dining';
      if (c.includes('groceries') || c.includes('supermarket') || c.includes('grocery'))
        return 'grocery';
      if (c.includes('gas station') || c.includes('fuel') || c.includes('gas'))
        return 'gas';
      if (c.includes('pharmacy') || c.includes('drug'))
        return 'pharmacy';
      if (c.includes('airline') || c.includes('hotel') || c.includes('travel') || c.includes('lodging'))
        return 'travel';
      if (c.includes('taxi') || c.includes('rideshare') || c.includes('transit') || c.includes('public transportation'))
        return 'transit';
      if (c.includes('streaming') || c.includes('subscription') || c.includes('digital'))
        return 'streaming';
      if (c.includes('online') || c.includes('e-commerce'))
        return 'online';
    }
  }

  return 'general';
}

/** Returns a human-readable label for an AutoCard category. */
export const CATEGORY_LABEL: Record<Category, string> = {
  dining:    'Dining',
  grocery:   'Grocery',
  gas:       'Gas',
  pharmacy:  'Pharmacy',
  travel:    'Travel',
  transit:   'Transit',
  streaming: 'Streaming',
  online:    'Online Shopping',
  general:   'General',
};
