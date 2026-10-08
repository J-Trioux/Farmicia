import type { Game } from './game.ts';
import {
  AISLES_PX,
  GESTURE_FEET,
  GESTURE_SIDE,
  LANE_FEET,
  NODES,
  PLOT,
  POTAGER_DOORS,
  SPAWN,
  POTAGER,
  WORLD_H,
  WORLD_W,
  pct,
  plotRect,
  px,
  type NodeId,
  type RectPx,
} from './world.ts';
import { findPath } from './nav.ts';
export type Point = { x: number; y: number };
export type FarmIntent = { index: number; crop: string; lineageId?: number };
/**
 * 0.12 — La grande carte : toute la géométrie vient de lib/world.ts (grille de
 * 1 200 × 800). Les positions restent en % de la carte ; celles de Rosalie
 * sont celles de ses pieds.
 */
export const PLOT_COLUMNS = PLOT.columns;
/** Coin haut gauche d’une parcelle, en % : la parcelle se dessine vers le bas. */
export function plotPosition(index: number): Point {
  const r = plotRect(index);
  return pct({ x: r.x + r.w / 2, y: r.y });
}
/** Gestes sur une parcelle. */
export type PlotGesture = 'plant' | 'water' | 'harvest';
/**
 * Rosalie se place du côté qui la tourne vers la parcelle. Depuis 0.9.7, les
 * trois gestes des sprites (semer, arroser, récolter) sont tournés vers la
 * droite : elle se tient à gauche du plant, les pieds sur le bord de la terre.
 */
const FACES_RIGHT: ReadonlySet<PlotGesture> = new Set(['water', 'harvest', 'plant']);
export function approach(index: number, gesture: PlotGesture = 'plant'): Point {
  const r = plotRect(index);
  const centre = r.x + r.w / 2;
  // 0.32.6 : pour arroser, Rosalie se tient dans l’allée à gauche de la parcelle :
  // l’eau de son arrosoir (planche d’effet de l’eau) tombe alors sur la plante.
  if (gesture === 'water') return pct({ x: AISLES_PX[index % PLOT.columns], y: r.y + GESTURE_FEET });
  return pct({
    x: centre + (FACES_RIGHT.has(gesture) ? -GESTURE_SIDE : GESTURE_SIDE),
    y: r.y + GESTURE_FEET,
  });
}
const rowOf = (yPx: number) => Math.round((yPx - PLOT.top - GESTURE_FEET) / PLOT.dy);
const inGarden = (p: Point) => {
  const q = px(p);
  return q.x >= AISLES_PX[0] - 1 && q.x <= AISLES_PX[AISLES_PX.length - 1] + 1 &&
    q.y >= PLOT.top - 1 && q.y <= PLOT.top + (PLOT.capacity / PLOT.columns) * PLOT.dy + 1;
};
/** Point de l’allée juste devant un point de geste (le point lui-même sinon). */
export function laneOf(point: Point): Point {
  const q = px(point);
  const row = rowOf(q.y);
  const gestureY = PLOT.top + row * PLOT.dy + GESTURE_FEET;
  return row >= 0 && row < PLOT.capacity / PLOT.columns && Math.abs(q.y - gestureY) < 0.5 && inGarden(point)
    ? pct({ x: q.x, y: PLOT.top + row * PLOT.dy + LANE_FEET })
    : point;
}
/** Couloirs verticaux entre les colonnes de parcelles (et de part et d’autre), en %. */
export const AISLES = AISLES_PX.map((x) => pct({ x, y: 0 }).x);
const dedupe = (points: Point[]) =>
  points.filter((p, i) => i === 0 || p.x !== points[i - 1].x || p.y !== points[i - 1].y);
/** Trajet dans le potager : allées et couloirs, jamais à travers une parcelle. */
function gardenRoute(from: Point, to: Point): Point[] {
  const start = laneOf(from);
  const end = laneOf(to);
  const aisle = AISLES.reduce((best, a) =>
    Math.abs(start.x - a) + Math.abs(a - end.x) < Math.abs(start.x - best) + Math.abs(best - end.x) ? a : best,
  );
  const middle = Math.abs(start.y - end.y) < 0.05 ? [] : [{ x: aisle, y: start.y }, { x: aisle, y: end.y }];
  return [start, ...middle, end, to];
}
/** Portes de la clôture (rangées 1 et 3) : seuil dehors et point dans l’allée. */
const DOORS = POTAGER_DOORS.map((door) => ({
  outside: pct(door.outside),
  inside: pct({ x: AISLES_PX[0], y: door.outside.y }),
}));
const nodePoint = (id: NodeId) => pct(NODES[id]);
const length = (points: Point[]) =>
  points.slice(1).reduce((sum, p, i) => sum + Math.hypot(((p.x - points[i].x) * WORLD_W) / 100, ((p.y - points[i].y) * WORLD_H) / 100), 0);
