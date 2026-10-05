import { CROPS } from './crops.ts';
import { REGIONS, VALLEY_PROJECT_TARGET, VALLEY_TOURS, tourOf, tourMinimum, type TourId, freshValley, normalizeValley, valleyCapacity, cargoLimit, valleyPreview, cargoSignature, type RegionId, type ValleyState } from './valley.ts';
export { REGIONS, VALLEY_PROJECT_TARGET, VALLEY_TOURS, tourOf, tourMinimum, type TourId, valleyCapacity, cargoLimit, valleyPreview, type RegionId, type ValleyState } from './valley.ts';
import { TRAITS, TERROIRS, AMENDMENTS, candidateOptions, freshSeason, lineageGrowFactor,
  normalizeLineages, normalizeSeedFinds, normalizeSeason, seasonFor, terroirForPlot, terroirGrowFactor,
  type TraitId, type TerroirId, type Lineage, type SeedFind, type LivingSeason,
  type FairBreakdown } from './terres.ts';
export { TRAITS, TERROIRS, AMENDMENTS, SEASONS, seasonFor, terroirForPlot,
  type TraitId, type TerroirId, type Lineage, type SeedFind, type LivingSeason,
  type FairRecord, type FairBreakdown } from './terres.ts';
import { LINKS, SKILL_PATHS, FESTIVAL_THEMES, type SkillPath } from './village.ts';
export { LINKS, SKILL_PATHS, FESTIVAL_THEMES, type SkillPath } from './village.ts';
import {
  calculateFestivalScore,
  festivalLeadJudge,
  festivalReactions,
  freshFestival,
  normalizeFestival,
  type FestivalJudgeId,
  type FestivalState,
} from './festival.ts';
import {
  DISH_EFFECTS,
  DISH_EFFECT_IDS,
  EFFECT_CAP_MINUTES,
  EFFECT_MINUTES,
  ORCHARD_DELAY,
  PROJECTS,
  RECIPE_COURSES,
  freshProjects,
  normalizeProjects,
  type Course,
  type DishEffectId,
  type MenuLine,
  type ProjectReward,
  type ProjectState,
  type ProjectStep,
  type VillageProject,
} from './projects.ts';
import { isSupportedSaveVersion, SAVE_VERSION } from './save-schema.ts';
import {
  DONATION_PROJECT, EMBELLISHMENTS, MILLED, POLLINATED, donationCost, donationSouvenir, donationTitle,
  embellishment, embellishmentStage, embellishmentValue, type EmbellishmentId,
} from './embellishments.ts';
import { CELLAR_INGREDIENTS, restoration, restorationDouble, restorationStage, restorationValue, RESTORATIONS, type RestorationId } from './restorations.ts';
export { RESTORATIONS, restorationStage, restorationValue, type RestorationId } from './restorations.ts';
export { EMBELLISHMENTS, donationCost, donationSouvenir, donationTitle, embellishmentStage, embellishmentValue, type EmbellishmentId } from './embellishments.ts';
import { SEASON_MIN_MS } from './terres.ts';
import { CHORE_FEEDS, nearestChore, plotWalk, pointWalk } from './chores.ts';
import { POTAGER_DOORS, WORLD_H, WORLD_W } from './world.ts';
import { freshTutorial, normalizeTutorial, settledTutorial, type TutorialState } from './tutorial.ts';
export { CROPS } from './crops.ts';
export {
  COURSE_NAMES,
  DISH_EFFECTS,
  DISH_EFFECT_IDS,
  EFFECT_MINUTES,
  ORCHARD_DELAY,
  PROJECTS,
  RECIPE_COURSES,
  freshProjects,
  type Course,
  type DishEffectId,
  type MenuLine,
  type ProjectReward,
  type ProjectState,
  type ProjectStep,
  type VillageProject,
} from './projects.ts';
export {
  FESTIVAL_AWARDS,
  FESTIVAL_JUDGE_IDS,
  festivalAward,
  freshFestival,
  type FestivalAwardId,
  type FestivalEntry,
  type FestivalJudgeId,
  type FestivalReaction,
  type FestivalScore,
  type FestivalState,
} from './festival.ts';
export type Recipe = {
  id: string;
  name: string;
  icon: string;
  needs: Record<string, number>;
  price: number;
  time: number;
  level: number;
  parent?: string;
  friend?: string;
  project?: string;
  valley?: RegionId;
  reputation?: number;
};
export const RECIPES: Recipe[] = [
  {
    id: 'pain',
    name: 'Pain de campagne',
    icon: '🍞',
    needs: { ble: 3 },
    price: 76,
    time: 40,
    level: 8,
  },
  {
    id: 'confiture',
    name: 'Confiture de fraises',
    icon: '🍯',
    needs: { fraise: 3 },
    price: 155,
    time: 70,
    level: 10,
  },
  {
    id: 'sauce',
    name: 'Sauce du jardin',
    icon: '🥫',
    needs: { tomate: 2, carotte: 1 },
    price: 96,
    time: 60,
    level: 8,
  },
  {
    id: 'potage', name: 'Potage des primeurs', icon: '🍲',
    needs: { radis: 2, carotte: 1 }, price: 55, time: 48, level: 10,
  },
  {
    id: 'assiette', name: 'Assiette croquante', icon: '🥗',
    needs: { salade: 2, radis: 1 }, price: 56, time: 45, level: 10,
  },
  {
    id: 'ratatouille',
    name: 'Ratatouille',
    icon: '🍲',
    needs: { tomate: 2, aubergine: 2 },
    price: 275,
    time: 100,
    level: 15,
  },
  {
    id: 'violette',
    name: 'Confiture des bois',
    icon: '🫙',
    needs: { myrtille: 3 },
    price: 450,
    time: 140,
    level: 17,
  },
];
// Variants share their parent's mastery but have their own pantry entry.
RECIPES.push(
  ...RECIPES.map((r) => ({
    ...r,
    id: r.id + '_maison',
    name: r.name + ' · signature',
    parent: r.id,
    price: Math.round(r.price * 1.25),
    time: Math.round(r.time * 1.2),
  })),
);
RECIPES.push(
  {
    id: 'brioche',
    name: 'Brioche de Lucie',
    icon: '🥐',
    needs: { ble: 3, oeuf: 1 },
    price: 140,
    time: 90,
    level: 13,
    friend: 'lucie',
  },
  {
    id: 'infusion',
    name: 'Infusion de Jeanne',
    icon: '🍵',
    needs: { myrtille: 1, fraise: 1 },
    price: 170,
    time: 80,
    level: 18,
    friend: 'jeanne',
  },
  {
    id: 'tarte',
    name: 'Tarte de Clara',
    icon: '🥧',
    needs: { fraise: 2, ble: 1, oeuf: 1 },
    price: 170,
    time: 100,
    level: 16,
    friend: 'clara',
  },
);

RECIPES.push(
  { id: 'galette', name: 'Galette des champs', icon: '🥘', needs: { mais: 2, tomate: 1 }, price: 168, time: 85, level: 18, project: 'champs' },
  { id: 'clafoutis', name: 'Clafoutis du verger', icon: '🥧', needs: { myrtille: 2, fraise: 1 }, price: 340, time: 125, level: 22, project: 'douceurs' },
  { id: 'veloute', name: 'Velouté de courge', icon: '🍲', needs: { citrouille: 2, carotte: 1 }, price: 355, time: 120, level: 21, project: 'courges' },
  { id: 'jus', name: 'Jus des vendanges', icon: '🍷', needs: { raisin: 3 }, price: 690, time: 150, level: 23, project: 'vendanges' },
  { id: 'melonade', name: 'Melonade du jardin', icon: '🍹', needs: { melon: 2, fraise: 1 }, price: 840, time: 160, level: 25 },
  { id: 'fougasse', name: 'Fougasse des Moulins', icon: '🥖', needs: { ble: 2, tomate: 1 }, price: 145, time: 72, level: 8, valley: 'moulins', reputation: 2 },
  { id: 'pickles', name: 'Pickles du Port', icon: '🫙', needs: { carotte: 2, radis: 1 }, price: 64, time: 55, level: 8, valley: 'vergers', reputation: 2 },
);
export const BUILD = '0.21.1 — Grand ménage';
export const QUALITIES = [
  { id: 'ordinaire', name: 'Ordinaire', multiplier: 1 },
  { id: 'belle', name: 'Belle', multiplier: 1.4 },
  { id: 'exceptionnelle', name: 'Exceptionnelle', multiplier: 2 },
];
export const SPECIALIZATIONS = [
  { id: 'precoce', name: 'Précoce', desc: 'Croissance −25 %.' },
  {
    id: 'abondante',
    name: 'Abondante',
    desc: '35 % de chances de récolter une unité de plus.',
  },
  {
    id: 'artisanale',
    name: 'Artisanale',
    desc: 'Croissance +20 %, meilleures chances de qualité.',
  },
];
export const MASTERY_STEPS = [0, 15, 60, 150, 300];

export type CropFamily = 'primeurs' | 'grains' | 'legumes' | 'fruits';
export function cropFamily(id: string): CropFamily {
  if (['radis', 'carotte', 'salade'].includes(id)) return 'primeurs';
  if (['ble', 'mais'].includes(id)) return 'grains';
  if (['tomate', 'aubergine', 'citrouille'].includes(id)) return 'legumes';
  return 'fruits';
}
export const CROP_FAMILY_NAMES: Record<CropFamily, string> = {
  primeurs: 'Primeurs', grains: 'Grains', legumes: 'Cuisine du jardin', fruits: 'Fruits et douceurs',
};
export function cropMasterySteps(id: string) {
  const time = crop(id)?.time || 30;
  const counts = time <= 120 ? [0, 6, 18, 40, 75]
    : time <= 600 ? [0, 5, 15, 34, 62] : [0, 4, 12, 28, 50];
  return counts.map((n) => n * masteryGain(id));
}
export function specializationDescription(id: string, choice: string) {
  const family = cropFamily(id);
  if (choice === 'precoce')
    return family === 'primeurs' ? 'Croissance −25 % et une graine toutes les 4 récoltes.'
      : family === 'grains' ? 'Croissance −30 % pour les céréales.'
      : family === 'legumes' ? 'Croissance −25 % et sauces préparées plus vite.'
      : 'Croissance −25 % pour les fruits.';
  if (choice === 'abondante')
    return family === 'grains' ? '45 % de récolte double.' :
      family === 'primeurs' ? '40 % de récolte double.' : '35 % de récolte double.';
  return family === 'fruits' ? 'Qualité des fruits et des desserts améliorée.'
    : family === 'legumes' ? 'Qualité améliorée et plats du jardin plus rapides.'
    : family === 'grains' ? 'Qualité améliorée et pains plus rapides.'
    : 'Qualité améliorée pour les paniers du village.';
}

export const HEART_STEPS = [0, 2, 6, 12, 20, 30];
export const QUESTS = [
  {
    id: 'lucie',
    title: 'Le pain du partage',
    item: 'pain|reussi',
    amount: 1,
    reward: 90,
    tiers: [
      '+1,5 Maîtrise par cœur',
      'Brioche exclusive',
      '+5 Maîtrise culinaire',
    ],
  },
  {
    id: 'marcel',
    title: 'Un panier pour les voisins',
    item: 'carotte',
    amount: 6,
    reward: 80,
    tiers: [
      'Une graine toutes les 5 récoltes',
      '+5 % de belles récoltes',
      'Une graine toutes les 2 récoltes',
    ],
  },
  {
    id: 'jeanne',
    title: 'Les fruits de la patience',
    item: 'fraise',
    amount: 4,
    reward: 100,
    tiers: [
      '+1,2 Créativité par cœur',
      'Infusion exclusive',
      '+5 Créativité culinaire',
    ],
  },
  {
    id: 'clara',
    title: 'Une douceur à partager',
    item: 'confiture|reussi',
    amount: 1,
    reward: 110,
    tiers: ['+1,8 Chance par cœur', 'Tarte exclusive', '+5 Chance culinaire'],
  },
  {
    id: 'emile',
    title: 'Le marché des voisins',
    item: 'tomate',
    amount: 5,
    reward: 100,
    tiers: [
      '+3 % à la vente par cœur',
      'Commandes : +15 % de pièces',
      '+10 % à toutes les ventes',
    ],
  },
];
export const OUTCOMES = [
  {
    id: 'rustique',
    name: 'Plat rustique',
    icon: '🥣',
    multiplier: 0.72,
    xp: 12,
    desc: 'Réconfortant et généreux',
  },
  {
    id: 'reussi',
    name: 'Plat réussi',
    icon: '🍽️',
    multiplier: 1,
    xp: 20,
    desc: 'Une belle assiette maison',
  },
  {
    id: 'savoureux',
    name: 'Plat savoureux',
    icon: '✨',
    multiplier: 1.55,
    xp: 34,
    desc: 'Les saveurs se répondent',
  },
  {
    id: 'chef',
    name: 'Chef-d’œuvre',
    icon: '🌟',
    multiplier: 2.8,
    xp: 65,
    desc: 'Une recette dont on parlera longtemps',
  },
];
export const VILLAGERS = [
  {
    id: 'lucie',
    name: 'Lucie',
    role: 'La boulangère',
    icon: '👩🏻‍🍳',
    likes: ['ble', 'pain'],
    perk: 'Chaque point d’amitié ajoute de la Maîtrise.',
    perkShort: '+ Maîtrise des recettes',
  },
  {
    id: 'marcel',
    name: 'Marcel',
    role: 'Le maraîcher',
    icon: '👨🏻‍🌾',
    likes: ['carotte', 'tomate', 'salade'],
    perk: 'Il glisse régulièrement une graine bonus dans votre panier.',
    perkShort: 'Graine bonus régulière',
  },
  {
    id: 'jeanne',
    name: 'Jeanne',
    role: 'L’herboriste',
    icon: '👩🏽',
    likes: ['fraise', 'myrtille', 'confiture'],
    perk: 'Chaque point d’amitié augmente les chances de plat savoureux.',
    perkShort: '+ Plats savoureux',
  },
  {
    id: 'clara',
    name: 'Clara',
    role: 'La pâtissière',
    icon: '👩🏼‍🍳',
    likes: ['fraise', 'confiture'],
    perk: 'Ses conseils rendent les chefs-d’œuvre plus probables.',
    perkShort: '+ Chefs-d’œuvre',
  },
  {
    id: 'emile',
    name: 'Émile',
    role: 'Le marchand',
    icon: '🧔🏻',
    likes: ['citrouille', 'raisin', 'melon'],
    perk: 'Chaque point d’amitié ajoute 3 % au prix de vente.',
    perkShort: '+ Prix du marché',
  },
];
export const UPGRADES = [
  {
    id: 'expand',
    name: 'Un jardin plus grand',
    icon: '🏡',
    desc: '3 nouvelles parcelles (2 à la dernière). Les extensions suivantes arrivent aux niveaux 9, 14, 19 et 23.',
    cost: 35,
    level: 1,
  },
  {
    id: 'water',
    name: 'Irrigation douce',
    icon: '💧',
    desc: 'Toutes les nouvelles plantations poussent 25 % plus vite.',
    cost: 120,
    level: 7,
  },
  {
    id: 'tools',
    name: 'Outils de jardinier',
    icon: '🧺',
    desc: 'Rosalie cueille d’elle-même toutes les plantes mûres, parcelle après parcelle. Chaque palier rend son geste plus vif.',
    cost: 180,
    level: 3,
  },
  {
    id: 'workshop',
    name: 'Atelier de Rosalie',
    icon: '🍯',
    desc: 'Transformez vos récoltes en recettes plus précieuses.',
    cost: 180,
    level: 8,
  },
  {
    id: 'coop',
    name: 'Le petit poulailler',
    icon: '🐔',
    desc: '3 blés donnent 4 œufs en 2 minutes. Un œuf vaut 22 pièces.',
    cost: 240,
    level: 12,
  },
  {
    id: 'auto',
    name: 'Semis en série',
    icon: '🌱',
    desc: 'Rosalie sème d’elle-même la graine choisie dans toutes les parcelles libres. Chaque palier rend son geste plus vif.',
    cost: 500,
    level: 9,
  },
  {
    id: 'paths',
    name: 'Sentiers de gravier',
    icon: '🪨',
    desc: 'Des allées tassées entre les parcelles : Rosalie marche 15 % plus vite.',
    cost: 1500,
    level: 11,
  },
  {
    id: 'watering-can',
    name: 'Arrosoir de cuivre',
    icon: '🚿',
    desc: 'Rosalie arrose d’elle-même toutes les cultures en pousse, parcelle après parcelle. Chaque palier rend son geste plus vif.',
    cost: 100,
    level: 2,
  },
  {
    id: 'stove2',
    name: 'Deuxième fourneau',
    icon: '🔥',
    desc: 'Deux plats mijotent en même temps à l’atelier.',
    cost: 6000,
    level: 18,
  },
  {
    id: 'marmite',
    name: 'Grande marmite',
    icon: '🍲',
    desc: 'Deux portions d’une même recette d’un coup : ingrédients doublés, cuisson 1,5 fois plus longue.',
    cost: 12000,
    level: 22,
  },
  {
    id: 'stove3',
    name: 'Troisième fourneau',
    icon: '🔥',
    desc: 'Trois plats mijotent en même temps à l’atelier.',
    cost: 20000,
    level: 24,
  },
];
/** 0.9.9 : ce qu’une amélioration demande d’avoir installé avant elle. */
export const UPGRADE_REQUIRES: Record<string, string> = {
  stove2: 'workshop',
  marmite: 'workshop',
  stove3: 'stove2',
};

export const UPGRADE_PATHS = {
  // 0.9.2 : les paliers 4 et 5 suivent les revenus du niveau où ils s’ouvrent.
  'watering-can': { costs: [100, 200, 400, 10000, 25000], levels: [2, 3, 8, 15, 21], speeds: [780, 580, 420, 280, 150] },
  tools: { costs: [180, 350, 620, 10000, 25000], levels: [3, 5, 10, 17, 23], speeds: [780, 580, 420, 280, 150] },
  // 0.11.2 : le semis en série arrive au niveau 9 (au lieu de 13), ses paliers suivent.
  auto: { costs: [500, 1000, 1500, 12000, 30000], levels: [9, 12, 15, 19, 23], speeds: [840, 630, 450, 300, 160] },
} as const;
export type UpgradePathId = keyof typeof UPGRADE_PATHS;
export type BulkKind = 'water' | 'harvest' | 'sow';
export type BulkJob = {
  kind: BulkKind; crop?: string; lineageId?: number; targets: number[]; completed: number;
  total: number; lastIndex: number | null; nextAt: number; fast: boolean;
  /** 0.9.5 : avance rapide, retirée en 0.9.9 (lu et ignoré). */
  boost?: 1 | 2;
  /** 0.9.5 : semis de garde, en heures. */
  garde?: number;
  /**
   * 0.18 : tâches actives (récolter, semer, arroser), lancées ensemble ou l’une
   * après l’autre. `kind` et `targets` décrivent alors le prochain geste : la
   * parcelle la plus proche parmi toutes les tâches (lib/chores.ts).
   */
  chores?: BulkKind[];
};
/** 0.18 : les tâches en cours (une seule dans les sauvegardes d’avant 0.18). */
export function bulkChores(job: BulkJob | null | undefined): BulkKind[] {
  if (!job) return [];
  return job.chores ?? [job.kind];
}
export function upgradeTier(g: Game, id: UpgradePathId) {
  return Math.min(5, Math.max(0, g.upgradeTiers?.[id] ??
    (g.upgrades.includes(id) ? 1 : 0)));
}
export function nextUpgradeLevel(g: Game, id: string) {
  const path = UPGRADE_PATHS[id as UpgradePathId];
  return path ? path.levels[Math.min(4, upgradeTier(g, id as UpgradePathId))]
    : UPGRADES.find((u) => u.id === id)?.level || 1;
}
export function bulkSpeed(g: Game, kind: BulkKind) {
  const id: UpgradePathId = kind === 'water' ? 'watering-can'
    : kind === 'harvest' ? 'tools' : 'auto';
  return UPGRADE_PATHS[id].speeds[Math.max(1, upgradeTier(g, id)) - 1];
}
/**
 * 0.9.9 : durée d’un geste de Rosalie (semer, arroser, récolter), qu’il soit
 * lancé d’un clic ou par un geste groupé. Sans l’outil, c’est la durée du
 * premier palier ; chaque palier la raccourcit.
 */
export function gestureMs(g: Game, kind: BulkKind) {
  // 0.13 : l’eau du lavoir restauré raccourcit l’arrosage.
  return kind === 'water' ? Math.round(bulkSpeed(g, kind) * (1 - restorationValue(g, 'lavoir'))) : bulkSpeed(g, kind);
}
/** 0.9.9 : nombre de fourneaux de l’atelier (0 sans atelier). */
export function stoveCount(g: Game) {
  if (!g.upgrades.includes('workshop')) return 0;
  return 1 + (g.upgrades.includes('stove2') ? 1 : 0) + (g.upgrades.includes('stove3') ? 1 : 0);
}
/** Préparation de chaque fourneau installé (null : fourneau libre). */
export function stoveJobs(g: Game): (CookJob | null)[] {
  const all = [g.job, ...(g.stoves || [])];
  return Array.from({ length: stoveCount(g) }, (_, i) => all[i] || null);
}
/** Premier fourneau libre, ou -1. */
export function freeStove(g: Game) {
  return stoveJobs(g).findIndex((job) => !job);
}
/** Plats prêts à sortir des fourneaux (en portions). */
export function readyDishes(g: Game, now: number) {
  return stoveJobs(g).reduce((n, job) => n + (job && job.end <= now ? job.portions || 1 : 0), 0);
}
function setStove(g: Game, index: number, job: CookJob | null) {
  if (index === 0) g.job = job;
  else {
    const stoves = [...(g.stoves || [])];
    while (stoves.length < index) stoves.push(null);
    stoves[index - 1] = job;
    g.stoves = stoves;
  }
}

export type Plot = {
  crop: string;
  start: number;
  end: number;
  watered: boolean;
  specialization?: string;
  lineageId?: number;
  /** 0.9.5 : semis de garde, nombre de récoltes rendues d’un coup. */
  garde?: number;
} | null;
/** Une préparation au fourneau. */
export type CookJob = {
  id: string;
  /** 0.9.9 : début de la cuisson, pour la barre d’avancement. */
  start?: number;
  end: number;
  quality?: string;
  probabilities?: number[];
  ingredientValue?: number;
  lineageId?: number;
  /** 0.9.9 : grande marmite, deux portions de la même recette. */
  portions?: 2;
};
export type CookingStats = {
  mastery: number;
  precision: number;
  creativity: number;
  regularity: number;
  luck: number;
};
export type ActionArgument =
  | string
  | number
  | null
  | undefined
  | {
      crop?: string;
      index?: number;
      /** 0.9.5 : semis de garde, durée en heures (0 ou absent : semis normal). */
      garde?: number;
      specialization?: string;
      id?: string;
      ingredients?: string[];
      /** 0.9.9 : grande marmite (2 portions). */
      portions?: number;
      villager?: string;
      item?: string;
      confirmSuperior?: boolean;
      stat?: keyof CookingStats;
      setting?:
        | 'animatedMovement'
        | 'quickActions'
        | 'reduceMotion'
        | 'forceAnimations'
        | 'autoBuySeeds';
      amount?: number | 'max';
      /** 0.18 : où se tient Rosalie (pieds, % de la carte), pour viser la parcelle la plus proche. */
      from?: { x: number; y: number };
      slot?: number;
      path?: SkillPath;
      choice?: string;
      value?: boolean;
      scene?: string;
      project?: string;
      lineageId?: number;
      candidateId?: number;
      trait?: TraitId;
      name?: string;
      terroir?: TerroirId;
      items?: string[];
      region?: RegionId;
    };
