// Build 0.5.0 — La Fête des Saveurs.
// Données pures : grands projets du village, lignes de menu et effets des plats.
// Aucune dépendance vers game.ts pour éviter les imports circulaires.

export type Course = 'entree' | 'plat' | 'dessert';

export type MenuLine =
  /** Un produit précis, qualité minimale incluse dans la clé (ex. `tomate|belle`, `pain|reussi`). */
  | { kind: 'item'; item: string; amount: number }
  /** Plusieurs cultures différentes, pour une valeur de base minimale. */
  | { kind: 'distinct'; count: number; minValue: number; /** 0.11 : unités de chaque culture (1 par défaut). */ each?: number }
  /** Un plat d’un service donné, avec un résultat culinaire minimal. */
  | { kind: 'course'; course: Course; minOutcome: string };

export type ProjectStep =
  | {
      kind: 'harvest';
      /** `*` accepte toutes les cultures. */
      crop: string;
      amount: number;
      minQuality?: 'ordinaire' | 'belle' | 'exceptionnelle';
      lineageOnly?: boolean;
      text: string;
    }
  | {
      kind: 'cook';
      /** `*` accepte toutes les recettes. */
      recipe: string;
      amount: number;
      minOutcome: string;
      signatureOnly?: boolean;
      text: string;
    }
  | { kind: 'sell'; amount: number; text: string }
  | { kind: 'festival'; minScore: number; text: string }
  | { kind: 'fair'; minScore: number; text: string }
  | { kind: 'signatureOrder'; amount: number; text: string }
  /** 0.9.2 : participation en pièces, payée d’un coup depuis le carnet. */
  | { kind: 'fund'; amount: number; text: string }
  | { kind: 'deliver'; lines: MenuLine[]; text: string };

export type ProjectReward = 'etal' | 'silo' | 'four' | 'verger' | 'toque' | 'galette' | 'clafoutis' | 'veloute' | 'pressoir' | 'grande-table' | 'pepiniere' | 'halle';

export type VillageProject = {
  id: string;
  title: string;
  host: string;
  style: string;
  level: number;
  requires?: string[];
  intro: string;
  reward: ProjectReward;
  rewardName: string;
  rewardDesc: string;
  coins: number;
  xp: number;
  outro: string;
  steps: ProjectStep[];
};

