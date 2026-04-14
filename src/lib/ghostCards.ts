import { CreditCard, GhostCard, Recommendation } from '../types';

const GHOST_THRESHOLD_DAYS = 30;

/**
 * Returns a GhostCard entry for every enabled premium card (annualFee > 0)
 * that either has never been the top recommendation, or hasn't been
 * the top recommendation in the last GHOST_THRESHOLD_DAYS days.
 */
export function detectGhostCards(
  enabledCards: CreditCard[],
  history: Recommendation[],
): GhostCard[] {
  const now = Date.now();
  const ghosts: GhostCard[] = [];

  for (const card of enabledCards) {
    if (card.annualFee === 0) continue;

    const wins = history.filter(rec => rec.best.card.id === card.id);

    if (wins.length === 0) {
      ghosts.push({
        cardId: card.id,
        daysSinceLastWin: Infinity,
        annualFee: card.annualFee,
        suggestedAction: `${card.shortName} hasn't been your best card for any purchase yet — make sure it's worth the $${card.annualFee}/yr fee.`,
      });
      continue;
    }

    const lastWin = wins.reduce((latest, rec) =>
      new Date(rec.timestamp) > new Date(latest.timestamp) ? rec : latest,
    );
    const daysSince = Math.floor(
      (now - new Date(lastWin.timestamp).getTime()) / 86_400_000,
    );

    if (daysSince >= GHOST_THRESHOLD_DAYS) {
      ghosts.push({
        cardId: card.id,
        daysSinceLastWin: daysSince,
        annualFee: card.annualFee,
        suggestedAction: `Consider downgrading ${card.shortName} — it hasn't led a recommendation in ${daysSince} days but costs $${card.annualFee}/yr.`,
      });
    }
  }

  return ghosts;
}
