import { ROTATING_SCHEDULES } from '../data/cards';
import { RotatingCategorySchedule } from '../types';

/**
 * Returns the current quarter's rotating category schedule for a given card,
 * or null if the card has no rotating schedule this month.
 */
export function getCurrentRotating(cardId: string): RotatingCategorySchedule | null {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed

  const entry = ROTATING_SCHEDULES.find(
    e => e.cardId === cardId && e.months.includes(month),
  );
  if (!entry) return null;

  const firstMonth = Math.min(...entry.months);
  const lastMonth  = Math.max(...entry.months);

  // Quarter start: 1st of the first month in this entry
  const quarterStart = new Date(now.getFullYear(), firstMonth, 1);
  // Quarter end: last millisecond of the last month
  const quarterEnd   = new Date(now.getFullYear(), lastMonth + 1, 0, 23, 59, 59, 999);

  const totalMs       = quarterEnd.getTime() - quarterStart.getTime();
  const elapsedMs     = now.getTime()        - quarterStart.getTime();
  const remainingMs   = quarterEnd.getTime() - now.getTime();

  const totalDays       = Math.ceil(totalMs     / 86_400_000);
  const daysIntoQuarter = Math.max(0, Math.ceil(elapsedMs   / 86_400_000));
  const daysRemaining   = Math.max(0, Math.ceil(remainingMs / 86_400_000));
  const percentElapsed  = Math.min(100, Math.round((daysIntoQuarter / totalDays) * 100));

  return { entry, daysRemaining, daysIntoQuarter, percentElapsed };
}