export type Game = {
  version: typeof SAVE_VERSION;
  coins: number;
  xp: number;
  plots: Plot[];
  seeds: Record<string, number>;
  stock: Record<string, number>;
  upgrades: string[];
  harvests: number;
  sold: number;
  orders: number;
  crafted: number;
  collection: Record<string, number>;
  claimed: string[];
  /** Premier fourneau de l’atelier. */
  job: CookJob | null;
  /** 0.9.9 : deuxième et troisième fourneaux (améliorations « stove2 », « stove3 »). */
  stoves: (CookJob | null)[];
  /** 0.10 : tutoriel de Rosalie (chapitres faits, étape en cours). */
  tutorial?: TutorialState;
  cropXP: Record<string, number>;
  specializations: Record<string, string>;
  recipeXP: Record<string, number>;
  friendship: Record<string, number>;
  quests: string[];
  talentPoints: number;
  pendingCrop: string | null;
  /** Cultures découvertes à présenter ensuite sur la première commande. */
  pendingCrops?: string[];
  hens: number | null;
  created: number;
  saved: number;
  stats: CookingStats;
  relations: Record<string, number>;
  settings: {
    animatedMovement: boolean;
    quickActions: boolean;
    reduceMotion: boolean;
    forceAnimations: boolean;
    autoBuySeeds: boolean;
  };
  seenScenes: string[];
  weatherSeed: number;
  festival: FestivalState;
  /** 0.5.0 : grands projets du village. */
  projects: ProjectState;
  /** 0.5.0 : effets temporaires des plats, fin de chaque effet en ms. */
  buffs: Partial<Record<DishEffectId, number>>;
  /** 0.5.0 : prochaine cueillette du verger restauré, null tant qu’il ne l’est pas. */
  orchard: number | null;
  /** 0.5.0 : meilleur résultat obtenu pour chaque recette (rang 0–3). */
  dishBest: Record<string, number>;
  /** 0.5.0 : récoltes exceptionnelles par culture, pour la vitrine. */
  exceptional: Record<string, number>;
  orderSlots: number[];
  upgradeTiers: Record<string, number>;
  bulkJob: BulkJob | null;
  trackedGoals: string[];
  grandOrders: number;
  personalWins: Record<string, number>;
  giftHistory: string[];
  skillSeen: string[];
  skillChoices: Partial<Record<SkillPath, string>>;
  festivalAwards: string[];
  lastCooked: string | null;
  lineages: Lineage[];
  seedFinds: SeedFind[];
  lineageSerial: number;
  findSerial: number;
  terroirBuilds: TerroirId[];
  season: LivingSeason;
  signatureOrders: number;
  valley: ValleyState;
  /**
   * 0.9.1 : pages du carnet déjà consultées. Absent dans les sauvegardes
   * antérieures : settleNotebook() le remplit au chargement.
   */
  seenPages?: string[];
  /** 0.9.1 : graines épinglées dans le dock (5 au plus). Absent : choix automatique. */
  favoriteSeeds?: string[];
  /** 0.11 : étape de chaque embellissement (1 à 3 ; absent : pas construit). */
  embellishments?: Partial<Record<EmbellishmentId, number>>;
  /** 0.13 : étape de restauration de chaque lieu de l’anneau (1 à 3 ; absent : en friche). */
  restorations?: Partial<Record<RestorationId, number>>;
  /** 0.11 : nombre de dons à la fête du village. */
  donations?: number;
  /** 0.11 : heure à laquelle chaque emplacement de commande propose à nouveau une offre. */
  orderReady?: number[];
};
export const KEY = 'rosalie-farm-v1';
export function fresh(now = Date.now()): Game {
  return {
    version: SAVE_VERSION,
    cropXP: {},
    specializations: {},
    recipeXP: {},
    friendship: {},
    quests: [],
    talentPoints: 0,
    pendingCrop: null,
    coins: 20,
    xp: 0,
    plots: Array(6).fill(null),
    seeds: { radis: 6, carotte: 3 },
    stock: {},
    upgrades: [],
    harvests: 0,
    sold: 0,
    orders: 0,
    crafted: 0,
    collection: {},
    claimed: [],
    job: null,
    stoves: [],
    tutorial: freshTutorial(),
    hens: null,
    created: now,
    saved: now,
    stats: { mastery: 1, precision: 1, creativity: 1, regularity: 1, luck: 1 },
    relations: { lucie: 0, marcel: 0, jeanne: 0, clara: 0, emile: 0 },
    settings: {
      animatedMovement: true,
      quickActions: false,
      reduceMotion: false,
      forceAnimations: false,
      autoBuySeeds: false,
    },
    seenScenes: [],
    weatherSeed: Math.floor(now / 86400000) % 4,
    festival: freshFestival(),
    projects: freshProjects(),
    buffs: {},
    orchard: null,
    dishBest: {},
    exceptional: {},
    orderSlots: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    upgradeTiers: {},
    bulkJob: null,
    trackedGoals: ['first'],
    grandOrders: 0,
    personalWins: {},
    giftHistory: [],
    skillSeen: [],
    skillChoices: {},
    festivalAwards: [],
    lastCooked: null,
    lineages: [],
    seedFinds: [],
    lineageSerial: 1,
    findSerial: 1,
    terroirBuilds: [],
    season: freshSeason(),
    signatureOrders: 0,
    valley: freshValley(),
    embellishments: {},
    restorations: {},
    donations: 0,
    orderReady: [],
  };
}
/**
 * 0.10 : 25 niveaux, 2 ou 3 nouveautés par niveau (une grande à la fois).
 * Courbe calée par scripts/simulate-progression.ts : les premiers niveaux
 * restent des découvertes rapides, puis un palier tous les 2 à 4 jours pour
 * un joueur à 3 × 10 min par jour, qui atteint le niveau 25 en 6 à 8 semaines.
 */
export const MAX_LEVEL = 25;
export const LEVEL_XP = [
  0, 80, 240, 650, 1350, 2200, 3200, 4350, 7400, 12100, 17900, 24900, 33400,
  43700, 56000, 70400, 88000, 109600, 136200, 169000, 202500, 237500,
  275000, 314500, 356000,
];
/**
 * Courbe des versions 0.10.0 à 0.10.1 (sauvegardes v11 et v12). La 0.11 la
 * recale : les commandes plus grosses et les embellissements font gagner plus
 * vite en milieu de partie ; les niveaux 9 à 24 demandent donc plus d’XP pour
 * garder un palier tous les 2 à 4 jours.
 */
export const V12_LEVEL_XP = [
  0, 80, 240, 650, 1350, 2200, 3200, 4350, 5850, 8450, 12500, 17000, 22000,
  27500, 34500, 45000, 57500, 72000, 90000, 115000, 146000, 184000,
  233000, 290000, 357000,
] as const;
/** 0.11 : même niveau, même avancement dans le niveau, sur la nouvelle courbe. */
export function rescaleV12Xp(xp: number) {
  const value = Math.max(0, Number(xp) || 0);
  const old = V12_LEVEL_XP;
  const top = old.length - 1;
  if (value >= old[top]) return Math.round(LEVEL_XP[top] + (value - old[top]) * (LEVEL_XP[top] / old[top]));
  let i = 0;
  while (i < top && value >= old[i + 1]) i++;
  const share = (value - old[i]) / (old[i + 1] - old[i]);
  return Math.round(LEVEL_XP[i] + share * (LEVEL_XP[i + 1] - LEVEL_XP[i]));
}
/** Courbe à 12 niveaux des versions 0.9.2 à 0.9.9 (sauvegardes v10). */
export const V10_LEVEL_XP = [
  0, 80, 350, 1100, 2900, 6300, 13300, 24300, 44800, 81000, 144000, 254000,
] as const;
/**
 * 0.10 : même avancement relatif sur le parcours. Une partie aux deux tiers
 * des 12 anciens niveaux se retrouve aux deux tiers des 25 nouveaux ; au-delà
 * du dernier niveau, l’excédent suit le même rapport.
 */
export function rescaleV10Xp(xp: number) {
  const value = Math.max(0, Number(xp) || 0);
  const old = V10_LEVEL_XP;
  const top = old.length - 1;
  const last = LEVEL_XP.length - 1;
  if (value >= old[top]) return Math.round(LEVEL_XP[last] + (value - old[top]) * (LEVEL_XP[last] / old[top]));
  let i = 0;
  while (i < top && value >= old[i + 1]) i++;
  const position = ((i + (value - old[i]) / (old[i + 1] - old[i])) / top) * last;
  const n = Math.min(last - 1, Math.floor(position));
  return Math.round(LEVEL_XP[n] + (position - n) * (LEVEL_XP[n + 1] - LEVEL_XP[n]));
}
/** Courbe des versions 0.3 à 0.9.1, gardée pour convertir les anciennes sauvegardes. */
export const LEGACY_LEVEL_XP = [
  0, 120, 420, 1000, 1900, 3300, 5200, 7800, 11000, 15000, 20500, 28000,
] as const;
/**
 * Convertit une XP de l’ancienne courbe : même niveau, même avancement
 * dans le niveau. Au-delà du niveau 12, l’excédent suit le même rapport.
 */
export function rescaleLegacyXp(xp: number) {
  const value = Math.max(0, Number(xp) || 0);
  const old = LEGACY_LEVEL_XP;
  const top = old.length - 1;
  if (value >= old[top]) return Math.round(V10_LEVEL_XP[top] + (value - old[top]) * (V10_LEVEL_XP[top] / old[top]));
  let i = 0;
  while (i < top && value >= old[i + 1]) i++;
  const share = (value - old[i]) / (old[i + 1] - old[i]);
  return Math.round(V10_LEVEL_XP[i] + share * (V10_LEVEL_XP[i + 1] - V10_LEVEL_XP[i]));
}
/** Paliers des mécaniques qui ne sont pas des objets de données (commandes, marché). */
export const UNLOCKS = {
  marketBasket: 4,
  caravan: 6,
  bakerMenu: 13,
  prestigeMenu: 16,
  signatures: 15,
  qualityMarket: 19,
  bigOrders: 24,
} as const;
const gardeLabel = (hours: number) => (hours === 1 ? 'Semis de garde (1 h)' : `Semis de garde de ${hours} h`);
const UNLOCK_LABELS: Record<keyof typeof UNLOCKS, string> = {
  marketBasket: 'Paniers du marché',
  caravan: 'Caravane de la vallée',
  bakerMenu: 'Menu du boulanger',
  prestigeMenu: 'Repas prestigieux',
  signatures: 'Recettes signatures et grande commande',
  qualityMarket: 'Marchés de qualité',
  bigOrders: 'Grandes commandes',
};
/** 0.13 : 4e extension au niveau 23 (2 parcelles, 20 au total, la capacité de la grande carte). */
export const EXTENSION_LEVELS = [9, 14, 19, 23];
/** Nombre de parcelles au plus : 9 au départ, puis 12, 15, 18 et 20. */
export const PLOT_STEPS = [9, 12, 15, 18, 20] as const;
/** Niveau des premières graines prometteuses (lignées). */
export const SEED_FIND_LEVEL = 7;
/**
 * 0.9.5 — Semis de garde : une culture lente pour les absences.
 * Elle rend d’un coup une part des récoltes qu’un joueur présent aurait faites,
 * en qualité ordinaire, avec l’XP et la maîtrise d’une seule récolte.
 */
export const GARDE_STEPS = [
  { level: 5, hours: 1 },
  { level: 9, hours: 3 },
  { level: 11, hours: 8 },
  { level: 20, hours: 12 },
] as const;
export const GARDE_SHARE = 0.03;
export const GARDE_MIN = 1;
export const GARDE_MAX = 12;
/** 0.11 : plafond d’une parcelle de garde avec l’épouvantail (12 + 50 %). */
export const GARDE_CAP = 18;
/**
 * 0.11 : la part rendue grandit avec la durée de pousse, pour que les
 * cultures lentes (aubergine → melon) vaillent la garde : 3 % pour le radis,
 * environ 20 % pour le melon (2 melons en 12 h au lieu d’un). L’épouvantail
 * ajoute sa part, au-delà du plafond.
 */
export function gardeShare(growSeconds: number) {
  return Math.min(0.3, GARDE_SHARE * Math.pow(Math.max(30, growSeconds) / 30, 0.36));
}
export function gardeOptions(g: Game): number[] {
  return GARDE_STEPS.filter((step) => step.level <= level(g)).map((step) => step.hours);
}
export function gardeYield(g: Game, cropId: string, hours: number, now?: number) {
  const normal = Math.max(5, growTime(g, cropId, now));
  const base = Math.min(GARDE_MAX, Math.max(GARDE_MIN, Math.round((hours * 3600 / normal) * gardeShare(normal))));
  const watch = embellishmentValue(g, 'epouvantail');
  return watch ? base + Math.max(1, Math.round(base * watch)) : base;
}
/**
 * Contenu débloqué à chaque niveau, dérivé des cultures, améliorations,
 * recettes, projets et paliers ci-dessus : une seule source de vérité.
 */
export const LEVEL_CONTENT = Array.from({ length: MAX_LEVEL }, (_, i) => {
  const value = i + 1;
  // 0.10 : les recettes d’un niveau forment une seule nouveauté.
  // 0.13 : la recette d’un projet du même niveau est sa récompense : elle s’affiche avec lui.
  const projectRecipe = (id: string) => RECIPES.find((r) => r.project === id && r.level === value);
  const recipes = RECIPES.filter((r) => !r.parent && !r.valley && r.level === value &&
    !(r.project && PROJECTS.some((p) => p.id === r.project && p.level === value))).map((r) =>
    r.friend ? `${r.name} (amitié)` : r.project ? `${r.name} (projet)` : r.name,
  );
  const parts = [
    ...UPGRADES.filter((u) => u.level === value).map((u) => u.name),
    ...(EXTENSION_LEVELS.includes(value) ? ['Extension du jardin'] : []),
    // Les recettes de la vallée s’ouvrent avec la réputation, pas avec le niveau.
    ...(recipes.length ? [`${recipes.length > 1 ? 'Recettes' : 'Recette'} : ${recipes.join(', ')}`] : []),
    ...(value === SEED_FIND_LEVEL ? ['Graines prometteuses et foires aux variétés'] : []),
    ...(Object.keys(UNLOCKS) as (keyof typeof UNLOCKS)[])
      .filter((key) => UNLOCKS[key] === value)
      .map((key) => UNLOCK_LABELS[key]),
    ...GARDE_STEPS.filter((step) => step.level === value).map((step) => gardeLabel(step.hours)),
    ...VALLEY_TOURS.filter((tour) => tour.id !== 'court' && tour.level === value).map((tour) => `Caravane : ${tour.name.charAt(0).toLowerCase()}${tour.name.slice(1)}`),
    ...PROJECTS.filter((p) => p.level === value).map((p) => {
      const reward = projectRecipe(p.id);
      return reward
        ? `Projet : ${p.title} (recette : ${reward.name.charAt(0).toLowerCase()}${reward.name.slice(1)})`
        : `Projet : ${p.title}`;
    }),
    ...EMBELLISHMENTS.filter((e) => e.levels[0] === value).map((e) => `Embellissement : ${e.name}`),
    ...(value === 1 ? ['Marché du village'] : []),
    ...(value === MAX_LEVEL ? ['Titre de maître jardinier · serre ornementale'] : []),
  ];
  const unlocked = CROPS.find((c) => c.level === value && value > 1);
  return {
    level: value,
    crop: CROPS.find((c) => c.level === value)?.id ?? null,
    system:
      parts.join(' · ') ||
      (unlocked ? `${unlocked.name} : ${unlocked.tag.toLowerCase()}` : ''),
  };
});
export function level(g: Game) {
  let current = 1;
  for (let i = 1; i < LEVEL_XP.length; i++)
    if (g.xp >= LEVEL_XP[i]) current = i + 1;
  return Math.min(MAX_LEVEL, current);
}
export function levelContent(value: number) {
  return LEVEL_CONTENT.find((entry) => entry.level === value)!;
}
export const crop = (id: string) => CROPS.find((c) => c.id === id)!;
export const recipe = (id: string) => RECIPES.find((r) => r.id === id);
export const outcome = (id: string) => OUTCOMES.find((o) => o.id === id)!;
export function lineageById(g: Game, id: number | undefined) {
  return id ? g.lineages.find((lineage) => lineage.id === id) : undefined;
}
export function itemLineageId(id: string) {
  const part = id.split('|').find((section) => /^l[1-9]\d*$/.test(section));
  return part ? Number(part.slice(1)) : undefined;
}
export function itemLabel(g: Game, id: string) {
  const lineage = lineageById(g, itemLineageId(id));
  return lineage ? itemName(id).replace(/ · Lignée n°\d+/, '') + ` · ${lineage.name}` : itemName(id);
}
export function dishParts(id: string) {
  const [recipeId, qualityId, valuePart, signaturePart] = id.split('|');
  return {
    recipeId,
    qualityId: qualityId || 'reussi',
    ingredientValue: valuePart?.startsWith('v')
      ? Number(valuePart.slice(1)) || 0
      : 0,
    lineageId: signaturePart?.startsWith('l') ? Number(signaturePart.slice(1)) || undefined
      : valuePart?.startsWith('l') ? Number(valuePart.slice(1)) || undefined : undefined,
  };
}
export function dishName(id: string) {
  const p = dishParts(id);
  const r = recipe(p.recipeId);
  return r ? `${r.name} · ${outcome(p.qualityId).name}${p.lineageId ? ' · spécialité de ferme' : ''}` : id;
}
export function dishIcon(id: string) {
  const p = dishParts(id);
  return recipe(p.recipeId)?.icon || '🍽️';
}
export function mastery(xp: number) {
  return MASTERY_STEPS.filter((n) => xp >= n).length;
}
export function cropMastery(g: Game, id: string) {
  return cropMasterySteps(id).filter((n) => (g.cropXP[id] || 0) >= n).length;
}
export function recipeMastery(g: Game, id: string) {
  return mastery((g.recipeXP[recipe(id)?.parent || id] || 0) * 3);
}
export function isFestivalDish(id: string) {
  if (typeof id !== 'string') return false;
  const parts = id.split('|');
  if (parts.length < 2 || parts.length > 4) return false;
  const [recipeId, qualityId, valuePart, signaturePart] = parts;
  return Boolean(
    recipe(recipeId) &&
    OUTCOMES.some((quality) => quality.id === qualityId) &&
    (valuePart === undefined || /^v\d+$/.test(valuePart) || /^l[1-9]\d*$/.test(valuePart)) &&
    (signaturePart === undefined || (/^v\d+$/.test(valuePart || '') && /^l[1-9]\d*$/.test(signaturePart))),
  );
}
export function festivalDishKeys(g: Game) {
  return Object.keys(g.stock)
    .filter((id) => (g.stock[id] || 0) > 0 && isFestivalDish(id))
    .sort((a, b) => {
      const scoreDifference =
        festivalEvaluation(g, b).score - festivalEvaluation(g, a).score;
      return scoreDifference || dishName(a).localeCompare(dishName(b), 'fr');
    });
}
export function festivalAffinityJudges(id: string): FestivalJudgeId[] {
  if (!isFestivalDish(id)) return [];
  const prepared = recipe(dishParts(id).recipeId)!;
  const tastes = new Set([
    prepared.id,
    prepared.parent || prepared.id,
    ...Object.keys(prepared.needs),
  ]);
  return VILLAGERS.filter((villager) =>
    villager.likes.some((liked) => tastes.has(liked)),
  ).map((villager) => villager.id as FestivalJudgeId);
}
export function festivalEvaluation(g: Game, id: string, themeId?: string) {
  const parts = dishParts(id);
  const affinities = festivalAffinityJudges(id);
  const theme = FESTIVAL_THEMES.find((item) => item.id === themeId) || festivalTheme(g);
  const prepared = isFestivalDish(id) ? recipe(parts.recipeId) : undefined;
  const matches = !!prepared && Object.keys(prepared.needs).some((cropId) =>
    (theme.crops as readonly string[]).includes(cropId));
  const result = calculateFestivalScore({
    qualityId: isFestivalDish(id) ? parts.qualityId : '',
    mastery: isFestivalDish(id) ? recipeMastery(g, parts.recipeId) : 0,
    relations: g.relations,
    affinities,
    themeBonus: matches ? 12 : 0,
    skillBonus: Math.max(0, skillRank(g, 'cuisine') - 1) * 3,
  });
  return {
    ...result,
    theme, matches,
    affinities,
    leadJudge: festivalLeadJudge(g.festival.entries),
    reactions: festivalReactions(result.score, affinities, g.relations),
  };
}
/** Un effet de plat est actif seulement si l’heure est connue et avant son échéance. */
export function buffActive(g: Game, id: DishEffectId, now?: number) {
  return now !== undefined && (g.buffs?.[id] || 0) > now;
}
export function activeBuffs(g: Game, now: number) {
  return DISH_EFFECT_IDS.filter((id) => buffActive(g, id, now)).map((id) => ({
    ...Object.values(DISH_EFFECTS).find((effect) => effect.id === id)!,
    end: g.buffs[id]!,
  }));
}
export function hasReward(g: Game, reward: ProjectReward) {
  return PROJECTS.some(
    (project) =>
      project.reward === reward && !!g.projects?.done.includes(project.id),
  );
}
function addUseMastery(g: Game, ids: readonly string[], factor: number) {
  const unique = new Set(ids.map((id) => id.split('|')[0]).filter((id) => !!crop(id)));
  for (const id of unique)
    g.cropXP[id] = (g.cropXP[id] || 0) + Math.max(1, Math.round(masteryGain(id) * factor));
}
export function masteryGain(id: string) {
  return crop(id).mastery;
}
/** Détail du temps de pousse : base puis chaque modificateur actif. */
export function growTimeBreakdown(g: Game, id: string, now?: number) {
  const spec = g.specializations[id];
  const factors: { label: string; multiplier: number }[] = [];
  if (cropMastery(g, id) >= 2)
    factors.push({ label: 'Maîtrise 2 de la culture', multiplier: 0.9 });
  if (spec === 'precoce')
    factors.push({ label: 'Spécialisation précoce', multiplier: cropFamily(id) === 'grains' ? 0.7 : 0.75 });
  if (spec === 'artisanale')
    factors.push({ label: 'Spécialisation artisanale', multiplier: 1.2 });
  if (g.upgrades.includes('water'))
    factors.push({ label: 'Irrigation douce', multiplier: 0.75 });
  if (buffActive(g, 'croissance', now))
    factors.push({ label: 'Effet Terre vive', multiplier: 0.85 });
  const base = crop(id).time;
  return {
    base,
    factors,
    total: factors.reduce((time, factor) => time * factor.multiplier, base),
  };
}
export function growTime(g: Game, id: string, now?: number) {
  return growTimeBreakdown(g, id, now).total;
}
export function itemName(id: string) {
  const [base, q = 'ordinaire'] = id.split('|');
  const c = crop(base);
  return c
    ? `${c.name} · ${QUALITIES.find((v) => v.id === q)?.name || 'Ordinaire'}${itemLineageId(id) ? ' · Lignée n°' + itemLineageId(id) : ''}`
    : base === 'oeuf'
      ? 'Œuf'
      : dishName(id);
}
export function itemIcon(id: string) {
  return crop(id.split('|')[0])?.icon || (id === 'oeuf' ? '🥚' : dishIcon(id));
}
export function basePrice(id: string) {
  const [base, quality] = id.split('|');
  if (crop(base))
    return (
      crop(base).price *
      (QUALITIES.find((q) => q.id === quality)?.multiplier || 1)
    );
  if (base === 'oeuf') return 22;
  const parts = dishParts(id);
  const cooked =
    (recipe(base)?.price || 0) *
    (OUTCOMES.find((q) => q.id === quality)?.multiplier || 1);
  return parts.ingredientValue
    ? Math.max(cooked, parts.ingredientValue + 5)
    : cooked;
}
const CROP_QUALITY = ['ordinaire', 'belle', 'exceptionnelle'];
const DISH_QUALITY = ['rustique', 'reussi', 'savoureux', 'chef'];
export function itemQualityRank(id: string) {
  const [base, quality] = id.split('|');
  const values = crop(base) ? CROP_QUALITY : DISH_QUALITY;
  return Math.max(0, values.indexOf(quality || values[0]));
}
export function satisfiesQuality(offered: string, requested: string) {
  return (
    offered.split('|')[0] === requested.split('|')[0] &&
    (!itemLineageId(requested) || itemLineageId(offered) === itemLineageId(requested)) &&
    itemQualityRank(offered) >= itemQualityRank(requested)
  );
}
export function fulfillment(
  stock: Record<string, number>,
  requested: string,
  amount: number,
) {
  const matches = Object.keys(stock)
    .filter((id) => (stock[id] || 0) > 0 && satisfiesQuality(id, requested))
    .sort((a, b) => itemQualityRank(a) - itemQualityRank(b) || Number(!!itemLineageId(a)) - Number(!!itemLineageId(b)));
  const used: Record<string, number> = {};
  let remaining = amount;
  for (const id of matches) {
    const quantity = Math.min(remaining, stock[id] || 0);
    if (quantity) used[id] = quantity;
    remaining -= quantity;
    if (!remaining) break;
  }
  return {
    possible: remaining === 0,
    used,
    usesSuperior: Object.keys(used).some(
      (id) => itemQualityRank(id) > itemQualityRank(requested),
    ),
  };
}
export function canProduceQuality(g: Game, id: string) {
  if (id === 'belle')
    return (
      g.upgrades.includes('water') ||
      CROPS.some((c) => cropMastery(g, c.id) >= 2)
    );
  if (id === 'exceptionnelle')
    return CROPS.some(
      (c) =>
        cropMastery(g, c.id) >= 4 || g.specializations[c.id] === 'artisanale',
    );
  if (id === 'savoureux' || id === 'chef')
    return g.upgrades.includes('workshop') && g.crafted > 0;
  return true;
}
export function recipeLock(g: Game, r: Recipe) {
  if (level(g) < r.level) return `Niveau ${r.level}`;
  if (r.parent && level(g) < UNLOCKS.signatures)
    return `Niveau ${UNLOCKS.signatures}`;
  if (r.parent && recipeMastery(g, r.parent) < 3)
    return 'Maîtrise 3 de la recette de base';
  if (r.friend && (g.relations[r.friend] || 0) < 3)
    return `3 cœurs avec ${VILLAGERS.find((v) => v.id === r.friend)?.name}`;
  if (r.valley && g.valley.reputations[r.valley] < (r.reputation || 0))
    return `${REGIONS[r.valley].name} · réputation ${r.reputation}`;
  if (r.project && !g.projects.done.includes(r.project))
    return 'Projet : ' + PROJECTS.find((p) => p.id === r.project)?.title;
  return '';
}
export function marketEvent(g: Game, now: number) {
  const cycle = Math.floor(Math.max(0, now - g.created) / 1200000);
  const crops = CROPS.filter((c) => c.level <= level(g));
  const recipes = RECIPES.filter((r) => !recipeLock(g, r));
  const qualities = ['belle', 'exceptionnelle', 'savoureux'].filter((id) =>
    canProduceQuality(g, id),
  );
  const modes = [0];
  if (g.upgrades.includes('workshop') && recipes.length) modes.push(1);
  if (level(g) >= UNLOCKS.qualityMarket && qualities.length) modes.push(2);
  const mode = modes[cycle % modes.length];
  const target =
    mode === 0
      ? crops[cycle % crops.length].id
      : mode === 1
        ? recipes[cycle % recipes.length]?.id || 'pain'
        : qualities[cycle % qualities.length];
  const targetCrop = crop(target);
  const bonus =
    mode === 0 && targetCrop.time >= 1200
      ? 0.5
      : mode === 0 && targetCrop.time >= 600
        ? 0.4
        : mode === 2
          ? 0.25
          : 0.3;
  return {
    target,
    mode,
    bonus,
    label:
      mode === 0
        ? crop(target).name
        : mode === 1
          ? recipe(target)!.name
          : target === 'belle'
            ? 'Belles récoltes'
            : target === 'exceptionnelle'
              ? 'Récoltes exceptionnelles'
              : 'Plats savoureux',
    end: g.created + (cycle + 1) * 1200000,
  };
}
export function marketBonus(g: Game, id: string, now: number) {
  const event = marketEvent(g, now),
    [base, q] = id.split('|');
  return (event.mode === 2 ? q === event.target : base === event.target)
    ? event.bonus
    : 0;
}
export function price(g: Game, id: string, now: number) {
  const hearts = g.relations.emile || 0;
  const late = (crop(id.split('|')[0])?.level || 0) >= LATE_CROP_LEVEL ? LATE_CROP_SALE : 1;
  return Math.round(
    late *
    basePrice(id) *
      (1 + marketBonus(g, id, now) + (seasonFor(g.season.index).crops.includes(id.split('|')[0] as never) ? 0.08 : 0)) *
      (1 + hearts * 0.03 + (hearts >= 5 ? 0.1 : 0)) *
      (stallEligible(g, id) ? 1.1 : 1),
  );
}
/** Étal personnel : belles récoltes, récoltes exceptionnelles et plats. */
export function stallEligible(g: Game, id: string) {
  if (!hasReward(g, 'etal')) return false;
  const [base] = id.split('|');
  return crop(base) ? itemQualityRank(id) >= 1 : base !== 'oeuf';
}
/** Le marché suivant, révélé par l’infusion (Intuition). */
export function nextMarketEvent(g: Game, now: number) {
  return marketEvent(g, marketEvent(g, now).end);
}
export function featured(g: Game, now: number) {
  return marketEvent(g, now).target;
}
export type OrderKind = 'simple' | 'dish' | 'baker' | 'market' | 'prestige' | 'grand' | 'personal' | 'signature';
export type VillageOrder = {
  kind: OrderKind;
  title: string;
  note: string;
  lines: MenuLine[];
  /** Produit principal, conservé pour l’icône et la compatibilité 0.4. */
  crop: string;
  amount: number;
  reward: number;
  xp: number;
  person: string;
  villagerId?: string;
};
const OUTCOME_IDS = ['rustique', 'reussi', 'savoureux', 'chef'];
export function outcomeRank(id: string) {
  return Math.max(0, OUTCOME_IDS.indexOf(id));
}
export function dishCourse(id: string): Course | undefined {
  if (!isFestivalDish(id)) return undefined;
  const r = recipe(dishParts(id).recipeId)!;
  return RECIPE_COURSES[r.parent || r.id];
}
export function coursesAvailable(g: Game) {
  const unlocked = RECIPES.filter((r) => !recipeLock(g, r));
  return (['entree', 'plat', 'dessert'] as Course[]).every((course) =>
    unlocked.some((r) => RECIPE_COURSES[r.parent || r.id] === course),
  );
}

