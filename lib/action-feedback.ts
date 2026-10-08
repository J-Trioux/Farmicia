import { itemName, type Game } from './game.ts';
import { frenchText } from './typography.ts';
export type ActionFeedback = {
  id: number;
  action: string;
  changed: boolean;
  coins: number;
  xp: number;
  items: { id: string; amount: number; quality: string; name: string }[];
  /** Graines gagnées (bonus de récolte) ; négatif quand on sème. */
  seeds: number;
  building?: string;
  plot?: { index: number; kind: 'water' | 'harvest' | 'plant' };
};
export function actionFeedback(
  before: Game,
  after: Game,
  action: string,
  id: number,
  building?: string,
): ActionFeedback {
  return {
    id,
    action,
    changed: before !== after,
    coins: after.coins - before.coins,
    xp: after.xp - before.xp,
    seeds: seedTotal(after) - seedTotal(before),
    building,
    plot: action === 'bulkTick' && before.bulkJob?.targets.length
      ? { index: before.bulkJob.targets[0], kind: before.bulkJob.kind === 'sow' ? 'plant' : before.bulkJob.kind }
      : undefined,
    items: Object.entries(after.stock)
      .filter(([key, n]) => n > (before.stock[key] || 0))
      .map(([key, n]) => ({
        id: key,
        amount: n - (before.stock[key] || 0),
        quality: key.split('|')[1] || 'ordinaire',
        name: itemName(key),
      })),
  };
}
function seedTotal(g: Game) {
  return Object.values(g.seeds || {}).reduce((sum, n) => sum + (Number(n) || 0), 0);
}
export function plainMessage(message: string) {
  return frenchText(message)
    .replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, '')
    .trim();
}
