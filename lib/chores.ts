/**
 * 0.18 — Les tâches de Rosalie, à la manière des Sims.
 *
 * Demande de l’auteur : récolter, semer et arroser peuvent être lancés
 * ensemble ; Rosalie prend toujours la parcelle la plus proche parmi toutes
 * ses tâches, au lieu de suivre les rangées dans l’ordre, et les gestes
 * s’enchaînent naturellement sur une même parcelle (récolter, puis semer,
 * puis arroser).
 *
 * Ce module ne connaît que la géométrie du potager (lib/world.ts) : il mesure
 * la marche par les allées et les couloirs, comme le fait `route` (lib/farm-controls.ts),
 * sans chercher de chemin sur la carte.
 */
import { AISLES_PX, GESTURE_FEET, GESTURE_SIDE, LANE_FEET, PLOT, POTAGER_DOORS, WORLD_H, WORLD_W, plotRect } from './world.ts';

export type ChoreKind = 'harvest' | 'sow' | 'water';
/** Sur une même parcelle, à distance égale : on récolte, on sème, puis on arrose. */
export const CHORE_ORDER: readonly ChoreKind[] = ['harvest', 'sow', 'water'];
/** Ce qu’une tâche prépare pour une autre : une récolte libère une parcelle, un semis a soif. */
export const CHORE_FEEDS: Readonly<Record<ChoreKind, ChoreKind | null>> = { harvest: 'sow', sow: 'water', water: null };

const ROWS = PLOT.capacity / PLOT.columns;
/** Descendre du bord de la terre à l’allée (et remonter). */
const STEP_DOWN = LANE_FEET - GESTURE_FEET;
const rowOf = (index: number) => Math.floor(index / PLOT.columns);
const laneY = (row: number) => PLOT.top + row * PLOT.dy + LANE_FEET;
/** Où Rosalie se tient pour travailler une parcelle (pieds, px de la carte). */
function spot(index: number) {
  const r = plotRect(index);
  return { x: r.x + r.w / 2 - GESTURE_SIDE, y: r.y + GESTURE_FEET };
}
/** De l’allée d’une rangée (à l’abscisse x) jusqu’au point de geste d’une parcelle. */
function fromLane(x: number, row: number, index: number) {
  const q = spot(index);
  const target = rowOf(index);
  if (row === target) return Math.abs(x - q.x) + STEP_DOWN;
  const aisle = Math.min(...AISLES_PX.map((a) => Math.abs(x - a) + Math.abs(a - q.x)));
  return aisle + Math.abs(laneY(row) - laneY(target)) + STEP_DOWN;
}
/** Marche (px) d’une parcelle à une autre, par les allées. 0 : la même parcelle. */
export function plotWalk(from: number, to: number) {
  if (from === to) return 0;
  return STEP_DOWN + fromLane(spot(from).x, rowOf(from), to);
}
/** Marche (px) depuis un point de la carte (pieds de Rosalie, en %) jusqu’à une parcelle. */
export function pointWalk(from: { x: number; y: number }, to: number) {
  const f = { x: (from.x / 100) * WORLD_W, y: (from.y / 100) * WORLD_H };
  const inside = f.x >= AISLES_PX[0] - 1 && f.x <= AISLES_PX[AISLES_PX.length - 1] + 1 &&
    f.y >= PLOT.top - 1 && f.y <= PLOT.top + ROWS * PLOT.dy + 1;
  if (inside) {
    const row = Math.min(ROWS - 1, Math.max(0, Math.round((f.y - PLOT.top - LANE_FEET) / PLOT.dy)));
    return Math.abs(f.y - laneY(row)) + fromLane(f.x, row, to);
  }
  // Dehors : jusqu’à la porte la plus commode de la clôture, puis par les allées.
  return Math.min(...POTAGER_DOORS.map((door) =>
    Math.hypot(f.x - door.outside.x, f.y - door.outside.y) + Math.abs(door.outside.x - AISLES_PX[0]) +
    fromLane(AISLES_PX[0], door.row, to)));
}
/**
 * La prochaine parcelle : la plus proche parmi toutes les tâches. À égalité,
 * sur une même parcelle, on récolte, puis on sème, puis on arrose (les gestes
 * s’enchaînent sur place) ; ailleurs, Rosalie continue dans le sens de sa
 * tournée (les parcelles après `after` d’abord).
 */
export function nearestChore(
  candidates: readonly { kind: ChoreKind; index: number }[],
  distance: (index: number) => number,
  after = -1,
) {
  const rank = (c: { kind: ChoreKind; index: number }) =>
    [distance(c.index), Number(c.index <= after), c.index, CHORE_ORDER.indexOf(c.kind)];
  let best: { kind: ChoreKind; index: number } | null = null;
  let bestRank: number[] = [];
  for (const c of candidates) {
    const r = rank(c);
    const better = !best || r.some((value, i) => {
      for (let j = 0; j < i; j++) if (Math.abs(r[j] - bestRank[j]) > 0.01) return false;
      return value < bestRank[i] - 0.01;
    });
    if (better) {
      best = c;
      bestRank = r;
    }
  }
  return best;
}