export const PROJECTS: VillageProject[] = [
  {
    id: 'marche',
    title: 'Le marché d’Émile',
    host: 'emile',
    style: 'Vente et produits de qualité',
    level: 4,
    intro:
      'Émile rêve d’un étal aux couleurs de la ferme, au cœur de la place du marché.',
    reward: 'etal',
    rewardName: 'Étal personnel',
    rewardDesc:
      'Les produits de belle qualité ou mieux et les plats se vendent 10 % plus cher.',
    coins: 120,
    xp: 80,
    outro: 'Un étal fleuri porte désormais le nom de Rosalie sur la place.',
    steps: [
      {
        kind: 'harvest',
        crop: 'carotte',
        amount: 10,
        text: 'Récolter 10 carottes',
      },
      {
        kind: 'harvest',
        crop: '*',
        amount: 3,
        minQuality: 'belle',
        text: 'Obtenir 3 récoltes de belle qualité',
      },
      { kind: 'sell', amount: 150, text: 'Vendre pour 150 pièces' },
      {
        kind: 'deliver',
        lines: [{ kind: 'distinct', count: 3, minValue: 30 }],
        text: 'Composer le panier d’ouverture : 3 cultures différentes',
      },
    ],
  },
  {
    id: 'moissons',
    title: 'Le repas des moissons',
    host: 'marcel',
    style: 'Quantité et diversité',
    level: 6,
    intro:
      'Marcel veut réunir tout le village autour d’une grande tablée de fin d’été.',
    reward: 'silo',
    rewardName: 'Le silo',
    rewardDesc:
      'Commandes simples +20 % de pièces. Le poulailler ne consomme plus que 2 blés.',
    coins: 160,
    xp: 120,
    outro: 'Un silo de bois clair veille maintenant sur les champs.',
    steps: [
      { kind: 'harvest', crop: 'ble', amount: 8, text: 'Récolter 8 blés' },
      {
        kind: 'harvest',
        crop: 'salade',
        amount: 6,
        text: 'Récolter 6 laitues',
      },
      {
        kind: 'deliver',
        lines: [{ kind: 'distinct', count: 4, minValue: 45 }],
        text: 'Apporter un panier de 4 cultures différentes',
      },
      {
        kind: 'deliver',
        lines: [
          { kind: 'item', item: 'ble', amount: 5 },
          { kind: 'item', item: 'carotte', amount: 4 },
          { kind: 'item', item: 'salade', amount: 3 },
        ],
        text: 'Servir la grande tablée',
      },
    ],
  },
  {
    id: 'banquet',
    title: 'Le banquet de Lucie',
    host: 'lucie',
    style: 'Cuisine, tomates et blé',
    level: 10,
    intro:
      'Lucie prépare un banquet pour la fête. Il lui faut une sauce parfaite et du bon pain.',
    reward: 'four',
    rewardName: 'Four amélioré',
    rewardDesc:
      'Préparations 20 % plus rapides. Les plats rustiques deviennent deux fois plus rares.',
    coins: 220,
    xp: 180,
    outro: 'Le four de l’atelier a reçu une voûte de briques neuves.',
    steps: [
      { kind: 'harvest', crop: 'tomate', amount: 30, text: 'Produire 30 tomates' },
      { kind: 'harvest', crop: 'tomate', amount: 6, minQuality: 'belle', text: 'Obtenir 6 tomates de belle qualité' },
      { kind: 'cook', recipe: 'sauce', amount: 3, minOutcome: 'reussi', text: 'Préparer 3 sauces réussies' },
      { kind: 'cook', recipe: 'pain', amount: 2, minOutcome: 'savoureux', text: 'Cuire 2 pains savoureux' },
      {
        kind: 'deliver',
        lines: [
          { kind: 'item', item: 'sauce|reussi', amount: 2 },
          { kind: 'item', item: 'pain|reussi', amount: 1 },
          { kind: 'item', item: 'tomate|belle', amount: 4 },
          { kind: 'item', item: 'ble', amount: 8 },
        ],
        text: 'Organiser le banquet',
      },
    ],
  },
  {
    id: 'verger',
    title: 'La fête du verger',
    host: 'jeanne',
    style: 'Fruits et qualité',
    level: 14,
    intro:
      'Jeanne voudrait redonner vie au vieux verger avec une fête des fruits.',
    reward: 'verger',
    rewardName: 'Le verger restauré',
    rewardDesc:
      'Le verger produit 3 fruits de belle qualité ou mieux toutes les 30 minutes.',
    coins: 260,
    xp: 220,
    outro: 'Les vieux arbres ont été taillés : le verger donne à nouveau.',
    steps: [
      { kind: 'harvest', crop: 'fraise', amount: 30, text: 'Récolter 30 fraises' },
      { kind: 'harvest', crop: 'fraise', amount: 8, minQuality: 'belle', text: 'Obtenir 8 belles fraises' },
      { kind: 'harvest', crop: '*', amount: 2, minQuality: 'exceptionnelle', text: 'Obtenir 2 récoltes exceptionnelles' },
      { kind: 'cook', recipe: 'confiture', amount: 4, minOutcome: 'reussi', text: 'Préparer 4 confitures réussies' },
      {
        kind: 'deliver',
        lines: [
          { kind: 'item', item: 'fraise|belle', amount: 6 },
          { kind: 'item', item: 'confiture|reussi', amount: 2 },
        ],
        text: 'Dresser la table des fruits',
      },
    ],
  },
  {
    id: 'concours',
    title: 'Le concours gourmand',
    host: 'clara',
    style: 'Plats de haute qualité',
    level: 16,
    intro:
      'Clara organise un concours. Seules les assiettes les plus soignées y ont leur place.',
    reward: 'toque',
    rewardName: 'La toque du village',
    rewardDesc: '3 points de talent et +1 dans chaque statistique culinaire.',
    coins: 320,
    xp: 300,
    outro: 'La toque dorée du concours trône désormais dans l’atelier.',
    steps: [
      { kind: 'cook', recipe: '*', amount: 6, minOutcome: 'savoureux', text: 'Préparer 6 plats savoureux ou mieux' },
      { kind: 'festival', minScore: 65, text: 'Obtenir la Médaille du village à la Fête des Saveurs' },
      {
        kind: 'deliver',
        lines: [
          { kind: 'course', course: 'entree', minOutcome: 'reussi' },
          { kind: 'course', course: 'plat', minOutcome: 'savoureux' },
          { kind: 'course', course: 'dessert', minOutcome: 'reussi' },
        ],
        text: 'Servir un repas prestigieux : entrée, plat savoureux, dessert',
      },
    ],
  },

  {
    id: 'champs',
    title: 'Les tables des champs',
    host: 'marcel',
    style: 'Maïs, aubergines et cuisine de saison',
    level: 18,
    intro: 'Marcel veut nourrir les ouvriers des champs avec les légumes de la ferme.',
    reward: 'galette',
    rewardName: 'La galette des champs',
    rewardDesc: 'Une recette au maïs et à la tomate rejoint l’atelier et les commandes culinaires.',
    coins: 360,
    xp: 320,
    outro: 'La recette de la galette passe de table en table au village.',
    steps: [
      { kind: 'harvest', crop: 'mais', amount: 40, text: 'Récolter 40 maïs' },
      { kind: 'harvest', crop: 'aubergine', amount: 25, text: 'Récolter 25 aubergines' },
      { kind: 'cook', recipe: 'ratatouille', amount: 3, minOutcome: 'reussi', text: 'Préparer 3 ratatouilles réussies' },
      { kind: 'deliver', lines: [
        { kind: 'item', item: 'ratatouille|reussi', amount: 2 },
        { kind: 'item', item: 'mais', amount: 10 },
      ], text: 'Servir les ouvriers des champs' },
    ],
  },
  {
    id: 'douceurs',
    title: 'Les douceurs de Jeanne',
    host: 'jeanne',
    style: 'Fruits, confiture et pâtisserie',
    level: 22,
    intro: 'Jeanne rassemble les fruits de saison pour une table de douceurs.',
    reward: 'clafoutis',
    rewardName: 'Le clafoutis du verger',
    rewardDesc: 'Une recette à la myrtille et à la fraise rejoint l’atelier.',
    coins: 420,
    xp: 400,
    outro: 'Le parfum du clafoutis attire les voisins sur la place.',
    steps: [
      { kind: 'harvest', crop: 'myrtille', amount: 30, text: 'Récolter 30 myrtilles' },
      { kind: 'cook', recipe: 'violette', amount: 3, minOutcome: 'reussi', text: 'Préparer 3 confitures des bois réussies' },
      { kind: 'deliver', lines: [
        { kind: 'item', item: 'violette|reussi', amount: 2 },
        { kind: 'item', item: 'fraise|belle', amount: 6 },
      ], text: 'Installer la table des douceurs' },
    ],
  },
  {
    id: 'courges',
    title: 'La marmite d’automne',
    host: 'lucie',
    style: 'Courges et repas réconfortants',
    level: 21,
    intro: 'Lucie prépare un repas chaud pour les soirées fraîches.',
    reward: 'veloute',
    rewardName: 'Le velouté de courge',
    rewardDesc: 'La citrouille devient un plat nourrissant, demandé par le village.',
    coins: 500,
    xp: 480,
    outro: 'Une grande marmite parfume désormais la fête.',
    steps: [
      { kind: 'harvest', crop: 'citrouille', amount: 24, text: 'Récolter 24 citrouilles' },
      { kind: 'cook', recipe: 'sauce', amount: 3, minOutcome: 'reussi', text: 'Préparer 3 sauces du jardin réussies' },
      { kind: 'deliver', lines: [
        { kind: 'item', item: 'citrouille', amount: 8 },
        { kind: 'item', item: 'sauce|reussi', amount: 2 },
      ], text: 'Remplir la marmite du village' },
    ],
  },
  {
    id: 'vendanges',
    title: 'Les vendanges d’Émile',
    host: 'emile',
    style: 'Raisin et pressage',
    level: 23,
    intro: 'Émile voudrait faire goûter le raisin de Rosalie à tout le village.',
    reward: 'pressoir',
    rewardName: 'Le pressoir du village',
    rewardDesc: 'Le jus de raisin devient une recette et une commande possible.',
    coins: 650,
    xp: 600,
    outro: 'Le pressoir est prêt pour chaque nouvelle vendange.',
    steps: [
      { kind: 'harvest', crop: 'raisin', amount: 20, text: 'Récolter 20 raisins' },
      { kind: 'cook', recipe: 'confiture', amount: 3, minOutcome: 'reussi', text: 'Préparer 3 confitures de fraises réussies' },
      { kind: 'deliver', lines: [
        { kind: 'item', item: 'raisin', amount: 8 },
        { kind: 'item', item: 'confiture|reussi', amount: 2 },
      ], text: 'Ouvrir la dégustation des vendanges' },
    ],
  },
  {
    id: 'pepiniere-voisins',
    title: 'La pépinière des voisins',
    host: 'marcel', style: 'Lignées et partage', level: 7,
    intro: 'Marcel voudrait garder les graines qui racontent votre ferme et partager leur goût.',
    reward: 'pepiniere', rewardName: 'La pépinière',
    rewardDesc: 'Les lignées rendent une graine toutes les deux récoltes au lieu de trois, et multiplier coûte 8 graines classiques au lieu de 10 ; la pépinière apparaît au bord du potager.',
    coins: 180, xp: 160,
    outro: 'Des bacs de semis en bois accueillent désormais les graines de Rosalie au bord du potager.',
    steps: [
      { kind: 'harvest', crop: '*', lineageOnly: true, amount: 2, text: 'Récolter 2 produits d’une lignée de la ferme' },
      { kind: 'signatureOrder', amount: 1, text: 'Livrer une commande de spécialité avec une lignée de la ferme' },
      { kind: 'deliver', lines: [{ kind: 'distinct', count: 3, minValue: 30 }], text: 'Partager 3 cultures différentes avec les voisins' },
    ],
  },
  {
    id: 'halle-terroirs',
    title: 'La halle des terroirs',
    host: 'emile', style: 'Variétés reconnues et foire', level: 20,
    requires: ['pepiniere-voisins'],
    intro: 'Émile veut offrir une place aux spécialités de Rosalie dans le marché du village.',
    reward: 'halle', rewardName: 'La halle des variétés',
    rewardDesc: 'Un second contrat de spécialité s’ouvre sur le panneau et la halle reçoit son enseigne.',
    coins: 420, xp: 380,
    outro: 'La halle porte maintenant le nom des terres vivantes de Rosalie.',
    steps: [
      { kind: 'harvest', crop: '*', lineageOnly: true, amount: 30, text: 'Récolter 30 produits de lignées' },
      { kind: 'signatureOrder', amount: 4, text: 'Livrer 4 commandes de spécialité' },
      { kind: 'fair', minScore: 65, text: 'Présenter une foire notée au moins 65/100' },
      { kind: 'deliver', lines: [{ kind: 'distinct', count: 6, minValue: 45, each: 3 }], text: 'Ouvrir la halle avec 6 cultures différentes, 3 de chaque' },
    ],
  },
  {
    id: 'grand-banquet',
    title: 'Le grand banquet du village',
    host: 'clara',
    style: 'Menu complet et savoir-faire réunis',
    level: 24,
    requires: ['champs', 'douceurs', 'courges', 'vendanges'],
    intro: 'Chaque savoir-faire se retrouve à la même table, du potager au dessert.',
    reward: 'grande-table',
    rewardName: 'La grande table',
    rewardDesc: 'Un emplacement de grande commande supplémentaire et la table de fête sur la carte.',
    coins: 900,
    xp: 850,
    outro: 'La grande table accueille désormais les menus du village.',
    steps: [
      { kind: 'harvest', crop: 'melon', amount: 12, text: 'Récolter 12 melons' },
      { kind: 'cook', recipe: 'galette', amount: 2, minOutcome: 'reussi', text: 'Préparer 2 galettes des champs réussies' },
      { kind: 'cook', recipe: 'veloute', amount: 2, minOutcome: 'reussi', text: 'Préparer 2 veloutés de courge réussis' },
      { kind: 'deliver', lines: [
        { kind: 'item', item: 'galette|reussi', amount: 1 },
        { kind: 'item', item: 'veloute|reussi', amount: 1 },
        { kind: 'item', item: 'jus|reussi', amount: 1 },
        { kind: 'item', item: 'melon', amount: 4 },
      ], text: 'Dresser le grand banquet' },
    ],
  },
];

