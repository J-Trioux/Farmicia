import { CROPS } from './crops.ts';
import { RECIPE_COURSES } from './projects.ts';

export type RegionId = 'moulins' | 'vergers';
export type CargoLine = { item: string; amount: number };
export type ValleyTrip = {
  serial: number;
  region: RegionId;
  cargo: CargoLine[];
  departedAt: number;
  returnAt: number;
  coins: number;
  xp: number;
  reputation: number;
  preference: string;
  combination: string;
  signature: string | null;
  projectPoints: number;
  /** 0.9.5 : tournée choisie (absent : aller-retour). */
  tour?: TourId;
};
export type ValleyState = {
  region: RegionId;
  cargo: CargoLine[];
  trip: ValleyTrip | null;
  reputations: Record<RegionId, number>;
  shipments: Record<RegionId, number>;
  serial: number;
  projectPoints: number;
  projectDone: boolean;
  famousSignature: string | null;
  /** 0.9.5 : tournée préparée (absent : aller-retour). */
  tour?: TourId;
};
/**
 * 0.9.5 — Longues tournées : la caravane part plus longtemps, avec des caisses
 * plus grandes et un meilleur tarif. Pensé pour les absences.
 */
export type TourId = 'court' | 'quart' | 'heure' | 'longue';
export const VALLEY_TOURS = [
  { id: 'court', name: 'Aller-retour', short: 'Aller-retour', seconds: 0, crate: 1, reward: 1, level: 6 },
  { id: 'quart', name: 'Tournée d’un quart d’heure', short: '15 min', seconds: 900, crate: 2, reward: 1.08, level: 6 },
  { id: 'heure', name: 'Tournée d’une heure', short: '1 h', seconds: 3600, crate: 4, reward: 1.18, level: 17 },
  { id: 'longue', name: 'Grande tournée de 4 h', short: '4 h', seconds: 14400, crate: 8, reward: 1.3, level: 20 },
] as const satisfies readonly { id: TourId; name: string; short: string; seconds: number; crate: number; reward: number; level: number }[];
/** Une tournée longue ne part pas à moitié vide : au moins autant de produits que son multiplicateur. */
export const tourMinimum = (id: unknown) => Math.max(2, tourOf(id).crate);
export const tourOf = (id: unknown) => VALLEY_TOURS.find((tour) => tour.id === id) || VALLEY_TOURS[0];
/** Plus grande caisse possible : 3 produits × 8 (grande tournée). */
const MAX_CRATE = 24;
export const REGIONS = {
  moulins: {
    name: 'Bourg des Moulins', voice: 'Mathis, meunier',
    greeting: 'Un bon pain rassemble toute la vallée. Que nous apporte Rosalie ?',
    travel: 90, preference: ['ble', 'mais', 'pain', 'brioche', 'galette', 'potage', 'veloute'],
    note: 'Céréales, pains et plats nourrissants',
  },
  vergers: {
    name: 'Port des Vergers', voice: 'Anaïs, batelière',
    greeting: 'Les paniers fruités voyagent vite sur notre rivière !',
    travel: 115, preference: ['carotte', 'salade', 'radis', 'fraise', 'myrtille', 'raisin', 'melon', 'confiture', 'clafoutis', 'jus', 'melonade', 'tarte'],
    note: 'Primeurs, fruits, douceurs et variétés de ferme',
  },
} as const;
const CROP_IDS = new Set(CROPS.map((crop) => crop.id));
export const VALLEY_PROJECT_TARGET = 8;
export function freshValley(): ValleyState {
  return { region: 'moulins', cargo: [], trip: null,
    reputations: { moulins: 0, vergers: 0 }, shipments: { moulins: 0, vergers: 0 },
    serial: 0, projectPoints: 0, projectDone: false, famousSignature: null };
}
export function valleyCapacity(v: ValleyState) { return v.projectDone ? 3 : 2; }
export function cargoLimit(v: ValleyState, region: RegionId) {
  return (v.reputations[region] >= 5 ? 3 : 2) * tourOf(v.tour).crate;
}
export function cargoKind(item: string): 'crop' | 'dish' | 'egg' {
  const base = item.split('|')[0];
  return CROP_IDS.has(base) ? 'crop' : base === 'oeuf' ? 'egg' : 'dish';
}
export function cargoSignature(item: string) { return /\|l[1-9]\d*(?:$|\|)/.test(item); }
export function valleyPreview(
  cargo: CargoLine[], region: RegionId, priceOf: (item: string) => number, tourId?: TourId,
) {
  const tour = tourOf(tourId);
  const preferred: readonly string[] = REGIONS[region].preference;
  const units = cargo.reduce((n, line) => n + line.amount, 0);
  const directValue = cargo.reduce((n, line) => n + Math.max(0, priceOf(line.item)) * line.amount, 0);
  const preferredUnits = cargo.reduce((n, line) => n + (preferred.includes(line.item.split('|')[0]) ? line.amount : 0), 0);
  const crops = cargo.filter((line) => cargoKind(line.item) === 'crop');
  const dishes = cargo.filter((line) => cargoKind(line.item) === 'dish');
  const mainDishes = dishes.filter((line) => RECIPE_COURSES[line.item.split('|')[0].replace('_maison', '')] === 'plat');
  const desserts = dishes.filter((line) => RECIPE_COURSES[line.item.split('|')[0].replace('_maison', '')] === 'dessert');
  const signature = cargo.some((line) => cargoSignature(line.item));
  let combination = '';
  let bonus = 0;
  if (region === 'moulins' && crops.some((line) => ['ble', 'mais'].includes(line.item.split('|')[0])) && mainDishes.length) {
    combination = 'Table du moulin · céréale + plat'; bonus = 0.16;
  } else if (region === 'vergers' && crops.some((line) => preferred.includes(line.item.split('|')[0])) && desserts.length) {
    combination = 'Dessert du port · fruit + douceur'; bonus = 0.16;
  } else if (new Set(crops.map((line) => line.item.split('|')[0])).size >= 2) {
    combination = 'Panier assorti · deux récoltes'; bonus = 0.11;
  }
  if (signature && !combination) { combination = 'Spécialité de Rosalie'; bonus = 0.12; }
  const preference = preferredUnits ? `${preferredUnits} produit${preferredUnits > 1 ? 's' : ''} recherché${preferredUnits > 1 ? 's' : ''}` : 'Découverte de la vallée';
  // Le tarif ordinaire reste inférieur à la vente immédiate. Les assortiments
  // préparés peuvent la dépasser légèrement, en échange du temps de trajet.
  const factor = Math.min(1.12, 0.68 + Math.min(0.22, preferredUnits * 0.07) + bonus + (signature ? 0.05 : 0));
  return {
    units, directValue, preferredUnits, preference, combination,
    coins: units ? Math.max(8, Math.round(directValue * factor * tour.reward)) : 0,
    xp: units ? 14 + units * 7 + (combination ? 12 : 0) : 0,
    reputation: units ? 1 + Number(preferredUnits > 0) + Number(!!combination) + Number(signature) : 0,
    projectPoints: units ? 1 + Number(!!combination) + Number(signature) : 0,
    seconds: tour.seconds || REGIONS[region].travel,
    tour: tour.id,
  };
}
function finiteInt(value: unknown, max: number) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(0, Math.floor(value))) : 0;
}
function validCargo(raw: unknown, validItem: (item: string) => boolean): CargoLine[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  return raw.flatMap((line) => {
    if (!line || typeof line !== 'object' || typeof line.item !== 'string' ||
      !validItem(line.item) || seen.has(line.item)) return [];
    seen.add(line.item);
    return [{ item: line.item, amount: Math.max(1, finiteInt(line.amount, MAX_CRATE)) }];
  }).slice(0, 3);
}
export function normalizeValley(raw: unknown, validItem: (item: string) => boolean): ValleyState {
  const base = freshValley();
  if (!raw || typeof raw !== 'object') return base;
  const value = raw as Partial<ValleyState>;
  const region: RegionId = value.region === 'vergers' ? 'vergers' : 'moulins';
  const reputations = { moulins: finiteInt(value.reputations?.moulins, 9999), vergers: finiteInt(value.reputations?.vergers, 9999) };
  const shipments = { moulins: finiteInt(value.shipments?.moulins, 9999), vergers: finiteInt(value.shipments?.vergers, 9999) };
  const projectPoints = finiteInt(value.projectPoints, VALLEY_PROJECT_TARGET);
  const projectDone = value.projectDone === true || projectPoints >= VALLEY_PROJECT_TARGET;
  const rawTrip = value.trip;
  let trip: ValleyTrip | null = null;
  if (rawTrip && typeof rawTrip === 'object' && ['moulins', 'vergers'].includes(rawTrip.region) &&
    Number.isFinite(rawTrip.departedAt) && Number.isFinite(rawTrip.returnAt) && rawTrip.returnAt > rawTrip.departedAt &&
    Number.isFinite(rawTrip.coins) && Number.isFinite(rawTrip.xp) && Number.isFinite(rawTrip.reputation)) {
    const cargo = validCargo(rawTrip.cargo, validItem);
    if (cargo.length) trip = {
      serial: finiteInt(rawTrip.serial, 999999), region: rawTrip.region, cargo,
      departedAt: rawTrip.departedAt, returnAt: rawTrip.returnAt,
      coins: finiteInt(rawTrip.coins, 1000000), xp: finiteInt(rawTrip.xp, 100000),
      reputation: finiteInt(rawTrip.reputation, 10),
      preference: typeof rawTrip.preference === 'string' ? rawTrip.preference.slice(0, 100) : '',
      combination: typeof rawTrip.combination === 'string' ? rawTrip.combination.slice(0, 100) : '',
      signature: typeof rawTrip.signature === 'string' ? rawTrip.signature.slice(0, 100) : null,
      projectPoints: finiteInt(rawTrip.projectPoints, 3),
      ...(tourOf(rawTrip.tour).id !== 'court' ? { tour: tourOf(rawTrip.tour).id } : {}),
    };
  }
  const crate = (reputations[region] >= 5 ? 3 : 2) * tourOf(value.tour).crate;
  const cargo = validCargo(value.cargo, validItem).slice(0, projectDone ? 3 : 2)
    .map((line) => ({ ...line, amount: Math.min(crate, line.amount) }));
  return { region, cargo, trip,
    reputations, shipments, serial: Math.max(finiteInt(value.serial, 999999), trip?.serial || 0),
    projectPoints, projectDone,
    famousSignature: typeof value.famousSignature === 'string' ? value.famousSignature.slice(0, 100) : null,
    ...(tourOf(value.tour).id !== 'court' ? { tour: tourOf(value.tour).id } : {}) };
}
