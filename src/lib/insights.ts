import { CreditCard, RankedCard, Recommendation, SimulatedHistoryRow, SimulationResult } from '../types';

/**
 * Replays up to 20 history entries through a target card to show
 * what the user would have earned with that card instead of their
 * actual top recommendation.
 */
export function simulateCard(
  targetCardId: string,
  history: Recommendation[],
  allCards: CreditCard[],
): SimulationResult {
  const targetCard = allCards.find(c => c.id === targetCardId);

  if (!targetCard || history.length === 0) {
    return {
      cardId: targetCardId,
      totalActualValue: 0,
      totalSimulatedValue: 0,
      netDelta: 0,
      rows: [],
    };
  }

  const rows: SimulatedHistoryRow[] = history.slice(0, 20).map(rec => {
    const category = rec.context.merchant.category;
    const rate = targetCard.rewards.find(r => r.category === category);
    const multiplier = rate?.multiplier ?? targetCard.baseMultiplier;
    const simulatedCPD = +(multiplier * targetCard.pointValue).toFixed(2);

    const simulatedCard: RankedCard = {
      card: targetCard,
      multiplier,
      effectiveCPD: simulatedCPD,
      rank: 1,
      note: rate?.notes,
    };

    return {
      recommendation: rec,
      simulatedCard,
      actualCPD: rec.best.effectiveCPD,
      simulatedCPD,
      deltaPerDollar: +(simulatedCPD - rec.best.effectiveCPD).toFixed(2),
    };
  });

  const totalActualValue = rows.reduce(
    (s, r) => s + (r.actualCPD / 100) * r.recommendation.context.estimatedAmount,
    0,
  );
  const totalSimulatedValue = rows.reduce(
    (s, r) => s + (r.simulatedCPD / 100) * r.recommendation.context.estimatedAmount,
    0,
  );

  return {
    cardId: targetCardId,
    totalActualValue,
    totalSimulatedValue,
    netDelta: +(totalSimulatedValue - totalActualValue).toFixed(2),
    rows,
  };
}