/**
 * 0.9.2 : les chantiers tardifs se terminent par une participation en pièces.
 * L’étape est ajoutée à la fin pour ne pas décaler les étapes déjà commencées
 * dans les sauvegardes.
 */
export const PROJECT_FUNDS: Record<string, number> = {
  champs: 12000,
  'halle-terroirs': 15000,
  courges: 20000,
  douceurs: 22000,
  vendanges: 28000,
  'grand-banquet': 50000,
};
const thousands = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f');
for (const project of PROJECTS) {
  const amount = PROJECT_FUNDS[project.id];
  if (amount)
    project.steps.push({
      kind: 'fund',
      amount,
      text: `Participer aux frais du chantier : ${thousands(amount)} pièces`,
    });
}

export const COURSE_NAMES: Record<Course, string> = {
  entree: 'Entrée',
  plat: 'Plat',
  dessert: 'Dessert',
};

/** Service de chaque recette de base. Les variantes signature héritent de leur parent. */
export const RECIPE_COURSES: Record<string, Course> = {
  sauce: 'entree',
  potage: 'entree',
  assiette: 'entree',
  melonade: 'dessert',
  infusion: 'entree',
  pain: 'plat',
  ratatouille: 'plat',
  brioche: 'dessert',
  confiture: 'dessert',
  violette: 'dessert',
  tarte: 'dessert',
  galette: 'plat',
  clafoutis: 'dessert',
  veloute: 'entree',
  jus: 'dessert',
  fougasse: 'plat',
  pickles: 'entree',
};

