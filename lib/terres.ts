/** Build 0.8.0 : données pures des lignées, terroirs et saisons. */
export const TRAITS = [
  { id: 'precoce', name: 'Précoce', effect: 'Pousse 20 % plus vite.', tradeoff: 'Un peu moins de belles récoltes.' },
  { id: 'abondante', name: 'Abondante', effect: 'Une récolte double environ une fois sur trois.', tradeoff: 'Pousse 18 % plus lentement.' },
  { id: 'savoureuse', name: 'Savoureuse', effect: 'Ses produits améliorent les chances d’un plat savoureux.', tradeoff: 'Pousse 10 % plus lentement.' },
  { id: 'robuste', name: 'Robuste', effect: 'Profite de la qualité de l’arrosage même sans eau.', tradeoff: 'Pousse 12 % plus lentement.' },
  { id: 'artisanale', name: 'Artisanale', effect: 'Ses ingrédients accélèrent la préparation et réduisent les plats rustiques.', tradeoff: 'Pousse 10 % plus lentement.' },
] as const;
export type TraitId = (typeof TRAITS)[number]['id'];
export const TERROIRS = [
  { id: 'soleil', name: 'Potager ensoleillé', short: 'Soleil', color: '#bd8548', crops: ['radis', 'carotte', 'ble', 'tomate', 'mais'], effect: 'Primeurs et céréales poussent 10 % plus vite.' },
  { id: 'humide', name: 'Terres humides', short: 'Humide', color: '#718d77', crops: ['salade', 'fraise', 'myrtille', 'aubergine', 'melon'], effect: 'Une culture arrosée a davantage de belles récoltes.' },
  { id: 'abrite', name: 'Verger abrité', short: 'Abrité', color: '#9f7651', crops: ['citrouille', 'raisin', 'fraise', 'myrtille', 'melon'], effect: 'Les fruits et courges y mûrissent 10 % plus vite.' },
] as const;
export type TerroirId = (typeof TERROIRS)[number]['id'];
export const AMENDMENTS = [
  { terroir: 'soleil', id: 'compost', name: 'Compost du potager', cost: 90, level: 7, effect: 'Une graine de lignée en plus toutes les 3 récoltes de ce terroir.' },
  { terroir: 'humide', id: 'rigoles', name: 'Rigoles de pierre', cost: 210, level: 9, effect: 'L’eau et la terre humide favorisent davantage les belles récoltes.' },
  { terroir: 'abrite', id: 'haie', name: 'Haie protectrice', cost: 420, level: 14, effect: 'Les lignées du verger poussent 12 % plus vite.' },
] as const;
export const SEASONS = [
  { id: 'printemps', name: 'Printemps des primeurs', crops: ['radis', 'carotte', 'salade', 'fraise'], note: 'Les premières couleurs du potager ouvrent la foire.' },
  { id: 'ete', name: 'Été des tables longues', crops: ['tomate', 'mais', 'aubergine', 'fraise'], note: 'Les légumes du soleil sont attendus à la table.' },
  { id: 'automne', name: 'Automne des récoltes', crops: ['citrouille', 'raisin', 'ble', 'melon'], note: 'Courges, céréales et vendanges racontent la saison.' },
  { id: 'hiver', name: 'Hiver des douceurs', crops: ['myrtille', 'fraise', 'raisin', 'carotte'], note: 'Les réserves et les recettes réconfortantes brillent.' },
] as const;
export type Lineage = {
  id: number; crop: string; name: string; traits: TraitId[];
  nativeTerroir: TerroirId; originQuality: string;
  generation: number; seeds: number; harvests: number; orders: number;
  bestQuality: number; created: number;
  terroirHarvests?: Partial<Record<TerroirId, number>>;
};
export type SeedFind = {
  id: number; crop: string; nativeTerroir: TerroirId;
  sourceQuality: string; options: TraitId[]; parentId?: number; created: number;
};
export type FairBreakdown = { quality: number; theme: number; variety: number; lineage: number; mastery: number; village: number };
export type FairRecord = { cycle: number; items: string[]; score: number; breakdown: FairBreakdown; coins: number; xp: number };
export type LivingSeason = { index: number; startedHarvests: number; startedOrders: number; startedCrafted: number; fairs: FairRecord[];
  /** 0.11 : début de la saison (ms) ; une saison dure au moins SEASON_MIN_MS. Absent : aucune attente. */
  startedAt?: number };
