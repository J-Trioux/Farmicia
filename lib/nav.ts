/**
 * 0.16 — Marche libre de Rosalie sur la grande carte.
 *
 * La carte de marche (lib/nav-grid.ts, générée par scripts/generer-navigation.py)
 * découpe la grille 1 200 × 800 en cases de 4 px : bloquées (bâtiments, murets,
 * clôtures, arbres, eau, champs…) ou libres, et parmi les libres, les chemins
 * peints. Rosalie cherche le trajet le moins coûteux (A*, 8 directions, jamais
 * en coupant l’angle d’un obstacle) : les chemins coûtent moins que l’herbe, et
 * le bord d’un obstacle coûte un peu plus, pour qu’elle marche au milieu des
 * allées. Le trajet est ensuite lissé en lignes droites, sans quitter ce qui est
 * libre ni délaisser un chemin pour l’herbe.
 *
 * Les objets posés au fil du jeu (aménagements, embellissements, décors de la
 * fête) s’ajoutent en rectangles d’emprise au sol (`extra`).
 */
import { NAV_GRID } from './nav-grid.ts';
import type { Px, RectPx } from './world.ts';

const { cell: CELL, cols: COLS, rows: ROWS } = NAV_GRID;
const SIZE = COLS * ROWS;

function decode(b64: string) {
  const raw = atob(b64);
  const out = new Uint8Array(SIZE);
  for (let i = 0; i < SIZE; i++) out[i] = (raw.charCodeAt(i >> 3) >> (7 - (i & 7))) & 1;
  return out;
}

const BASE = decode(NAV_GRID.blocked);
const TRAIL = decode(NAV_GRID.trail);

/** Coût d’une case selon le sol : chemin 1, herbe 2,2. */
const TRAIL_COST = 1;
const GRASS_COST = 2.2;
/** Surcoût près d’un obstacle (1 case, puis 2 cases). */
const EDGE_NEAR = 0.5;
const EDGE_FAR = 0.15;

const cellOf = (p: Px) => ({
  c: Math.min(COLS - 1, Math.max(0, Math.floor(p.x / CELL))),
  r: Math.min(ROWS - 1, Math.max(0, Math.floor(p.y / CELL))),
});
const centre = (i: number): Px => ({ x: (i % COLS) * CELL + CELL / 2, y: Math.floor(i / COLS) * CELL + CELL / 2 });

const gridCache = new Map<string, Uint8Array>();
/** Grille bloquée, objets posés compris (les dernières grilles sont gardées). */
function blockedGrid(extra: readonly RectPx[]) {
  if (!extra.length) return BASE;
  const key = extra.map((r) => `${r.x},${r.y},${r.w},${r.h}`).join(';');
  const cached = gridCache.get(key);
  if (cached) return cached;
  const grid = BASE.slice();
  for (const r of extra) {
    const c0 = Math.max(0, Math.floor(r.x / CELL));
    const c1 = Math.min(COLS - 1, Math.floor((r.x + r.w - 0.001) / CELL));
    const r0 = Math.max(0, Math.floor(r.y / CELL));
    const r1 = Math.min(ROWS - 1, Math.floor((r.y + r.h - 0.001) / CELL));
    for (let row = r0; row <= r1; row++) for (let col = c0; col <= c1; col++) grid[row * COLS + col] = 1;
  }
  if (gridCache.size >= 4) gridCache.delete(gridCache.keys().next().value!);
  gridCache.set(key, grid);
  return grid;
}

