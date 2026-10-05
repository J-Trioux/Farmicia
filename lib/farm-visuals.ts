import type { Game, Plot } from './game.ts';
import { seasonFor } from './terres.ts';

export const CROP_ATLAS_ROWS: Record<string, number> = {
  radis: 0,
  carotte: 1,
  salade: 2,
  ble: 3,
  tomate: 4,
  fraise: 5,
  mais: 6,
  aubergine: 7,
  myrtille: 8,
  citrouille: 9,
  raisin: 10,
  melon: 11,
};

export const WEATHER = [
  { id: 'soleil', icon: '☀', label: 'Soleil doux' },
  { id: 'pluie', icon: '☂', label: 'Pluie légère' },
  { id: 'brume', icon: '≈', label: 'Brume claire' },
  { id: 'doree', icon: '✦', label: 'Lumière dorée' },
] as const;

export const DAY_PHASES = [
  'dawn',
  'day',
  'golden',
  'evening',
  'night',
] as const;
export type DayPhase = (typeof DAY_PHASES)[number];
export const PHASE_LABELS: Record<DayPhase, string> = {
  dawn: 'Aube',
  day: 'Jour',
  golden: 'Heure dorée',
  evening: 'Soir',
  night: 'Nuit',
};
/** Début de chaque phase, en heures locales. */
const PHASE_STARTS: [DayPhase, number][] = [
  ['dawn', 5],
  ['day', 8],
  ['golden', 17],
  ['evening', 20],
  ['night', 22],
];
/** Fondu entre deux phases : 45 minutes de jeu avant le changement. */
export const PHASE_FADE_HOURS = 0.75;

export function hourOf(now: number) {
  const date = new Date(now);
  return date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
}
export function dayPhase(now: number): DayPhase {
  return phaseAtHour(hourOf(now));
}
export function phaseAtHour(hour: number): DayPhase {
  const h = ((hour % 24) + 24) % 24;
  let phase: DayPhase = 'night';
  for (const [id, start] of PHASE_STARTS) if (h >= start) phase = id;
  return phase;
}
/**
 * Phase courante, phase suivante et avancement du fondu (0 → 1) pendant les
 * PHASE_FADE_HOURS qui précèdent le changement : les transitions sont
 * continues au lieu de basculer d’un coup.
 */
export function phaseBlend(hour: number) {
  const h = ((hour % 24) + 24) % 24;
  const phase = phaseAtHour(h);
  const index = PHASE_STARTS.findIndex(([id]) => id === phase);
  const [next, nextStart] = PHASE_STARTS[(index + 1) % PHASE_STARTS.length];
  const until = (nextStart - h + 24) % 24;
  const t = until < PHASE_FADE_HOURS ? 1 - until / PHASE_FADE_HOURS : 0;
  return { phase, next, t: Math.round(t * 1000) / 1000 };
}
/** Intensité des lumières artificielles (lampadaires, fenêtres) de 0 à 1. */
export const LAMP_LEVEL: Record<DayPhase, number> = {
  dawn: 0.25,
  day: 0,
  golden: 0.45,
  evening: 1,
  night: 1,
};
/** Couleur du calque de multiplication et son opacité, par phase. */
export const PHASE_TINT: Record<DayPhase, { color: string; alpha: number }> = {
  dawn: { color: '#f2b8c6', alpha: 0.14 },
  day: { color: '#ffffff', alpha: 0 },
  golden: { color: '#ffb866', alpha: 0.14 },
  evening: { color: '#5b6fb8', alpha: 0.24 },
  night: { color: '#455577', alpha: 0.36 },
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
function hex(color: string) {
  const n = parseInt(color.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
/** Teinte et lumières interpolées à une heure donnée. */
export function lightingAt(hour: number) {
  const { phase, next, t } = phaseBlend(hour);
  const a = PHASE_TINT[phase],
    b = PHASE_TINT[next];
  const [r1, g1, b1] = hex(a.color),
    [r2, g2, b2] = hex(b.color);
  const rgb = [mix(r1, r2, t), mix(g1, g2, t), mix(b1, b2, t)].map(Math.round);
  return {
    phase,
    tint: `rgb(${rgb.join(' ')})`,
    tintAlpha: Math.round(mix(a.alpha, b.alpha, t) * 100) / 100,
    lamps: Math.round(mix(LAMP_LEVEL[phase], LAMP_LEVEL[next], t) * 100) / 100,
  };
}
/** Heure fictive associée à une phase, pour les captures en développement. */
export const PHASE_PREVIEW_HOUR: Record<DayPhase, number> = {
  dawn: 6.5,
  day: 12,
  golden: 18.5,
  evening: 21,
  night: 1,
};

export function weatherFor(game: Game, now: number): { id: string; icon: string; label: string; pixel: string } {
  const cycle = Math.floor((now - game.created) / 1_200_000);
  const weather = WEATHER[Math.abs(game.weatherSeed + cycle) % WEATHER.length];
  // 0.9.5 : en hiver, la pluie tombe en neige (décor seulement).
  if (weather.id === 'pluie' && seasonFor(game.season?.index ?? 0).id === 'hiver')
    return { ...weather, icon: '❄', label: 'Neige légère', pixel: 'season-hiver' };
  return { ...weather, pixel: weather.id };
}

export function plotStage(plot: Plot, now: number) {
  if (!plot) return 0;
  const progress = Math.max(
    0,
    Math.min(1, (now - plot.start) / Math.max(1, plot.end - plot.start)),
  );
  if (progress >= 1) return 4;
  if (progress >= 0.76) return 3;
  if (progress >= 0.42) return 2;
  if (progress >= 0.12) return 1;
  return 0;
}

export function plotProgress(plot: Plot, now: number) {
  if (!plot) return 0;
  return Math.max(
    0,
    Math.min(1, (now - plot.start) / Math.max(1, plot.end - plot.start)),
  );
}
