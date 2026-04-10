/**
 * AutoCard Recommendation Engine
 *
 * ── How it works ────────────────────────────────────────────────────────────
 * For a given purchase context (merchant → category), we evaluate every enabled
 * card and compute an "effective cents per dollar" (CPD) value:
 *
 *   CPD = rewardMultiplier × pointValue
 *
 * Cards are ranked by CPD descending. The top card is the recommendation.
 * A plain-English explanation is generated for the best result.
 *
 * ── Simplifying assumptions ─────────────────────────────────────────────────
 * - Point values are estimates based on common redemption paths:
 *     Amex MR ~2.0¢, Chase UR (Sapphire) ~2.0¢, Chase UR (Flex) ~1.5¢,
 *     Capital One Miles ~1.85¢, cash back = face value (1¢/1%)
 * - Citi Custom Cash: we assume the purchase category IS the user's top
 *   monthly spend (so 5% applies). In reality, the user must track this.
 * - Chase Freedom Flex rotating category: fixed to "grocery" for Q3 in demo.
 * - Spend caps (e.g., $25k/yr grocery on Amex Gold) are shown in notes but
 *   not enforced — this simplifies the engine for demo purposes.
 * - "High value" threshold: 5¢ per dollar or higher.
 */

import { CreditCard, Merchant, PurchaseContext, RankedCard, Recommendation } from '../types';
import { MERCHANTS } from '../data/merchants';

// ── Public helpers ──────────────────────────────────────────────────────────

export function getMerchantById(id: string): Merchant | undefined {
  return MERCHANTS.find(m => m.id === id);
}

export function buildContext(
  merchantId: string,
  estimatedAmount = 50
): PurchaseContext | null {
  const merchant = getMerchantById(merchantId);
  if (!merchant) return null;
  return { merchantId, merchant, estimatedAmount };
}

/**
 * Core recommendation function.
 * Requires at least one enabled card — callers should guard against empty arrays.
 */
export function getRecommendation(
  context: PurchaseContext,
  enabledCards: CreditCard[]
): Recommendation {
  if (enabledCards.length === 0) {
    throw new Error('AutoCard: getRecommendation called with no enabled cards');
  }

  // Rank all enabled cards for this purchase category
  const ranked: RankedCard[] = enabledCards
    .map(card => {
      const rate = card.rewards.find(r => r.category === context.merchant.category);
      const multiplier = rate?.multiplier ?? card.baseMultiplier;
      const effectiveCPD = +(multiplier * card.pointValue).toFixed(2);
      return {
        card,
        multiplier,
        effectiveCPD,
        rank: 0, // filled in after sort
        note: rate?.notes,
      };
    })
    .sort((a, b) => b.effectiveCPD - a.effectiveCPD)
    .map((item, index) => ({ ...item, rank: index + 1 }));

  const best = ranked[0];
  const alternatives = ranked.slice(1);
  const isHighValue = best.effectiveCPD >= 5;
  const explanation = buildExplanation(best, context, ranked);

  return {
    id: generateId(),
    context,
    best,
    alternatives,
    explanation,
    timestamp: new Date().toISOString(),
    isHighValue,
  };
}

// ── Private helpers ─────────────────────────────────────────────────────────

function buildExplanation(
  best: RankedCard,
  context: PurchaseContext,
  allRanked: RankedCard[]
): string {
  const { card, multiplier, effectiveCPD } = best;
  const categoryLabel = categoryDisplayName(context.merchant.category);
  const secondBest = allRanked[1];

  // Core sentence: card name, category, multiplier, CPD
  let text = `Use ${card.shortName} — ${categoryLabel} earns ${multiplier}x ${card.pointsName} (≈${effectiveCPD.toFixed(1)}¢ per dollar).`;

  // Margin commentary
  if (secondBest) {
    const margin = effectiveCPD - secondBest.effectiveCPD;
    if (margin >= 2) {
      text += ` That's ${margin.toFixed(1)}¢ more than your next-best option (${secondBest.card.shortName}).`;
    } else if (margin > 0) {
      text += ` Slightly ahead of ${secondBest.card.shortName} at ${secondBest.effectiveCPD.toFixed(1)}¢/$1.`;
    }
  }

  // Cap/condition note
  if (best.note) {
    text += ` Note: ${best.note}.`;
  }

  return text;
}

function categoryDisplayName(category: string): string {
  const map: Record<string, string> = {
    dining:    'Dining',
    grocery:   'Groceries',
    travel:    'Travel',
    transit:   'Transit / rideshare',
    pharmacy:  'Pharmacy',
    streaming: 'Streaming',
    gas:       'Gas',
    online:    'Online shopping',
    general:   'General purchases',
  };
  return map[category] ?? category;
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