export type DishEffectId =
  | 'atelier'
  | 'croissance'
  | 'qualite'
  | 'abondance'
  | 'rarete'
  | 'entrain'
  | 'intuition'
  | 'inspiration'
  /** 0.9.5 : Rosalie marche plus vite (Allant). */
  | 'souffle';

export const DISH_EFFECTS: Record<
  string,
  { id: DishEffectId; name: string; desc: string }
> = {
  pain: {
    id: 'atelier',
    name: 'Four chaud',
    desc: 'Préparations de l’atelier 25 % plus rapides.',
  },
  sauce: {
    id: 'croissance',
    name: 'Terre vive',
    desc: 'Nouvelles plantations 15 % plus rapides.',
  },
  confiture: {
    id: 'qualite',
    name: 'Main douce',
    desc: '+8 % de belles récoltes.',
  },
  ratatouille: {
    id: 'abondance',
    name: 'Panier généreux',
    desc: '+15 % de chances de récolte double.',
  },
  violette: {
    id: 'rarete',
    name: 'Éclat des bois',
    desc: '+4 % de récoltes exceptionnelles.',
  },
  brioche: {
    id: 'entrain',
    name: 'Entrain',
    desc: '+20 % d’XP sur les récoltes.',
  },
  infusion: {
    id: 'intuition',
    name: 'Intuition',
    desc: 'Révèle le prochain coup de cœur du marché.',
  },
  tarte: {
    id: 'inspiration',
    name: 'Inspiration',
    desc: 'Plats savoureux et chefs-d’œuvre plus probables.',
  },
  galette: { id: 'entrain', name: 'Entrain des champs', desc: '+20 % d’XP sur les récoltes.' },
  clafoutis: { id: 'inspiration', name: 'Douce inspiration', desc: 'Plats savoureux et chefs-d’œuvre plus probables.' },
  veloute: { id: 'croissance', name: 'Terre vive', desc: 'Nouvelles plantations 15 % plus rapides.' },
  jus: { id: 'souffle', name: 'Second souffle', desc: 'Rosalie marche 20 % plus vite.' },
  potage: { id: 'croissance', name: 'Terre vive', desc: 'Nouvelles plantations 15 % plus rapides.' },
  assiette: { id: 'qualite', name: 'Main douce', desc: '+8 % de belles récoltes.' },
  melonade: { id: 'entrain', name: 'Entrain', desc: '+20 % d’XP sur les récoltes.' },
};