/** 0.16 : marche libre hors du potager, sur la carte de marche (lib/nav.ts). */
const walkOutside = (from: Point, to: Point, obstacles: readonly RectPx[]) =>
  findPath(px(from), px(to), obstacles).map(pct);
/**
 * Trajet complet entre deux points (pieds) : allées du potager, porte de la
 * clôture la plus commode, puis marche libre sur la carte, sans traverser ni
 * bâtiment, ni muret, ni clôture, ni arbre, ni eau (0.16), ni les objets posés
 * (`obstacles`, emprises au sol en px de la grille).
 */
export function route(from: Point, to: Point, obstacles: readonly RectPx[] = []): Point[] {
  const a = inGarden(from);
  const b = inGarden(to);
  if (a && b) return dedupe([from, ...gardenRoute(from, to)]).slice(1);
  let best: Point[] = [];
  for (const out of a ? DOORS : [null])
    for (const back of b ? DOORS : [null]) {
      const start = out ? out.outside : from;
      const end = back ? back.outside : to;
      const points = dedupe([
        from,
        ...(out ? [...gardenRoute(from, out.inside).slice(0, -1), out.inside, out.outside] : []),
        ...walkOutside(start, end, obstacles),
        ...(back ? [back.outside, back.inside, ...gardenRoute(back.inside, to).slice(1)] : []),
      ]);
      if (!best.length || length(points) < length(best)) best = points;
    }
  return best.slice(1);
}
/**
 * 0.16 : point visé par un clic sur la carte. Dans le potager clos, Rosalie
 * rejoint l’allée la plus proche (jamais une parcelle) ; ailleurs, le point
 * lui-même (la marche s’arrête au plus près s’il est bloqué).
 */
