/**
 * 0.9.5 — L’Allant de Rosalie : sa vitesse de marche progresse avec la ferme.
 * Proposé par l’audit 0.5.3 et repris par l’audit 0.9.0 (point 7).
 *
 * allant = BASE × niveau × sentiers × habitude × second souffle, plafonné.
 * Les vitesses sont en pixels de la grille de la carte (1 200 × 800) par seconde (0.12).
 */
import { buffActive, gestureMs, level, upgradeTier, type BulkKind, type Game } from './game.ts';
import { approach, route, routeTimeline, type Point } from './farm-controls.ts';
import { POTAGER, WORLD_W } from './world.ts';

/**
 * Niveau 1, sans rien : 75 px/s, soit environ 6 % de la largeur de la grande carte
 * par seconde (0.32.2 : 120 avant, Rosalie courait). Elle gagne ensuite en allant
 * avec le niveau, les sentiers, l’habitude et le Second souffle (×2,3 au plus).
 */
export const ALLANT_BASE = 75;
/** 0.10 : +2,1 % par niveau : ×1,5 au niveau 25 (comme au niveau 12 avant). */
export const ALLANT_PER_LEVEL = 0.5 / 24;
export const ALLANT_PATHS = 1.15;
export const ALLANT_SOUFFLE = 1.2;
/** Habitude du potager : +4 % à 150, 600 puis 1 500 récoltes. */
export const HABIT_STEPS = [150, 600, 1500];
export const ALLANT_HABIT = 0.04;
/** Maximum réellement atteignable, sans changer les facteurs de vitesse. */
export const ALLANT_MAX = ALLANT_BASE * 1.5 * ALLANT_PATHS * (1 + ALLANT_HABIT * HABIT_STEPS.length) * ALLANT_SOUFFLE;
/** Largeur du potager (4 colonnes), en % de la largeur de la carte. */
const GARDEN_WIDTH = (POTAGER.w / WORLD_W) * 100;
const NATIVE_W = WORLD_W;

export function habitRank(g: Game) {
  return HABIT_STEPS.filter((n) => g.harvests >= n).length;
}

export function allantSources(g: Game, now?: number) {
  const lv = level(g);
  return [
    { id: 'base', label: 'Pas de départ', factor: 1 },
    { id: 'level', label: `Niveau ${lv}`, factor: 1 + ALLANT_PER_LEVEL * (lv - 1) },
    { id: 'paths', label: 'Sentiers de gravier', factor: g.upgrades.includes('paths') ? ALLANT_PATHS : 1 },
    { id: 'habit', label: `Habitude du potager · ${habitRank(g)}/3`, factor: 1 + ALLANT_HABIT * habitRank(g) },
    { id: 'souffle', label: 'Second souffle', factor: buffActive(g, 'souffle', now) ? ALLANT_SOUFFLE : 1 },
  ];
}

/** Vitesse de marche de Rosalie, en pixels de la grille par seconde. */
export function allant(g: Game, now?: number) {
  const speed = allantSources(g, now).reduce((v, s) => v * s.factor, ALLANT_BASE);
  return Math.min(ALLANT_MAX, speed);
}

/**
 * 0.32.2 : plus de plafond de durée. Avant, un trajet ne dépassait jamais
 * 1,5 s : quand Rosalie était loin de la parcelle cliquée, elle filait à
 * plusieurs fois sa vitesse pour arriver à temps. Elle marche maintenant
 * toujours à son allant, quelle que soit la distance.
 */
export function allantMaxSeconds(_speed: number) {
  return Infinity;
}
/**
 * 0.12 : les courses hors du potager (atelier, poulailler, verger, fête)
 * traversent la grande carte : leur plafond est doublé, pour que Rosalie
 * marche au lieu de filer. Les trajets dans le potager ne changent pas.
 */
export const ERRAND_MAX_FACTOR = 2;

/**
 * 0.32.3 : l’élan des tournées. Pendant « tout récolter », « tout arroser » ou
 * « tout semer », Rosalie enchaîne les parcelles d’un pas plus vif : +20 %, puis
 * +6 % par palier de l’outil de la tournée (outils, arrosoir, semis en série),
 * soit +50 % au palier 5. Les clics un par un gardent son allant normal.
 */
export const ELAN_BASE = 1.2;
export const ELAN_PER_TIER = 0.06;
const ELAN_TOOL: Record<BulkKind, 'tools' | 'watering-can' | 'auto'> = { harvest: 'tools', water: 'watering-can', sow: 'auto' };
export function bulkElan(g: Game, kind: BulkKind) {
  return ELAN_BASE + ELAN_PER_TIER * upgradeTier(g, ELAN_TOOL[kind]);
}

/** Durée d’un pas (une image de marche), liée à la vitesse : les pieds suivent le sol. */
export function stepSeconds(speed: number) {
  return Math.min(0.34, Math.max(0.16, (0.3 * ALLANT_BASE) / speed));
}

/** En % de la largeur de la carte par seconde, pour l’affichage. */
export const allantPercent = (speed: number) => (speed / NATIVE_W) * 100;

/** Temps pour traverser le potager d’un bout à l’autre. */
export const gardenCrossing = (speed: number) =>
  ((GARDEN_WIDTH / 100) * NATIVE_W) / speed;

/**
 * 0.9.9 : durée d’un trajet de Rosalie (points en % de la carte, départ compris),
 * à son Allant du moment. Même calcul que la marche affichée sur la carte.
 */
export function travelSeconds(g: Game, points: Point[], now?: number, errand = false, boost = 1) {
  if (points.length < 2) return 0;
  const speed = allant(g, now) * boost;
  return routeTimeline(points, speed, allantMaxSeconds(speed) * (errand ? ERRAND_MAX_FACTOR : 1)).duration;
}
const GESTURE_OF: Record<BulkKind, 'plant' | 'water' | 'harvest'> = { sow: 'plant', water: 'water', harvest: 'harvest' };
/**
 * 0.9.9 : durée d’un geste groupé, marche comprise : Rosalie va de parcelle en
 * parcelle comme si le joueur cliquait sur chacune.
 */
export function bulkSeconds(g: Game, kind: BulkKind, targets: number[], from: Point, now?: number) {
  let position = from;
  let total = 0;
  for (const index of targets) {
    const to = approach(index, GESTURE_OF[kind]);
    total += travelSeconds(g, [position, ...route(position, to)], now, false, bulkElan(g, kind)) + gestureMs(g, kind) / 1000;
    position = to;
  }
  return total;
}
