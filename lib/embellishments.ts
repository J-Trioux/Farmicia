/**
 * 0.11 — La ferme s’embellit : six embellissements en trois étapes, chacun
 * avec un petit effet lié à un système voisin, puis les dons à la fête du
 * village, sans fin et sans effet de puissance, pour la fin de partie.
 *
 * Planches : assets/embellissements-v010 (ChatGPT). 0.12 : en HD depuis les
 * générations originales (scripts/prepare-embellissements-hd.py), dans
 * public/assets/pixel/embellissements-hd/.
 */
import { ANCHORS, pct, type Px } from './world.ts';

export type EmbellishmentId = 'fontaine' | 'barque' | 'epouvantail' | 'ruches' | 'moulin' | 'pigeonnier';
export type EmbellishmentStage = 0 | 1 | 2 | 3;

export type Embellishment = {
  id: EmbellishmentId;
  name: string;
  /** Nom de chaque étape, dans l’ordre. */
  stages: readonly [string, string, string];
  /** Niveau d’ouverture de chaque étape. */
  levels: readonly [number, number, number];
  /** Prix de chaque étape, en pièces. */
  costs: readonly [number, number, number];
  /** Effet par étape (valeur cumulée, pas un ajout). */
  values: readonly [number, number, number];
  /** Effet lisible, avec {v} pour la valeur de l’étape. */
  effect: string;
  /** Système voisin, pour le regroupement de l’interface. */
  system: string;
  /** Position sur la grande carte (pieds de l’objet, en % ; lib/world.ts). */
  at: { x: number; y: number };
  /** Hauteur de la case sur l’ancienne carte (128 ou 192 px) : 64 ou 96 px sur la grille de 1 200 × 800. */
  cell: 128 | 192;
  /**
   * 0.19 : agrandissement de la case pour être à l’échelle de la carte
   * (lib/echelle.ts). La taille visible de la dernière étape est notée à côté.
   */
  scale: number;
};

export const EMBELLISHMENTS: readonly Embellishment[] = [
  {
    id: 'fontaine', name: 'Fontaine de pierre',
    stages: ['Bassin et bec de fontaine', 'Fontaine ronde sculptée', 'Fontaine provençale à deux vasques'],
    levels: [4, 10, 18], costs: [600, 9000, 30000], values: [0.04, 0.08, 0.12],
    effect: 'L’eau de la fontaine fait pousser plus vite : l’arrosage retire {v} du temps restant.',
    system: 'Arrosage', at: pct(ANCHORS.fontaine), cell: 128,
    // Fontaine à deux vasques et ses pots : 59 × 48 px, comme le puits couvert du mas.
    scale: 1.47,
  },
  {
    id: 'barque', name: 'Barque de l’étang',
    stages: ['Vieille barque amarrée', 'Barque bleue et sa lanterne', 'Barque fleurie et lanternes flottantes'],
    levels: [5, 13, 20], costs: [1500, 14000, 40000], values: [1, 2, 3],
    effect: 'Promenades en barque avec les voisins : +{v} d’amitié à chaque gain d’amitié.',
    system: 'Villageois', at: pct(ANCHORS.barque), cell: 128,
    // Barque de 2,7 m : 62 px de long, amarrée au ponton.
    scale: 1.41,
  },
  {
    id: 'epouvantail', name: 'Épouvantail et bordure fleurie',
    stages: ['Épouvantail de paille', 'Clôture basse et pots de fleurs', 'Foulard lavande, tournesols et fanions'],
    levels: [13, 15, 21], costs: [5000, 20000, 50000], values: [0.15, 0.3, 0.5],
    effect: 'Il veille sur les semis de garde : +{v} de récolte.',
    system: 'Semis de garde', at: pct(ANCHORS.epouvantail), cell: 128,
    // Épouvantail : 44 px, un peu plus grand que Rosalie (38 px).
    scale: 1.1,
  },
  {
    id: 'ruches', name: 'Ruches de la lavande',
    stages: ['Ruche de paille', 'Deux ruches bleues', 'Trois ruches sous l’auvent'],
    levels: [11, 17, 22], costs: [6000, 26000, 60000], values: [0.04, 0.08, 0.12],
    effect: 'Les abeilles pollinisent tomates, fraises, aubergines, myrtilles, citrouilles et melons : +{v} de chances de belle récolte.',
    system: 'Qualité', at: pct(ANCHORS.ruches), cell: 128,
    // Trois ruches sous l’auvent : 63 × 46 px, ruches de 60 cm.
    scale: 1.44,
  },
  {
    id: 'moulin', name: 'Moulin à vent',
    stages: ['Tour en chantier', 'Moulin restauré', 'Moulin fleuri et sacs de farine'],
    levels: [12, 19, 23], costs: [8000, 32000, 70000], values: [0.1, 0.2, 0.3],
    effect: 'Farine fraîche : les recettes au blé ou au maïs cuisent {v} plus vite.',
    system: 'Atelier', at: pct(ANCHORS.moulin), cell: 192,
    // Moulin : 120 px ailes comprises, sa porte (20 px) à l’échelle du mas.
    scale: 1.77,
  },
  {
    id: 'pigeonnier', name: 'Pigeonnier provençal',
    stages: ['Volière de bois', 'Pigeonnier de pierre', 'Pigeonnier élancé et sa girouette'],
    levels: [14, 20, 24], costs: [10000, 38000, 80000], values: [0.05, 0.1, 0.15],
    effect: 'La colombine, engrais des pigeonniers : +{v} de chances de récolte double.',
    system: 'Récoltes', at: pct(ANCHORS.pigeonnier), cell: 192,
    // Pigeonnier : 94 px, porte de 20 px, un peu moins haut que le mas (124 px).
    scale: 1.5,
  },
];

