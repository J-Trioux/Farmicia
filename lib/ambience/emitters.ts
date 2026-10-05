/**
 * Ambiance de la carte (0.5.5) : logique pure, sans DOM.
 *
 * Les coordonnées sont en pixels de la grille de la carte (1 200 × 800) ; le moteur
 * les met à l’échelle au dessin. Tout ce qui est ici est testable.
 */
import type { DayPhase } from '../farm-visuals.ts';

import { AMBIENCE, WORLD_H, WORLD_W } from '../world.ts';

/** 0.12 : grille de la grande carte (1 200 × 800), relevés dans lib/world.ts. */
export const MAP_W = WORLD_W;
export const MAP_H = WORLD_H;
/** Budget : jamais plus de particules actives que ce nombre. */
export const MAX_PARTICLES = 150;

export type Rect = { x: number; y: number; w: number; h: number };
/** Zones relevées sur la grande carte (pixels de la grille). */
export const ZONES = {
  map: { x: 0, y: 0, w: MAP_W, h: MAP_H },
  pond: AMBIENCE.pond,
  lavender: AMBIENCE.lavender,
  coopYard: AMBIENCE.coopYard,
  garden: AMBIENCE.garden,
  meadow: AMBIENCE.meadow,
} as const satisfies Record<string, Rect>;
/** Cheminées du mas (sommet du conduit). */
export const CHIMNEYS = AMBIENCE.chimneys;
/** Lumières peintes : lanterne du mas, lampadaire de la grange, mât de la fête. */
export const LAMPS = AMBIENCE.lamps;
/** Fenêtres du mas qui s’éclairent le soir. */
export const WINDOWS = AMBIENCE.windows;

export type ParticleKind =
  | 'rain'
  | 'splash'
  | 'firefly'
  | 'bee'
  | 'leaf'
  | 'smoke'
  | 'dust'
  | 'sprout'
  | 'sparkle'
  | 'snow'
  | 'petal';

export type Emitter = {
  kind: ParticleKind;
  /** Particules créées par seconde. */
  rate: number;
  /** Nombre maximal de particules vivantes de ce type. */
  max: number;
  area: Rect;
};

export type AmbienceContext = {
  phase: DayPhase;
  weather: string;
  coop: boolean;
  /** 0.9.5 : saison de la ferme (printemps, ete, automne, hiver). */
  season?: string;
};

const dark = (phase: DayPhase) => phase === 'evening' || phase === 'night';

/** Émetteurs actifs selon l’heure, la météo, la saison et la ferme. */
export function ambientEmitters(ctx: AmbienceContext): Emitter[] {
  const winter = ctx.season === 'hiver';
  const rain = ctx.weather === 'pluie';
  const list: Emitter[] = [];
  // En hiver, la pluie tombe en neige, plus lente et plus rare.
  if (rain && winter) list.push({ kind: 'snow', rate: 22, max: 70, area: ZONES.map });
  else if (rain) list.push({ kind: 'rain', rate: 70, max: 80, area: ZONES.map });
  else if (winter) list.push({ kind: 'snow', rate: 6, max: 24, area: ZONES.map });
  if (dark(ctx.phase)) {
    if (!winter) {
      list.push({
        kind: 'firefly',
        rate: 3,
        max: rain ? 6 : 14,
        area: ZONES.pond,
      });
      list.push({
        kind: 'firefly',
        rate: 2,
        max: rain ? 4 : 10,
        area: ZONES.lavender,
      });
    }
  } else if (!rain && !winter && ctx.phase !== 'dawn') {
    list.push({ kind: 'bee', rate: 2, max: 8, area: ZONES.lavender });
  }
  if (!rain && !winter && !dark(ctx.phase))
    list.push({ kind: 'leaf', rate: ctx.season === 'automne' ? 1.2 : 0.5, max: ctx.season === 'automne' ? 18 : 10, area: ZONES.meadow });
  if (!rain && ctx.season === 'printemps' && !dark(ctx.phase))
    list.push({ kind: 'petal', rate: 1.5, max: 12, area: ZONES.meadow });
  // L’hiver, les cheminées fument davantage.
  const smoky = dark(ctx.phase) || winter;
  list.push(
    ...CHIMNEYS.map((c) => ({
      kind: 'smoke' as const,
      rate: smoky ? 2.4 : 1.2,
      max: smoky ? 9 : 5,
      area: { x: c.x - 1, y: c.y - 1, w: 2, h: 2 },
    })),
  );
  return list;
}

/** Papillons visibles : de jour et sans pluie, entre 4 et 6 ; aucun l’hiver, moins l’automne. */
export function butterflyCount(ctx: AmbienceContext, seed = 0) {
  if (ctx.weather === 'pluie' || dark(ctx.phase) || ctx.season === 'hiver') return 0;
  const n = 4 + (Math.abs(Math.floor(seed)) % 3);
  return ctx.season === 'automne' ? n - 2 : n;
}
/** Poules en promenade, seulement si le poulailler est acheté. */
export function henCount(ctx: AmbienceContext) {
  return ctx.coop ? 3 : 0;
}

export type Particle = {
  kind: ParticleKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  size: number;
  seed: number;
};

/**
 * Réserve de particules à taille fixe : aucune allocation pendant
 * l’animation, et jamais plus de MAX_PARTICLES actives.
 */
export class ParticlePool {
  readonly items: Particle[];
  active = 0;
  readonly counts = new Map<ParticleKind, number>();
  readonly capacity: number;
  constructor(capacity = MAX_PARTICLES) {
    this.capacity = capacity;
    this.items = Array.from({ length: capacity }, () => ({
      kind: 'dust' as ParticleKind,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      age: 0,
      life: 0,
      size: 1,
      seed: 0,
    }));
  }
  count(kind: ParticleKind) {
    return this.counts.get(kind) || 0;
  }
  /** Renvoie une particule libre, ou null si le budget est atteint. */
  spawn(kind: ParticleKind): Particle | null {
    if (this.active >= this.capacity) return null;
    const p = this.items[this.active++];
    p.kind = kind;
    p.age = 0;
    this.counts.set(kind, this.count(kind) + 1);
    return p;
  }
  /** Retire la particule d’index i (échange avec la dernière active). */
  kill(i: number) {
    const p = this.items[i];
    this.counts.set(p.kind, this.count(p.kind) - 1);
    const last = this.items[--this.active];
    this.items[this.active] = p;
    this.items[i] = last;
  }
  clear() {
    this.active = 0;
    this.counts.clear();
  }
}

/** Générateur pseudo-aléatoire déterministe (mulberry32). */
export function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
