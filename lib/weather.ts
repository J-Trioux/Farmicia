import type { Game } from './game.ts';
import { seasonFor } from './terres.ts';

/**
 * 0.33.0 — Une météo qui compte.
 *
 * Le ciel change toutes les 20 minutes, dans l’ordre soleil, pluie, brume,
 * lumière dorée (décalé par partie). Jusqu’à la 0.32, il n’était qu’un décor.
 * Chaque temps a désormais un effet de jeu, simple et lisible :
 * - soleil doux : les plantations poussent 10 % plus vite ;
 * - pluie légère (neige l’hiver) : les cultures en terre sont arrosées ;
 * - brume claire : on travaille au frais, +10 % d’XP sur les récoltes ;
 * - lumière dorée : plus de belles récoltes (+8 points de chance).
 */
export const WEATHER = [
  { id: 'soleil', icon: '☀', label: 'Soleil doux' },
  { id: 'pluie', icon: '☂', label: 'Pluie légère' },
  { id: 'brume', icon: '≈', label: 'Brume claire' },
  { id: 'doree', icon: '✦', label: 'Lumière dorée' },
] as const;
export type WeatherId = (typeof WEATHER)[number]['id'];

/** Durée d’un temps (ms). */
export const WEATHER_PERIOD_MS = 1_200_000;
/** Soleil doux : multiplicateur de la durée de pousse des plantations. */
export const SUN_GROWTH = 0.9;
/** Brume claire : multiplicateur de l’XP des récoltes. */
export const MIST_XP = 1.1;
/** Lumière dorée : chance de belle récolte en plus. */
export const GOLDEN_QUALITY = 0.08;

/** Effet de chaque temps, tel qu’il s’affiche (pixel = icône de la planche B). */
export const WEATHER_EFFECTS: Record<string, string> = {
  soleil: 'Les plantations poussent 10 % plus vite.',
  pluie: 'La pluie arrose toutes les cultures en terre.',
  neige: 'La neige fond sur les parcelles et arrose les cultures.',
  brume: 'On travaille au frais : +10 % d’XP sur les récoltes.',
  doree: 'Plus de belles récoltes.',
};

export function weatherFor(game: Pick<Game, 'created' | 'weatherSeed' | 'season'>, now: number): { id: WeatherId; icon: string; label: string; pixel: string } {
  const cycle = Math.floor((now - game.created) / WEATHER_PERIOD_MS);
  const weather = WEATHER[Math.abs(game.weatherSeed + cycle) % WEATHER.length];
  // 0.9.5 : en hiver, la pluie tombe en neige.
  if (weather.id === 'pluie' && seasonFor(game.season?.index ?? 0).id === 'hiver')
    return { ...weather, icon: '❄', label: 'Neige légère', pixel: 'neige' };
  return { ...weather, pixel: weather.id };
}

/** Fin du temps en cours (ms). */
export function weatherEnds(game: Pick<Game, 'created'>, now: number) {
  return game.created + (Math.floor((now - game.created) / WEATHER_PERIOD_MS) + 1) * WEATHER_PERIOD_MS;
}

/** Le temps qui suivra le temps en cours. */
export function nextWeather(game: Pick<Game, 'created' | 'weatherSeed' | 'season'>, now: number) {
  return weatherFor(game, weatherEnds(game, now));
}