export function skillProgress(g: Game, path: SkillPath) {
  return g.skillSeen.filter((key) => key.startsWith(path + ':')).length;
}
export function skillRank(g: Game, path: SkillPath) {
  return skillProgress(g, path) >= 6 ? 3 : skillProgress(g, path) >= 3 ? 2 : 1;
}
function recordSkill(g: Game, path: SkillPath, key: string) {
  const id = path + ':' + key;
  if (!g.skillSeen.includes(id)) g.skillSeen.push(id);
}
function gainFriendship(g: Game, id: string, points: number) {
  if (!VILLAGERS.some((v) => v.id === id) || points <= 0) return false;
  const before = g.relations[id] || 0;
  // 0.11 : promenades en barque, +1 à +3 points à chaque gain.
  points += embellishmentValue(g, 'barque');
  g.friendship[id] = Math.min(HEART_STEPS[5], (g.friendship[id] || 0) + points);
  g.relations[id] = Math.min(5, HEART_STEPS.filter((n) => g.friendship[id] >= n).length - 1);
  return g.relations[id] > before;
}
export function festivalTheme(g: Game) {
  return FESTIVAL_THEMES[g.festival.entries % FESTIVAL_THEMES.length];
}
export function canAdvanceSeason(g: Game, now?: number) {
  return level(g) >= SEED_FIND_LEVEL && !!fairEntry(g) && g.harvests - g.season.startedHarvests >= 4 &&
    (g.orders > g.season.startedOrders || g.crafted > g.season.startedCrafted) &&
    (now === undefined || seasonReadyAt(g) <= now);
}
/** 0.11 : une saison dure au moins 8 h, soit trois foires par jour au plus. */
export function seasonReadyAt(g: Game) {
  return g.season.startedAt ? g.season.startedAt + SEASON_MIN_MS : 0;
}
/** 0.11 : la foire paie selon le niveau (×1,16 au niveau 7, ×2,6 au niveau 25). */
export function fairPay(g: Game, score: number) {
  const factor = 0.6 + level(g) * 0.08;
  return { coins: Math.round((45 + score * 2) * factor), xp: Math.round((20 + score) * factor) };
}
export function fairEntry(g: Game) {
  return g.season.fairs.find((entry) => entry.cycle === g.season.index);
}
export function fairCandidates(g: Game) {
  return Object.keys(g.stock).filter((key) => g.stock[key] > 0 &&
    (crop(key.split('|')[0]) || isFestivalDish(key)));
}
export function fairEvaluation(g: Game, items: readonly string[]) {
  const theme = seasonFor(g.season.index);
  const choices = [...new Set(items)].slice(0, 2);
  const ranks = choices.map((key) => itemQualityRank(key));
  const quality = choices.length ? Math.round(choices.reduce((sum, key, index) =>
    sum + (crop(key.split('|')[0]) ? 22 + ranks[index] * 12 : 21 + ranks[index] * 10), 0) / choices.length) : 0;
  const themeMatches = choices.filter((key) => {
    const base = key.split('|')[0];
    return (theme.crops as readonly string[]).includes(base) ||
      (recipe(base) && Object.keys(recipe(base)!.needs).some((id) => (theme.crops as readonly string[]).includes(id)));
  }).length;
  const matchedLineages = choices.map((key) => lineageById(g, itemLineageId(key))).filter((lineage): lineage is Lineage => !!lineage);
  const breakdown: FairBreakdown = {
    quality, theme: themeMatches * 10, variety: choices.length === 2 && choices[0].split('|')[0] !== choices[1].split('|')[0] ? 8 : 0,
    lineage: Math.min(16, matchedLineages.length * 9 + matchedLineages.filter((lineage) => lineage.orders > 0).length * 3),
    mastery: Math.round(choices.reduce((sum, key) => sum + (crop(key.split('|')[0])
      ? cropMastery(g, key.split('|')[0]) : recipeMastery(g, key.split('|')[0])) * 2, 0) / Math.max(1, choices.length)),
    village: Math.min(6, Math.max(...Object.values(g.relations), 0)),
  };
  return { theme, breakdown, score: Math.min(100, Object.values(breakdown).reduce((sum, n) => sum + n, 0)) };
}

/** Several independent offers; delivering one renews only its own position. */
/** 0.11 : cultures proposées par les commandes : les cinq plus récentes. */
export function orderPool(g: Game) {
  return CROPS.filter((item) => item.level <= level(g)).sort((a, b) => a.level - b.level).slice(-5);
}
/**
 * 0.11 : taille d’une commande de récoltes. Elle suit le niveau et la taille du
 * jardin (35 % des parcelles au niveau 1, 88 % au niveau 25, pour une culture de
 * 10 min), un peu plus pour les cultures rapides, un peu moins pour les lentes.
 */
export function orderUnits(g: Game, cropId: string, share = 1) {
  const plots = Math.max(6, g.plots.length);
  const time = crop(cropId)?.time || 60;
  const scale = 0.35 + 0.022 * (level(g) - 1);
  return Math.max(1, Math.min(40, Math.round(plots * scale * Math.pow(600 / time, 0.3) * share)));
}
/** 0.11 : XP d’une commande de récoltes, en plus de celle des récoltes elles-mêmes (part de leur XP). */
export const ORDER_XP_SHARE = 0.08;
function linesXP(lines: MenuLine[]) {
  return Math.round(lines.reduce((sum, line) => line.kind === 'item' && crop(line.item.split('|')[0])
    ? sum + crop(line.item.split('|')[0]).xp * line.amount * ORDER_XP_SHARE : sum, 0));
}
function linesValue(lines: MenuLine[]) {
  return lines.reduce((sum, line) => line.kind === 'item' ? sum + basePrice(line.item) * line.amount : sum, 0);
}
/** 0.11 : délai avant une nouvelle offre au même emplacement, en minutes (plein effet dès le niveau 10). */
export const ORDER_COOLDOWN_MIN: Record<OrderKind, number> = {
  simple: 20, market: 30, dish: 30, baker: 30, grand: 45, prestige: 60, personal: 60, signature: 60,
};
export function orderCooldownMs(g: Game, kind: OrderKind) {
  const ramp = Math.min(1, Math.max(0.1, (level(g) - 2) / 8));
  return Math.round(ORDER_COOLDOWN_MIN[kind] * ramp * 60_000);
}
/** Heure à laquelle l’emplacement propose de nouveau une offre (0 : tout de suite). */
export function orderReadyAt(g: Game, slot: number) {
  return g.orderReady?.[slot] || 0;
}
export function orderAvailable(g: Game, slot: number, now: number) {
  return orderReadyAt(g, slot) <= now;
}

/** Several independent offers; delivering one renews only its own position. */
export function orderBoard(g: Game): (VillageOrder & { slot: number })[] {
  const current = level(g);
  const available = CROPS.filter((item) => item.level <= current);
  const counters = g.orderSlots || [g.orders, 0, 0, 0, 0, 0, 0, 0, 0];
  const pool = orderPool(g);
  const pickCrop = (offset: number) =>
    pool[((counters[offset] || 0) + offset) % pool.length];
  const result: (VillageOrder & { slot: number })[] = [];
  // 0.11 : la commande de Marcel varie (panier, cageot, belle récolte, saison, grande commande)
  // et grandit avec le niveau et le jardin.
  const marcelCycle = counters[0] || 0;
  const discovery = g.pendingCrop && crop(g.pendingCrop)?.level <= current ? crop(g.pendingCrop) : null;
  const seasonal = available.filter((item) => (seasonFor(g.season.index).crops as readonly string[]).includes(item.id))
    .sort((a, b) => b.level - a.level);
  const variant = discovery ? 'discovery'
    : marcelCycle % 4 === 1 && current >= 5 && pool.length >= 3 ? 'mixed'
    : marcelCycle % 4 === 2 && canProduceQuality(g, 'belle') ? 'belle'
    : marcelCycle % 4 === 3 && current >= UNLOCKS.bigOrders ? 'large'
    : marcelCycle % 4 === 3 && current >= SEED_FIND_LEVEL && seasonal.length >= 2 ? 'season'
    : 'single';
  const main = discovery || pickCrop(0);
  const second = pool[(pool.indexOf(main) + 2) % pool.length];
  const simpleLines: MenuLine[] =
    variant === 'discovery' ? [{ kind: 'item', item: main.id, amount: orderUnits(g, main.id, 0.5) }]
    : variant === 'mixed' ? [
        { kind: 'item', item: main.id, amount: orderUnits(g, main.id, 0.55) },
        { kind: 'item', item: second.id, amount: orderUnits(g, second.id, 0.55) },
      ]
    : variant === 'belle' ? [{ kind: 'item', item: pickCrop(1).id + '|belle', amount: orderUnits(g, pickCrop(1).id, 0.4) }]
    : variant === 'large' ? [{ kind: 'item', item: main.id, amount: orderUnits(g, main.id, 2) }]
    : variant === 'season' ? seasonal.slice(0, 2).map((item) => ({ kind: 'item', item: item.id, amount: orderUnits(g, item.id, 0.5) }))
    : [{ kind: 'item', item: main.id, amount: orderUnits(g, main.id) }];
  const simpleTitle = { discovery: 'Panier du jardin', single: 'Panier du jardin', mixed: 'Cageot mixte',
    belle: 'Belle récolte', large: 'Grande commande du jardin', season: 'Produits de saison' }[variant];
  const simpleNote = {
    discovery: 'Une nouvelle culture à faire goûter au village.',
    single: 'Une récolte de qualité supérieure est acceptée.',
    mixed: 'Deux récoltes pour garnir le cageot.',
    belle: 'Seules les belles récoltes (ou mieux) conviennent.',
    large: 'Le double d’un panier, pour les grandes tablées.',
    season: `Les produits de ${seasonFor(g.season.index).label}, mieux payés.`,
  }[variant];
  const first = simpleLines[0] as Extract<MenuLine, { kind: 'item' }>;
  result.push({
    slot: 0, kind: 'simple', title: simpleTitle, note: simpleNote,
    lines: simpleLines,
    crop: first.item.split('|')[0], amount: simpleLines.reduce((n, line) => n + (line.kind === 'item' ? line.amount : 0), 0),
    reward: Math.round(linesValue(simpleLines) * (variant === 'season' ? 1.15 : 1) + 15 + Math.min(variant === 'large' ? 30 : 20, marcelCycle) * 3),
    xp: 20 + linesXP(simpleLines) + Math.min(20, marcelCycle),
    person: 'Marcel, le maraîcher',
  });
  if (current >= UNLOCKS.marketBasket) {
    // 0.11 : le panier assorti suit le niveau (3 à 5 cultures, 1 à 3 de chaque).
    const count = Math.min(available.length, current < 10 ? 3 : current < 18 ? 4 : 5);
    const each = current < 8 ? 1 : current < 16 ? 2 : 3;
    const top = [...available].sort((a, b) => b.level - a.level).slice(0, 6);
    const mean = top.reduce((sum, item) => sum + item.price, 0) / Math.max(1, top.length);
    const minValue = Math.max(count === 2 ? 18 : 30, Math.round(count * each * mean * 0.6));
    result.push({
      slot: 1, kind: 'market', title: 'Panier assorti',
      note: each > 1 ? `${count} cultures différentes, ${each} de chaque, au choix.` : 'Plusieurs cultures différentes, au choix.',
      lines: [{ kind: 'distinct', count, minValue, ...(each > 1 ? { each } : {}) }],
      crop: pickCrop(1).id, amount: count * each,
      reward: Math.round(minValue * 1.55 + 25 + Math.min(20, counters[1] || 0) * 4),
      xp: 30 + Math.round(minValue / 10) + Math.min(20, counters[1] || 0) * 2,
      person: 'Émile, pour son étal',
    });
  }
  const recipes = RECIPES.filter((r) => !r.parent && !recipeLock(g, r));
  // 0.11.1 : les commandes de cuisine visent les cinq recettes les plus fines de la ferme,
  // comme les commandes de récoltes visent les cultures récentes.
  const dishPool = [...recipes].sort((a, b) => b.price - a.price).slice(0, 5);
  if (g.upgrades.includes('workshop') && recipes.length) {
    const chosen = dishPool[(counters[2] || 0) % dishPool.length];
    const item = chosen.id + '|rustique';
    // 0.11 : deux portions à partir du niveau 15 ; 0.11.1 : trois à partir du niveau 20.
    const portions = current >= 20 ? 3 : current >= 15 ? 2 : 1;
    result.push({
      slot: 2, kind: 'dish', title: 'À la table du village',
      note: portions > 1 ? `${portions === 3 ? 'Trois' : 'Deux'} portions, rustiques ou meilleures.` : 'Le plat demandé peut être rustique ou meilleur.',
      lines: [{ kind: 'item', item, amount: portions }],
      crop: item, amount: portions,
      reward: Math.round(Math.max(basePrice(item) * 1.55, Object.entries(chosen.needs).reduce((n, [id, amount]) => n + basePrice(id) * amount, 0) * 1.28) * portions + 20),
      xp: 45 * portions + Math.min(20, counters[2] || 0) * 2,
      person: 'Lucie, la boulangère',
    });
  }
  if (current >= UNLOCKS.signatures && g.upgrades.includes('workshop') && recipes.length >= 2) {
    const first = dishPool[(counters[3] || 0) % dishPool.length];
    const second = dishPool[((counters[3] || 0) + 1) % dishPool.length];
    const lines: MenuLine[] = [
      { kind: 'item', item: first.id + '|rustique', amount: 1 },
      { kind: 'item', item: second.id + '|rustique', amount: 1 },
    ];
    result.push({
      slot: 3, kind: 'grand', title: 'Grande commande',
      note: 'Deux plats précis, sans limite de temps.',
      lines, crop: first.id + '|rustique', amount: 2,
      reward: Math.round((basePrice(first.id + '|rustique') + basePrice(second.id + '|rustique')) * 1.55 + 45),
      xp: 85 + Math.min(20, counters[3] || 0) * 3,
      person: 'Jeanne, pour la tablée',
    });
  }
  if (g.projects.done.includes('grand-banquet') && coursesAvailable(g)) {
    const lines: MenuLine[] = [
      { kind: 'course', course: 'entree', minOutcome: 'rustique' },
      { kind: 'course', course: 'plat', minOutcome: 'rustique' },
      { kind: 'course', course: 'dessert', minOutcome: 'rustique' },
    ];
    result.push({
      slot: 4, kind: 'prestige', title: 'Menu de la grande table',
      note: 'Une entrée, un plat et un dessert, selon vos recettes.',
      lines, crop: 'veloute|rustique', amount: 3,
      reward: Math.round(RECIPES.filter((r) => !r.parent && !recipeLock(g, r))
        .slice(0, 3).reduce((sum, r) => sum + basePrice(r.id + '|rustique'), 0) * 1.65 + 100),
      xp: 150 + Math.min(20, counters[4] || 0) * 4,
      person: 'Clara, pour le banquet',
    });
  }
  if (current >= UNLOCKS.marketBasket) {
    const eligible = LINKS.filter((link) => current >= link.level &&
      (!link.orderItem.includes('|') || g.upgrades.includes('workshop')));
    const link = eligible[(counters[5] || 0) % eligible.length];
    if (link) {
      const item = link.orderItem;
      const dish = item.includes('|');
      const unit = basePrice(item);
      // 0.11 : les commandes des voisins grandissent avec le niveau.
      const orderAmount = link.orderAmount * (1 + Math.floor(Math.max(0, current - link.level) / (dish ? 10 : 4)));
      result.push({ slot: 5, kind: 'personal', villagerId: link.id,
        title: 'Pour ' + link.name, person: link.name + ', ' + link.specialty.toLowerCase(),
        note: '+4 amitié · ' + link.quote,
        lines: [{ kind: 'item', item, amount: orderAmount }],
        crop: item, amount: orderAmount,
        reward: Math.round(unit * orderAmount * (dish ? 1.55 : 1.3) + (dish ? 25 : 12)),
        xp: dish ? 42 : 25,
      });
    }
  }
  if (g.skillChoices.commerce === 'deux-comptoirs') {
    const extra = pickCrop(6);
    const count = orderUnits(g, extra.id, 0.6);
    result.push({ slot: 6, kind: 'simple', title: 'Second comptoir',
      note: 'Une autre récolte à livrer, à votre rythme.',
      lines: [{ kind: 'item', item: extra.id, amount: count }],
      crop: extra.id, amount: count,
      reward: Math.round(basePrice(extra.id) * count + 15 + extra.time / 12),
      xp: 20, person: 'Émile, pour son second étal' });
  }
  const recognized = g.lineages.filter((lineage) => lineage.harvests > 0 && crop(lineage.crop)?.level <= current);
  if (recognized.length) {
    const lineage = recognized[(counters[7] || 0) % recognized.length];
    const amount = (counters[7] || 0) > 1 ? 2 : 1;
    const item = `${lineage.crop}|ordinaire|l${lineage.id}`;
    result.push({ slot: 7, kind: 'signature', title: `La variété ${lineage.name}`,
      note: `Spécialité reconnue du village · ${lineage.name}. Une meilleure qualité convient aussi.`,
      lines: [{ kind: 'item', item, amount }], crop: item, amount,
      reward: Math.round(basePrice(lineage.crop) * amount * 1.55 + 24 + crop(lineage.crop).time / 12),
      xp: 38 + amount * 9, person: 'Marcel, au nom des voisins', villagerId: 'marcel' });
    if (hasReward(g, 'halle') && recipes.length) {
      const dish = recipes[(counters[8] || 0) % recipes.length];
      const dishItem = `${dish.id}|rustique`;
      result.push({ slot: 8, kind: 'signature', title: 'La halle des terroirs',
        note: `Votre ${lineage.name} accompagné d’un plat de l’atelier.`,
        lines: [{ kind: 'item', item, amount: 1 }, { kind: 'item', item: dishItem, amount: 1 }],
        crop: item, amount: 2,
        reward: Math.round(basePrice(lineage.crop) * 1.6 + basePrice(dishItem) * 1.65 + 45),
        xp: 92, person: 'Jeanne, pour la halle', villagerId: 'jeanne' });
    }
  }
  // Les menus alternent dans leur propre emplacement : livrer ailleurs ne les renouvelle pas.
  const cycle = counters[2] || 0;
  const progression = Math.min(30, cycle) * 3;
  const menuXP = 20 + Math.min(30, cycle) * 2;
  const culinary = result.findIndex((offer) => offer.slot === 2);
  if (!g.pendingCrop && culinary >= 0) {
    if (current >= UNLOCKS.prestigeMenu && cycle % 8 === 7 && coursesAvailable(g)) {
      const value = (['entree', 'plat', 'dessert'] as Course[]).reduce((sum, course) => {
        const prices = recipes.filter((r) => RECIPE_COURSES[r.id] === course).map((r) => r.price);
        return sum + prices.reduce((a, b) => a + b, 0) / prices.length;
      }, 0);
      result[culinary] = {
        slot: 2, kind: 'prestige', title: 'Repas prestigieux',
        note: 'Chaque plat savoureux ajoute 10 %, chaque chef-d’œuvre 20 %.',
        lines: [
          { kind: 'course', course: 'entree', minOutcome: 'reussi' },
          { kind: 'course', course: 'plat', minOutcome: 'reussi' },
          { kind: 'course', course: 'dessert', minOutcome: 'reussi' },
        ],
        crop: recipes[0].id + '|reussi', amount: 3,
        reward: Math.round(value * 1.35 + 60 + progression), xp: menuXP * 3,
        person: 'Clara, pour ses invités',
      };
    } else if (current >= UNLOCKS.bakerMenu && cycle % 6 === 5 && !recipeLock(g, recipe('pain')!)) {
      result[culinary] = {
        slot: 2, kind: 'baker', title: 'Menu du boulanger',
        note: 'Un pain plus réussi que demandé reste accepté.',
        lines: [
          { kind: 'item', item: 'ble', amount: 3 },
          { kind: 'item', item: 'carotte|belle', amount: 1 },
          { kind: 'item', item: 'pain|reussi', amount: 1 },
        ],
        crop: 'pain|reussi', amount: 5,
        reward: Math.round((3 * 17 + 18.2 + 76) * 1.3 + 30 + progression),
        xp: menuXP * 2, person: 'Lucie, la boulangère',
      };
    }
  }
  // 0.9.2 : une commande paie nettement mieux que la vente au panier.
  return result.map((offer) => ({ ...offer, reward: Math.round(offer.reward * (offer.kind === 'simple' && hasReward(g, 'silo') ? 1.2 : 1) * ((g.relations.emile || 0) >= 3 ? 1.15 : 1) * ORDER_PREMIUM) }));
}
/** Prime des commandes sur leur valeur de base (0.9.2). */
export const ORDER_PREMIUM = 1.6;
/** Vente directe des cultures tardives (à partir du niveau 19) : les commandes en valent mieux. */
export const LATE_CROP_SALE = 0.8;
/** Cultures tardives (citrouille, raisin, melon) : vente directe à 80 %. */
export const LATE_CROP_LEVEL = 19;

