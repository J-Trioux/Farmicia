/**
 * 0.33.0 — La gazette du matin et les demandes du jour.
 *
 * Chaque jour (date locale), le village pose trois petites demandes à Rosalie,
 * choisies parmi ce que la partie permet déjà : récolter une culture, arroser,
 * soigner la qualité, livrer des commandes, cuisiner, ramasser les œufs.
 * Elles se font en jouant normalement, se comptent toutes seules et paient
 * dès qu’elles sont faites. Rien n’est perdu si on ne les fait pas : le
 * lendemain, trois nouvelles demandes les remplacent.
 */
import { CROPS } from './crops.ts';

export type DailyKind = 'harvestCrop' | 'water' | 'quality' | 'order' | 'cook' | 'eggs';
export type DailyRequest = {
  kind: DailyKind;
  /** Culture demandée (harvestCrop). */
  crop?: string;
  target: number;
  count: number;
  done?: boolean;
  coins: number;
  xp: number;
};
export type DailyState = {
  /** Jour local AAAA-MM-JJ. */
  day: string;
  requests: DailyRequest[];
  /** La gazette du jour a été lue. */
  read?: boolean;
  /** Bilan de la veille (ou du dernier jour joué). */
  previous?: { day: string; done: number; total: number };
};
/** Ce qui fait avancer une demande (émis par la logique du jeu). */
export type DailyEvent =
  | { kind: 'harvest'; crop: string; quality: string; amount: number }
  | { kind: 'cook' }
  | { kind: 'order' }
  | { kind: 'water'; amount: number }
  | { kind: 'eggs' };

/** Ce que la partie permet, pour choisir des demandes faisables. */
export type DailyContext = {
  seed: number;
  level: number;
  plots: number;
  workshop: boolean;
  coop: boolean;
  reward: { coins: number; xp: number };
};

/** Cultures assez rapides pour une demande du jour (15 minutes au plus). */
export const DAILY_CROP_MAX_SECONDS = 900;
/** Part du palier de niveau payée par demande (XP, pièces). */
export const DAILY_XP_SHARE = 0.01;
export const DAILY_COIN_SHARE = 0.03;

/** Jour local (AAAA-MM-JJ) d’un instant. */
export function dayKey(now: number) {
  const d = new Date(now);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}
/** Tirage reproductible : le même jour donne les mêmes demandes. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, Math.round(value)));

export function makeDaily(day: string, ctx: DailyContext): DailyRequest[] {
  const random = rng(hash(day) ^ ctx.seed);
  const crops = CROPS.filter((c) => c.level <= ctx.level && c.time <= DAILY_CROP_MAX_SECONDS).map((c) => c.id);
  const pick = <T,>(list: T[]) => list[Math.floor(random() * list.length) % list.length];
  const base = { count: 0, coins: ctx.reward.coins, xp: ctx.reward.xp };
  const requests: DailyRequest[] = [
    { ...base, kind: 'harvestCrop', crop: pick(crops.length ? crops : ['radis']), target: clamp(ctx.plots * 1.5, 4, 30) },
  ];
  const pool: DailyRequest[] = [
    { ...base, kind: 'water', target: clamp(ctx.plots * 2, 4, 30) },
    { ...base, kind: 'order', target: ctx.level >= 12 ? 3 : 2 },
  ];
  if (ctx.level >= 2) pool.push({ ...base, kind: 'quality', target: clamp(ctx.plots * 0.6, 2, 10) });
  if (ctx.workshop) pool.push({ ...base, kind: 'cook', target: ctx.level >= 15 ? 3 : 2 });
  if (ctx.coop) pool.push({ ...base, kind: 'eggs', target: 2 });
  while (requests.length < 3 && pool.length) requests.push(pool.splice(Math.floor(random() * pool.length) % pool.length, 1)[0]);
  return requests;
}

/** Une demande avance-t-elle avec cet évènement ? De combien ? */
export function dailyGain(request: DailyRequest, event: DailyEvent) {
  switch (request.kind) {
    case 'harvestCrop':
      return event.kind === 'harvest' && event.crop === request.crop ? event.amount : 0;
    case 'quality':
      return event.kind === 'harvest' && event.quality !== 'ordinaire' ? event.amount : 0;
    case 'water':
      return event.kind === 'water' ? event.amount : 0;
    case 'order':
      return event.kind === 'order' ? 1 : 0;
    case 'cook':
      return event.kind === 'cook' ? 1 : 0;
    case 'eggs':
      return event.kind === 'eggs' ? 1 : 0;
  }
}

