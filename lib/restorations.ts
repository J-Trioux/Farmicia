/**
 * 0.13 — Restaurer le domaine : les six lieux de l’anneau de la grande carte
 * (bois, lavoir, champs, grange, chai, vignes) se restaurent en trois étapes,
 * comme les embellissements. Chacun aide un peu un système existant ; aucune
 * monnaie, culture ni production nouvelle.
 *
 * Images : aucune planche pour l’instant (choix de l’auteur) ; la ruine peinte
 * sur la carte reste telle quelle, le lieu est cliquable et porte son étape.
 */
export type RestorationId = 'lavoir' | 'champs' | 'grange' | 'bois' | 'vignes' | 'chai';

export type Restoration = {
  id: RestorationId;
  name: string;
  stages: readonly [string, string, string];
  levels: readonly [number, number, number];
  costs: readonly [number, number, number];
  /** Effet par étape (valeur cumulée). */
  values: readonly [number, number, number];
  /** Effet lisible, avec {v} pour la valeur de l’étape. */
  effect: string;
  /** Système voisin. */
  system: string;
};

export const RESTORATIONS: readonly Restoration[] = [
  {
    id: 'lavoir', name: 'Le lavoir de la rivière',
    stages: ['Bassin dégagé et toit réparé', 'Lavoir restauré et ses bancs', 'Lavoir fleuri et ses lanternes'],
    levels: [8, 13, 18], costs: [2500, 12000, 35000], values: [0.1, 0.2, 0.3],
    effect: 'L’eau claire du lavoir remplit vite l’arrosoir : chaque arrosage de Rosalie prend {v} de temps en moins.',
    system: 'Arrosage',
  },
  {
    id: 'champs', name: 'Les grands champs',
    stages: ['Premier champ défriché', 'Quatre champs labourés', 'Champs dorés et murets relevés'],
    levels: [10, 16, 22], costs: [4000, 16000, 45000], values: [0.08, 0.16, 0.25],
    effect: 'Le blé et le maïs profitent de la terre des champs : +{v} de chances de récolte double.',
    system: 'Récoltes',
  },
  {
    id: 'grange', name: 'La grange et l’aire de battage',
    stages: ['Toit de la grange bâché', 'Grange restaurée', 'Grange, aire de battage et meules'],
    levels: [12, 18, 24], costs: [7000, 28000, 65000], values: [1, 2, 3],
    effect: 'De la paille fraîche pour les poules : +{v} à chaque ramassage.',
    system: 'Poulailler',
  },
  {
    id: 'bois', name: 'Le bois des myrtilles',
    stages: ['Sentier dégagé jusqu’à la clairière', 'Clairière des myrtilles', 'Cabane du cueilleur restaurée'],
    levels: [17, 20, 24], costs: [15000, 40000, 80000], values: [0.1, 0.2, 0.3],
    effect: 'Les myrtilles sauvages se mêlent aux vôtres : +{v} de chances de récolte double sur les myrtilles.',
    system: 'Récoltes',
  },
  {
    id: 'vignes', name: 'Les vieilles vignes',
    stages: ['Échalas relevés', 'Vieilles vignes taillées', 'Vignes en pleine vendange'],
    levels: [21, 23, 25], costs: [30000, 60000, 100000], values: [0.1, 0.2, 0.3],
    effect: 'Les vieux ceps donnent leur raisin : +{v} de chances de récolte double sur le raisin.',
    system: 'Récoltes',
  },
  {
    id: 'chai', name: 'Le chai de pierre',
    stages: ['Murs du chai consolidés', 'Chai couvert et ses tonneaux', 'Chai restauré et sa cave fraîche'],
    levels: [22, 24, 25], costs: [40000, 75000, 120000], values: [0.1, 0.2, 0.3],
    effect: 'Le frais du chai : les recettes au raisin ou au melon cuisent {v} plus vite.',
    system: 'Atelier',
  },
];

/** Cultures dont la récolte double profite de chaque lieu. */
export const RESTORATION_CROPS: Partial<Record<RestorationId, readonly string[]>> = {
  champs: ['ble', 'mais'],
  bois: ['myrtille'],
  vignes: ['raisin'],
};
/** Ingrédients des recettes qui cuisent plus vite au chai. */
export const CELLAR_INGREDIENTS = ['raisin', 'melon'] as const;

type WithRestorations = { restorations?: Partial<Record<RestorationId, number>> };

export function restoration(id: string) {
  return RESTORATIONS.find((entry) => entry.id === id);
}
export function restorationStage(g: WithRestorations, id: RestorationId): 0 | 1 | 2 | 3 {
  const stage = g.restorations?.[id] || 0;
  return (stage >= 3 ? 3 : stage >= 2 ? 2 : stage >= 1 ? 1 : 0) as 0 | 1 | 2 | 3;
}
export function restorationValue(g: WithRestorations, id: RestorationId) {
  const stage = restorationStage(g, id);
  return stage ? restoration(id)!.values[stage - 1] : 0;
}
/** Chances de récolte double apportées aux cultures des lieux restaurés. */
export function restorationDouble(g: WithRestorations, cropId: string) {
  return (Object.keys(RESTORATION_CROPS) as RestorationId[])
    .filter((id) => RESTORATION_CROPS[id]!.includes(cropId))
    .reduce((sum, id) => sum + restorationValue(g, id), 0);
}
export function formatRestorationValue(id: RestorationId, value: number) {
  if (id === 'grange') return `${value} œuf${value > 1 ? 's' : ''}`;
  return `${Math.round(value * 100)} %`;
}
export function restorationEffect(entry: Restoration, stage: 1 | 2 | 3) {
  return entry.effect.replace('{v}', formatRestorationValue(entry.id, entry.values[stage - 1]));
}