const costCache = new WeakMap<Uint8Array, Float32Array>();
/** Coût de chaque case libre (Infinity si bloquée). */
function costGrid(grid: Uint8Array) {
  const cached = costCache.get(grid);
  if (cached) return cached;
  const cost = new Float32Array(SIZE);
  for (let i = 0; i < SIZE; i++) {
    if (grid[i]) {
      cost[i] = Infinity;
      continue;
    }
    const r = Math.floor(i / COLS);
    const c = i % COLS;
    let near = false;
    let far = false;
    for (let dr = -2; dr <= 2 && !near; dr++)
      for (let dc = -2; dc <= 2; dc++) {
        const rr = r + dr;
        const cc = c + dc;
        if (rr < 0 || rr >= ROWS || cc < 0 || cc >= COLS || !grid[rr * COLS + cc]) continue;
        if (Math.abs(dr) <= 1 && Math.abs(dc) <= 1) {
          near = true;
          break;
        }
        far = true;
      }
    cost[i] = (TRAIL[i] ? TRAIL_COST : GRASS_COST) + (near ? EDGE_NEAR : far ? EDGE_FAR : 0);
  }
  costCache.set(grid, cost);
  return cost;
}

/** Vrai si Rosalie ne peut pas poser les pieds en ce point (px de la grille). */
export function isBlocked(p: Px, extra: readonly RectPx[] = []) {
  if (p.x < 0 || p.y < 0 || p.x >= COLS * CELL || p.y >= ROWS * CELL) return true;
  const { c, r } = cellOf(p);
  return !!blockedGrid(extra)[r * COLS + c];
}

/** Départ de Rosalie : sa zone de marche est celle du domaine entier. */
const HOME_CELL = Math.floor(327 / CELL) * COLS + Math.floor(440 / CELL);

const zoneCache = new WeakMap<Uint8Array, Uint8Array>();
/**
 * Cases reliées au départ de Rosalie (mêmes pas que la marche : 8 directions,
 * sans couper d’angle). Les poches isolées (clairière entre des roseaux, coin
 * de haies) ne sont jamais visées : un clic dessus mène au bord atteignable.
 */
function reachable(grid: Uint8Array) {
  const cached = zoneCache.get(grid);
  if (cached) return cached;
  const seen = new Uint8Array(SIZE);
  const start = grid[HOME_CELL] ? nearestAny(grid, HOME_CELL) : HOME_CELL;
  if (start >= 0) {
    const stack = [start];
    seen[start] = 1;
    while (stack.length) {
      const i = stack.pop()!;
      const c = i % COLS;
      const r = Math.floor(i / COLS);
      for (const [dc, dr] of STEPS) {
        const cc = c + dc;
        const rr = r + dr;
        if (cc < 0 || cc >= COLS || rr < 0 || rr >= ROWS) continue;
        const j = rr * COLS + cc;
        if (seen[j] || grid[j]) continue;
        if (dc && dr && (grid[r * COLS + cc] || grid[rr * COLS + c])) continue;
        seen[j] = 1;
        stack.push(j);
      }
    }
  }
  zoneCache.set(grid, seen);
  return seen;
}

/** Première case libre autour d’une case (sans condition de zone). */
function nearestAny(grid: Uint8Array, i: number) {
  const p = centre(i);
  return ring(grid, p, (j) => !grid[j]);
}

/** Recherche en anneaux de la case acceptée la plus proche d’un point. */
function ring(grid: Uint8Array, p: Px, accept: (i: number) => boolean) {
  const { c, r } = cellOf(p);
  if (accept(r * COLS + c)) return r * COLS + c;
  for (let d = 1; d < Math.max(COLS, ROWS); d++) {
    let best = -1;
    let bestDist = Infinity;
    for (let dr = -d; dr <= d; dr++)
      for (let dc = -d; dc <= d; dc++) {
        if (Math.max(Math.abs(dr), Math.abs(dc)) !== d) continue;
        const rr = r + dr;
        const cc = c + dc;
        if (rr < 0 || rr >= ROWS || cc < 0 || cc >= COLS || !accept(rr * COLS + cc)) continue;
        const q = centre(rr * COLS + cc);
        const e = Math.hypot(q.x - p.x, q.y - p.y);
        if (e < bestDist) {
          bestDist = e;
          best = rr * COLS + cc;
        }
      }
    if (best >= 0) return best;
  }
  return -1;
}

