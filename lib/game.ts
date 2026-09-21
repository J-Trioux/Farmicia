export const CROPS = [
  {
    id: 'radis',
    name: 'Radis',
    icon: '🌱',
    fruit: '🔴',
    level: 1,
    time: 30,
    cost: 2,
    price: 7,
    xp: 2,
    mastery: 1,
    tag: 'Active et rapide · faible valeur par geste',
  },
  {
    id: 'carotte',
    name: 'Carotte',
    icon: '🥕',
    fruit: '🥕',
    level: 1,
    time: 60,
    cost: 4,
    price: 13,
    xp: 5,
    mastery: 2,
    tag: 'Idéale pour les commandes courtes',
  },
  {
    id: 'ble',
    name: 'Blé',
    icon: '🌾',
    fruit: '🌾',
    level: 3,
    time: 120,
    cost: 5,
    price: 17,
    xp: 12,
    mastery: 3,
    tag: 'Indispensable au pain et aux poules',
  },
  {
    id: 'salade',
    name: 'Laitue',
    icon: '🥬',
    fruit: '🥬',
    level: 2,
    time: 90,
    cost: 5,
    price: 12,
    xp: 7,
    mastery: 2,
    tag: 'Fraîcheur des commandes courtes',
  },
  {
    id: 'tomate',
    name: 'Tomate',
    icon: '🍅',
    fruit: '🍅',
    level: 4,
    time: 180,
    cost: 9,
    price: 27,
    xp: 19,
    mastery: 4,
    tag: 'La reine de la transformation',
  },
  {
    id: 'fraise',
    name: 'Fraise',
    icon: '🍓',
    fruit: '🍓',
    level: 5,
    time: 300,
    cost: 12,
    price: 36,
    xp: 28,
    mastery: 5,
    tag: 'La douceur des confitures',
  },
  {
    id: 'mais',
    name: 'Maïs',
    icon: '🌽',
    fruit: '🌽',
    level: 6,
    time: 600,
    cost: 15,
    price: 52,
    xp: 46,
    mastery: 7,
    tag: 'Production intermédiaire rentable',
  },
  {
    id: 'aubergine',
    name: 'Aubergine',
    icon: '🍆',
    fruit: '🍆',
    level: 7,
    time: 900,
    cost: 20,
    price: 72,
    xp: 62,
    mastery: 8,
    tag: 'Rentable et utile à la ratatouille',
  },
  {
    id: 'myrtille',
    name: 'Myrtille',
    icon: '🫐',
    fruit: '🫐',
    level: 8,
    time: 1200,
    cost: 28,
    price: 105,
    xp: 86,
    mastery: 10,
    tag: 'Parfaite pendant une longue absence',
  },
  {
    id: 'citrouille',
    name: 'Citrouille',
    icon: '🎃',
    fruit: '🎃',
    level: 9,
    time: 1800,
    cost: 35,
    price: 145,
    xp: 115,
    mastery: 12,
    tag: 'À laisser grandir tranquillement',
  },
  {
    id: 'raisin',
    name: 'Raisin',
    icon: '🍇',
    fruit: '🍇',
    level: 10,
    time: 3600,
    cost: 45,
    price: 220,
    xp: 175,
    mastery: 16,
    tag: 'Grande valeur et qualités généreuses',
  },
  {
    id: 'melon',
    name: 'Melon',
    icon: '🍈',
    fruit: '🍈',
    level: 11,
    time: 7200,
    cost: 65,
    price: 360,
    xp: 280,
    mastery: 22,
    tag: 'Récolte rare et prestigieuse',
  },
];
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
};
export const RECIPES: Recipe[] = [
  {
    id: 'pain',
    name: 'Pain de campagne',
    icon: '🍞',
    needs: { ble: 3 },
    price: 76,
    time: 40,
    level: 4,
  },
  {
    id: 'confiture',
    name: 'Confiture de fraises',
    icon: '🍯',
    needs: { fraise: 3 },
    price: 155,
    time: 70,
    level: 5,
  },
  {
    id: 'sauce',
    name: 'Sauce du jardin',
    icon: '🥫',
    needs: { tomate: 2, carotte: 1 },
    price: 96,
    time: 60,
    level: 4,
  },
  {
    id: 'ratatouille',
    name: 'Ratatouille',
    icon: '🍲',
    needs: { tomate: 2, aubergine: 2 },
    price: 275,
    time: 100,
    level: 7,
  },
  {
    id: 'violette',
    name: 'Confiture des bois',
    icon: '🫙',
    needs: { myrtille: 3 },
    price: 450,
    time: 140,
    level: 8,
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
    level: 6,
    friend: 'lucie',
  },
  {
    id: 'infusion',
    name: 'Infusion de Jeanne',
    icon: '🍵',
    needs: { myrtille: 1, fraise: 1 },
    price: 170,
    time: 80,
    level: 8,
    friend: 'jeanne',
  },
  {
    id: 'tarte',
    name: 'Tarte de Clara',
    icon: '🥧',
    needs: { fraise: 2, ble: 1, oeuf: 1 },
    price: 170,
    time: 100,
    level: 7,
    friend: 'clara',
  },
);
export const BUILD = '0.2.1 — Le Bon Rythme';
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
      'Commandes : +15 % de pièces',
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
    desc: '3 nouvelles parcelles. Les extensions suivantes arrivent aux niveaux 4, 6 et 9.',
    cost: 35,
    level: 1,
  },
  {
    id: 'water',
    name: 'Irrigation douce',
    icon: '💧',
    desc: 'Toutes les nouvelles plantations poussent 25 % plus vite.',
    cost: 120,
    level: 3,
  },
  {
    id: 'tools',
    name: 'Outils de jardinier',
    icon: '🧺',
    desc: 'Récoltez toutes les plantes mûres en un geste.',
    cost: 100,
    level: 2,
  },
  {
    id: 'workshop',
    name: 'Atelier de Rosalie',
    icon: '🍯',
    desc: 'Transformez vos récoltes en recettes plus précieuses.',
    cost: 180,
    level: 4,
  },
  {
    id: 'coop',
    name: 'Le petit poulailler',
    icon: '🐔',
    desc: '3 blés donnent 4 œufs en 2 minutes. Un œuf vaut 22 pièces.',
    cost: 240,
    level: 6,
  },
  {
    id: 'auto',
    name: 'Semis en série',
    icon: '🌱',
    desc: 'Plantez la graine sélectionnée dans toutes les cases vides.',
    cost: 400,
    level: 8,
  },
  {
    id: 'watering-can',
    name: 'Arrosoir de cuivre',
    icon: '🚿',
    desc: 'Arrosez toutes les cultures en pousse en une seule action.',
    cost: 220,
    level: 3,
  },
];
export type Plot = {
  crop: string;
  start: number;
  end: number;
  watered: boolean;
  specialization?: string;
} | null;
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
      specialization?: string;
      id?: string;
      ingredients?: string[];
      villager?: string;
      item?: string;
      confirmSuperior?: boolean;
      stat?: keyof CookingStats;
    };
