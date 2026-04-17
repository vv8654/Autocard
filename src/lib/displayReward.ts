import { RewardsType } from '../types';

/**
 * Human-readable reward label for a card + multiplier.
 * Cash cards → "5% back", points cards → "4x points"
 */
export function rewardLabel(rewardsType: RewardsType, multiplier: number): string {
  if (rewardsType === 'Cash') return `${multiplier}% back`;
  const name =
    rewardsType === 'MR'    ? 'MR pts'    :
    rewardsType === 'UR'    ? 'UR pts'    :
    rewardsType === 'Miles' ? 'miles'     : 'pts';
  return `${multiplier}x ${name}`;
}

/**
 * Estimated dollar value earned, formatted as "$2.40".
 * effectiveCPD is already in cents-per-dollar.
 */
export function earnedDollars(effectiveCPD: number, amount: number): string {
  const val = (effectiveCPD / 100) * amount;
  return `$${val.toFixed(val < 10 ? 2 : 0)}`;
}