export type MenuPlan = {
  possible: boolean;
  used: Record<string, number>;
  usesSuperior: boolean;
  /** Réussite de chaque ligne, dans l’ordre des lignes demandées. */
  status: boolean[];
  /** Produits retenus pour chaque ligne. */
  picks: Record<string, number>[];
};
function distinctPick(
  left: Record<string, number>,
  count: number,
  minValue: number,
  each = 1,
) {
  // Chaque culture propose quelques « lots » de `each` unités : du plus modeste
  // au plus beau, pour atteindre la valeur minimale sans gaspiller la qualité.
  type Bundle = { used: Record<string, number>; rank: number; value: number };
  const groups: Bundle[][] = CROPS.map((c) => {
    const keys = Object.keys(left).filter((key) => key.split('|')[0] === c.id && left[key] > 0)
      .sort((a, b) => itemQualityRank(a) - itemQualityRank(b) || basePrice(a) - basePrice(b));
    const total = keys.reduce((sum, key) => sum + left[key], 0);
    if (total < each) return [];
    const fill = (order: string[]) => {
      const used: Record<string, number> = {};
      let remaining = each, rank = 0, value = 0;
      for (const key of order) {
        const n = Math.min(remaining, left[key]);
        if (!n) continue;
        used[key] = n; remaining -= n; rank += itemQualityRank(key) * n; value += basePrice(key) * n;
        if (!remaining) break;
      }
      return { used, rank, value };
    };
    if (each === 1) return keys.slice(0, 4).map((key) => ({ used: { [key]: 1 }, rank: itemQualityRank(key), value: basePrice(key) }));
    const low = fill(keys);
    const high = fill([...keys].reverse());
    return JSON.stringify(low.used) === JSON.stringify(high.used) ? [low] : [low, high];
  }).filter((bundles) => bundles.length);
  let best: Bundle | null = null;
  const search = (start: number, chosen: Bundle[], rank: number, value: number) => {
    if (chosen.length === count) {
      if (value >= minValue && (!best || rank < best.rank || (rank === best.rank && value < best.value))) {
        const used: Record<string, number> = {};
        chosen.forEach((bundle) => Object.entries(bundle.used).forEach(([key, n]) => { used[key] = (used[key] || 0) + n; }));
        best = { used, rank, value };
      }
      return;
    }
    for (let i = start; i < groups.length; i++)
      for (const bundle of groups[i])
        search(i + 1, [...chosen, bundle], rank + bundle.rank, value + bundle.value);
  };
  search(0, [], 0, 0);
  return best as Bundle | null;
}
export function planMenu(
  stock: Record<string, number>,
  lines: readonly MenuLine[],
): MenuPlan {
  const left: Record<string, number> = { ...stock };
  const used: Record<string, number> = {};
  const status = lines.map(() => false);
  const picks: Record<string, number>[] = lines.map(() => ({}));
  let usesSuperior = false;
  const take = (index: number, id: string, n: number) => {
    left[id] -= n;
    used[id] = (used[id] || 0) + n;
    picks[index][id] = (picks[index][id] || 0) + n;
  };
  const priority = { item: 0, course: 1, distinct: 2 } as const;
  const orderIndexes = lines
    .map((line, index) => index)
    .sort((a, b) => priority[lines[a].kind] - priority[lines[b].kind]);
  for (const index of orderIndexes) {
    const line = lines[index];
    if (line.kind === 'item') {
      const f = fulfillment(left, line.item, line.amount);
      if (!f.possible) continue;
      Object.entries(f.used).forEach(([id, n]) => take(index, id, n));
      usesSuperior ||= f.usesSuperior;
      status[index] = true;
    } else if (line.kind === 'course') {
      const min = outcomeRank(line.minOutcome);
      const candidate = Object.keys(left)
        .filter(
          (id) =>
            (left[id] || 0) > 0 &&
            dishCourse(id) === line.course &&
            outcomeRank(dishParts(id).qualityId) >= min,
        )
        .sort(
          (a, b) =>
            outcomeRank(dishParts(a).qualityId) -
              outcomeRank(dishParts(b).qualityId) ||
            basePrice(a) - basePrice(b),
        )[0];
      if (!candidate) continue;
      take(index, candidate, 1);
      usesSuperior ||= outcomeRank(dishParts(candidate).qualityId) > min;
      status[index] = true;
    } else {
      const pick = distinctPick(left, line.count, line.minValue, line.each || 1);
      if (!pick) continue;
      Object.entries(pick.used).forEach(([id, n]) => take(index, id, n));
      usesSuperior ||= pick.rank > 0;
      status[index] = true;
    }
  }
  return {
    possible: status.every(Boolean),
    used,
    usesSuperior,
    status,
    picks,
  };
}
/** Récompense finale d’une commande, selon les produits réellement utilisés. */
export function orderReward(
  g: Game,
  o: VillageOrder,
  plan: MenuPlan,
  now: number,
) {
  let multiplier = 1;
  if (o.kind === 'prestige')
    multiplier += Object.entries(plan.used).reduce(
      (sum, [id, n]) =>
        sum + Math.max(0, outcomeRank(dishParts(id).qualityId) - 1) * 0.1 * n,
      0,
    );
  if (o.kind === 'market') {
    const event = marketEvent(g, now);
    if (
      event.mode === 0 &&
      Object.keys(plan.used).some((id) => id.split('|')[0] === event.target)
    )
      multiplier += 0.25;
  }
  return Math.round(o.reward * multiplier);
}
export function ingredientKeys(g: Game, id: string) {
  return Object.keys(g.stock).filter((key) => key.split('|')[0] === id && g.stock[key] > 0)
    .sort((a, b) => itemQualityRank(a) - itemQualityRank(b) || Number(!!itemLineageId(a)) - Number(!!itemLineageId(b)));
}
export function defaultIngredients(g: Game, r: Recipe) {
  const result: string[] = [];
  for (const [id, n] of Object.entries(r.needs)) {
    let left = n;
    for (const key of ingredientKeys(g, id)) {
      const take = Math.min(left, g.stock[key]);
      result.push(...Array(take).fill(key));
      left -= take;
    }
    result.push(...Array(left).fill(id));
  }
  return result;
}
/** 0.9.9 : la grande marmite cuit 1,5 fois plus longtemps. */
export const MARMITE_TIME = 1.5;
export function validIngredients(g: Game, r: Recipe, keys: string[], portions = 1) {
  if (!Array.isArray(keys) || keys.some((k) => typeof k !== 'string'))
    return false;
  const counts: Record<string, number> = {},
    bases: Record<string, number> = {};
  for (const k of keys) {
    counts[k] = (counts[k] || 0) + 1;
    const base = k.split('|')[0];
    bases[base] = (bases[base] || 0) + 1;
  }
  return (
    Object.entries(counts).every(
      ([k, n]) =>
        ingredientKeys(g, k.split('|')[0]).includes(k) &&
        (g.stock[k] || 0) >= n * portions,
    ) &&
    Object.keys(bases).length === Object.keys(r.needs).length &&
    Object.entries(r.needs).every(([k, n]) => bases[k] === n)
  );
}
export function ingredientQuality(keys: string[]) {
  return (
    keys.reduce(
      (sum, k) => sum + itemQualityRank(k),
      0,
    ) / Math.max(1, keys.length)
  );
}
export function harvestProbabilities(
  g: Game,
  id: string,
  watered: boolean,
  specialization = g.specializations[id],
  now?: number,
) {
  const rank = cropMastery(g, id);
  const bonus =
    (watered ? 0.08 : 0) +
    (watered && g.skillChoices.culture === 'terre-soignee' ? 0.08 : 0) +
    (g.upgrades.includes('tools') ? 0.05 : 0) +
    (rank >= 4 ? 0.1 : 0) +
    ((g.relations.marcel || 0) >= 3 ? 0.05 : 0);
  const longCropBonus = Math.min(0.12, crop(id).time / 60000);
  const exceptional =
    0.01 +
    (rank >= 4 ? 0.04 : 0) +
    (specialization === 'artisanale' ? 0.16 : 0) +
    (watered ? 0.02 : 0) +
    (buffActive(g, 'rarete', now) ? 0.04 : 0) +
    longCropBonus * 0.35;
  const beautiful =
    0.1 +
    bonus +
    longCropBonus +
    (specialization === 'artisanale' ? 0.15 : 0) +
    (buffActive(g, 'qualite', now) ? 0.08 : 0) +
    ((POLLINATED as readonly string[]).includes(id) ? embellishmentValue(g, 'ruches') : 0);
  return [1 - beautiful - exceptional, beautiful, exceptional];
}
function rollIndex(probabilities: number[], random: () => number) {
  let roll = random();
  for (let i = 0; i < probabilities.length; i++) {
    roll -= probabilities[i];
    if (roll < 0) return i;
  }
  return probabilities.length - 1;
}
export function upgradeCost(g: Game, id: string) {
  if (id === 'expand') return 35 * Math.pow(2, Math.floor((g.plots.length - 6) / 3));
  const path = UPGRADE_PATHS[id as UpgradePathId];
  if (path) return path.costs[Math.min(4, upgradeTier(g, id as UpgradePathId))];
  return UPGRADES.find((u) => u.id === id)!.cost;
}
export function maxPlots(g: Game) {
  const current = level(g);
  return PLOT_STEPS[EXTENSION_LEVELS.filter((value) => current >= value).length];
}
export const MISSIONS = [
  {
    id: 'first',
    title: 'Les mains dans la terre',
    desc: 'Récoltez 3 plantes',
    target: 3,
    field: 'harvests',
    reward: 20,
  },
  {
    id: 'market',
    title: 'Du jardin au panier',
    desc: 'Vendez pour 50 pièces',
    target: 50,
    field: 'sold',
    reward: 30,
  },
  {
    id: 'village',
    title: 'Un voisin sur qui compter',
    desc: 'Livrez 3 commandes',
    target: 3,
    field: 'orders',
    reward: 80,
  },
  {
    id: 'cook',
    title: 'Le goût du fait maison',
    desc: 'Récupérez 5 recettes',
    target: 5,
    field: 'crafted',
    reward: 120,
  },
  {
    id: 'garden',
    title: 'Un jardin d’abondance',
    desc: 'Récoltez 100 plantes',
    target: 100,
    field: 'harvests',
    reward: 200,
  },
  {
    id: 'master',
    title: 'Le bonheur se cultive',
    desc: 'Récoltez 500 plantes',
    target: 500,
    field: 'harvests',
    reward: 700,
  },
] as const;

export type GoalCategory = 'Ferme' | 'Cuisine' | 'Village' | 'Maîtrise' | 'Collection';
export type Goal = {
  id: string; title: string; desc: string; category: GoalCategory;
  target: number; reward: number; xp: number; seeds?: { id: string; amount: number };
};
export const GOALS: Goal[] = [
  ...MISSIONS.map((mission) => ({
    ...mission,
    category: mission.id === 'market' || mission.id === 'village' ? 'Village' as const
      : mission.id === 'cook' ? 'Cuisine' as const : 'Ferme' as const,
    xp: 15,
  })),
  { id: 'first-project', title: 'Une idée qui rassemble', desc: 'Achever un projet du village', category: 'Village', target: 1, reward: 100, xp: 60 },
  { id: 'first-dish', title: 'La première assiette', desc: 'Récupérer un plat de l’atelier', category: 'Cuisine', target: 1, reward: 60, xp: 35, seeds: { id: 'tomate', amount: 2 } },
  { id: 'three-crops', title: 'Trois couleurs au potager', desc: 'Découvrir 3 cultures différentes', category: 'Collection', target: 3, reward: 45, xp: 25, seeds: { id: 'salade', amount: 3 } },
  { id: 'first-specialization', title: 'Le geste choisi', desc: 'Choisir une spécialisation de culture', category: 'Maîtrise', target: 1, reward: 80, xp: 45 },
  { id: 'neighbor', title: 'Un vrai voisin', desc: 'Atteindre 3 cœurs avec un villageois', category: 'Village', target: 1, reward: 90, xp: 60 },
  { id: 'festival-goal', title: 'À la table de la fête', desc: 'Présenter un plat au jury', category: 'Cuisine', target: 1, reward: 75, xp: 45 },
  { id: 'grand-contract', title: 'La grande livraison', desc: 'Livrer une grande commande', category: 'Village', target: 1, reward: 250, xp: 100 },
  { id: 'six-crops', title: 'L’album des saisons', desc: 'Découvrir 6 cultures différentes', category: 'Collection', target: 6, reward: 160, xp: 85, seeds: { id: 'mais', amount: 3 } },
  { id: 'all-tools', title: 'Une ferme bien équipée', desc: 'Installer arrosoir, outils et semis', category: 'Ferme', target: 3, reward: 300, xp: 120 },
  { id: 'banquet-goal', title: 'Les savoir-faire réunis', desc: 'Achever le grand banquet', category: 'Village', target: 1, reward: 900, xp: 300 },
  { id: 'first-lineage', title: 'Une variété à soi', desc: 'Stabiliser la première lignée de la ferme', category: 'Ferme', target: 1, reward: 75, xp: 45, seeds: { id: 'radis', amount: 2 } },
  { id: 'first-specialty', title: 'Le village la connaît', desc: 'Livrer une commande de spécialité', category: 'Village', target: 1, reward: 130, xp: 70, seeds: { id: 'carotte', amount: 2 } },
  { id: 'first-fair', title: 'À la foire des terroirs', desc: 'Présenter une foire saisonnière', category: 'Village', target: 1, reward: 110, xp: 60 },
  { id: 'three-lineages', title: 'Le nom de la ferme', desc: 'Créer trois variétés différentes', category: 'Collection', target: 3, reward: 340, xp: 170 },
  { id: 'three-terroirs', title: 'Des terres aménagées', desc: 'Aménager les trois terroirs', category: 'Ferme', target: 3, reward: 420, xp: 210 },
  { id: 'fair-circuit', title: 'Les quatre saisons', desc: 'Présenter quatre foires', category: 'Collection', target: 4, reward: 500, xp: 240 },
];
export function goalProgress(g: Game, goal: Goal) {
  const legacy = MISSIONS.find((mission) => mission.id === goal.id);
  if (legacy) return g[legacy.field];
  switch (goal.id) {
    case 'first-project': return g.projects.done.length;
    case 'first-dish': return g.crafted;
    case 'three-crops':
    case 'six-crops': return Object.keys(g.collection).filter((id) => (g.collection[id] || 0) > 0).length;
    case 'first-specialization': return Object.keys(g.specializations).length;
    case 'neighbor': return Object.values(g.relations).some((hearts) => hearts >= 3) ? 1 : 0;
    case 'festival-goal': return g.festival.entries;
    case 'grand-contract': return g.grandOrders;
    case 'all-tools': return ['watering-can', 'tools', 'auto'].filter((id) => g.upgrades.includes(id)).length;
    case 'banquet-goal': return g.projects.done.includes('grand-banquet') ? 1 : 0;
    case 'first-lineage': case 'three-lineages': return g.lineages.length;
    case 'first-specialty': return g.signatureOrders;
    case 'first-fair': case 'fair-circuit': return g.season.fairs.length;
    case 'three-terroirs': return g.terroirBuilds.length;
    default: return 0;
  }
}

export function cookingProbabilities(
  g: Game,
  id = 'pain',
  keys: string[] = [],
  now?: number,
) {
  const stats = { ...g.stats };
  stats.mastery +=
    (g.relations.lucie || 0) * 1.5 + ((g.relations.lucie || 0) >= 5 ? 5 : 0);
  stats.creativity +=
    (g.relations.jeanne || 0) * 1.2 + ((g.relations.jeanne || 0) >= 5 ? 5 : 0);
  stats.luck +=
    (g.relations.clara || 0) * 1.8 + ((g.relations.clara || 0) >= 5 ? 5 : 0);
  const quality = ingredientQuality(keys),
    rank = recipeMastery(g, id);
  const r = recipe(id);
  const fruitDessert = !!r && RECIPE_COURSES[r.parent || r.id] === 'dessert' &&
    Object.keys(r.needs).some((cropId) => crop(cropId) &&
      cropFamily(cropId) === 'fruits' && g.specializations[cropId] === 'artisanale');
  const cropKnowledge = r ? Object.keys(r.needs)
    .filter((cropId) => !!crop(cropId))
    .reduce((sum, cropId) => sum + Math.max(0, cropMastery(g, cropId) - 1), 0) : 0;
  const steadyHand = g.skillChoices.cuisine === 'gout-sur' && quality >= 0.5;
  const inspired = buffActive(g, 'inspiration', now);
  const weights = [
    (hasReward(g, 'four') ? 0.5 : 1) *
      Math.max(
        0.03,
        0.54 -
          stats.mastery * 0.008 -
          stats.regularity * 0.006 -
          quality * 0.14 -
          (rank - 1) * 0.035,
      ),
    0.29 + stats.mastery * 0.006 + stats.precision * 0.003,
    0.13 +
      stats.creativity * 0.006 +
      stats.precision * 0.003 +
      quality * 0.15 +
      (rank - 1) * 0.025 +
      (inspired ? 0.06 : 0),
    0.04 +
      stats.creativity * 0.003 +
      stats.luck * 0.004 +
      quality * 0.07 +
      (rank - 1) * 0.015 +
      (inspired ? 0.03 : 0),
  ];
  weights[0] *= Math.max(0.76, 1 - cropKnowledge * 0.025);
  weights[2] += Math.min(0.08, cropKnowledge * 0.012);
  if (steadyHand) { weights[1] += weights[0]; weights[0] = 0; }
  if (fruitDessert) {
    weights[0] *= 0.86;
    weights[2] += 0.045;
    weights[3] += 0.025;
  }
  const usedLineages = keys.map((key) => lineageById(g, itemLineageId(key))).filter((entry): entry is Lineage => !!entry);
  if (usedLineages.some((lineage) => lineage.traits.includes('savoureuse'))) {
    weights[0] *= 0.78;
    weights[2] += 0.09;
  }
  if (usedLineages.some((lineage) => lineage.traits.includes('artisanale'))) {
    weights[0] *= 0.86;
    weights[1] += 0.05;
  }
  const cap = weights.reduce((a, b) => a + b, 0) * 0.24;
  if (weights[3] > cap) { weights[2] += weights[3] - cap; weights[3] = cap; }
  const total = weights.reduce((a, b) => a + b, 0);
  return weights.map((w) => w / total);
}
export function projectById(id: string) {
  return PROJECTS.find((project) => project.id === id);
}
export function projectAvailable(g: Game, project: VillageProject) {
  return level(g) >= project.level &&
    (!project.requires || project.requires.every((id) => g.projects.done.includes(id))) &&
    !g.projects.done.includes(project.id);
}
export function stepTarget(step: ProjectStep) {
  return step.kind === 'harvest' || step.kind === 'cook' || step.kind === 'sell' || step.kind === 'signatureOrder'
    ? step.amount
    : 1;
}
/** État du projet actif : étape courante et avancement. */
export function projectStatus(g: Game) {
  const project = g.projects?.active ? projectById(g.projects.active) : null;
  if (!project) return null;
  const progress = g.projects.progress[project.id] || { step: 0, count: 0 };
  const step = project.steps[progress.step];
  return {
    project,
    index: progress.step,
    step,
    count: Math.min(
      stepTarget(step),
      Math.max(progress.count, g.projects.evidence?.[project.id]?.[progress.step] || 0),
    ),
    target: stepTarget(step),
  };
}
type ProjectEvent =
  | { kind: 'harvest'; crop: string; quality: string; amount: number; lineage?: boolean }
  | { kind: 'cook'; recipe: string; outcome: string; signature?: boolean }
  | { kind: 'sell'; coins: number }
  | { kind: 'festival'; score: number }
  | { kind: 'fair'; score: number }
  | { kind: 'signatureOrder' };
