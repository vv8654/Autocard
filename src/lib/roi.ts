import { CardROIResult, CreditCard, Recommendation } from '../types';

/**
 * Computes an annual-fee ROI estimate for a given card based on history.
 * Rewards value = sum of (effectiveCPD / 100 × estimatedAmount) for every
 * history entry where this card was the top recommendation.
 */
export function computeCardROI(
  cardId: string,
  history: Recommendation[],
  allCards: CreditCard[],
): CardROIResult {
  const card = allCards.find(c => c.id === cardId);
  const annualFee = card?.annualFee ?? 0;

  const wins = history.filter(rec => rec.best.card.id === cardId);
  const estimatedRewardsValue = wins.reduce((sum, rec) => {
    return sum + (rec.best.effectiveCPD / 100) * rec.context.estimatedAmount;
  }, 0);

  const netROI = estimatedRewardsValue - annualFee;
  return {
    cardId,
    annualFee,
    estimatedRewardsValue,
    netROI,
    isAhead: netROI >= 0,
  };
}
