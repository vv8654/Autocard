/**
 * AutoCard Recommendation Engine v2
 *
 * ── Scoring model ───────────────────────────────────────────────────────────
 *   base_value   = earn_rate × pointValue(rewardsType, redemptionStyle)
 *   bonus_value  = (bonus.totalValue / remaining_spend) × 100   [¢/$]
 *                  (only when bonus.active && remaining_spend > 0)
 *   total_score  = base_value + bonus_value
 *
 * Cards are ranked by total_score descending.
 *
 * ── Simplifying assumptions ─────────────────────────────────────────────────
 * - Citi Custom Cash: assumes this category IS the user's top monthly spend.
 * - Freedom Flex rotating category: fixed to current quarter in demo.
 * - Spend caps shown in notes but not enforced.
 * - "High value" threshold: 5¢ per dollar or higher (base score only).
 */

import {
  Bonus,
  BonusContext,
  CreditCard,
  Merchant,
  PurchaseContext,
  RankedCard,
  RedemptionStyle,
  Recommendation,
} from '../types';
import { MERCHANTS } from '../data/merchants';
import { getPointValue } from './pointValues';

// ── Public helpers ──────────────────────────────────────────────────────────

export function getMerchantById(id: string): Merchant | undefined {
  return MERCHANTS.find(m => m.id === id);
}

export function buildContext(
  merchantId: string,
  estimatedAmount = 50,
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
  enabledCards: CreditCard[],
  bonuses: Bonus[] = [],
  redemptionStyle: RedemptionStyle = 'balanced',
): Recommendation {
  if (enabledCards.length === 0) {
    throw new Error('AutoCard: getRecommendation called with no enabled cards');
  }

  const ranked: RankedCard[] = enabledCards
    .map(card => {
      // ── Step 1: base score ───────────────────────────────────────────────
      const rate = card.rewards.find(r => r.category === context.merchant.category);
      const multiplier = rate?.multiplier ?? card.baseMultiplier;
      const pointValue = getPointValue(card.rewardsType, redemptionStyle);
      const baseCPD = +(multiplier * pointValue).toFixed(2);

      // ── Step 2: bonus score ──────────────────────────────────────────────
      const bonus = bonuses.find(b => b.cardId === card.id && b.active);
      let bonusCPD = 0;
      let bonusApplied = false;
      if (bonus) {
        const remaining = bonus.requiredSpend - bonus.currentSpend;
        if (remaining > 0) {
          // Convert dollars-per-dollar to cents-per-dollar
          bonusCPD = +((bonus.totalValue / remaining) * 100).toFixed(2);
          bonusApplied = true;
        }
      }

      // ── Step 3: total score ──────────────────────────────────────────────
      const effectiveCPD = +(baseCPD + bonusCPD).toFixed(2);

      return {
        card,
        multiplier,
        effectiveCPD,
        baseCPD,
        bonusCPD,
        bonusApplied,
        rank: 0,
        note: rate?.notes,
      };
    })
    .sort((a, b) => b.effectiveCPD - a.effectiveCPD)
    .map((item, index) => ({ ...item, rank: index + 1 }));

  const best = ranked[0];
  const alternatives = ranked.slice(1);

  // High-value is based on base score (so bonus doesn't inflate the threshold)
  const isHighValue = (best.baseCPD ?? best.effectiveCPD) >= 5;

  // ── Bonus context: what would win without the bonus? ─────────────────────
  let bonusContext: BonusContext | undefined;
  if (best.bonusApplied) {
    const bonus = bonuses.find(b => b.cardId === best.card.id && b.active)!;
    const remaining = bonus.requiredSpend - bonus.currentSpend;

    // Rank cards by base score alone
    const baselineRanked = [...ranked].sort(
      (a, b) => (b.baseCPD ?? b.effectiveCPD) - (a.baseCPD ?? a.effectiveCPD),
    );
    const baselineWinner = baselineRanked[0];
    const baselineBest =
      baselineWinner.card.id !== best.card.id
        ? {
            cardId: baselineWinner.card.id,
            shortName: baselineWinner.card.shortName,
            effectiveCPD: baselineWinner.baseCPD ?? baselineWinner.effectiveCPD,
          }
        : undefined;

    bonusContext = {
      totalValue: bonus.totalValue,
      remainingSpend: remaining,
      bonusCPD: best.bonusCPD ?? 0,
      baseCPD: best.baseCPD ?? best.effectiveCPD,
      baselineBest,
    };
  }

  const explanation = buildExplanation(best, context, ranked, bonusContext);

  return {
    id: generateId(),
    context,
    best,
    alternatives,
    explanation,
    timestamp: new Date().toISOString(),
    isHighValue,
    bonusContext,
  };
}

// ── Private helpers ─────────────────────────────────────────────────────────

function buildExplanation(
  best: RankedCard,
  context: PurchaseContext,
  allRanked: RankedCard[],
  bonusContext?: BonusContext,
): string {
  const { card, multiplier, effectiveCPD } = best;
  const categoryLabel = categoryDisplayName(context.merchant.category);
  const amount = context.estimatedAmount;
  const earned = ((effectiveCPD / 100) * amount).toFixed(2);
  const rewardStr = card.rewardsType === 'Cash'
    ? `${multiplier}% cash back`
    : `${multiplier}x ${card.rewardsType === 'MR' ? 'Membership Rewards' : card.rewardsType === 'UR' ? 'Ultimate Rewards' : 'miles'}`;
  const secondBest = allRanked[1];

  if (bonusContext) {
    const { totalValue, remainingSpend, baseCPD, baselineBest } = bonusContext;
    const remaining = remainingSpend.toLocaleString('en-US', {
      style: 'currency', currency: 'USD', maximumFractionDigits: 0,
    });
    const baseEarned = ((baseCPD / 100) * amount).toFixed(2);
    let text = `${card.shortName} earns $${earned} on this purchase and you're only ${remaining} from a $${totalValue} welcome bonus.`;
    if (baselineBest) {
      const baselineEarned = ((baselineBest.effectiveCPD / 100) * amount).toFixed(2);
      text += ` Without the bonus, ${baselineBest.shortName} would earn slightly more ($${baselineEarned}).`;
    } else {
      text += ` Base earn alone: $${baseEarned} back.`;
    }
    return text;
  }

  let text = `${card.shortName} gives you ${rewardStr} at ${categoryLabel} — about $${earned} back on this $${amount} purchase.`;

  if (secondBest) {
    const secondEarned = (((secondBest.baseCPD ?? secondBest.effectiveCPD) / 100) * amount).toFixed(2);
    const margin = effectiveCPD - (secondBest.baseCPD ?? secondBest.effectiveCPD);
    if (margin >= 1) {
      text += ` ${secondBest.card.shortName} would earn $${secondEarned} — ${card.shortName} comes out ahead.`;
    }
  }

  if (best.note) {
    text += ` (${best.note}.)`;
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