/** 0.11 : une foire se recharge avec la saison, au plus trois par jour. */
export const SEASON_MIN_MS = 8 * 3_600_000;
export function freshSeason(): LivingSeason {
  return { index: 0, startedHarvests: 0, startedOrders: 0, startedCrafted: 0, fairs: [] };
}
export function terroirForPlot(index: number): TerroirId {
  return TERROIRS[Math.min(2, Math.max(0, Math.floor(index / 6)))].id;
}
export function seasonFor(index: number) {
  const safe = Math.max(0, Math.floor(index));
  const season = SEASONS[safe % SEASONS.length];
  const circuit = Math.floor(safe / SEASONS.length);
  const alternates = [
    ['ble', 'tomate', 'myrtille'], ['salade', 'melon', 'raisin'],
    ['mais', 'aubergine', 'carotte'], ['citrouille', 'ble', 'tomate'],
  ];
  const crops: string[] = [...season.crops];
  if (circuit > 0) crops[(circuit - 1) % 4] = alternates[safe % 4][(circuit - 1) % 3];
  return { ...season, crops, circuit, label: circuit ? `${season.name} · tour ${circuit + 1}` : season.name };
}
export function trait(id: string) { return TRAITS.find((entry) => entry.id === id); }
export function candidateOptions(seed: number, existing: readonly TraitId[] = []): TraitId[] {
  const available = TRAITS.map((entry) => entry.id).filter((id) => !existing.includes(id));
  const start = Math.abs(Math.floor(seed)) % available.length;
  const stride = available.length % 2 ? 2 : 1;
  return Array.from({ length: Math.min(3, available.length) }, (_, n) => available[(start + n * stride) % available.length]);
}
export function lineageGrowFactor(traits: readonly TraitId[]) {
  return traits.reduce((factor, id) => factor * ({ precoce: 0.8, abondante: 1.18, savoureuse: 1.1, robuste: 1.12, artisanale: 1.1 }[id]), 1);
}
export function terroirGrowFactor(crop: string, terroir: TerroirId, traits: readonly TraitId[], native: TerroirId | null, hedged: boolean) {
  const data = TERROIRS.find((entry) => entry.id === terroir)!;
  const fit = (data.crops as readonly string[]).includes(crop) ? 0.9 : 1;
  const home = native === terroir ? 0.92 : 1;
  const haie = hedged && terroir === 'abrite' && traits.length ? 0.88 : 1;
  return fit * home * haie;
}
const safeInt = (value: unknown, max = 1_000_000) => typeof value === 'number' && Number.isFinite(value)
  ? Math.min(max, Math.max(0, Math.floor(value))) : 0;