export type Game = {
  version: 3;
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
  job: null | {
    id: string;
    end: number;
    quality?: string;
    probabilities?: number[];
    ingredientValue?: number;
  };
  cropXP: Record<string, number>;
  specializations: Record<string, string>;
  recipeXP: Record<string, number>;
  friendship: Record<string, number>;
  quests: string[];
  talentPoints: number;
  pendingCrop: string | null;
  hens: number | null;
  created: number;
  saved: number;
  stats: CookingStats;
  relations: Record<string, number>;
};
export const KEY = 'rosalie-farm-v1';
export function fresh(now = Date.now()): Game {
  return {
    version: 3,
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
    hens: null,
    created: now,
    saved: now,
    stats: { mastery: 1, precision: 1, creativity: 1, regularity: 1, luck: 1 },
    relations: { lucie: 0, marcel: 0, jeanne: 0, clara: 0, emile: 0 },
  };
}
export const LEVEL_XP = [
  0, 120, 420, 1000, 1900, 3300, 5200, 7800, 11000, 15000, 20500, 28000,
];
export const LEVEL_CONTENT = [
  { level: 1, crop: 'radis', system: 'Marché et première extension' },
  { level: 2, crop: 'salade', system: 'Irrigation douce' },
  { level: 3, crop: 'ble', system: 'Outils et commandes élaborées' },
  { level: 4, crop: 'tomate', system: 'Atelier, pain et sauce' },
  { level: 5, crop: 'fraise', system: 'Confitures et quêtes d’amitié' },
  { level: 6, crop: 'mais', system: 'Poulailler' },
  { level: 7, crop: 'aubergine', system: 'Ratatouille et recettes signatures' },
  {
    level: 8,
    crop: 'myrtille',
    system: 'Semis en série et marchés de qualité',
  },
  { level: 9, crop: 'citrouille', system: 'Grandes commandes et extension' },
  { level: 10, crop: 'raisin', system: 'Préparation du futur verger' },
  {
    level: 11,
    crop: 'melon',
    system: 'Recettes rares et commandes prestigieuses',
  },
  { level: 12, crop: null, system: 'Titre de maître jardinier · future serre' },
] as const;
export function level(g: Game) {
  let current = 1;
  for (let i = 1; i < LEVEL_XP.length; i++)
    if (g.xp >= LEVEL_XP[i]) current = i + 1;
  return Math.min(12, current);
}
export function levelContent(value: number) {
  return LEVEL_CONTENT.find((entry) => entry.level === value)!;
}
export const crop = (id: string) => CROPS.find((c) => c.id === id)!;
export const recipe = (id: string) => RECIPES.find((r) => r.id === id);
export const outcome = (id: string) => OUTCOMES.find((o) => o.id === id)!;
export function dishParts(id: string) {
  const [recipeId, qualityId, valuePart] = id.split('|');
  return {
    recipeId,
    qualityId: qualityId || 'reussi',
    ingredientValue: valuePart?.startsWith('v')
      ? Number(valuePart.slice(1)) || 0
      : 0,
  };
}
export function dishName(id: string) {
  const p = dishParts(id);
  const r = recipe(p.recipeId);
  return r ? `${r.name} · ${outcome(p.qualityId).name}` : id;
}
export function dishIcon(id: string) {
  const p = dishParts(id);
  return recipe(p.recipeId)?.icon || '🍽️';
}
export function mastery(xp: number) {
  return MASTERY_STEPS.filter((n) => xp >= n).length;
}
export function cropMastery(g: Game, id: string) {
  return mastery(g.cropXP[id] || 0);
}
export function recipeMastery(g: Game, id: string) {
  return mastery((g.recipeXP[recipe(id)?.parent || id] || 0) * 3);
}
export function masteryGain(id: string) {
  return crop(id).mastery;
}
export function growTime(g: Game, id: string) {
  const spec = g.specializations[id];
  return (
    crop(id).time *
    (cropMastery(g, id) >= 2 ? 0.9 : 1) *
    (spec === 'precoce' ? 0.75 : spec === 'artisanale' ? 1.2 : 1) *
    (g.upgrades.includes('water') ? 0.75 : 1)
  );
}
export function itemName(id: string) {
  const [base, q = 'ordinaire'] = id.split('|');
  const c = crop(base);
  return c
    ? `${c.name} · ${QUALITIES.find((v) => v.id === q)?.name || 'Ordinaire'}`
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
    .sort((a, b) => itemQualityRank(a) - itemQualityRank(b));
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
  if (r.parent && level(g) < 7) return 'Niveau 7';
  if (r.parent && recipeMastery(g, r.parent) < 3)
    return 'Maîtrise 3 de la recette de base';
  if (r.friend && (g.relations[r.friend] || 0) < 3)
    return `3 cœurs avec ${VILLAGERS.find((v) => v.id === r.friend)?.name}`;
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
  if (level(g) >= 8 && qualities.length) modes.push(2);
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
  return Math.round(
    basePrice(id) *
      (1 + marketBonus(g, id, now)) *
      (1 + hearts * 0.03 + (hearts >= 5 ? 0.1 : 0)),
  );
}
export function featured(g: Game, now: number) {
  return marketEvent(g, now).target;
}
export function order(g: Game) {
  const list = CROPS.filter((c) => c.level <= level(g));
  const recipes = RECIPES.filter((r) => !recipeLock(g, r) && !r.parent);
  const dish =
    !g.pendingCrop &&
    g.orders % 3 === 2 &&
    g.upgrades.includes('workshop') &&
    recipes.length;
  const pending = g.pendingCrop && crop(g.pendingCrop)?.level <= level(g);
  const c = pending ? crop(g.pendingCrop!) : list[g.orders % list.length];
  const id = dish
    ? recipes[Math.floor(g.orders / 3) % recipes.length].id +
      (g.orders % 6 === 5 ? '|savoureux' : '|reussi')
    : c.id +
      (canProduceQuality(g, 'belle') && g.orders >= 4 && g.orders % 3 === 1
        ? '|belle'
        : '');
  const baseAmount = Math.max(1, Math.min(5, Math.ceil(240 / c.time)));
  const amount = dish
    ? 1
    : level(g) >= 9 && g.orders % 4 === 3
      ? baseAmount * 2
      : baseAmount;
  return {
    crop: id,
    amount,
    reward: Math.round(
      (basePrice(id) * amount + 15 + c.time / 12 + Math.min(30, g.orders) * 3) *
        ((g.relations.emile || 0) >= 3 ? 1.15 : 1),
    ),
    xp: 20 + Math.min(30, g.orders) * 2,
    person: ['Lucie, la boulangère', 'Marcel, le voisin', 'Jeanne, au café'][
      g.orders % 3
    ],
  };
}
export function ingredientKeys(g: Game, id: string) {
  return [id, id + '|belle', id + '|exceptionnelle'].filter(
    (k) => (g.stock[k] || 0) > 0,
  );
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
export function validIngredients(g: Game, r: Recipe, keys: string[]) {
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
        (g.stock[k] || 0) >= n,
    ) &&
    Object.keys(bases).length === Object.keys(r.needs).length &&
    Object.entries(r.needs).every(([k, n]) => bases[k] === n)
  );
}
export function ingredientQuality(keys: string[]) {
  return (
    keys.reduce(
      (sum, k) =>
        sum +
        (k.endsWith('|belle') ? 1 : k.endsWith('|exceptionnelle') ? 2 : 0),
      0,
    ) / Math.max(1, keys.length)
  );
}
export function harvestProbabilities(
  g: Game,
  id: string,
  watered: boolean,
  specialization = g.specializations[id],
) {
  const rank = cropMastery(g, id);
  const bonus =
    (watered ? 0.08 : 0) +
    (g.upgrades.includes('tools') ? 0.05 : 0) +
    (rank >= 4 ? 0.1 : 0) +
    ((g.relations.marcel || 0) >= 3 ? 0.05 : 0);
  const longCropBonus = Math.min(0.12, crop(id).time / 60000);
  const exceptional =
    0.01 +
    (rank >= 4 ? 0.04 : 0) +
    (specialization === 'artisanale' ? 0.16 : 0) +
    (watered ? 0.02 : 0) +
    longCropBonus * 0.35;
  const beautiful =
    0.1 + bonus + longCropBonus + (specialization === 'artisanale' ? 0.15 : 0);
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
  return id === 'expand'
    ? 35 * Math.pow(2, (g.plots.length - 6) / 3)
    : UPGRADES.find((u) => u.id === id)!.cost;
}
export function maxPlots(g: Game) {
  const current = level(g);
  return current >= 9 ? 21 : current >= 6 ? 15 : current >= 4 ? 12 : 9;
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
export function cookingProbabilities(
  g: Game,
  id = 'pain',
  keys: string[] = [],
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
  const weights = [
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
      (rank - 1) * 0.025,
    0.04 +
      stats.creativity * 0.003 +
      stats.luck * 0.004 +
      quality * 0.07 +
      (rank - 1) * 0.015,
  ];
  const total = weights.reduce((a, b) => a + b, 0);
  return weights.map((w) => w / total);
}
export function qualityFor(g: Game) {
  return OUTCOMES[rollIndex(cookingProbabilities(g), Math.random)].id;
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
} {
  const g = structuredClone(state);
  const payload = typeof arg === 'object' && arg !== null ? arg : {};
  const scalar = typeof arg === 'string' || typeof arg === 'number' ? arg : '';
  let message = '';
  const fail = (message: string) => ({ g: state, message });
  if (action === 'plant') {
    const c = crop(payload.crop || '');
    const index = payload.index ?? -1;
    if (!c || c.level > level(g) || g.plots[index] !== null)
      return fail('Cette parcelle n’est pas disponible.');
    if (!(g.seeds[c.id] > 0))
      return fail('Achetez des graines dans la graineterie.');
    g.seeds[c.id]--;
    g.plots[index] = {
      crop: c.id,
      start: now,
      end: now + growTime(g, c.id) * 1000,
      specialization: g.specializations[c.id],
      watered: false,
    };
    message = `${c.name} planté · ça pousse !`;
  }
  if (action === 'harvest') {
    const index = Number(scalar);
    const p = g.plots[index];
    if (!p || p.end > now) return fail('Encore un peu de patience…');
    const c = crop(p.crop);
    const quality =
      QUALITIES[
        rollIndex(
          harvestProbabilities(g, c.id, p.watered, p.specialization),
          random,
        )
      ].id;
    const key = quality === 'ordinaire' ? c.id : c.id + '|' + quality;
    const amount = p.specialization === 'abondante' && random() < 0.35 ? 2 : 1;
    g.stock[key] = (g.stock[key] || 0) + amount;
    g.collection[c.id] = (g.collection[c.id] || 0) + amount;
    g.cropXP[c.id] = (g.cropXP[c.id] || 0) + masteryGain(c.id);
    g.harvests++;
    g.xp += c.xp;
    g.plots[index] = null;
    const hearts = g.relations.marcel || 0;
    const bonus = hearts > 0 && g.harvests % (hearts >= 5 ? 2 : 5) === 0;
    if (bonus) g.seeds[c.id] = (g.seeds[c.id] || 0) + 1;
    const signature =
      cropMastery(g, c.id) === 5 && g.collection[c.id] % 5 === 0;
    if (signature) g.seeds[c.id] = (g.seeds[c.id] || 0) + 1;
    message = `+${amount} ${itemName(key)} · +${c.xp} XP${bonus || signature ? ' · +1 graine !' : ''}`;
    if (cropMastery(g, c.id) > cropMastery(state, c.id))
      message += ` · Maîtrise ${cropMastery(g, c.id)} !`;
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
    const cost = g.specializations[id] ? 50 : 0;
    if (g.coins < cost)
      return fail('Changer de spécialisation coûte 50 pièces.');
    g.coins -= cost;
    g.specializations[id] = spec;
    message = 'Spécialisation choisie pour les prochaines plantations.';
  }
  if (action === 'water') {
    const p = g.plots[Number(scalar)];
    if (!p || p.watered || p.end <= now)
      return fail('Cette plante n’a pas besoin d’eau.');
    p.watered = true;
    message = 'Cette culture est arrosée · meilleures chances de qualité.';
  }
  if (action === 'waterAll') {
    if (!g.upgrades.includes('watering-can'))
      return fail('Installez l’arrosoir de cuivre.');
    let watered = 0;
    g.plots.forEach((plot) => {
      if (plot && !plot.watered && plot.end > now) {
        plot.watered = true;
        watered++;
      }
    });
    if (!watered) return fail('Aucune culture n’a besoin d’eau.');
    message = `${watered} culture${watered > 1 ? 's' : ''} arrosée${watered > 1 ? 's' : ''} · qualité améliorée.`;
  }
  if (action === 'buy') {
    const c = crop(String(scalar));
    if (!c || c.level > level(g))
      return fail('Cette culture se débloque avec les niveaux.');
    if (g.coins < c.cost)
      return fail(
        'Pas assez de pièces. Les graines de secours peuvent vous aider.',
      );
    g.coins -= c.cost;
    g.seeds[c.id] = (g.seeds[c.id] || 0) + 1;
    message = `+1 graine de ${c.name.toLowerCase()}`;
  }
  if (action === 'sell') {
    const key = String(scalar);
    const n = g.stock[key] || 0;
    if (!n) return fail('Votre panier est vide.');
    const earned = n * price(g, key, now);
    g.coins += earned;
    g.sold += earned;
    g.stock[key] = 0;
    message = `Vendu ! +${earned} pièces`;
  }
  if (action === 'upgrade') {
    const id = String(scalar);
    const u = UPGRADES.find((u) => u.id === id);
    if (
      !u ||
      level(g) < u.level ||
      g.coins < upgradeCost(g, id) ||
      (id === 'expand'
        ? g.plots.length >= maxPlots(g)
        : g.upgrades.includes(id))
    )
      return fail('Cette amélioration n’est pas encore disponible.');
    g.coins -= upgradeCost(g, id);
    if (id === 'expand') g.plots.push(null, null, null);
    else g.upgrades.push(id);
    message = `${u.name} installé !`;
  }
  if (action === 'order') {
    const o = order(g);
    const delivery = fulfillment(g.stock, o.crop, o.amount);
    if (!delivery.possible)
      return fail('Il manque des récoltes pour cette commande.');
    if (delivery.usesSuperior && !payload.confirmSuperior)
      return fail('Confirmez l’utilisation de produits de qualité supérieure.');
    Object.entries(delivery.used).forEach(([id, quantity]) => {
      g.stock[id] -= quantity;
    });
    g.coins += o.reward;
    g.xp += o.xp;
    g.orders++;
    if (g.pendingCrop === o.crop.split('|')[0]) g.pendingCrop = null;
    message = `Merci pour la livraison ! +${o.reward} pièces · +${o.xp} XP`;
  }
  if (action === 'craft') {
    const r = recipe(typeof arg === 'string' ? arg : payload.id || '');
    if (!r || !g.upgrades.includes('workshop') || recipeLock(g, r) || g.job)
      return fail('Votre atelier ou cette recette n’est pas disponible.');
    const keys: string[] =
      typeof arg === 'string'
        ? defaultIngredients(g, r)
        : (payload.ingredients ?? []);
    if (!validIngredients(g, r, keys))
      return fail('Vérifiez les quantités et les ingrédients choisis.');
    const probabilities = cookingProbabilities(g, r.id, keys);
    const ingredientValue = Math.ceil(
      keys.reduce((sum, id) => sum + basePrice(id), 0),
    );
    keys.forEach((id: string) => g.stock[id]--);
    g.job = {
      id: r.id,
      end: now + r.time * 1000,
      probabilities,
      ingredientValue,
      quality: OUTCOMES[rollIndex(probabilities, random)].id,
    };
    message =
      'La recette mijote… Vos ingrédients et leurs bonus sont conservés.';
  }
  if (action === 'collect') {
    if (!g.job || g.job.end > now)
      return fail('La recette n’est pas encore prête.');
    const prepared = g.job.id,
      qualityId =
        g.job.quality ||
        OUTCOMES[rollIndex(cookingProbabilities(g, prepared), random)].id,
      result = outcome(qualityId),
      key = `${prepared}|${qualityId}|v${g.job.ingredientValue || 0}`;
    g.stock[key] = (g.stock[key] || 0) + 1;
    g.job = null;
    g.crafted++;
    const masteryId = recipe(prepared)?.parent || prepared;
    g.recipeXP[masteryId] = (g.recipeXP[masteryId] || 0) + 1;
    if (g.crafted % 3 === 0) g.talentPoints++;
    g.xp += result.xp;
    message =
      `${result.icon} ${result.name} : ${recipe(prepared)?.name} · +${result.xp} XP` +
      (qualityId === 'chef' ? ' ✨' : '') +
      (g.crafted % 3 === 0 ? ' · +1 point de talent !' : '');
  }
  if (action === 'talent') {
    const stat = payload.stat;
    if (!stat || !(stat in g.stats) || g.talentPoints < 1)
      return fail('Aucun point de talent disponible.');
    if (g.stats[stat] >= 20) return fail('Cette statistique est au maximum.');
    g.talentPoints--;
    g.stats[stat]++;
    message = `${stat === 'mastery' ? 'Maîtrise' : stat === 'precision' ? 'Précision' : stat === 'creativity' ? 'Créativité' : stat === 'regularity' ? 'Régularité' : 'Chance'} améliorée !`;
  }
  if (action === 'hens') {
    if (!g.upgrades.includes('coop')) return fail('Installez le poulailler.');
    if (g.hens !== null) {
      if (g.hens > now) return fail('Les poules prennent leur temps.');
      g.stock.oeuf = (g.stock.oeuf || 0) + 4;
      g.hens = null;
      g.xp += 15;
      message = '+4 œufs frais · +15 XP';
    } else {
      if ((g.stock.ble || 0) < 3)
        return fail('Il faut 3 blés pour nourrir les poules.');
      g.stock.ble -= 3;
      g.hens = now + 120000;
      message = 'Les poules ont bien mangé !';
    }
  }
  if (action === 'mission') {
    const id = String(scalar);
    const m = MISSIONS.find((m) => m.id === id);
    if (!m || g.claimed.includes(id) || g[m.field] < m.target)
      return fail('Cet objectif n’est pas encore terminé.');
    g.claimed.push(id);
    g.coins += m.reward;
    g.xp += 15;
    message = `Objectif accompli ! +${m.reward} pièces · +15 XP`;
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
    message = `Quête accomplie ! +${q.reward} pièces · nouveau talent débloqué.`;
  }
  if (action === 'gift') {
    const v = VILLAGERS.find((v) => v.id === payload.villager);
    if (!v || (g.relations[v.id] || 0) >= 5)
      return fail('Votre amitié est déjà au sommet.');
    const key = payload.item;
    if (typeof key !== 'string' || !(g.stock[key] > 0))
      return fail('Choisissez un produit à offrir.');
    if (
      (g.relations[v.id] || 0) >= 2 &&
      !g.quests.includes(v.id) &&
      (g.friendship[v.id] || 0) >= 12
    )
      return fail('Accomplissez sa quête personnelle pour dépasser 2 cœurs.');
    const points = v.likes.includes(key.split('|')[0]) ? 2 : 1;
    g.stock[key]--;
    g.friendship[v.id] = (g.friendship[v.id] || 0) + points;
    g.relations[v.id] = Math.min(
      g.quests.includes(v.id) ? 5 : 2,
      HEART_STEPS.filter((n) => g.friendship[v.id] >= n).length - 1,
    );
    message = `${v.name} vous remercie ! +${points} amitié · ${g.relations[v.id]}/5 cœurs`;
  }
  if (action === 'rescue') {
    if (
      g.coins >= 2 ||
      Object.values(g.seeds).some((n) => n > 0) ||
      g.plots.some(Boolean) ||
      Object.values(g.stock).some((n) => n > 0) ||
      g.job ||
      g.hens
    )
      return fail(
        'Vos ressources permettent encore de faire grandir le jardin.',
      );
    g.seeds.radis = 3;
    message = 'Rosalie vous offre 3 graines de radis.';
  }
  const previousLevel = level(state);
  const currentLevel = level(g);
  let levelUp:
    | { level: number; crop: string | null; system: string }
    | undefined;
  if (currentLevel > previousLevel) {
    for (
      let unlocked = previousLevel + 1;
      unlocked <= currentLevel;
      unlocked++
    ) {
      const content = levelContent(unlocked);
      if (content.crop) {
        g.seeds[content.crop] = (g.seeds[content.crop] || 0) + 1;
        g.pendingCrop = content.crop;
      }
      levelUp = { ...content };
    }
    message += ` ✨ Niveau ${currentLevel} ! Une nouvelle étape commence.`;
  }
  g.saved = now;
  return { g, message, levelUp };
}
export function restore(raw: string | null): Game {
  if (!raw) return fresh();
  try {
    const g = JSON.parse(raw),
      base = fresh();
    if (
      ![1, 2, 3].includes(g.version) ||
      !Array.isArray(g.plots) ||
      g.plots.length < 6 ||
      !Number.isFinite(g.coins) ||
      !Number.isFinite(g.xp) ||
      !g.seeds ||
      !g.stock ||
      !Array.isArray(g.upgrades) ||
      !Array.isArray(g.claimed)
    )
      return base;
    return {
      ...base,
      ...g,
      version: 3,
      cropXP:
        g.version < 3
          ? Object.fromEntries(
              Object.entries(g.cropXP || g.collection || {}).map(
                ([id, value]) => [id, Number(value) * (crop(id)?.mastery || 1)],
              ),
            )
          : g.cropXP || {},
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
      stats: { ...base.stats, ...g.stats },
      relations: { ...base.relations, ...g.relations },
    };
  } catch {
    return fresh();
  }
}
export function duration(seconds: number) {
  const s = Math.max(0, Math.ceil(seconds));
  return s < 60
    ? `${s} s`
    : `${Math.floor(s / 60)} min${s % 60 ? ' ' + (s % 60) + ' s' : ''}`;
}
