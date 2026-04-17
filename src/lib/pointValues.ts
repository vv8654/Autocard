import { RedemptionStyle, RewardsType } from '../types';

/**
 * Cents-per-point valuations by redemption style.
 *
 * simple   — treat everything as cash / easy redemption (Amex MR heavily discounted)
 * balanced — moderate transfer-partner assumptions (default)
 * max      — optimistic travel-partner valuations (experienced travelers)
 */
// TPG monthly valuations April 2026: MR 2.0¢, UR 2.05¢, Cap1 Miles 1.85¢
export const POINT_VALUES: Record<RewardsType, Record<RedemptionStyle, number>> = {
  MR:    { simple: 0.6,  balanced: 1.5, max: 2.0  },
  UR:    { simple: 1.0,  balanced: 1.7, max: 2.05 },
  Miles: { simple: 1.0,  balanced: 1.3, max: 1.85 },
  Cash:  { simple: 1.0,  balanced: 1.0, max: 1.0  },
};

export function getPointValue(rewardsType: RewardsType, style: RedemptionStyle): number {
  return POINT_VALUES[rewardsType][style];
}

export const REDEMPTION_STYLE_INFO: Record<
  RedemptionStyle,
  { label: string; description: string; example: string }
> = {
  simple: {
    label: 'Simple',
    description: 'Cash back / easy redemptions',
    example: 'Statement credits, gift cards — maximize simplicity',
  },
  balanced: {
    label: 'Balanced',
    description: 'Mix of cash and travel',
    example: 'Transfer to partners occasionally, mostly easy redemptions',
  },
  max: {
    label: 'Max Value',
    description: 'Travel optimization',
    example: 'Transfer to airline / hotel partners for premium cabin bookings',
  },
};