/** Cultures pollinisées par les ruches. */
export const POLLINATED = ['tomate', 'fraise', 'aubergine', 'myrtille', 'citrouille', 'melon'] as const;
/** Ingrédients moulus par le moulin. */
export const MILLED = ['ble', 'mais'] as const;

type WithEmbellishments = { embellishments?: Partial<Record<EmbellishmentId, number>> };

export function embellishment(id: string) {
  return EMBELLISHMENTS.find((entry) => entry.id === id);
}
export function embellishmentStage(g: WithEmbellishments, id: EmbellishmentId): EmbellishmentStage {
  const stage = g.embellishments?.[id] || 0;
  return (stage >= 3 ? 3 : stage >= 2 ? 2 : stage >= 1 ? 1 : 0) as EmbellishmentStage;
}
/** Valeur de l’effet à l’étape atteinte (0 sans embellissement). */
export function embellishmentValue(g: WithEmbellishments, id: EmbellishmentId) {
  const stage = embellishmentStage(g, id);
  return stage ? embellishment(id)!.values[stage - 1] : 0;
}
export function formatEffectValue(id: EmbellishmentId, value: number) {
  if (id === 'barque') return `${value} point${value > 1 ? 's' : ''}`;
  return `${Math.round(value * 100)} %`;
}
export function embellishmentEffect(entry: Embellishment, stage: 1 | 2 | 3) {
  return entry.effect.replace('{v}', formatEffectValue(entry.id, entry.values[stage - 1]));
}

// ---------- Dons à la fête du village (fin de partie, sans fin) ----------
/** Les dons s’ouvrent quand le grand banquet du village est terminé. */
export const DONATION_PROJECT = 'grand-banquet';
export const DONATION_BASE = 25000;
export const DONATION_GROWTH = 1.08;
export function donationCost(done: number) {
  return Math.round((DONATION_BASE * Math.pow(DONATION_GROWTH, Math.max(0, done))) / 100) * 100;
}
/** Ce que chaque don offre à la fête : un souvenir, jamais un bonus. */
export const DONATION_SOUVENIRS = [
  'Une guirlande de lampions sur la place',
  'Un bal sous les platanes',
  'Un concours de boules à l’ombre',
  'Une fanfare pour la procession',
  'Une farandole jusqu’au lavoir',
  'Un marché de nuit aux chandelles',
  'Une veillée de contes au coin du puits',
  'Un grand concours de tartes',
  'Une course en sacs pour les enfants',
  'Un feu de joie pour la Saint-Jean',
  'Un feu d’artifice sur l’étang',
  'Un banquet sous les étoiles',
] as const;
export function donationSouvenir(index: number) {
  const base = DONATION_SOUVENIRS[index % DONATION_SOUVENIRS.length];
  const edition = Math.floor(index / DONATION_SOUVENIRS.length);
  return edition ? `${base} (${edition + 1}ᵉ édition)` : base;
}
export const DONATION_TITLES = [
  { count: 1, title: 'Amie de la fête' },
  { count: 5, title: 'Marraine de la fête' },
  { count: 12, title: 'Âme du village' },
  { count: 25, title: 'Légende de la vallée' },
] as const;
export function donationTitle(count: number) {
  return [...DONATION_TITLES].reverse().find((entry) => count >= entry.count)?.title || '';
}

// ---------- Décors de la fête ----------
/**
 * 0.15 : les quatre décors livrés par Astra en objets seuls (8 px par px de
 * grille), dans public/assets/pixel/fete-1.0/ (scripts/integrer-assets-1.0.py).
 * Chacun s’installe sur la place au palier de dons de son titre.
 */
export const FEAST_DECOR_READY = true;
export type FeastDecor = {
  id: 'lampions' | 'tables' | 'estrade' | 'arche';
  /** Nombre de dons qui l’installe (mêmes paliers que les titres). */
  count: number;
  name: string;
  /** Pieds du décor sur la carte, en px de la grille 1 200 × 800. */
  foot: Px;
  /** Taille en px de la grille (largeur × hauteur). */
  size: readonly [number, number];
  /** Images de la bande : 2 pour la guirlande (éteinte le jour, allumée le soir). */
  frames: 1 | 2;
};
export const FEAST_DECOR: readonly FeastDecor[] = [
  // Au sud-est de la place, tendue au-dessus de la table peinte.
  // 0.19 : tailles à l’échelle de la carte (lib/echelle.ts) : poteaux de 1,1 m.
  { id: 'lampions', count: 1, name: 'Guirlande de lampions sur la place', foot: { x: 700, y: 226 }, size: [64, 26], frames: 2 },
  // Sur la mosaïque, sous le passage de Rosalie.
  { id: 'tables', count: 5, name: 'Tables du banquet sur la mosaïque', foot: { x: 650, y: 196 }, size: [48, 30], frames: 1 },
  // En haut de la place, à droite du mât, devant les tonneaux.
  // 0.19 : estrade de 60 cm et ses instruments : 51 × 46 px.
  { id: 'estrade', count: 12, name: 'Estrade des musiciens', foot: { x: 690, y: 164 }, size: [51, 46], frames: 1 },
  // Sur le chemin qui vient du mas : Rosalie passe dessous.
  // 0.19 : arche de 2,5 m : Rosalie (38 px) passe dessous sans baisser la tête.
  { id: 'arche', count: 25, name: 'Arche fleurie à l’entrée de la place', foot: { x: 538, y: 214 }, size: [40, 58], frames: 1 },
];
export function feastDecorFor(donations: number) {
  return FEAST_DECOR.filter((entry) => donations >= entry.count);
}