function projectGain(step: ProjectStep, event: ProjectEvent) {
  if (step.kind === 'harvest' && event.kind === 'harvest')
    return (!step.lineageOnly || event.lineage) &&
      (step.crop === '*' || step.crop === event.crop) &&
      CROP_QUALITY.indexOf(event.quality) >=
        CROP_QUALITY.indexOf(step.minQuality || 'ordinaire')
      ? event.amount
      : 0;
  if (step.kind === 'cook' && event.kind === 'cook') {
    const base = recipe(event.recipe)?.parent || event.recipe;
    return (!step.signatureOnly || event.signature) &&
      (step.recipe === '*' || step.recipe === base) &&
      outcomeRank(event.outcome) >= outcomeRank(step.minOutcome)
      ? 1
      : 0;
  }
  if (step.kind === 'sell' && event.kind === 'sell') return event.coins;
  if (step.kind === 'festival' && event.kind === 'festival')
    return event.score >= step.minScore ? 1 : 0;
  if (step.kind === 'fair' && event.kind === 'fair') return event.score >= step.minScore ? 1 : 0;
  if (step.kind === 'signatureOrder' && event.kind === 'signatureOrder') return 1;
  return 0;
}
function completeProjectStep(g: Game, now: number): string {
  const status = projectStatus(g)!;
  const { project } = status;
  const next = status.index + 1;
  if (next < project.steps.length) {
    g.projects.progress[project.id] = { step: next, count: 0 };
    g.xp += 10;
    return ` · ${project.title} : étape ${next}/${project.steps.length} terminée (+10 XP)`;
  }
  g.projects.done.push(project.id);
  delete g.projects.progress[project.id];
  g.projects.active = null;
  g.coins += project.coins;
  g.xp += project.xp;
  if (project.reward === 'toque') {
    g.talentPoints += 3;
    (Object.keys(g.stats) as (keyof CookingStats)[]).forEach((stat) => {
      g.stats[stat] = Math.min(20, g.stats[stat] + 1);
    });
  }
  if (project.reward === 'verger') g.orchard = now;
  gainFriendship(g, project.host, 3);
  return ` · 🎉 ${project.title} accompli ! ${project.rewardName} débloqué · +${project.coins} pièces · +${project.xp} XP`;
}
function advanceReadyProject(g: Game, now: number) {
  const messages: string[] = [];
  while (true) {
    const status = projectStatus(g);
    if (!status || status.step.kind === 'deliver' || status.step.kind === 'fund' || status.count < status.target) break;
    messages.push(completeProjectStep(g, now));
  }
  return messages.join('');
}
function recordProject(g: Game, event: ProjectEvent, now: number) {
  for (const project of PROJECTS) {
    if (g.projects.done.includes(project.id)) continue;
    const evidence = (g.projects.evidence ??= {})[project.id] ??= project.steps.map(() => 0);
    project.steps.forEach((step, index) => {
      if (step.kind === 'deliver' || step.kind === 'fund') return;
      evidence[index] = Math.min(stepTarget(step), (evidence[index] || 0) + projectGain(step, event));
    });
  }
  const status = projectStatus(g);
  if (status) g.projects.progress[status.project.id].count = status.count;
  return advanceReadyProject(g, now);
}
/** Prior actions are credited once when a v5 save is migrated. */
function migrateProjectEvidence(raw: Record<string, unknown>, state: ProjectState) {
  const collection = raw.collection && typeof raw.collection === 'object'
    ? raw.collection as Record<string, number> : {};
  const recipeXP = raw.recipeXP && typeof raw.recipeXP === 'object'
    ? raw.recipeXP as Record<string, number> : {};
  const exceptional = raw.exceptional && typeof raw.exceptional === 'object'
    ? raw.exceptional as Record<string, number> : {};
  const dishBest = raw.dishBest && typeof raw.dishBest === 'object'
    ? raw.dishBest as Record<string, number> : {};
  const festival = raw.festival && typeof raw.festival === 'object'
    ? raw.festival as { bestScore?: number } : {};
  state.evidence ??= {};
  for (const project of PROJECTS) {
    const evidence = state.evidence[project.id] ??= project.steps.map(() => 0);
    project.steps.forEach((step, index) => {
      if (step.kind === 'deliver' || step.kind === 'fund') return;
      let historical = 0;
      if (step.kind === 'harvest' && !step.lineageOnly) {
        historical = step.crop === '*'
          ? Number(raw.harvests) || 0 : Number(collection[step.crop]) || 0;
        if (step.minQuality === 'exceptionnelle')
          historical = step.crop === '*'
            ? Object.values(exceptional).reduce((a, b) => a + (Number(b) || 0), 0)
            : Number(exceptional[step.crop]) || 0;
        if (step.minQuality === 'belle') historical = 0;
      }
      if (step.kind === 'sell') historical = Number(raw.sold) || 0;
      if (step.kind === 'cook' && !step.signatureOnly && step.recipe !== '*') {
        historical = step.minOutcome === 'rustique'
          ? Number(recipeXP[step.recipe]) || 0
          : (Number(dishBest[step.recipe]) || 0) >= outcomeRank(step.minOutcome) ? 1 : 0;
      }
      if (step.kind === 'cook' && !step.signatureOnly && step.recipe === '*')
        historical = step.minOutcome === 'rustique'
          ? Number(raw.crafted) || 0
          : Object.values(dishBest).filter((rank) => Number(rank) >= outcomeRank(step.minOutcome)).length;
      if (step.kind === 'festival')
        historical = (festival.bestScore || 0) >= step.minScore ? 1 : 0;
      evidence[index] = Math.min(stepTarget(step), Math.max(evidence[index], historical));
    });
  }
  if (state.active && state.progress[state.active]) {
    const entry = state.progress[state.active];
    entry.count = Math.max(entry.count, state.evidence?.[state.active]?.[entry.step] || 0);
  }
  return state;
}
export function eatableDish(id: string) {
  if (!isFestivalDish(id)) return undefined;
  const r = recipe(dishParts(id).recipeId)!;
  return DISH_EFFECTS[r.parent || r.id];
}
export function effectMinutes(id: string) {
  return EFFECT_MINUTES[dishParts(id).qualityId] || 10;
}
export function orchardFruit(g: Game) {
  return level(g) >= crop('myrtille').level ? 'myrtille' : 'fraise';
}
/** Points d’amitié d’un cadeau : favori, puis bonus de qualité. */
export function giftPoints(likes: readonly string[], key: string) {
  const [base, quality] = key.split('|');
  const liked =
    likes.includes(base) ||
    (isFestivalDish(key) && likes.includes(recipe(base)?.parent || base));
  const qualityBonus = crop(base)
    ? itemQualityRank(key)
    : isFestivalDish(key)
      ? Math.max(0, outcomeRank(quality) - 1)
      : 0;
  return (liked ? 2 : 1) + qualityBonus;
}
export function cookTime(g: Game, r: Recipe, now?: number, keys: string[] = []) {
  const base = r.parent || r.id;
  const ingredients = Object.keys(r.needs);
  const preppedSauce = base === 'sauce' && ingredients.some((id) =>
    crop(id) && cropFamily(id) === 'legumes' && g.specializations[id] === 'precoce');
  const artisanGrain = ingredients.some((id) =>
    crop(id) && cropFamily(id) === 'grains' && g.specializations[id] === 'artisanale');
  const artisanVegetable = ingredients.some((id) =>
    crop(id) && cropFamily(id) === 'legumes' && g.specializations[id] === 'artisanale');
  return (
    r.time *
    (hasReward(g, 'four') ? 0.8 : 1) *
    (buffActive(g, 'atelier', now) ? 0.75 : 1) *
    (preppedSauce ? 0.85 : 1) *
    (g.skillChoices.cuisine === 'mise-en-place' ? 0.8 : 1) *
    (artisanGrain || artisanVegetable ? 0.88 : 1) *
    (keys.some((key) => lineageById(g, itemLineageId(key))?.traits.includes('artisanale')) ? 0.85 : 1) *
    // 0.11 : farine fraîche du moulin pour les recettes au blé ou au maïs.
    (ingredients.some((id) => (MILLED as readonly string[]).includes(id)) ? 1 - embellishmentValue(g, 'moulin') : 1) *
    // 0.13 : le frais du chai pour les recettes au raisin ou au melon.
    (ingredients.some((id) => (CELLAR_INGREDIENTS as readonly string[]).includes(id)) ? 1 - restorationValue(g, 'chai') : 1)
  );
}
export function henFeed(g: Game) {
  return hasReward(g, 'silo') ? 2 : 3;
}
export const MAX_SEED_PURCHASE = 99;
export function maxAffordable(g: Game, id: string) {
  const c = crop(id);
  return c ? Math.min(MAX_SEED_PURCHASE, Math.floor(g.coins / c.cost)) : 0;
}
/** Plante une parcelle ; rachète une graine si le réglage l’autorise. */
function plantPlot(g: Game, cropId: string, index: number, now: number, lineageId?: number, garde = 0) {
  const c = crop(cropId);
  if (!c || c.level > level(g) || g.plots[index] !== null)
    return 'Cette parcelle n’est pas disponible.';
  if (garde && !gardeOptions(g).includes(garde)) return 'Ce semis de garde n’est pas encore disponible.';
  if (garde && lineageId) return 'Le semis de garde utilise des graines classiques.';
  const lineage = lineageById(g, lineageId);
  if (lineageId && (!lineage || lineage.crop !== c.id)) return 'Cette lignée ne correspond pas à la culture.';
  if (lineage && lineage.seeds < 1) return 'Cette lignée n’a plus de graines. La pépinière peut la multiplier.';
  let bought = false;
  if (lineage) lineage.seeds--;
  else if (!(g.seeds[c.id] > 0)) {
    if (!g.settings.autoBuySeeds || g.coins < c.cost)
      return 'Achetez des graines dans la graineterie.';
    g.coins -= c.cost;
    bought = true;
  } else g.seeds[c.id]--;
  const terroir = terroirForPlot(index);
  const growth = lineage ? lineageGrowFactor(lineage.traits) : 1;
  const ground = terroirGrowFactor(c.id, terroir, lineage?.traits || [], lineage?.nativeTerroir || null,
    g.terroirBuilds.includes('abrite'));
  if (garde) {
    // Semis de garde : durée fixe, pas besoin d’eau, rendement calculé au semis.
    g.plots[index] = {
      crop: c.id, start: now, end: now + garde * 3_600_000,
      specialization: g.specializations[c.id], watered: true,
      garde: gardeYield(g, c.id, garde, now),
    };
    return { name: `${c.name} (garde ${garde} h)`, bought };
  }
  g.plots[index] = {
    crop: c.id,
    start: now,
    end: now + Math.max(5, Math.round(growTime(g, c.id, now) * growth * ground)) * 1000,
    specialization: g.specializations[c.id],
    lineageId: lineage?.id,
    watered: false,
  };
  return { name: lineage ? lineage.name : c.name, bought };
}
function createSeedFind(g: Game, cropId: string, quality: string, terroir: TerroirId, now: number, seed: number, parentId?: number) {
  if (g.seedFinds.length >= 3) return false;
  const parent = lineageById(g, parentId);
  if (parentId && (!parent || parent.traits.length >= 2 || g.seedFinds.some((find) => find.parentId === parentId))) return false;
  const id = g.findSerial++;
  const options = candidateOptions(id * 7 + seed + cropId.length, parent?.traits || []);
  g.seedFinds.push({ id, crop: cropId, nativeTerroir: terroir, sourceQuality: quality,
    options, parentId, created: now });
  return true;
}
/** Parcelles concernées par un geste groupé, à cet instant. */
export function bulkEligible(g: Game, kind: BulkKind, now: number) {
  return g.plots.flatMap((plot, index) => {
    const eligible = kind === 'water' ? !!plot && !plot.watered && plot.end > now
      : kind === 'harvest' ? !!plot && plot.end <= now : plot === null;
    return eligible ? [index] : [];
  });
}
/** 0.18 : nom d’une tâche, pour les messages. */
export const CHORE_NAMES: Record<BulkKind, string> = { harvest: 'Récolter', sow: 'Semer', water: 'Arroser' };
/** Porte de gauche du potager : d’où Rosalie arrive quand on ne sait pas où elle est. */
const GARDEN_DOOR = { x: (POTAGER_DOORS[0].outside.x / WORLD_W) * 100, y: (POTAGER_DOORS[0].outside.y / WORLD_H) * 100 };
/**
 * 0.18 : choisit le prochain geste. Retire les tâches finies (plus rien à
 * faire, et aucune autre tâche active ne leur prépare de travail), puis vise la
 * parcelle la plus proche de Rosalie parmi toutes les tâches restantes.
 * Renvoie false quand il n’y a plus rien à faire.
 */
function planBulk(g: Game, job: BulkJob, now: number, from?: { x: number; y: number }) {
  let chores = bulkChores(job);
  const eligible = Object.fromEntries(chores.map((kind) => [kind, bulkEligible(g, kind, now)])) as Record<BulkKind, number[]>;
  for (let changed = true; changed;) {
    const kept = chores.filter((kind) => eligible[kind].length > 0 || chores.some((other) => CHORE_FEEDS[other] === kind));
    changed = kept.length !== chores.length;
    chores = kept;
  }
  job.chores = chores;
  const candidates = chores.flatMap((kind) => eligible[kind].map((index) => ({ kind, index })));
  if (!candidates.length) {
    job.targets = [];
    return false;
  }
  const origin = from && Number.isFinite(from.x) && Number.isFinite(from.y) ? from : null;
  const distance = (index: number) => origin ? pointWalk(origin, index)
    : job.lastIndex !== null ? plotWalk(job.lastIndex, index) : pointWalk(GARDEN_DOOR, index);
  const after = job.lastIndex ?? -1;
  const best = nearestChore(candidates, distance, after)!;
  // Même distance : Rosalie continue dans le sens de sa tournée.
  const order = (a: number, b: number) => distance(a) - distance(b) || Number(a <= after) - Number(b <= after) || a - b;
  job.kind = best.kind;
  job.targets = [best.index, ...eligible[best.kind].filter((index) => index !== best.index).sort(order)];
  job.total = job.completed + candidates.length;
  return true;
}
/** 0.18 : le prochain geste vu depuis Rosalie (pour la carte), sans rien changer. */
export function bulkNext(g: Game, now: number, from?: { x: number; y: number }) {
  if (!g.bulkJob) return null;
  const job = structuredClone(g.bulkJob);
  return planBulk(g, job, now, from) ? { kind: job.kind, index: job.targets[0] } : null;
}
/** 0.11 : arroser une parcelle ; l’eau de la fontaine retire une part du temps restant. */
function waterPlot(plot: NonNullable<Plot>, g: Game, now: number) {
  plot.watered = true;
  const boost = embellishmentValue(g, 'fontaine');
  if (boost && plot.end > now) plot.end = Math.max(now + 1000, Math.round(now + (plot.end - now) * (1 - boost)));
}
/** Récolte une parcelle mûre. Toute la logique de récolte passe par ici. */
function harvestPlot(
  g: Game,
  index: number,
  now: number,
  random: () => number,
) {
  const p = g.plots[index]!;
  const c = crop(p.crop);
  const rankBefore = cropMastery(g, c.id);
  const lineage = lineageById(g, p.lineageId);
  const terroir = terroirForPlot(index);
  const traits = lineage?.traits || [];
  const effectiveWatered = p.watered || traits.includes('robuste');
  const [, pretty, rare] = harvestProbabilities(g, c.id, effectiveWatered, p.specialization, now);
  const nativeBonus = lineage?.nativeTerroir === terroir ? 0.04 : 0;
  const humidBonus = terroir === 'humide' && p.watered ?
    (g.terroirBuilds.includes('humide') ? 0.1 : 0.05) : 0;
  const quickPenalty = traits.includes('precoce') ? 0.04 : 0;
  const exceptional = Math.min(0.28, Math.max(0, rare + nativeBonus / 4));
  const beautiful = Math.min(0.8 - exceptional, Math.max(0, pretty + nativeBonus + humidBonus - quickPenalty));
  const garde = p.garde && p.garde > 0 ? p.garde : 0;
  const odds = [Math.max(0, 1 - beautiful - exceptional), beautiful, exceptional];
  const quality = QUALITIES[rollIndex(odds, random)].id;
  const key = c.id + '|' + quality + (lineage ? '|l' + lineage.id : '');
  const stockKey = lineage ? key : quality === 'ordinaire' ? c.id : c.id + '|' + quality;
  const doubleChance = Math.min(0.7,
    (p.specialization === 'abondante' ? cropFamily(c.id) === 'grains' ? 0.45 : cropFamily(c.id) === 'primeurs' ? 0.4 : 0.35 : 0) +
    (traits.includes('abondante') ? 0.32 : 0) +
    (buffActive(g, 'abondance', now) ? 0.15 : 0) +
    embellishmentValue(g, 'pigeonnier') +
    // 0.13 : champs, bois et vignes restaurés.
    restorationDouble(g, c.id));
  const amount = garde || (doubleChance && random() < doubleChance ? 2 : 1);
  const xp = Math.round(c.xp * (buffActive(g, 'entrain', now) ? 1.2 : 1));
  const firstHarvest = !(g.collection[c.id] > 0);
  // 0.11 : un semis de garde tire la qualité de chaque unité ; la première suit le tirage ci-dessus.
  const extra: Record<string, number> = {};
  for (let unit = 1; unit < amount && garde; unit++) {
    const q = QUALITIES[rollIndex(odds, random)].id;
    const k = q === 'ordinaire' ? c.id : c.id + '|' + q;
    extra[k] = (extra[k] || 0) + 1;
    if (q === 'exceptionnelle') g.exceptional[c.id] = (g.exceptional[c.id] || 0) + 1;
  }
  const kept = garde ? amount - Object.values(extra).reduce((sum, n) => sum + n, 0) : amount;
  g.stock[stockKey] = (g.stock[stockKey] || 0) + kept;
  for (const [k, n] of Object.entries(extra)) g.stock[k] = (g.stock[k] || 0) + n;
  g.collection[c.id] = (g.collection[c.id] || 0) + amount;
  if (quality === 'exceptionnelle')
    g.exceptional[c.id] = (g.exceptional[c.id] || 0) + kept;
  g.cropXP[c.id] = (g.cropXP[c.id] || 0) + masteryGain(c.id);
  g.harvests++;
  g.xp += xp;
  let promising = false;
  if (lineage) {
    lineage.harvests++;
    const localHarvests = lineage.terroirHarvests ??= {};
    localHarvests[terroir] = (localHarvests[terroir] || 0) + 1;
    lineage.bestQuality = Math.max(lineage.bestQuality, itemQualityRank(stockKey));
    lineage.seeds += 1 + (hasReward(g, 'pepiniere') && lineage.harvests % 2 === 0 ? 1 : 0)
      + (terroir === 'soleil' && g.terroirBuilds.includes('soleil') && localHarvests[terroir]! % 3 === 0 ? 1 : 0);
    if (lineage.traits.length < 2 && lineage.harvests >= 3 && lineage.generation < 2 &&
      !g.seedFinds.some((find) => find.parentId === lineage.id))
      promising = createSeedFind(g, c.id, quality, terroir, now, p.start, lineage.id);
  } else if (garde || level(g) < SEED_FIND_LEVEL) {
    // Semis de garde : pas de graine prometteuse.
    // Les graines prometteuses attendent SEED_FIND_LEVEL (7), pour étaler les découvertes.
  } else if ((g.lineages.length === 0 && g.harvests >= 3 && (p.watered || quality !== 'ordinaire' || g.harvests >= 6)) ||
    (quality !== 'ordinaire' && (g.harvests + p.start) % 3 === 0) ||
    (p.watered && g.harvests % 7 === 0)) {
    promising = createSeedFind(g, c.id, quality, terroir, now, p.start);
  }
  g.plots[index] = null;
  const hearts = g.relations.marcel || 0;
  const bonus = hearts > 0 && g.harvests % (hearts >= 5 ? 2 : 5) === 0;
  if (bonus) g.seeds[c.id] = (g.seeds[c.id] || 0) + 1;
  if (firstHarvest) {
    g.seeds[c.id] = (g.seeds[c.id] || 0) +
      (g.skillChoices.culture === 'semencier' ? 2 : 1);
    recordSkill(g, 'culture', c.id);
  }
  const earlySeed = p.specialization === 'precoce' && cropFamily(c.id) === 'primeurs' && g.collection[c.id] % 4 === 0;
  if (earlySeed) g.seeds[c.id] = (g.seeds[c.id] || 0) + 1;
  const signature = cropMastery(g, c.id) === 5 && g.collection[c.id] % 5 === 0;
  if (signature) g.seeds[c.id] = (g.seeds[c.id] || 0) + 1;
  const project = recordProject(
    g,
    { kind: 'harvest', crop: c.id, quality, amount, lineage: !!lineage },
    now,
  );
  return {
    crop: c.id,
    // 0.11 : une garde mêle plusieurs qualités ; le message nomme la culture.
    key: garde && Object.keys(extra).length ? c.id : stockKey,
    quality,
    amount,
    xp,
    seeds: (bonus ? 1 : 0) + (signature ? 1 : 0) + (firstHarvest ? g.skillChoices.culture === 'semencier' ? 2 : 1 : 0) + (earlySeed ? 1 : 0),
    masteryUp: cropMastery(g, c.id) > rankBefore,
    project,
    promising,
  };
}
/** Récolte toutes les parcelles mûres et renvoie un message cumulé. */
function harvestEverything(g: Game, now: number, random: () => number) {
  let count = 0,
    finds = 0,
    beautiful = 0,
    exceptional = 0,
    xp = 0,
    seeds = 0;
  const projects: string[] = [];
  const mastered = new Map<string, string>();
  g.plots.forEach((plot, index) => {
    if (!plot || plot.end > now) return;
    const r = harvestPlot(g, index, now, random);
    count += r.amount;
    if (r.promising) finds++;
    if (r.quality === 'belle') beautiful += r.amount;
    if (r.quality === 'exceptionnelle') exceptional += r.amount;
    xp += r.xp;
    seeds += r.seeds;
    if (r.project) projects.push(r.project);
    if (r.masteryUp)
      mastered.set(
        r.crop,
        `${crop(r.crop).name} maîtrise ${cropMastery(g, r.crop)}`,
      );
  });
  if (!count) return '';
  return (
    `${count} récolte${count > 1 ? 's' : ''}` +
    (beautiful ? ` · ${beautiful} belle${beautiful > 1 ? 's' : ''}` : '') +
    (exceptional
      ? ` · ${exceptional} exceptionnelle${exceptional > 1 ? 's' : ''}`
      : '') +
    ` · +${xp} XP` +
    (seeds ? ` · +${seeds} graine${seeds > 1 ? 's' : ''}` : '') +
    (mastered.size ? ` · ${[...mastered.values()].join(', ')}` : '') +
    (finds ? ` · ${finds} graine${finds > 1 ? 's' : ''} prometteuse${finds > 1 ? 's' : ''} !` : '') +
    projects.join('')
  );
}
function collectEggs(g: Game, now: number) {
  if (!g.upgrades.includes('coop') || g.hens === null || g.hens > now)
    return '';
  // 0.13 : la paille de la grange restaurée donne des œufs en plus.
  const eggs = 4 + restorationValue(g, 'grange');
  g.stock.oeuf = (g.stock.oeuf || 0) + eggs;
  g.hens = null;
  g.xp += 15;
  return `+${eggs} œufs frais · +15 XP`;
}
function pickOrchard(g: Game, now: number, random: () => number) {
  if (g.orchard === null || g.orchard > now) return '';
  const fruit = orchardFruit(g);
  let exceptional = 0;
  for (let i = 0; i < 3; i++) if (random() < 0.2) exceptional++;
  if (3 - exceptional)
    g.stock[fruit + '|belle'] =
      (g.stock[fruit + '|belle'] || 0) + 3 - exceptional;
  if (exceptional) {
    g.stock[fruit + '|exceptionnelle'] =
      (g.stock[fruit + '|exceptionnelle'] || 0) + exceptional;
    g.exceptional[fruit] = (g.exceptional[fruit] || 0) + exceptional;
  }
  g.collection[fruit] = (g.collection[fruit] || 0) + 3;
  g.orchard = now + ORCHARD_DELAY;
  g.xp += 20;
  return `Cueillette du verger : +3 ${crop(fruit).name.toLowerCase()}s de qualité · +20 XP`;
}
function collectJob(g: Game, now: number, random: () => number) {
  // 0.9.9 : Rosalie sort d’un coup tous les plats prêts, de tous les fourneaux.
  const messages: string[] = [];
  stoveJobs(g).forEach((job, index) => {
    if (!job || job.end > now) return;
    setStove(g, index, null);
    messages.push(serveJob(g, job, now, random));
  });
  return messages.join(' · ');
}
function serveJob(g: Game, job: CookJob, now: number, random: () => number) {
  const prepared = job.id,
    qualityId =
      job.quality ||
      OUTCOMES[rollIndex(cookingProbabilities(g, prepared), random)].id,
    result = outcome(qualityId),
    key = `${prepared}|${qualityId}|v${job.ingredientValue || 0}${job.lineageId ? '|l' + job.lineageId : ''}`;
  const signature = !!job.lineageId;
  const portions = job.portions || 1;
  g.stock[key] = (g.stock[key] || 0) + portions;
  let talents = 0;
  for (let n = 0; n < portions; n++) {
    g.crafted++;
    if (g.crafted % 3 === 0) { g.talentPoints++; talents++; }
  }
  g.lastCooked = key;
  recordSkill(g, 'cuisine', recipe(prepared)?.parent || prepared);
  const masteryId = recipe(prepared)?.parent || prepared;
  g.recipeXP[masteryId] = (g.recipeXP[masteryId] || 0) + 1;
  g.dishBest[masteryId] = Math.max(
    g.dishBest[masteryId] ?? -1,
    outcomeRank(qualityId),
  );
  g.xp += result.xp * portions;
  let projects = '';
  for (let n = 0; n < portions; n++)
    projects += recordProject(
      g,
      { kind: 'cook', recipe: prepared, outcome: qualityId, signature },
      now,
    );
  return (
    `${result.icon} ${result.name} : ${recipe(prepared)?.name}${portions > 1 ? ' × ' + portions : ''}${signature ? ' · spécialité de ferme' : ''} · +${result.xp * portions} XP` +
    (qualityId === 'chef' ? ' ✨' : '') +
    (talents ? ` · +${talents} point${talents > 1 ? 's' : ''} de talent !` : '') +
    projects
  );
}
/** Réserve, sans rien consommer, ce que demandent des lignes de menu, même incomplètes. */
function reserveLines(
  stock: Record<string, number>,
  lines: readonly MenuLine[],
  reserved: Record<string, number>,
) {
  const left = (id: string) => (stock[id] || 0) - (reserved[id] || 0);
  const keep = (id: string, n: number) => {
    reserved[id] = (reserved[id] || 0) + n;
  };
  for (const line of lines) {
    if (line.kind === 'item') {
      let remaining = line.amount;
      for (const id of Object.keys(stock)
        .filter((id) => left(id) > 0 && satisfiesQuality(id, line.item))
        .sort((a, b) => itemQualityRank(a) - itemQualityRank(b) || Number(!!itemLineageId(a)) - Number(!!itemLineageId(b)))) {
        const n = Math.min(remaining, left(id));
        keep(id, n);
        remaining -= n;
        if (!remaining) break;
      }
    } else if (line.kind === 'course') {
      const min = outcomeRank(line.minOutcome);
      const dish = Object.keys(stock)
        .filter(
          (id) =>
            left(id) > 0 &&
            dishCourse(id) === line.course &&
            outcomeRank(dishParts(id).qualityId) >= min,
        )
        .sort(
          (a, b) =>
            outcomeRank(dishParts(a).qualityId) -
            outcomeRank(dishParts(b).qualityId),
        )[0];
      if (dish) keep(dish, 1);
    } else {
      // Panier de cultures différentes : `each` unités de chaque culture sont gardées (0.11).
      for (const c of CROPS) {
        let remaining = line.each || 1;
        for (const key of [c.id, c.id + '|belle', c.id + '|exceptionnelle']) {
          const n = Math.min(remaining, Math.max(0, left(key)));
          if (n) keep(key, n);
          remaining -= n;
          if (!remaining) break;
        }
      }
    }
  }
}
/** Produits réservés au projet actif et à la commande en cours. */
export function reservedStock(g: Game) {
  const reserved: Record<string, number> = {};
  for (const line of g.valley.cargo) reserved[line.item] = Math.min(g.stock[line.item] || 0, (reserved[line.item] || 0) + line.amount);
  const status = projectStatus(g);
  if (status?.step.kind === 'deliver')
    reserveLines(g.stock, status.step.lines, reserved);
  if (status?.step.kind === 'cook' && status.step.recipe !== '*') {
    const r = recipe(status.step.recipe);
    const remaining = status.target - status.count;
    if (r)
      reserveLines(
        g.stock,
        Object.entries(r.needs).map(([item, n]) => ({
          kind: 'item' as const,
          item,
          amount: n * remaining,
        })),
        reserved,
      );
  }
  for (const offer of orderBoard(g).sort((a, b) => Number(b.kind === 'signature') - Number(a.kind === 'signature')))
    reserveLines(g.stock, offer.lines, reserved);
  return reserved;
}
/**
 * « Vendre le superflu » : seules les récoltes et les œufs sont concernés.
 * Les plats, les récoltes exceptionnelles (semence, collection) et tout ce
 * que demandent le projet actif et la commande en cours sont gardés.
 */