/** Case libre la plus proche d’un point, dans la zone où Rosalie peut marcher. */
function nearestFree(grid: Uint8Array, p: Px) {
  const zone = reachable(grid);
  return ring(grid, p, (i) => !!zone[i]);
}

/** Point libre le plus proche (le point lui-même s’il est libre). */
export function nearestWalkable(p: Px, extra: readonly RectPx[] = []): Px {
  const grid = blockedGrid(extra);
  const { c, r } = cellOf(p);
  if (reachable(grid)[r * COLS + c]) return p;
  const i = nearestFree(grid, p);
  return i < 0 ? p : centre(i);
}

/** Tas binaire minimal sur des indices de cases. */
class Heap {
  private items: number[] = [];
  private readonly score: Float32Array;
  constructor(score: Float32Array) {
    this.score = score;
  }
  get size() {
    return this.items.length;
  }
  push(i: number) {
    const a = this.items;
    a.push(i);
    let k = a.length - 1;
    while (k > 0) {
      const parent = (k - 1) >> 1;
      if (this.score[a[parent]] <= this.score[a[k]]) break;
      [a[parent], a[k]] = [a[k], a[parent]];
      k = parent;
    }
  }
  pop() {
    const a = this.items;
    const top = a[0];
    const last = a.pop()!;
    if (a.length) {
      a[0] = last;
      let k = 0;
      for (;;) {
        const l = 2 * k + 1;
        const r = l + 1;
        let m = k;
        if (l < a.length && this.score[a[l]] < this.score[a[m]]) m = l;
        if (r < a.length && this.score[a[r]] < this.score[a[m]]) m = r;
        if (m === k) break;
        [a[m], a[k]] = [a[k], a[m]];
        k = m;
      }
    }
    return top;
  }
}

const STEPS = [
  [-1, 0, 1],
  [1, 0, 1],
  [0, -1, 1],
  [0, 1, 1],
  [-1, -1, Math.SQRT2],
  [1, -1, Math.SQRT2],
  [-1, 1, Math.SQRT2],
  [1, 1, Math.SQRT2],
] as const;

/** A* de case en case ; si le but est hors d’atteinte, s’arrête au plus près. */
function search(grid: Uint8Array, cost: Float32Array, start: number, goal: number) {
  const g = new Float32Array(SIZE).fill(Infinity);
  const f = new Float32Array(SIZE).fill(Infinity);
  const from = new Int32Array(SIZE).fill(-1);
  const closed = new Uint8Array(SIZE);
  const gx = goal % COLS;
  const gy = Math.floor(goal / COLS);
  const h = (i: number) => {
    const dx = Math.abs((i % COLS) - gx);
    const dy = Math.abs(Math.floor(i / COLS) - gy);
    return TRAIL_COST * (Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy));
  };
  g[start] = 0;
  f[start] = h(start);
  const open = new Heap(f);
  open.push(start);
  let closest = start;
  let closestH = h(start);
  while (open.size) {
    const i = open.pop();
    if (closed[i]) continue;
    closed[i] = 1;
    if (i === goal) {
      closest = goal;
      break;
    }
    const hi = h(i);
    if (hi < closestH) {
      closestH = hi;
      closest = i;
    }
    const c = i % COLS;
    const r = Math.floor(i / COLS);
    for (const [dc, dr, len] of STEPS) {
      const cc = c + dc;
      const rr = r + dr;
      if (cc < 0 || cc >= COLS || rr < 0 || rr >= ROWS) continue;
      const j = rr * COLS + cc;
      if (grid[j] || closed[j]) continue;
      // Jamais en coupant l’angle d’un obstacle.
      if (dc && dr && (grid[r * COLS + cc] || grid[rr * COLS + c])) continue;
      const next = g[i] + (len * (cost[i] + cost[j])) / 2;
      if (next < g[j]) {
        g[j] = next;
        f[j] = next + h(j);
        from[j] = i;
        open.push(j);
      }
    }
  }
  const cells = [closest];
  while (cells[0] !== start) cells.unshift(from[cells[0]]);
  return { cells, g };
}