/** Pluriels des cultures des demandes du jour. */
const PLURALS: Record<string, string> = {
  radis: 'radis', carotte: 'carottes', salade: 'salades', ble: 'gerbes de blé', tomate: 'tomates',
  fraise: 'fraises', mais: 'épis de maïs', aubergine: 'aubergines', myrtille: 'myrtilles',
  citrouille: 'citrouilles', raisin: 'grappes de raisin', melon: 'melons',
};
/** Libellé d’une demande, au présent (« Récolter 6 carottes »). */
export function dailyLabel(request: DailyRequest, cropName: (id: string) => string) {
  const n = request.target;
  switch (request.kind) {
    case 'harvestCrop': {
      const id = request.crop || 'radis';
      return `Récolter ${n} ${PLURALS[id] ?? cropName(id).toLowerCase()}`;
    }
    case 'water':
      return `Arroser ${n} cultures`;
    case 'quality':
      return `Récolter ${n} produits de belle qualité ou mieux`;
    case 'order':
      return `Livrer ${n} commandes du village`;
    case 'cook':
      return `Cuisiner ${n} plats à l’atelier`;
    case 'eggs':
      return `Ramasser les œufs ${n} fois`;
  }
}

/** Icône d’une demande (planches HD). */
export function dailyIcon(request: DailyRequest) {
  switch (request.kind) {
    case 'harvestCrop': return request.crop || 'radis';
    case 'water': return 'arrosoir';
    case 'quality': return 'etoile';
    case 'order': return 'commande';
    case 'cook': return 'casserole';
    case 'eggs': return 'oeuf';
  }
}

/** Relecture prudente d’une sauvegarde (absent avant la 0.33 : rien). */
export function normalizeDaily(raw: unknown, cropExists: (id: string) => boolean): DailyState | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const value = raw as Record<string, unknown>;
  if (typeof value.day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value.day) || !Array.isArray(value.requests)) return undefined;
  const kinds: DailyKind[] = ['harvestCrop', 'water', 'quality', 'order', 'cook', 'eggs'];
  const requests = value.requests.slice(0, 3).flatMap((entry): DailyRequest[] => {
    if (!entry || typeof entry !== 'object') return [];
    const r = entry as Record<string, unknown>;
    const num = (v: unknown, max: number) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.min(max, Math.floor(v)) : 0);
    if (!kinds.includes(r.kind as DailyKind)) return [];
    if (r.kind === 'harvestCrop' && (typeof r.crop !== 'string' || !cropExists(r.crop))) return [];
    const target = Math.max(1, num(r.target, 100));
    return [{
      kind: r.kind as DailyKind,
      ...(r.kind === 'harvestCrop' ? { crop: r.crop as string } : {}),
      target,
      count: Math.min(target, num(r.count, 100)),
      ...(r.done === true ? { done: true } : {}),
      coins: num(r.coins, 1_000_000),
      xp: num(r.xp, 1_000_000),
    }];
  });
  const previous = value.previous && typeof value.previous === 'object' ? value.previous as Record<string, unknown> : null;
  return {
    day: value.day,
    requests,
    ...(value.read === true ? { read: true } : {}),
    ...(previous && typeof previous.day === 'string' && Number.isInteger(previous.done) && Number.isInteger(previous.total)
      ? { previous: { day: previous.day, done: Math.max(0, Math.min(3, previous.done as number)), total: Math.max(0, Math.min(3, previous.total as number)) } }
      : {}),
  };
}