export function surplus(g: Game, now: number) {
  const reserved = reservedStock(g);
  const sell: Record<string, number> = {};
  let count = 0,
    coins = 0,
    kept = 0;
  for (const [key, n] of Object.entries(g.stock)) {
    if (!(n > 0)) continue;
    const [base, quality] = key.split('|');
    if (!crop(base) && base !== 'oeuf') continue;
    const protectedAmount =
      quality === 'exceptionnelle' ? n : Math.min(n, Math.max(itemLineageId(key) ? 1 : 0, reserved[key] || 0));
    kept += protectedAmount;
    const amount = n - protectedAmount;
    if (amount <= 0) continue;
    sell[key] = amount;
    count += amount;
    coins += amount * price(g, key, now);
  }
  return { sell, count, coins, kept, reserved };
}
/** Les avis changent après une livraison dans la région, jamais avec l'heure. */
export function valleyRequests(g: Game, region: RegionId) {
  const choices = REGIONS[region].preference.filter((id) => {
    const c = crop(id);
    if (c) return c.level <= level(g);
    const r = recipe(id);
    return !!r && g.upgrades.includes('workshop') && !recipeLock(g, r);
  });
  const serial = g.valley.shipments[region];
  const visible = choices.length > 3
    ? [choices[serial % choices.length], choices[(serial + 1) % choices.length], choices[(serial + 2) % choices.length]]
    : choices;
  return [...new Set(visible)];
}
export function valleyUnlocked(g: Game) { return level(g) >= UNLOCKS.caravan; }
export function valleyReady(g: Game, now: number) { return !!g.valley.trip && g.valley.trip.returnAt <= now; }
/** Un recul d’horloge ne peut ajouter plus d’un cycle nominal à l’attente. */
function boundTimers(g: Game, now: number) {
  if (g.bulkJob && g.bulkJob.nextAt > now + gestureMs(g, g.bulkJob.kind)) g.bulkJob.nextAt = now;
  // 0.11 : après un recul d’horloge, un délai de commande ne dépasse jamais l’heure la plus longue,
  // et une saison ne commence pas dans le futur.
  if (g.orderReady?.some((at) => at > now + 60 * 60_000))
    g.orderReady = g.orderReady.map((at) => Math.min(at, now + 60 * 60_000));
  if (g.season.startedAt && g.season.startedAt > now) g.season.startedAt = now;
  if (g.hens !== null) g.hens = Math.min(g.hens, now + 120000);
  if (g.orchard !== null) g.orchard = Math.min(g.orchard, now + ORCHARD_DELAY);
  for (const job of [g.job, ...g.stoves]) {
    if (!job) continue;
    const nominal = job.start !== undefined && job.end > job.start
      ? job.end - job.start : cookTime(g, recipe(job.id)!, now) * (job.portions === 2 ? MARMITE_TIME : 1) * 1000;
    if (job.end > now + nominal) { job.start = now; job.end = now + nominal; }
  }
  const trip = g.valley.trip;
  if (trip) {
    const nominal = Math.min(trip.returnAt - trip.departedAt,
      (tourOf(trip.tour).seconds || REGIONS[trip.region].travel) * 1000);
    if (trip.returnAt > now + nominal) { trip.departedAt = now; trip.returnAt = now + nominal; }
  }
}
export function act(
  state: Game,
  action: string,
  arg: ActionArgument,
  now = Date.now(),
  random: () => number = Math.random,
): {
  g: Game;
  message: string;
  levelUp?: { level: number; crop: string | null; system: string };
  levelUps?: { level: number; crop: string | null; system: string }[];
} {
  const g = structuredClone(state);
  boundTimers(g, now);
  const payload = typeof arg === 'object' && arg !== null ? arg : {};
  const scalar = typeof arg === 'string' || typeof arg === 'number' ? arg : '';
  let message = '';
  const fail = (message: string) => ({ g: state, message });
  if (action === 'valleySelect') {
    if (!valleyUnlocked(g)) return fail(`La caravane arrive au niveau ${UNLOCKS.caravan}.`);
    const region = payload.region;
    if (region !== 'moulins' && region !== 'vergers') return fail('Destination inconnue.');
    if (g.valley.trip) return fail('La caravane est déjà sur la route.');
    g.valley.region = region;
    g.valley.cargo = g.valley.cargo.map((line) => ({ ...line, amount: Math.min(line.amount, cargoLimit(g.valley, region)) }));
    message = `${REGIONS[region].name} : destination choisie.`;
  }
  if (action === 'valleyTour') {
    if (!valleyUnlocked(g)) return fail(`La caravane arrive au niveau ${UNLOCKS.caravan}.`);
    if (g.valley.trip) return fail('La caravane est déjà sur la route.');
    const tour = VALLEY_TOURS.find((entry) => entry.id === payload.id);
    if (!tour) return fail('Tournée inconnue.');
    if (tour.level > level(g)) return fail(`Cette tournée s’ouvre au niveau ${tour.level}.`);
    if (tour.id === 'court') delete g.valley.tour;
    else g.valley.tour = tour.id as TourId;
    const limit = cargoLimit(g.valley, g.valley.region);
    g.valley.cargo = g.valley.cargo.map((line) => ({ ...line, amount: Math.min(line.amount, limit) }));
    message = `${tour.name} : ${limit} produits par caisse.`;
  }
  if (action === 'valleyLoad') {
    if (!valleyUnlocked(g)) return fail(`La caravane arrive au niveau ${UNLOCKS.caravan}.`);
    if (g.valley.trip) return fail('La caravane est déjà sur la route.');
    const item = payload.item || '';
    const amount = Number(payload.amount);
    const valid = item === 'oeuf' || !!crop(item.split('|')[0]) || isFestivalDish(item);
    if (!valid || !Number.isInteger(amount) || amount < 0 || amount > cargoLimit(g.valley, g.valley.region))
      return fail('Cargaison invalide.');
    const other = g.valley.cargo.filter((line) => line.item !== item);
    if (amount > 0 && other.length >= valleyCapacity(g.valley)) return fail('Tous les emplacements sont occupés.');
    if (amount > (g.stock[item] || 0)) return fail('Stock insuffisant pour cette caisse.');
    g.valley.cargo = amount ? [...other, { item, amount }] : other;
    message = amount ? `${amount} ${itemLabel(g, item)} dans la caravane.` : `${itemLabel(g, item)} retiré de la caravane.`;
  }
  if (action === 'valleyDepart') {
    if (!valleyUnlocked(g)) return fail(`La caravane arrive au niveau ${UNLOCKS.caravan}.`);
    if (g.valley.trip) return fail('La caravane est déjà sur la route.');
    const cargo = g.valley.cargo;
    if (cargo.reduce((total, line) => total + line.amount, 0) < 2 || cargo.length > valleyCapacity(g.valley)) return fail('Préparez au moins deux produits.');
    if (new Set(cargo.map((line) => line.item)).size !== cargo.length ||
      cargo.some((line) => !Number.isInteger(line.amount) || line.amount < 1 ||
        line.amount > cargoLimit(g.valley, g.valley.region) || (g.stock[line.item] || 0) < line.amount))
      return fail('Vérifiez le contenu de chaque caisse.');
    const region = g.valley.region;
    const tour = tourOf(g.valley.tour);
    if (tour.level > level(g)) return fail(`Cette tournée s’ouvre au niveau ${tour.level}.`);
    if (cargo.reduce((total, line) => total + line.amount, 0) < tourMinimum(tour.id))
      return fail(`${tour.name} : chargez au moins ${tourMinimum(tour.id)} produits.`);
    const preview = valleyPreview(cargo, region, (item) => price(g, item, now), tour.id);
    const signatureItem = cargo.find((line) => cargoSignature(line.item))?.item;
    const signature = signatureItem ? lineageById(g, itemLineageId(signatureItem))?.name || 'La spécialité de Rosalie' : null;
    for (const line of cargo) g.stock[line.item] -= line.amount;
    g.valley.trip = {
      serial: ++g.valley.serial, region, cargo: cargo.map((line) => ({ ...line })),
      departedAt: now, returnAt: now + preview.seconds * 1000,
      coins: preview.coins, xp: preview.xp, reputation: preview.reputation,
      preference: preview.preference, combination: preview.combination,
      signature, projectPoints: preview.projectPoints,
      ...(tour.id !== 'court' ? { tour: tour.id } : {}),
    };
    g.valley.cargo = [];
    message = `La caravane part vers ${REGIONS[region].name} · retour dans ${duration(preview.seconds)}.`;
  }
  if (action === 'valleyClaim') {
    const trip = g.valley.trip;
    if (!trip) return fail('Aucune caravane à accueillir.');
    if (now < trip.returnAt) return fail('La caravane est encore sur la route.');
    const before = g.valley.reputations[trip.region];
    const after = before + trip.reputation;
    g.valley.reputations[trip.region] = after;
    g.valley.shipments[trip.region]++;
    g.coins += trip.coins;
    g.xp += trip.xp;
    g.valley.projectPoints = Math.min(VALLEY_PROJECT_TARGET, g.valley.projectPoints + trip.projectPoints);
    const completed = !g.valley.projectDone && g.valley.projectPoints >= VALLEY_PROJECT_TARGET;
    if (completed) g.valley.projectDone = true;
    if (trip.signature) g.valley.famousSignature = trip.signature;
    g.valley.trip = null; // Paiement unique, y compris après rechargement.
    const seed = trip.region === 'moulins' ? 'ble' : level(g) >= crop('fraise').level ? 'fraise' : 'carotte';
    if (before < 2 && after >= 2) g.seeds[seed] = (g.seeds[seed] || 0) + 2;
    if (before < 8 && after >= 8) g.seeds[seed] = (g.seeds[seed] || 0) + 3;
    if (before >= 8) g.seeds[seed] = (g.seeds[seed] || 0) + 1;
    message = `Retour de ${REGIONS[trip.region].name} : +${trip.coins} pièces, +${trip.xp} XP, +${trip.reputation} réputation.`;
    if (before < 2 && after >= 2) {
      const regional = RECIPES.find(r => r.valley === trip.region);
      const lock = regional && level(g) < regional.level ? `niveau ${regional.level}, puis installation de l’atelier` : !g.upgrades.includes('workshop') ? 'atelier à installer' : regional ? recipeLock(g, regional) : '';
      message += ` Recette régionale découverte${lock ? ` (${lock})` : ' et disponible à l’atelier'} et +2 graines de ${crop(seed).name} !`;
    }
    if (before < 5 && after >= 5) message += ' Caisses agrandies : 3 produits par emplacement !';
    if (before < 8 && after >= 8) message += ' Lien durable : graines offertes aux prochains retours !';
    if (completed) message += ' Relais de la vallée construit : troisième emplacement de caravane !';
    if (trip.signature) message += ` ${trip.signature} est désormais connue dans la vallée !`;
  }
  if (action === 'plant') {
    const planted = plantPlot(g, payload.crop || '', payload.index ?? -1, now, payload.lineageId, Number(payload.garde) || 0);
    if (typeof planted === 'string') return fail(planted);
    message = `${planted.name} planté${planted.bought ? ' · graine rachetée' : ''} · ça pousse !`;
  }
  if (action === 'harvest') {
    const index = Number(scalar);
    const p = g.plots[index];
    if (!p || p.end > now) return fail('Encore un peu de patience…');
    const r = harvestPlot(g, index, now, random);
    message = `+${r.amount} ${itemName(r.key)} · +${r.xp} XP${r.seeds ? ` · +${r.seeds} graine${r.seeds > 1 ? 's' : ''} !` : ''}`;
    if (r.masteryUp) message += ` · Maîtrise ${cropMastery(g, r.crop)} !`;
    message += r.project;
    if (r.promising) message += ' ✨ Une graine prometteuse rejoint l’album des lignées !';
  }

  if (action === 'bulkStart') {
    const kind = payload.id as BulkKind;
    const required = kind === 'water' ? 'watering-can'
      : kind === 'harvest' ? 'tools' : kind === 'sow' ? 'auto' : '';
    if (!required || !g.upgrades.includes(required))
      return fail('Amélioration nécessaire pour ce geste.');
    const selectedCrop = payload.crop || '';
    const selectedLineage = lineageById(g, payload.lineageId);
    if (kind === 'sow' && payload.lineageId && (!selectedLineage || selectedLineage.crop !== selectedCrop))
      return fail('Cette lignée ne correspond pas à la culture.');
    if (kind === 'sow' && (!crop(selectedCrop) || crop(selectedCrop).level > level(g)))
      return fail('Choisissez une culture disponible.');
    const garde = kind === 'sow' ? Number(payload.garde) || 0 : 0;
    if (garde && (!gardeOptions(g).includes(garde) || selectedLineage))
      return fail('Ce semis de garde n’est pas disponible.');
    // 0.18 : les tâches se cumulent ; une tâche déjà active n’est pas relancée
    // (le semis prend seulement la nouvelle culture).
    const active = bulkChores(g.bulkJob);
    if (active.includes(kind) && kind !== 'sow') return fail('Rosalie s’en occupe déjà.');
    const fed = active.some((other) => CHORE_FEEDS[other] === kind);
    if (!bulkEligible(g, kind, now).length && !fed) return fail('Aucune parcelle concernée pour le moment.');
    const job: BulkJob = g.bulkJob || {
      kind, targets: [], completed: 0, total: 0, lastIndex: null,
      // 0.9.9 : plus de geste instantané ; Rosalie va de parcelle en parcelle.
      nextAt: now, fast: false,
    };
    if (kind === 'sow') {
      job.crop = selectedCrop;
      job.lineageId = selectedLineage?.id;
      job.garde = garde || undefined;
    }
    job.chores = [...new Set([...active, kind])];
    g.bulkJob = job;
    planBulk(g, job, now, payload.from);
    message = active.includes(kind) ? `Semis : ${crop(selectedCrop).name} désormais.`
      : active.length ? `Rosalie ajoute « ${CHORE_NAMES[kind].toLowerCase()} » à ses tâches.`
      : 'Rosalie commence le geste sur ' + (job.total - job.completed) + ' parcelles.';
  }
  if (action === 'bulkCancel') {
    if (!g.bulkJob) return fail('Aucun geste en cours.');
    // 0.18 : arrêter une seule tâche, ou toutes.
    const kind = payload.id as BulkKind | undefined;
    const active = bulkChores(g.bulkJob);
    if (kind && active.includes(kind) && active.length > 1) {
      g.bulkJob.chores = active.filter((other) => other !== kind);
      if (!planBulk(g, g.bulkJob, now)) g.bulkJob = null;
      message = `Rosalie arrête : ${CHORE_NAMES[kind].toLowerCase()}.`;
    } else {
      g.bulkJob = null;
      message = 'Geste interrompu : les parcelles déjà traitées sont conservées.';
    }
  }
  if (action === 'bulkTick') {
    const job = g.bulkJob;
    if (!job || now < job.nextAt) return fail('Le geste suit son cours.');
    // 0.18 : la carte peut proposer le pas le plus proche de Rosalie (elle a pu
    // être appelée ailleurs entre deux gestes) ; sinon, le pas prévu.
    const asked = payload.id as BulkKind | undefined;
    const askedIndex = Number(payload.index);
    const valid = !!asked && bulkChores(job).includes(asked) && bulkEligible(g, asked, now).includes(askedIndex);
    // Arrivée sur une parcelle déjà faite : rien à faire ici, la carte vise la suivante.
    if (asked && !valid) return fail('Parcelle déjà faite.');
    const kind = valid ? asked! : job.kind;
    const index = valid ? askedIndex : job.targets[0];
    let applied = 0;
    let exhausted = false;
    if (index !== undefined) {
      job.lastIndex = index;
      const plot = g.plots[index];
      if (kind === 'water' && plot && !plot.watered && plot.end > now) {
        waterPlot(plot, g, now);
        applied++;
      }
      if (kind === 'harvest' && plot && plot.end <= now) {
        harvestPlot(g, index, now, random);
        applied++;
      }
      if (kind === 'sow' && !plot) {
        const planted = plantPlot(g, job.crop || '', index, now, job.lineageId, job.garde || 0);
        if (typeof planted !== 'string') applied++;
        else if (planted.includes('graines')) exhausted = true;
      }
      job.completed++;
    }
    // Plus de graines : le semis s’arrête, les autres tâches continuent.
    if (exhausted) job.chores = bulkChores(job).filter((other) => other !== 'sow');
    // 0.18 : à chaque pas, Rosalie regarde toutes ses tâches et va au plus près ;
    // ce qui devient à faire en route (une plante mûrit, une parcelle se libère,
    // un semis a soif) est pris en compte aussitôt.
    if (job.chores?.length !== 0 && planBulk(g, job, now)) {
      job.nextAt = now + gestureMs(g, kind);
      message = (applied ? 'Parcelle traitée · ' : 'Parcelle passée · ')
        + job.completed + '/' + job.total;
    } else {
      g.bulkJob = null;
      message = exhausted && !applied ? 'Plus de graines : semis arrêté.'
        : 'Geste terminé : ' + job.completed + ' parcelles parcourues.';
    }
  }
  // Les actions immédiates harvestAll, sowAll, waterAll et collectAll restent utilisées par le simulateur.
  if (action === 'harvestAll') {
    if (!g.upgrades.includes('tools'))
      return fail('Installez les outils de jardinier.');
    const summary = harvestEverything(g, now, random);
    if (!summary) return fail('Aucune récolte n’est prête.');
    message = summary;
  }
  if (action === 'sowAll') {
    if (!g.upgrades.includes('auto'))
      return fail('Installez le semis en série.');
    const c = crop(payload.crop || String(scalar));
    if (!c || c.level > level(g))
      return fail('Cette culture se débloque avec les niveaux.');
    let planted = 0,
      bought = 0;
    const garde = Number(payload.garde) || 0;
    if (garde && !gardeOptions(g).includes(garde)) return fail('Ce semis de garde n’est pas disponible.');
    g.plots.forEach((plot, index) => {
      if (plot) return;
      const result = plantPlot(g, c.id, index, now, undefined, garde);
      if (typeof result === 'string') return;
      planted++;
      if (result.bought) bought++;
    });
    if (!planted)
      return fail(
        g.plots.some((plot) => !plot)
          ? 'Achetez des graines dans la graineterie.'
          : 'Aucune parcelle libre.',
      );
    const free = g.plots.filter((plot) => !plot).length;
    message = `${planted} × ${c.name} planté${planted > 1 ? 's' : ''}${bought ? ` · ${bought} graine${bought > 1 ? 's' : ''} rachetée${bought > 1 ? 's' : ''}` : ''}${free ? ` · ${free} parcelle${free > 1 ? 's' : ''} libre${free > 1 ? 's' : ''} faute de graines` : ''}`;
  }
  if (action === 'collectAll') {
    const parts: string[] = [];
    // 0.18 : la cueillette rejoint les tâches déjà en cours.
    if (g.upgrades.includes('tools') && !bulkChores(g.bulkJob).includes('harvest')) {
      const targets = bulkEligible(g, 'harvest', now);
      if (targets.length) {
        const job: BulkJob = g.bulkJob || {
          kind: 'harvest', targets, completed: 0, total: targets.length,
          lastIndex: null, nextAt: now, fast: false,
        };
        job.chores = [...new Set([...bulkChores(g.bulkJob), 'harvest' as const])];
        g.bulkJob = job;
        planBulk(g, job, now);
        parts.push(`Cueillette lancée : ${targets.length} parcelles`);
      }
    }
    const eggs = collectEggs(g, now);
    if (eggs) parts.push(eggs);
    const fruits = pickOrchard(g, now, random);
    if (fruits) parts.push(fruits);
    const dish = collectJob(g, now, random);
    if (dish) parts.push(dish);
    if (!parts.length) return fail('Rien n’est prêt pour le moment.');
    message = parts.join(' · ');
  }
  if (action === 'specialize') {
    const id = payload.crop || '',
      spec = payload.specialization || '';
    if (
      !crop(id) ||
      cropMastery(g, id) < 3 ||
      !SPECIALIZATIONS.some((s) => s.id === spec)
    )
      return fail('La spécialisation se débloque à la maîtrise 3.');
    if (g.specializations[id] === spec)
      return fail('Cette spécialisation est déjà active.');
    const cost = g.specializations[id] ? 25 : 0;
    if (g.coins < cost)
      return fail('Changer de spécialisation coûte 25 pièces.');
    g.coins -= cost;
    g.specializations[id] = spec;
    message = 'Spécialisation choisie pour les prochaines plantations.';
  }
  if (action === 'water') {
    const p = g.plots[Number(scalar)];
    if (!p || p.watered || p.end <= now)
      return fail('Cette plante n’a pas besoin d’eau.');
    waterPlot(p, g, now);
    message = 'Cette culture est arrosée · meilleures chances de qualité.';
  }
  if (action === 'waterAll') {
    if (!g.upgrades.includes('watering-can'))
      return fail('Installez l’arrosoir de cuivre.');
    let watered = 0;
    g.plots.forEach((plot) => {
      if (plot && !plot.watered && plot.end > now) {
        waterPlot(plot, g, now);
        watered++;
      }
    });
    if (!watered) return fail('Aucune culture n’a besoin d’eau.');
    message = `${watered} culture${watered > 1 ? 's' : ''} arrosée${watered > 1 ? 's' : ''} · qualité améliorée.`;
  }
  if (action === 'buy') {
    const c = crop(payload.crop || String(scalar));
    if (!c || c.level > level(g))
      return fail('Cette culture se débloque avec les niveaux.');
    const wanted =
      payload.amount === 'max'
        ? maxAffordable(g, c.id)
        : Math.floor(Number(payload.amount ?? 1));
    if (!Number.isFinite(wanted) || wanted < 1)
      return fail(
        'Pas assez de pièces. Les graines de secours peuvent vous aider.',
      );
    const amount = Math.min(wanted, MAX_SEED_PURCHASE);
    if (g.coins < c.cost * amount)
      return fail(
        amount > 1
          ? `Il faut ${c.cost * amount} pièces pour ${amount} graines.`
          : 'Pas assez de pièces. Les graines de secours peuvent vous aider.',
      );
    g.coins -= c.cost * amount;
    g.seeds[c.id] = (g.seeds[c.id] || 0) + amount;
    message = `+${amount} graine${amount > 1 ? 's' : ''} de ${c.name.toLowerCase()} · −${c.cost * amount} pièces`;
  }
  if (action === 'sell') {
    const key = payload.item || String(scalar);
    const n = g.stock[key] || 0;
    if (!n) return fail('Votre panier est vide.');
    const amount =
      payload.amount === undefined || payload.amount === 'max'
        ? n
        : Math.min(n, Math.floor(Number(payload.amount)));
    if (!Number.isFinite(amount) || amount < 1)
      return fail('Quantité invalide.');
    const earned = amount * price(g, key, now);
    g.coins += earned;
    g.sold += earned;
    g.stock[key] = n - amount;
    message = `Vendu ! ${amount > 1 ? `${amount} × ` : ''}${itemName(key)} · +${earned} pièces`;
    message += recordProject(g, { kind: 'sell', coins: earned }, now);
  }
  if (action === 'sellMany') {
    // 0.9.1 : vente d’une culture ou d’une qualité entière, au même prix que clé par clé.
    const keys = [...new Set(payload.items || [])].filter((key) => (g.stock[key] || 0) > 0);
    if (!keys.length) return fail('Votre panier est vide.');
    let count = 0,
      earned = 0;
    for (const key of keys) {
      const n = g.stock[key];
      earned += n * price(g, key, now);
      count += n;
      g.stock[key] = 0;
    }
    g.coins += earned;
    g.sold += earned;
    message = `Vendu ! ${count} produit${count > 1 ? 's' : ''} · +${earned} pièces`;
    message += recordProject(g, { kind: 'sell', coins: earned }, now);
  }
  if (action === 'sellSurplus') {
    const plan = surplus(g, now);
    if (!plan.count) return fail('Rien à vendre : tout sert encore.');
    for (const [key, amount] of Object.entries(plan.sell))
      g.stock[key] -= amount;
    g.coins += plan.coins;
    g.sold += plan.coins;
    message = `Superflu vendu : ${plan.count} produit${plan.count > 1 ? 's' : ''} · +${plan.coins} pièces${plan.kept ? ` · ${plan.kept} gardé${plan.kept > 1 ? 's' : ''} pour le projet, les commandes ou la semence` : ''}`;
    message += recordProject(g, { kind: 'sell', coins: plan.coins }, now);
  }
  if (action === 'upgrade') {
    const id = String(scalar);
    const u = UPGRADES.find((entry) => entry.id === id);
    const path = UPGRADE_PATHS[id as UpgradePathId];
    const tier = path ? upgradeTier(g, id as UpgradePathId) : 0;
    const requires = UPGRADE_REQUIRES[id];
    if (requires && !g.upgrades.includes(requires))
      return fail(`Installez d’abord : ${UPGRADES.find((entry) => entry.id === requires)?.name}.`);
    if (!u || level(g) < nextUpgradeLevel(g, id) ||
      g.coins < upgradeCost(g, id) ||
      (id === 'expand' ? g.plots.length >= maxPlots(g)
        : path ? tier >= 5 : g.upgrades.includes(id)))
      return fail('Cette amélioration n’est pas encore disponible.');
    g.coins -= upgradeCost(g, id);
    if (id === 'expand') while (g.plots.length < Math.min(maxPlots(g), Math.ceil((state.plots.length + 1) / 3) * 3)) g.plots.push(null);
    else if (path) {
      g.upgradeTiers[id] = tier + 1;
      if (!g.upgrades.includes(id)) g.upgrades.push(id);
    } else g.upgrades.push(id);
    message = path
      ? u.name + ' · palier ' + (tier + 1) + '/5 installé !'
      : u.name + ' installé !';
  }
  if (action === 'embellish') {
    const entry = embellishment(String(payload.id || scalar));
    if (!entry) return fail('Embellissement inconnu.');
    const current = embellishmentStage(g, entry.id);
    if (current >= 3) return fail(`${entry.name} est déjà à sa dernière étape.`);
    const stage = current as 0 | 1 | 2;
    if (level(g) < entry.levels[stage]) return fail(`Cette étape s’ouvre au niveau ${entry.levels[stage]}.`);
    const cost = entry.costs[stage];
    if (g.coins < cost) return fail(`Il manque ${cost - g.coins} pièces.`);
    g.coins -= cost;
    g.embellishments = { ...g.embellishments, [entry.id]: stage + 1 };
    message = `${entry.name} : ${entry.stages[stage].toLowerCase()} ! La ferme s’embellit.`;
  }
  if (action === 'renovate') {
    const entry = restoration(String(payload.id || scalar));
    if (!entry) return fail('Lieu inconnu.');
    const current = restorationStage(g, entry.id);
    if (current >= 3) return fail(`${entry.name} est déjà restauré.`);
    const stage = current as 0 | 1 | 2;
    if (level(g) < entry.levels[stage]) return fail(`Cette étape s’ouvre au niveau ${entry.levels[stage]}.`);
    const cost = entry.costs[stage];
    if (g.coins < cost) return fail(`Il manque ${cost - g.coins} pièces.`);
    g.coins -= cost;
    g.restorations = { ...g.restorations, [entry.id]: stage + 1 };
    message = `${entry.name} : ${entry.stages[stage].toLowerCase()} ! Le domaine reprend vie.`;
  }
  if (action === 'donate') {
    if (!g.projects.done.includes(DONATION_PROJECT))
      return fail('La fête du village accepte les dons après le grand banquet.');
    const done = g.donations || 0;
    const cost = donationCost(done);
    if (g.coins < cost) return fail(`Il manque ${cost - g.coins} pièces pour ce don.`);
    g.coins -= cost;
    g.donations = done + 1;
    const title = donationTitle(done + 1);
    message = `Merci pour la fête ! ${donationSouvenir(done)}.` +
      (title && title !== donationTitle(done) ? ` Nouveau titre : ${title}.` : '');
  }
  if (action === 'order') {
    const slot = Number(payload.slot ?? 0);
    const o = orderBoard(g).find((entry) => entry.slot === slot);
    if (!o) return fail('Cette offre du village n’est pas disponible.');
    if (!orderAvailable(g, slot, now))
      return fail(`${o.person.split(',')[0]} prépare sa prochaine commande : revenez dans ${duration(Math.ceil((orderReadyAt(g, slot) - now) / 1000))}.`);
    const delivery = planMenu(g.stock, o.lines);
    if (!delivery.possible)
      return fail('Il manque des produits pour cette commande.');
    if (delivery.usesSuperior && !payload.confirmSuperior)
      return fail('Confirmez l’utilisation de produits de qualité supérieure.');
    const reward = orderReward(g, o, delivery, now);
    Object.entries(delivery.used).forEach(([id, quantity]) => {
      g.stock[id] -= quantity;
    });
    g.coins += reward;
    g.xp += o.xp;
    g.orders++;
    let projectMessage = '';
    if (o.kind === 'grand' || o.kind === 'prestige') g.grandOrders++;
    if (o.kind === 'signature') {
      g.signatureOrders++;
      for (const id of new Set(Object.keys(delivery.used).map(itemLineageId).filter((id): id is number => !!id))) {
        const lineage = lineageById(g, id);
        if (lineage) lineage.orders++;
      }
      projectMessage = recordProject(g, { kind: 'signatureOrder' }, now);
    }
    g.orderSlots[slot] = (g.orderSlots[slot] || 0) + 1;
    g.orderReady = [...(g.orderReady || [])];
    while (g.orderReady.length <= slot) g.orderReady.push(0);
    g.orderReady[slot] = now + orderCooldownMs(g, o.kind);
    recordSkill(g, 'commerce', o.kind + ':' + o.crop.split('|')[0]);
    if (o.villagerId) {
      const first = !(g.personalWins[o.villagerId] > 0);
      g.personalWins[o.villagerId] = (g.personalWins[o.villagerId] || 0) + 1;
      gainFriendship(g, o.villagerId, first ? 6 : 4);
    }
    const deliveredCrop = Object.keys(delivery.used).map(key => key.split('|')[0]).find(id => !!crop(id));
    if (g.skillChoices.commerce === 'panier-fidele' && deliveredCrop) {
      const id = deliveredCrop;
      g.seeds[id] = (g.seeds[id] || 0) + 1;
    }
    addUseMastery(g, Object.keys(delivery.used), 0.2);
    if (slot === 0 && g.pendingCrop === o.crop.split('|')[0]) g.pendingCrop = g.pendingCrops?.shift() ?? null;
    message = `Merci pour la livraison ! +${reward} pièces · +${o.xp} XP${o.villagerId ? ' · +amitié avec ' + VILLAGERS.find((v) => v.id === o.villagerId)?.name : ''}${reward > o.reward ? o.kind === 'market' ? ' · bonus du marché' : ' · bonus de qualité' : ''}` + projectMessage;
  }
  if (action === 'craft') {
    const r = recipe(typeof arg === 'string' ? arg : payload.id || '');
    const stove = freeStove(g);
    if (!r || !g.upgrades.includes('workshop') || recipeLock(g, r))
      return fail('Votre atelier ou cette recette n’est pas disponible.');
    if (stove < 0)
      return fail(stoveCount(g) > 1 ? 'Tous les fourneaux sont occupés.' : 'Le fourneau est occupé.');
    // 0.9.9 : grande marmite, deux portions de la même recette.
    const portions = Number(payload.portions) === 2 ? 2 : 1;
    if (portions === 2 && !g.upgrades.includes('marmite'))
      return fail('Installez la grande marmite pour cuisiner deux portions.');
    const keys: string[] =
      typeof arg === 'string'
        ? defaultIngredients(g, r)
        : (payload.ingredients ?? []);
    if (!validIngredients(g, r, keys, portions))
      return fail('Vérifiez les quantités et les ingrédients choisis.');
    const probabilities = cookingProbabilities(g, r.id, keys, now);
    const ingredientValue = Math.ceil(
      keys.reduce((sum, id) => sum + basePrice(id), 0),
    );
    for (let n = 0; n < portions; n++) keys.forEach((id: string) => g.stock[id]--);
    addUseMastery(g, keys, 0.25 * portions);
    setStove(g, stove, {
      id: r.id,
      start: now,
      end: now + cookTime(g, r, now, keys) * (portions === 2 ? MARMITE_TIME : 1) * 1000,
      probabilities,
      ingredientValue,
      lineageId: keys.map(itemLineageId).find((id) => !!lineageById(g, id)),
      quality: OUTCOMES[rollIndex(probabilities, random)].id,
      ...(portions === 2 ? { portions: 2 as const } : {}),
    });
    message =
      (portions === 2 ? 'La grande marmite mijote deux portions…' : 'La recette mijote…') +
      (stoveCount(g) > 1 ? ` Fourneau ${stove + 1}.` : ' Vos ingrédients et leurs bonus sont conservés.');
  }
  if (action === 'collect') {
    const dish = collectJob(g, now, random);
    if (!dish) return fail('La recette n’est pas encore prête.');
    message = dish;
  }
  if (action === 'festival') {
    if (!g.upgrades.includes('workshop'))
      return fail('L’Atelier de Rosalie ouvre l’accès à la Fête des Saveurs.');
    const key = payload.item || String(scalar);
    if (!isFestivalDish(key) || !(g.stock[key] > 0))
      return fail('Choisissez un plat cuisiné présent dans votre panier.');
    const evaluation = festivalEvaluation(g, key);
    const leadJudge = evaluation.leadJudge;
    const signature = evaluation.theme.id + ':' + dishParts(key).recipeId;
    const firstAward = !g.festivalAwards.includes(signature);
    g.stock[key]--;
    if (firstAward) {
      g.festivalAwards.push(signature);
      g.coins += Math.min(95, 20 + evaluation.score);
      g.xp += Math.min(75, 15 + Math.floor(evaluation.score / 2));
    }
    g.festival.entries++;
    g.festival.introSeen = true;
    g.festival.lastEntry = {
      dish: key,
      score: evaluation.score,
      award: evaluation.award.id,
      leadJudge,
      themeId: evaluation.theme.id,
      breakdown: evaluation.breakdown,
    };
    if (!g.festival.bestDish || evaluation.score > g.festival.bestScore) {
      g.festival.bestScore = evaluation.score;
      g.festival.bestDish = key;
      g.festival.bestAward = evaluation.award.id;
    }
    const judge = VILLAGERS.find((villager) => villager.id === leadJudge)!;
    message = `${evaluation.award.icon} ${evaluation.award.name} · ${evaluation.score}/100 · ${judge.name} présente le verdict. Le plat a été partagé avec le jury.${firstAward ? ' Première présentation : pièces et XP gagnés.' : ' Ce menu a déjà reçu sa prime.'}`;
    message += recordProject(
      g,
      { kind: 'festival', score: evaluation.score },
      now,
    );
  }
  if (action === 'talent') {
    const stat = payload.stat;
    if (!stat || !(stat in g.stats) || g.talentPoints < 1)
      return fail('Aucun point de talent disponible.');
    if (g.stats[stat] >= 20) return fail('Cette statistique est au maximum.');
    g.talentPoints--;
    g.stats[stat]++;
    message = `${stat === 'mastery' ? 'Maîtrise' : stat === 'precision' ? 'Précision' : stat === 'creativity' ? 'Créativité' : stat === 'regularity' ? 'Régularité' : 'Chance'} améliorée !`;
  }
  if (action === 'hens') {
    if (!g.upgrades.includes('coop')) return fail('Installez le poulailler.');
    if (g.hens !== null) {
      const eggs = collectEggs(g, now);
      if (!eggs) return fail('Les poules prennent leur temps.');
      message = eggs;
    } else {
      const feed = henFeed(g);
      if ((g.stock.ble || 0) < feed)
        return fail(`Il faut ${feed} blés pour nourrir les poules.`);
      g.stock.ble -= feed;
      g.hens = now + 120000;
      message = 'Les poules ont bien mangé !';
    }
  }
  if (action === 'mission') {
    const id = String(scalar);
    const goal = GOALS.find((entry) => entry.id === id);
    if (!goal || g.claimed.includes(id) || goalProgress(g, goal) < goal.target)
      return fail('Cet objectif n’est pas encore terminé.');
    g.claimed.push(id);
    g.trackedGoals = g.trackedGoals.filter((entry) => entry !== id);
    g.coins += goal.reward;
    g.xp += goal.xp;
    if (goal.seeds)
      g.seeds[goal.seeds.id] = (g.seeds[goal.seeds.id] || 0) + goal.seeds.amount;
    message = 'Objectif accompli ! +' + goal.reward + ' pièces · +' + goal.xp + ' XP' +
      (goal.seeds ? ' · +' + goal.seeds.amount + ' graines de ' + crop(goal.seeds.id).name : '');
  }
  if (action === 'trackGoal') {
    const id = String(scalar);
    if (!GOALS.some((goal) => goal.id === id) || g.claimed.includes(id))
      return fail('Cet objectif ne peut pas être suivi.');
    if (g.trackedGoals.includes(id)) {
      g.trackedGoals = g.trackedGoals.filter((entry) => entry !== id);
      message = 'Objectif retiré du suivi.';
    } else {
      if (g.trackedGoals.length >= 3) return fail('Suivez au maximum trois objectifs.');
      g.trackedGoals.push(id);
      message = 'Objectif visible depuis la ferme.';
    }
  }
  if (action === 'quest') {
    const questId = String(scalar || payload.id || '');
    const q = QUESTS.find((q) => q.id === questId);
    const delivery = q ? fulfillment(g.stock, q.item, q.amount) : null;
    if (
      !q ||
      g.quests.includes(q.id) ||
      (g.relations[q.id] || 0) < 2 ||
      !delivery?.possible
    )
      return fail('La quête demande 2 cœurs et les produits indiqués.');
    if (delivery.usesSuperior && !payload.confirmSuperior)
      return fail('Confirmez l’utilisation de produits de qualité supérieure.');
    Object.entries(delivery.used).forEach(([id, quantity]) => {
      g.stock[id] -= quantity;
    });
    g.quests.push(q.id);
    g.coins += q.reward;
    g.friendship[q.id] = Math.max(12, (g.friendship[q.id] || 0) + 6);
    g.relations[q.id] = Math.min(
      5,
      HEART_STEPS.filter((n) => g.friendship[q.id] >= n).length - 1,
    );
    message = `Quête accomplie ! +${q.reward} pièces · nouveau talent débloqué.`;
  }
  if (action === 'skillChoice') {
    const path = payload.path as SkillPath;
    const choice = payload.choice || '';
    const data = SKILL_PATHS.find((entry) => entry.id === path);
    if (!data || skillRank(g, path) < 2 || !data.choices.some((entry) => entry.id === choice))
      return fail('Découvrez davantage de savoir-faire pour choisir cette voie.');
    if (g.skillChoices[path] === choice) return fail('Cette voie est déjà active.');
    const cost = g.skillChoices[path] ? 50 : 0;
    if (g.coins < cost) return fail('Changer de voie coûte 50 pièces.');
    g.coins -= cost;
    g.skillChoices[path] = choice;
    message = data.title + ' : ' + data.choices.find((entry) => entry.id === choice)!.name + ' actif.';
  }
  if (action === 'selectSeed') {
    const find = g.seedFinds.find((entry) => entry.id === Number(payload.candidateId));
    const chosen = String(payload.trait || '');
    if (!find || !find.options.includes(chosen as TraitId)) return fail('Choisissez l’un des caractères proposés par cette graine.');
    const parent = lineageById(g, find.parentId);
    if (find.parentId && (!parent || parent.traits.length >= 2)) return fail('Cette lignée a déjà ses deux caractères.');
    if (parent) {
      parent.traits.push(chosen as TraitId);
      parent.generation = 2;
      parent.seeds += 1;
      message = `${parent.name} évolue : ${TRAITS.find((entry) => entry.id === chosen)?.name} ! +1 graine.`;
    } else {
      if (g.lineages.length >= 80) return fail('L’album des lignées est plein.');
      const proposed = String(payload.name || '').trim().replace(/\s+/g, ' ').slice(0, 24);
      const name = proposed || `${crop(find.crop).name} de Rosalie`;
      const lineage: Lineage = { id: g.lineageSerial++, crop: find.crop, name,
        traits: [chosen as TraitId], nativeTerroir: find.nativeTerroir,
        originQuality: find.sourceQuality, generation: 1, seeds: 2, harvests: 0,
        orders: 0, bestQuality: itemQualityRank(find.crop + '|' + find.sourceQuality), created: now };
      g.lineages.push(lineage);
      g.xp += 20;
      message = `✨ ${lineage.name} rejoint la ferme ! Deux graines prêtes · +20 XP.`;
    }
    g.seedFinds = g.seedFinds.filter((entry) => entry.id !== find.id);
  }
  if (action === 'discardSeed') {
    const found = g.seedFinds.find((entry) => entry.id === Number(payload.candidateId));
    if (!found) return fail('Cette graine a déjà été choisie.');
    g.seedFinds = g.seedFinds.filter((entry) => entry.id !== found.id);
    message = 'La graine est rendue à la terre. Une autre occasion viendra.';
  }
  if (action === 'renameLineage') {
    const lineage = lineageById(g, Number(payload.lineageId));
    const name = String(payload.name || '').trim().replace(/\s+/g, ' ').slice(0, 24);
    if (!lineage || !name) return fail('Donnez un nom court à cette variété.');
    lineage.name = name;
    message = `Cette variété s’appelle maintenant ${name}.`;
  }
  if (action === 'propagateLineage') {
    const lineage = lineageById(g, Number(payload.lineageId));
    if (!lineage) return fail('Cette lignée n’existe pas.');
    const seedCost = hasReward(g, 'pepiniere') ? 1 : 2;
    const coinCost = hasReward(g, 'pepiniere') ? 12 : 20;
    if ((g.seeds[lineage.crop] || 0) < seedCost || g.coins < coinCost)
      return fail(`Il faut ${seedCost} graine${seedCost > 1 ? 's' : ''} classique${seedCost > 1 ? 's' : ''} et ${coinCost} pièces.`);
    g.seeds[lineage.crop] -= seedCost;
    g.coins -= coinCost;
    lineage.seeds += 2;
    message = `La pépinière multiplie ${lineage.name} : +2 graines · −${coinCost} pièces.`;
  }
  if (action === 'amendTerroir') {
    const data = AMENDMENTS.find((entry) => entry.terroir === payload.terroir);
    if (!data || g.terroirBuilds.includes(data.terroir) || level(g) < data.level ||
      !g.plots.some((_, index) => terroirForPlot(index) === data.terroir) || g.coins < data.cost)
      return fail('Cet aménagement attend le bon terrain, le niveau et les pièces nécessaires.');
    g.coins -= data.cost;
    g.terroirBuilds.push(data.terroir);
    message = `${data.name} aménagé ! ${data.effect}`;
  }
  if (action === 'seasonNext') {
    if (!canAdvanceSeason(g)) return fail('Présentez la foire, récoltez quatre fois, puis livrez ou cuisinez avant de choisir la saison suivante.');
    if (seasonReadyAt(g) > now) return fail(`La prochaine saison s’ouvre dans ${duration(Math.ceil((seasonReadyAt(g) - now) / 1000))}.`);
    g.season.index++;
    g.season.startedAt = now;
    g.season.startedHarvests = g.harvests;
    g.season.startedOrders = g.orders;
    g.season.startedCrafted = g.crafted;
    message = `La ferme entre dans ${seasonFor(g.season.index).label}. La nouvelle foire vous attend, sans échéance.`;
  }
  if (action === 'fair') {
    const items = Array.isArray(payload.items) ? [...new Set(payload.items)] : [];
    if (level(g) < SEED_FIND_LEVEL || fairEntry(g) || items.length < 1 || items.length > 2 ||
      items.some((key) => typeof key !== 'string' || !(g.stock[key] > 0) || !fairCandidates(g).includes(key)) ||
      (items.length === 2 && items[0].split('|')[0] === items[1].split('|')[0]))
      return fail('Choisissez un ou deux produits différents du panier pour cette foire.');
    const result = fairEvaluation(g, items);
    items.forEach((key) => { g.stock[key]--; });
    const { coins, xp } = fairPay(g, result.score);
    g.coins += coins;
    g.xp += xp;
    g.season.fairs.push({ cycle: g.season.index, items, score: result.score, breakdown: result.breakdown, coins, xp });
    message = `Foire de ${result.theme.label} : ${result.score}/100 · +${coins} pièces · +${xp} XP. Les produits ont été partagés.`;
    message += recordProject(g, { kind: 'fair', score: result.score }, now);
  }
  if (action === 'gift') {
    const v = VILLAGERS.find((v) => v.id === payload.villager);
    if (!v || (g.relations[v.id] || 0) >= 5)
      return fail('Votre amitié est déjà au sommet.');
    const key = payload.item;
    if (typeof key !== 'string' || !(g.stock[key] > 0))
      return fail('Choisissez un produit à offrir.');
    const memory = v.id + ':' + key.split('|')[0];
    const repeat = g.giftHistory.includes(memory);
    const points = repeat ? 1 : giftPoints(v.likes, key);
    g.stock[key]--;
    if (!repeat) g.giftHistory.push(memory);
    gainFriendship(g, v.id, points);
    message = `${v.name} vous remercie ! +${points} amitié · ${g.relations[v.id]}/5 cœurs${repeat ? ' · une découverte lui plairait davantage' : ''}`;
  }
  if (action === 'projectStart') {
    const project = projectById(payload.project || String(scalar));
    if (!project || !projectAvailable(g, project))
      return fail('Ce projet n’est pas encore ouvert.');
    if (g.projects.active === project.id)
      return fail('Ce projet est déjà en cours.');
    g.projects.active = project.id;
    g.projects.progress[project.id] ??= { step: 0, count: 0 };
    message = `${project.title} devient votre grand projet. Les progrès des autres projets sont conservés.` + advanceReadyProject(g, now);
  }
  if (action === 'projectFund') {
    const status = projectStatus(g);
    if (!status || status.step.kind !== 'fund')
      return fail('Aucune participation n’est attendue pour ce projet.');
    if (g.coins < status.step.amount)
      return fail(`Il manque ${status.step.amount - g.coins} pièces pour participer.`);
    g.coins -= status.step.amount;
    message = `${status.step.text} : merci pour le village !` + completeProjectStep(g, now) + advanceReadyProject(g, now);
  }
  if (action === 'projectDeliver') {
    const status = projectStatus(g);
    if (!status || status.step.kind !== 'deliver')
      return fail('Aucune livraison n’est attendue pour ce projet.');
    const delivery = planMenu(g.stock, status.step.lines);
    if (!delivery.possible)
      return fail('Il manque des produits pour cette étape.');
    if (delivery.usesSuperior && !payload.confirmSuperior)
      return fail('Confirmez l’utilisation de produits de qualité supérieure.');
    Object.entries(delivery.used).forEach(([id, quantity]) => {
      g.stock[id] -= quantity;
    });
    message =
      `${status.step.text} : c’est livré !` + completeProjectStep(g, now) + advanceReadyProject(g, now);
  }
  if (action === 'eat') {
    const key = payload.item || String(scalar);
    const effect = eatableDish(key);
    if (!effect || !(g.stock[key] > 0))
      return fail('Choisissez un plat cuisiné à déguster.');
    const minutes = effectMinutes(key);
    const end = Math.min(
      now + EFFECT_CAP_MINUTES * 60000,
      Math.max(g.buffs[effect.id] || 0, now) + minutes * 60000,
    );
    g.stock[key]--;
    g.buffs[effect.id] = end;
    message = `${effect.name} actif ${duration((end - now) / 1000)} · ${effect.desc}`;
  }
  if (action === 'preserve') {
    const key = payload.item || String(scalar);
    const [base, quality] = key.split('|');
    if (!crop(base) || quality !== 'exceptionnelle' || !(g.stock[key] > 0))
      return fail('Seule une récolte exceptionnelle peut devenir semence.');
    g.stock[key]--;
    g.seeds[base] = (g.seeds[base] || 0) + 3;
    g.cropXP[base] = (g.cropXP[base] || 0) + masteryGain(base) * 2;
    message = `+3 graines de ${crop(base).name.toLowerCase()} · la lignée exceptionnelle nourrit la maîtrise.`;
  }
  if (action === 'orchard') {
    if (g.orchard === null)
      return fail('Le verger doit d’abord être restauré.');
    const fruits = pickOrchard(g, now, random);
    if (!fruits) return fail('Les arbres préparent leurs fruits.');
    message = fruits;
  }
  if (action === 'rescue') {
    if (
      g.coins >= 2 ||
      Object.values(g.seeds).some((n) => n > 0) ||
      g.plots.some(Boolean) ||
      Object.values(g.stock).some((n) => n > 0) ||
      stoveJobs(g).some(Boolean) ||
      g.hens
    )
      return fail(
        'Vos ressources permettent encore de faire grandir le jardin.',
      );
    g.seeds.radis = 3;
    message = 'Rosalie vous offre 3 graines de radis.';
  }
  if (action === 'setting') {
    const setting = payload.setting;
    if (!setting || typeof payload.value !== 'boolean')
      return fail('Réglage invalide.');
    g.settings[setting] = payload.value;
    message =
      setting === 'forceAnimations'
        ? payload.value ? 'Animations du jeu activées, même si Windows les réduit.' : 'Préférence de mouvement du système rétablie.'
        : setting === 'reduceMotion'
        ? payload.value
          ? 'Animations réduites.'
          : 'Animations rétablies.'
        : setting === 'autoBuySeeds'
          ? payload.value
            ? 'Les graines manquantes seront rachetées au semis.'
            : 'Rachat automatique des graines désactivé.'
          : setting === 'quickActions'
            ? payload.value
              ? 'Actions rapides activées.'
              : 'Déplacements animés activés.'
            : payload.value
              ? 'Rosalie se déplace entre les parcelles.'
              : 'Déplacements de Rosalie désactivés.';
  }
  if (action === 'scene') {
    const scene = payload.scene;
    if (!scene || g.seenScenes.includes(scene))
      return fail('Cette scène est déjà connue.');
    g.seenScenes.push(scene);
    message = 'Un nouveau souvenir rejoint le carnet.';
  }
  if (!message) return fail('Action inconnue.');
  const previousLevel = level(state);
  const currentLevel = level(g);
  const levelUps: { level: number; crop: string | null; system: string }[] = [];
  if (currentLevel > previousLevel) {
    for (
      let unlocked = previousLevel + 1;
      unlocked <= currentLevel;
      unlocked++
    ) {
      const content = levelContent(unlocked);
      if (content.crop) {
        g.seeds[content.crop] = (g.seeds[content.crop] || 0) + 1;
        if (!g.pendingCrop) g.pendingCrop = content.crop;
        else if (g.pendingCrop !== content.crop && !g.pendingCrops?.includes(content.crop)) (g.pendingCrops ??= []).push(content.crop);
      }
      levelUps.push({ ...content });
    }
    message += ` ✨ Niveau ${currentLevel} ! Une nouvelle étape commence.`;
  }
  g.saved = now;
  return { g, message, levelUp: levelUps[0], levelUps };
}
function numberRecord(raw: unknown, min: number, max: number) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  return Object.fromEntries(
    Object.entries(raw as Record<string, unknown>)
      .filter(([, v]) => typeof v === 'number' && Number.isFinite(v))
      .map(([k, v]) => [
        k,
        Math.min(max, Math.max(min, Math.floor(v as number))),
      ]),
  );
}
function normalizeBuffs(raw: unknown): Game['buffs'] {
  const values = numberRecord(raw, 0, Number.MAX_SAFE_INTEGER);
  return Object.fromEntries(
    Object.entries(values).filter(([id]) =>
      DISH_EFFECT_IDS.includes(id as DishEffectId),
    ),
  );
}
/** 0.9.9 : fourneaux 2 et 3, absents des anciennes sauvegardes. */
function normalizeStoves(raw: unknown): (CookJob | null)[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 2).map((job) =>
    job && typeof job === 'object' && typeof job.id === 'string' && recipe(job.id) && Number.isFinite(job.end)
      ? (({ portions, ...rest }) => (portions === 2 ? { ...rest, portions: 2 as const } : rest))(job as CookJob)
      : null);
}
function normalizeBulkJob(raw: unknown, plotCount: number): BulkJob | null {
  if (!raw || typeof raw !== 'object') return null;
  const job = raw as Partial<BulkJob>;
  if (!['water', 'harvest', 'sow'].includes(job.kind || '') ||
    !Array.isArray(job.targets) ||
    !job.targets.every((index) => Number.isInteger(index) && index >= 0 && index < plotCount))
    return null;
  return {
    kind: job.kind as BulkKind,
    crop: typeof job.crop === 'string' && crop(job.crop) ? job.crop : undefined,
    lineageId: Number.isInteger(job.lineageId) && (job.lineageId || 0) > 0 ? job.lineageId : undefined,
    targets: [...new Set(job.targets)],
    completed: Math.max(0, Math.floor(Number(job.completed) || 0)),
    total: Math.max(job.targets.length, Math.floor(Number(job.total) || 0)),
    lastIndex: Number.isInteger(job.lastIndex) ? job.lastIndex! : null,
    nextAt: Number.isFinite(job.nextAt) ? job.nextAt! : 0,
    // 0.9.9 : les anciennes sauvegardes perdent l’avance rapide.
    fast: false,
    garde: GARDE_STEPS.some((step) => step.hours === job.garde) ? job.garde : undefined,
    // 0.18 : tâches cumulées (la tâche du prochain geste en fait toujours partie).
    chores: Array.isArray(job.chores)
      ? [...new Set([job.kind as BulkKind, ...job.chores.filter((kind): kind is BulkKind => ['water', 'harvest', 'sow'].includes(kind))])]
      : undefined,
  };
}
/** Rejeter les données économiques ambiguës garde la copie récupérable intacte. */
function validateSaveNumbers(g: Record<string, unknown>, base: Game) {
  const numeric = (n: unknown, integer = false) => typeof n === 'number' && Number.isFinite(n) && n >= 0 && (!integer || Number.isSafeInteger(n));
  for (const [key, value] of Object.entries(base)) {
    if (typeof value === 'number' && g[key] !== undefined && !numeric(g[key], !['created', 'saved'].includes(key))) throw Error(`Nombre invalide : ${key}`);
  }
  for (const key of ['seeds', 'stock', 'collection', 'cropXP', 'recipeXP', 'friendship', 'relations', 'stats', 'upgradeTiers', 'personalWins', 'dishBest', 'exceptional']) {
    const value = g[key];
    if (value === undefined) continue;
    if (!value || typeof value !== 'object' || Array.isArray(value) || !Object.values(value).every(n => numeric(n, !['cropXP', 'recipeXP', 'friendship'].includes(key)))) throw Error(`Quantités invalides : ${key}`);
  }
  for (const key of ['upgrades', 'claimed', 'quests']) {
    if (g[key] !== undefined && (!Array.isArray(g[key]) || !(g[key] as unknown[]).every(v => typeof v === 'string'))) throw Error(`Liste invalide : ${key}`);
  }
  if (!(g.plots as unknown[]).every(p => p === null || (typeof p === 'object' && p && 'crop' in p && typeof p.crop === 'string' && !!crop(p.crop) && 'start' in p && numeric(p.start) && 'end' in p && numeric(p.end) && 'watered' in p && typeof p.watered === 'boolean'))) throw Error('Parcelle invalide');
}
export function restore(raw: string | null, now = Date.now()): Game {
  if (!raw) return fresh();
  try {
    const g = JSON.parse(raw),
      base = fresh();
    if (
      !isSupportedSaveVersion(g.version) ||
      !Array.isArray(g.plots) ||
      g.plots.length < 6 ||
      !Number.isFinite(g.coins) ||
      !Number.isFinite(g.xp) ||
      !g.seeds ||
      !g.stock ||
      !Array.isArray(g.upgrades) ||
      !Array.isArray(g.claimed)
    )
      throw new Error('Sauvegarde non reconnue');
    validateSaveNumbers(g, base);
    const lineages = normalizeLineages(g.lineages, (id) => !!crop(id));
    const seedFinds = normalizeSeedFinds(g.seedFinds, lineages, (id) => !!crop(id));
    const restored: Game = {
      ...base,
      ...g,
      version: SAVE_VERSION,
      // v10 (0.9.2) : nouvelle courbe d’XP ; le niveau et l’avancement sont conservés.
      // v11 (0.10) : 25 niveaux, même avancement relatif sur le parcours.
      xp: g.version < 10 ? rescaleV10Xp(rescaleLegacyXp(g.xp))
        : g.version < 11 ? rescaleV10Xp(g.xp)
        : g.version < 13 ? rescaleV12Xp(g.xp) : g.xp,
      plots: g.plots.map((plot: Plot) => {
        if (plot && plot.garde !== undefined) {
          const amount = Math.floor(Number(plot.garde));
          const { garde: _garde, lineageId: _lineage, ...rest } = plot;
          plot = Number.isFinite(amount) && amount > 0
            ? { ...rest, garde: Math.min(GARDE_CAP, amount) }
            : { ...rest, ...(_lineage ? { lineageId: _lineage } : {}) };
        }
        if (!plot || !plot.lineageId) return plot;
        return lineages.some((lineage) => lineage.id === plot.lineageId && lineage.crop === plot.crop)
          ? plot : { ...plot, lineageId: undefined };
      }),
      lineages,
      seedFinds,
      lineageSerial: Math.max(1, ...lineages.map((lineage) => lineage.id + 1), Math.floor(Number(g.lineageSerial) || 1)),
      findSerial: Math.max(1, ...seedFinds.map((find) => find.id + 1), Math.floor(Number(g.findSerial) || 1)),
      terroirBuilds: Array.isArray(g.terroirBuilds)
        ? [...new Set(g.terroirBuilds.filter((id: unknown): id is TerroirId =>
            typeof id === 'string' && TERROIRS.some((entry) => entry.id === id)))] : [],
      season: normalizeSeason(g.season, g.harvests, g.orders, g.crafted),
      signatureOrders: Number.isFinite(g.signatureOrders) ? Math.max(0, Math.floor(g.signatureOrders)) : 0,
      valley: normalizeValley(g.valley, (item) => item === 'oeuf' || !!crop(item.split('|')[0]) || isFestivalDish(item)),
      cropXP: Object.fromEntries(
        Object.entries(g.version < 3 ? g.cropXP || g.collection || {} : g.cropXP || {})
          .map(([id, value]) => {
            const points = Number(value) * (g.version < 3 ? crop(id)?.mastery || 1 : 1);
            const legacyRank = MASTERY_STEPS.filter((n) => points >= n).length;
            return [id, g.version < 6 && crop(id)
              ? Math.max(points, cropMasterySteps(id)[Math.max(0, legacyRank - 1)])
              : points];
          }),
      ),
      recipeXP: g.recipeXP || {},
      specializations: g.specializations || {},
      friendship:
        g.friendship ||
        Object.fromEntries(
          Object.entries(g.relations || {}).map(([id, n]) => [
            id,
            HEART_STEPS[Math.min(5, Math.max(0, Number(n)))],
          ]),
        ),
      quests:
        g.quests ||
        Object.keys(g.relations || {}).filter((id) => g.relations[id] >= 3),
      talentPoints: Number.isFinite(g.talentPoints) ? g.talentPoints : 0,
      pendingCrop: typeof g.pendingCrop === 'string' ? g.pendingCrop : null,
      pendingCrops: Array.isArray(g.pendingCrops) ? [...new Set<string>(g.pendingCrops.filter((id: unknown): id is string => typeof id === 'string' && !!crop(id) && id !== g.pendingCrop))] : [],
      stats: { ...base.stats, ...g.stats },
      relations: { ...base.relations, ...g.relations },
      settings: {
        ...base.settings,
        ...Object.fromEntries(Object.entries(g.settings && typeof g.settings === 'object' ? g.settings : {}).filter(([key, value]) => key in base.settings && typeof value === 'boolean')),
      },
      seenScenes: Array.isArray(g.seenScenes) ? g.seenScenes : [],
      weatherSeed: Number.isFinite(g.weatherSeed)
        ? Math.abs(Math.floor(g.weatherSeed)) % 4
        : base.weatherSeed,
      festival: normalizeFestival(g.festival, isFestivalDish),
      projects: g.version < 6
        ? migrateProjectEvidence(g, normalizeProjects(g.projects))
        : normalizeProjects(g.projects),
      buffs: normalizeBuffs(g.buffs),
      orchard:
        typeof g.orchard === 'number' && Number.isFinite(g.orchard)
          ? g.orchard
          : normalizeProjects(g.projects).done.includes('verger')
            ? 0
            : null,
      dishBest: numberRecord(g.dishBest, 0, 3),
      exceptional: numberRecord(g.exceptional, 0, Number.MAX_SAFE_INTEGER),
      upgradeTiers: Object.fromEntries(
        (Object.keys(UPGRADE_PATHS) as UpgradePathId[]).map((id) => [
          id,
          g.version < 6 || !Number.isFinite(g.upgradeTiers?.[id])
            ? g.upgrades.includes(id) ? 1 : 0
            : Math.min(5, Math.max(0, Math.floor(Number(g.upgradeTiers[id]) || 0))),
        ]),
      ),
      bulkJob: normalizeBulkJob(g.bulkJob, g.plots.length),
      stoves: normalizeStoves(g.stoves),
      trackedGoals: Array.isArray(g.trackedGoals)
        ? [...new Set(g.trackedGoals.filter((id: unknown): id is string =>
            typeof id === 'string' && GOALS.some((goal) => goal.id === id) &&
            !g.claimed.includes(id)))].slice(0, 3)
        : [],
      grandOrders: Number.isFinite(g.grandOrders)
        ? Math.max(0, Math.floor(g.grandOrders)) : 0,
      orderSlots: Array.from({ length: 9 }, (_, index) =>
        g.version < 6 && index === 0 ? Math.max(0, Math.floor(g.orders || 0))
          : Math.max(0, Math.floor(Number(g.orderSlots?.[index]) || 0))),
      personalWins: Object.fromEntries(LINKS.map((link) => [link.id,
        Math.max(0, Math.floor(Number(g.personalWins?.[link.id]) || 0))])),
      giftHistory: Array.isArray(g.giftHistory)
        ? g.giftHistory.filter((value: unknown) => typeof value === 'string').slice(0, 500) : [],
      skillSeen: Array.isArray(g.skillSeen)
        ? [...new Set(g.skillSeen.filter((value: unknown): value is string =>
            typeof value === 'string' && /^(culture|cuisine|commerce):/.test(value)))].slice(0, 300)
        : [
            ...Object.keys(g.collection || {}).filter((id) => crop(id) && g.collection[id] > 0).map((id) => 'culture:' + id),
            ...Object.keys(g.recipeXP || {}).filter((id) => recipe(id) && g.recipeXP[id] > 0).map((id) => 'cuisine:' + id),
            ...Array.from({ length: Math.min(3, Math.floor(Number(g.orders) || 0)) }, (_, i) => 'commerce:heritage-' + i),
          ],
      skillChoices: Object.fromEntries(SKILL_PATHS.flatMap((path) =>
        path.choices.some((choice) => choice.id === g.skillChoices?.[path.id])
          ? [[path.id, g.skillChoices[path.id]]] : [])),
      festivalAwards: Array.isArray(g.festivalAwards)
        ? [...new Set(g.festivalAwards.filter((value: unknown) => typeof value === 'string'))].slice(0, 200) : [],
      lastCooked: typeof g.lastCooked === 'string' && isFestivalDish(g.lastCooked) ? g.lastCooked : null,
      seenPages: Array.isArray(g.seenPages)
        ? [...new Set(g.seenPages.filter((value: unknown): value is string => typeof value === 'string'))].slice(0, 40)
        : undefined,
      favoriteSeeds: Array.isArray(g.favoriteSeeds)
        ? [...new Set(g.favoriteSeeds.filter((id: unknown): id is string => typeof id === 'string' && !!crop(id)))].slice(0, 5)
        : undefined,
      // 0.11 : embellissements, dons et délais des commandes (absents avant la v13).
      embellishments: Object.fromEntries(EMBELLISHMENTS.flatMap((entry) => {
        const value = (g.embellishments as Record<string, unknown> | undefined)?.[entry.id];
        return Number.isInteger(value) && (value as number) >= 1 ? [[entry.id, Math.min(3, value as number)]] : [];
      })),
      // 0.13 : restaurations de l’anneau (absentes avant la 0.13 : rien de restauré).
      restorations: Object.fromEntries(RESTORATIONS.flatMap((entry) => {
        const value = (g.restorations as Record<string, unknown> | undefined)?.[entry.id];
        return Number.isInteger(value) && (value as number) >= 1 ? [[entry.id, Math.min(3, value as number)]] : [];
      })),
      donations: Number.isInteger(g.donations) && g.donations > 0 ? Math.min(100_000, g.donations) : 0,
      orderReady: Array.isArray(g.orderReady)
        ? g.orderReady.slice(0, 9).map((value: unknown) => typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0)
        : [],
    };
    // 0.10 : tutoriel. Une partie d’avant n’a pas de leçon pour ce qu’elle connaît déjà.
    restored.tutorial = normalizeTutorial(g.tutorial) ?? settledTutorial(restored);
    const occupied = restored.plots.reduce((last, plot, index) => plot ? index + 1 : last, 0);
    const tiers = [6, 9, 12, 15, 18].filter(n => n <= maxPlots(restored) && n >= occupied);
    const nearest = tiers.sort((a, b) => Math.abs(a - restored.plots.length) - Math.abs(b - restored.plots.length) || a - b)[0];
    if (nearest !== undefined) restored.plots = Array.from({ length: nearest }, (_, i) => restored.plots[i] ?? null);
    boundTimers(restored, now);
    return restored;
  } catch (cause) {
    throw new Error('Sauvegarde illisible', { cause });
  }
}
export function duration(seconds: number) {
  const s = Math.max(0, Math.ceil(seconds));
  // 0.9.5 : au-delà d’une heure (semis de garde, longues tournées), heures et minutes.
  if (s >= 3600) {
    const m = Math.ceil((s % 3600) / 60);
    const h = Math.floor(s / 3600) + (m === 60 ? 1 : 0);
    return `${h} h${m && m < 60 ? ' ' + String(m).padStart(2, '0') : ''}`;
  }
  return s < 60
    ? `${s} s`
    : `${Math.floor(s / 60)} min${s % 60 ? ' ' + (s % 60) + ' s' : ''}`;
}