/** Cases traversées par un segment (toutes celles qu’il touche). */
function traverse(a: Px, b: Px) {
  const cells: number[] = [];
  const steps = Math.max(1, Math.ceil((Math.hypot(b.x - a.x, b.y - a.y) / CELL) * 3));
  let last = -1;
  for (let k = 0; k <= steps; k++) {
    const p = { x: a.x + ((b.x - a.x) * k) / steps, y: a.y + ((b.y - a.y) * k) / steps };
    const { c, r } = cellOf(p);
    const i = r * COLS + c;
    if (i === last) continue;
    // Passage en diagonale d’une case à l’autre : les deux cases d’angle comptent.
    if (last >= 0 && last % COLS !== c && Math.floor(last / COLS) !== r) {
      cells.push(Math.floor(last / COLS) * COLS + c, r * COLS + (last % COLS));
    }
    cells.push(i);
    last = i;
  }
  return cells;
}

/** Coût d’un segment droit (Infinity s’il touche un obstacle). */
function segmentCost(grid: Uint8Array, cost: Float32Array, a: Px, b: Px) {
  const cells = traverse(a, b);
  let sum = 0;
  for (const i of cells) {
    if (grid[i]) return Infinity;
    sum += cost[i];
  }
  return (sum / cells.length) * (Math.hypot(b.x - a.x, b.y - a.y) / CELL);
}

/**
 * Trajet de `from` à `to` (pieds, px de la grille), sans le point de départ.
 * Le dernier point est `to` s’il est libre et atteignable, sinon le point libre
 * atteignable le plus proche.
 */
export function findPath(from: Px, to: Px, extra: readonly RectPx[] = []): Px[] {
  const grid = blockedGrid(extra);
  const cost = costGrid(grid);
  const startCell = nearestFree(grid, from);
  const goalCell = nearestFree(grid, to);
  if (startCell < 0 || goalCell < 0) return [to];
  const { cells, g } = search(grid, cost, startCell, goalCell);
  const reached = cells.at(-1) === goalCell;
  // Points : départ exact (ou sa case libre), centres des cases, arrivée exacte.
  const zone = reachable(grid);
  const startFree = !!zone[cellOf(from).r * COLS + cellOf(from).c];
  const goalFree = reached && !!zone[cellOf(to).r * COLS + cellOf(to).c];
  const points: Px[] = [startFree ? from : centre(startCell), ...cells.slice(1, -1).map(centre)];
  points.push(goalFree ? to : centre(cells.at(-1)!));
  // Lissage : on saute des points tant que la ligne droite reste libre et ne
  // coûte pas plus que le trajet case par case (un chemin reste un chemin).
  const cum = points.map((_, k) => g[cells[Math.min(k, cells.length - 1)]]);
  const smooth: Px[] = [points[0]];
  let i = 0;
  while (i < points.length - 1) {
    let j = points.length - 1;
    for (; j > i + 1; j--) {
      const direct = segmentCost(grid, cost, points[i], points[j]);
      if (direct <= cum[j] - cum[i] + 0.25) break;
    }
    smooth.push(points[j]);
    i = j;
  }
  const out = smooth.slice(1);
  if (!startFree) out.unshift(points[0]);
  return dedupe(out);
}

function dedupe(points: Px[]) {
  return points.filter((p, i) => i === 0 || Math.hypot(p.x - points[i - 1].x, p.y - points[i - 1].y) > 0.01);
}

/** Longueur d’un trajet en px de la grille. */
export const pathLength = (from: Px, points: readonly Px[]) =>
  points.reduce((sum, p, i) => sum + Math.hypot(p.x - (i ? points[i - 1] : from).x, p.y - (i ? points[i - 1] : from).y), 0);