export function normalizeLineages(raw: unknown, validCrop: (id: string) => boolean): Lineage[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<number>();
  return raw.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object' && !Array.isArray(item))
    .map((item) => {
      const id = safeInt(item.id);
      const crop = typeof item.crop === 'string' ? item.crop : '';
      if (!id || seen.has(id) || !validCrop(crop)) return null;
      seen.add(id);
      const validTraits = Array.isArray(item.traits)
        ? [...new Set(item.traits.filter((value): value is TraitId => typeof value === 'string' && !!trait(value)))].slice(0, 2) : [];
      if (!validTraits.length) return null;
      const name = typeof item.name === 'string' ? item.name.trim().slice(0, 24) : '';
      return { id, crop, name: name || `Lignée ${id}`, traits: validTraits,
        nativeTerroir: TERROIRS.some((entry) => entry.id === item.nativeTerroir) ? item.nativeTerroir as TerroirId : 'soleil' as const,
        originQuality: ['ordinaire', 'belle', 'exceptionnelle'].includes(String(item.originQuality)) ? String(item.originQuality) : 'ordinaire',
        generation: Math.min(2, Math.max(1, safeInt(item.generation))),
        seeds: safeInt(item.seeds, Number.MAX_SAFE_INTEGER), harvests: safeInt(item.harvests), orders: safeInt(item.orders),
        bestQuality: safeInt(item.bestQuality, 2), created: safeInt(item.created, Number.MAX_SAFE_INTEGER),
        ...(item.terroirHarvests && typeof item.terroirHarvests === 'object' ? { terroirHarvests: Object.fromEntries(TERROIRS.flatMap(t => {
          const count = (item.terroirHarvests as Record<string, unknown>)[t.id];
          return count === undefined ? [] : [[t.id, safeInt(count)]];
        })) } : {}) };
    }).filter((item): item is Lineage => item !== null).slice(0, 80);
}
export function normalizeSeedFinds(raw: unknown, lineages: readonly Lineage[], validCrop: (id: string) => boolean): SeedFind[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object' && !Array.isArray(item))
    .map((item) => {
      const id = safeInt(item.id);
      const crop = typeof item.crop === 'string' ? item.crop : '';
      const parentId = safeInt(item.parentId);
      if (!id || !validCrop(crop) || (parentId && !lineages.some((lineage) => lineage.id === parentId && lineage.crop === crop && lineage.traits.length < 2))) return null;
      const nativeTerroir = TERROIRS.some((entry) => entry.id === item.nativeTerroir) ? item.nativeTerroir as TerroirId : 'soleil';
      const inherited = parentId ? lineages.find((lineage) => lineage.id === parentId)!.traits : [];
      const savedOptions = Array.isArray(item.options)
        ? [...new Set(item.options.filter((value): value is TraitId =>
          typeof value === 'string' && !!trait(value) && !inherited.includes(value as TraitId)))].slice(0, 3)
        : [];
      const options = savedOptions.length >= 2 ? savedOptions : candidateOptions(id + crop.length, inherited);
      return { id, crop, nativeTerroir, sourceQuality: ['ordinaire','belle','exceptionnelle'].includes(String(item.sourceQuality)) ? String(item.sourceQuality) : 'ordinaire',
        options, ...(parentId ? { parentId } : {}), created: safeInt(item.created, Number.MAX_SAFE_INTEGER) } as SeedFind;
    }).filter((item): item is SeedFind => item !== null).slice(0, 3);
}
export function normalizeSeason(raw: unknown, harvests: number, orders: number, crafted: number): LivingSeason {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw))
    return { index: 0, startedHarvests: harvests, startedOrders: orders, startedCrafted: crafted, fairs: [] };
  const value = raw as Record<string, unknown>;
  const fairs = Array.isArray(value.fairs) ? value.fairs.filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === 'object' && !Array.isArray(entry))
    .map((entry) => ({ cycle: safeInt(entry.cycle), items: Array.isArray(entry.items) ? entry.items.filter((item): item is string => typeof item === 'string').slice(0, 2) : [],
      score: safeInt(entry.score, 100), breakdown: Object.fromEntries(['quality','theme','variety','lineage','mastery','village'].map((key) => [key, safeInt((entry.breakdown as Record<string, unknown> | undefined)?.[key], 100)])) as FairBreakdown,
      coins: safeInt(entry.coins), xp: safeInt(entry.xp) })) : [];
  return { index: safeInt(value.index, 100_000), startedHarvests: Math.min(harvests, safeInt(value.startedHarvests)),
    startedOrders: Math.min(orders, safeInt(value.startedOrders)), startedCrafted: Math.min(crafted, safeInt(value.startedCrafted)), fairs: fairs.slice(-100),
    ...(typeof value.startedAt === 'number' && Number.isFinite(value.startedAt) && value.startedAt > 0 ? { startedAt: Math.floor(value.startedAt) } : {}) };
}