export const DISH_EFFECT_IDS = [
  ...new Set(Object.values(DISH_EFFECTS).map((effect) => effect.id)),
] as DishEffectId[];

/** Durée d’un effet selon le résultat du plat, en minutes. */
export const EFFECT_MINUTES: Record<string, number> = {
  rustique: 5,
  reussi: 10,
  savoureux: 15,
  chef: 25,
};
export const EFFECT_CAP_MINUTES = 60;
export const ORCHARD_DELAY = 30 * 60 * 1000;

export type ProjectState = {
  active: string | null;
  progress: Record<string, { step: number; count: number }>;
  done: string[];
  evidence?: Record<string, number[]>;
};

export function freshProjects(): ProjectState {
  return { active: null, progress: {}, done: [], evidence: {} };
}

export function normalizeProjects(raw: unknown): ProjectState {
  const base = freshProjects();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return base;
  const value = raw as Record<string, unknown>;
  const ids = PROJECTS.map((p) => p.id);
  const done = Array.isArray(value.done)
    ? [...new Set(value.done.filter((id): id is string => ids.includes(id)))]
    : [];
  const progress: ProjectState['progress'] = {};
  if (value.progress && typeof value.progress === 'object')
    for (const [id, entry] of Object.entries(
      value.progress as Record<string, unknown>,
    )) {
      const project = PROJECTS.find((p) => p.id === id);
      if (!project || done.includes(id) || !entry || typeof entry !== 'object')
        continue;
      const e = entry as Record<string, unknown>;
      const step = Number.isInteger(e.step)
        ? Math.min(project.steps.length - 1, Math.max(0, e.step as number))
        : 0;
      const count =
        typeof e.count === 'number' && Number.isFinite(e.count)
          ? Math.max(0, Math.floor(e.count))
          : 0;
      progress[id] = { step, count };
    }
  const active =
    typeof value.active === 'string' &&
    ids.includes(value.active) &&
    !done.includes(value.active)
      ? value.active
      : null;
  if (active && !progress[active]) progress[active] = { step: 0, count: 0 };
  const evidence: ProjectState['evidence'] = {};
  if (value.evidence && typeof value.evidence === 'object' && !Array.isArray(value.evidence))
    for (const [id, counts] of Object.entries(value.evidence as Record<string, unknown>)) {
      const project = PROJECTS.find((p) => p.id === id);
      if (!project || !Array.isArray(counts)) continue;
      // 0.32.2 : les avances prises par les projets pas encore commencés et par
      // les étapes à venir sont effacées.
      const entry = progress[id];
      if (!entry) continue;
      evidence[id] = project.steps.map((step, index) => {
        if (index > entry.step) return 0;
        const raw = counts[index];
        const maximum = step.kind === 'harvest' || step.kind === 'cook' || step.kind === 'sell' || step.kind === 'signatureOrder' ? step.amount : 1;
        return typeof raw === 'number' && Number.isFinite(raw) ? Math.min(maximum, Math.max(0, Math.floor(raw))) : 0;
      });
    }
  if (active && progress[active]) {
    const entry = progress[active];
    evidence[active] ??= PROJECTS.find((p) => p.id === active)!.steps.map(() => 0);
    evidence[active][entry.step] = Math.max(evidence[active][entry.step], entry.count);
  }
  return { active, progress, done, evidence };
}