export function groundTarget(point: Point): Point {
  const q = px(point);
  const inside = q.x >= POTAGER.x && q.x <= POTAGER.x + POTAGER.w && q.y >= POTAGER.y && q.y <= POTAGER.y + POTAGER.h;
  if (!inside) return point;
  const rows = PLOT.capacity / PLOT.columns;
  const lanes = Array.from({ length: rows }, (_, row) => PLOT.top + row * PLOT.dy + LANE_FEET);
  const y = lanes.reduce((best, lane) => (Math.abs(lane - q.y) < Math.abs(best - q.y) ? lane : best));
  const x = Math.min(AISLES_PX[AISLES_PX.length - 1], Math.max(AISLES_PX[0], q.x));
  return pct({ x, y });
}
/** 0.9.9 : lieux où Rosalie se rend pour ses courses (pieds, en % de la carte). */
export const PLACES = {
  atelier: nodePoint('atelier'),
  poulailler: nodePoint('poulailler'),
  verger: nodePoint('verger'),
  fete: nodePoint('fete'),
} as const satisfies Record<string, Point>;
export type PlaceId = keyof typeof PLACES;
/** Trajet vers un lieu hors du potager (même réseau de chemins). */
export function placeRoute(from: Point, to: Point, obstacles: readonly RectPx[] = []): Point[] {
  return route(from, to, obstacles);
}
/** Point de départ de Rosalie (pieds, en %). */
export const HOME: Point = pct(SPAWN);
export function direction(a: Point, b: Point) {
  return Math.abs(b.x - a.x) > Math.abs(b.y - a.y)
    ? b.x < a.x
      ? 'left'
      : 'right'
    : b.y < a.y
      ? 'up'
      : 'down';
}
/** 0.10 : paliers visuels des lieux sur 25 niveaux. */
export const ZONE_LEVELS = {
  workshopFoundation: 6,
  orchardCleaned: 9,
  orchardRestored: 15,
  orchardFruit: 21,
  greenhouseFoundation: 21,
  greenhouseBuilt: 25,
} as const;
export function zoneStates(g: Game, level: number) {
  const Z = ZONE_LEVELS;
  return {
    workshop: g.upgrades.includes('workshop')
      ? 'built'
      : level >= Z.workshopFoundation
        ? 'foundation'
        : 'empty',
    coop: g.upgrades.includes('coop') ? 'built' : 'empty',
    orchard:
      level >= Z.orchardFruit
        ? 'productive'
        : level >= Z.orchardRestored
          ? 'restored'
          : level >= Z.orchardCleaned
            ? 'cleaned'
            : 'abandoned',
    greenhouse: level >= Z.greenhouseBuilt ? 'built' : level >= Z.greenhouseFoundation ? 'foundation' : 'wild',
  } as const;
}
export class ActionQueue<T> {
  private items: T[] = [];
  private active = false;
  private cancelled = false;
  private readonly execute: (item: T) => Promise<void>;
  private readonly changed: (n: number) => void;
  constructor(
    execute: (item: T) => Promise<void>,
    changed: (n: number) => void = () => {},
  ) {
    this.execute = execute;
    this.changed = changed;
  }
  enqueue(item: T) {
    if (this.cancelled) return;
    this.items.push(item);
    this.changed(this.items.length);
    void this.drain();
  }
  /** 0.20 : passe devant la file (bêcher les nouvelles parcelles, fêter un niveau). */
  first(...items: T[]) {
    if (this.cancelled) return;
    this.items.unshift(...items);
    this.changed(this.items.length);
    void this.drain();
  }
  /** Retire de l’attente les actions qui répondent au critère (0.16 : marches libres remplacées). */
  drop(match: (item: T) => boolean) {
    const before = this.items.length;
    this.items = this.items.filter((item) => !match(item));
    if (this.items.length !== before) this.changed(this.items.length);
  }
  cancel() {
    this.cancelled = true;
    this.items = [];
    this.changed(0);
  }
  get pending() {
    return this.items.length;
  }
  /** Vrai tant qu’une action est en cours ou en attente. */
  get busy() {
    return this.active || this.items.length > 0;
  }
  private async drain() {
    if (this.active) return;
    this.active = true;
    try {
      while (!this.cancelled && this.items.length) {
        const item = this.items.shift()!;
        this.changed(this.items.length);
        try { await this.execute(item); }
        catch (error) { console.error('Une action de Rosalie a échoué.', error); }
      }
    } finally {
      this.active = false;
    }
  }
}
/** Vitesse de marche de Rosalie, en pixels de la grille (1 200 × 800) par seconde. */
export const WALK_SPEED = 190;
/** Un trajet ne dure jamais plus que ceci : au-delà, Rosalie presse le pas. */
export const WALK_MAX_SECONDS = 1.1;
const NATIVE_W = WORLD_W;
const NATIVE_H = WORLD_H;
/**
 * Trajet interpolé à vitesse constante entre des points exprimés en % de la
 * carte. `at(t)` renvoie la position et la direction à l’instant t (secondes).
 */
export function routeTimeline(
  points: Point[],
  speed = WALK_SPEED,
  maxSeconds = WALK_MAX_SECONDS,
) {
  const segments = points.slice(1).map((to, i) => {
    const from = points[i];
    const length = Math.hypot(
      ((to.x - from.x) / 100) * NATIVE_W,
      ((to.y - from.y) / 100) * NATIVE_H,
    );
    return { from, to, length };
  });
  const total = segments.reduce((sum, s) => sum + s.length, 0);
  const pace = total / speed > maxSeconds ? total / maxSeconds : speed;
  const duration = total / pace;
  return {
    duration,
    distance: total,
    at(t: number): Point & { dir: ReturnType<typeof direction> } {
      let travelled = Math.max(0, Math.min(duration, t)) * pace;
      for (const s of segments) {
        if (travelled <= s.length || s === segments.at(-1)) {
          const k = s.length ? Math.min(1, travelled / s.length) : 1;
          return {
            x: s.from.x + (s.to.x - s.from.x) * k,
            y: s.from.y + (s.to.y - s.from.y) * k,
            dir: direction(s.from, s.to),
          };
        }
        travelled -= s.length;
      }
      const last = points.at(-1)!;
      return { ...last, dir: 'down' };
    },
  };
}
