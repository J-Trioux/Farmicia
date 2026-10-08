/**
 * Icônes 3.0 (0.29, ChatGPT) : vrai pixel art 32 × 32 dans le style des icônes v040,
 * planches HD (cases de 512 px, ×16 exact des natifs), servies en PNG sans compression.
 * Aucun pixel n’est redessiné ou réduit lors de la livraison.
 * Un emplacement d’atlas par sens ; les alias nomment le même objet.
 */
export const ICON_SHEETS = {
  A: { columns: 4, rows: 3, ids: ["plan","commande","rosette","lettre","etabli","loupe","casserole","planchette","chap-village","chap-ferme","chap-cuisine","chap-souvenirs"] },
  B: { columns: 4, rows: 3, ids: ["piece","etoile","faucille","arrosoir","sachet","oeuf","sablier","soleil","pluie","brume","doree","neige"] },
  C: { columns: 4, rows: 3, ids: ["parcelles","arrosoir-cuivre","outils","irrigation","atelier","poulailler","semoir","sentier","fourneau-2","fourneau-3","marmite","serre"] },
  D: { columns: 4, rows: 3, ids: ["marche","garde","graine-doree","tournee","menu","signature","cloche","balance","cagette","laurier","projet-village","recette"] },
  E: { columns: 3, rows: 2, ids: ["fontaine","barque","epouvantail","ruches","moulin","pigeonnier"] },
  F: { columns: 4, rows: 2, ids: ["cadenas","engrenage","son","son-coupe","musique","cle","coeur","horloge"] },
} as const;

export type IconSheet = keyof typeof ICON_SHEETS;
export const ICON_IDS = Object.values(ICON_SHEETS).flatMap((sheet) => [...sheet.ids]);

export type PixelIconAsset = { image: string; columns: number; rows: number; index: number };
export const NEW_ICON_ASSETS: Record<string, PixelIconAsset> = Object.fromEntries(
  Object.entries(ICON_SHEETS).flatMap(([name, sheet]) => sheet.ids.map((id, index) => [
    id, { image: `/assets/pixel/icones-3.0/${name}.png`, columns: sheet.columns, rows: sheet.rows, index },
  ])),
);

/** Identifiants métier des améliorations → objets de la planche C. */
export const UPGRADE_ICONS: Record<string, string> = {
  expand: 'parcelles', water: 'irrigation', tools: 'outils',
  workshop: 'atelier', coop: 'poulailler', auto: 'semoir',
  paths: 'sentier', 'watering-can': 'arrosoir-cuivre',
  stove2: 'fourneau-2', stove3: 'fourneau-3', marmite: 'marmite',
  greenhouse: 'serre',
};

/** Anciens noms conservés pour les mêmes objets, jamais pour des actions différentes. */
export const ICON_ALIASES: Record<string, string> = {
  coin: 'piece', quality: 'etoile', seeds: 'sachet', water: 'arrosoir',
  ...Object.fromEntries(Object.entries(UPGRADE_ICONS).filter(([id]) => id !== 'water')),
};

/**
 * 0.30 — Icônes 3.1 (ChatGPT) : les derniers atlas anciens passent en vrai pixel art,
 * planches HD (cases de 512 px), servies sans perte. Mêmes identifiants, même ordre.
 */
const EXTRA_SHEETS: Record<string, { columns: number; rows: number; ids: readonly (string | null)[] }> = {
  // Carnet (anciennement carnet-v016/icons.png).
  G: { columns: 3, rows: 2, ids: ['basket', 'valley', 'lineage', 'savoirfaire', 'album', 'guidebook'] },
  // Recettes (anciennement recettes-v016/icons.png).
  H: { columns: 3, rows: 3, ids: ['potage', 'assiette', 'galette', 'clafoutis', 'veloute', 'jus', 'melonade', 'fougasse', 'pickles'] },
  // Saisons, réserves et braises du « Four chaud » (anciennement v095 et carnet-1.0).
  I: { columns: 4, rows: 2, ids: ['season-printemps', 'season-ete', 'season-automne', 'season-hiver', 'unused-paths', 'souffle', 'braises', null] },
  // Les cinq boutons d’action du bas de l’écran.
  J: { columns: 5, rows: 1, ids: ['action-arroser', 'action-recolter', 'action-panier', 'action-semer', 'action-carnet'] },
};
const EXTRA_ASSETS: Record<string, PixelIconAsset> = Object.fromEntries(
  Object.entries(EXTRA_SHEETS).flatMap(([name, sheet]) => sheet.ids.flatMap((id, index) => (id ? [[
    id, { image: `/assets/pixel/icones-3.1/${name}.png`, columns: sheet.columns, rows: sheet.rows, index },
  ]] : []))),
);
const CLASSIC_RECIPE_IDS: Record<string, number> = {
  pain: 4, confiture: 5, sauce: 6, ratatouille: 7, violette: 8, brioche: 9, infusion: 10, tarte: 11,
};
export const SIGNATURE_RECIPE_IDS = ['pain_maison', 'confiture_maison', 'sauce_maison', 'potage_maison', 'assiette_maison', 'ratatouille_maison', 'violette_maison'];

export function pixelIconAsset(id: string): PixelIconAsset | null {
  const base = id.split('|')[0];
  const canonical = ICON_ALIASES[base] || base;
  if (NEW_ICON_ASSETS[canonical]) return NEW_ICON_ASSETS[canonical];
  if (EXTRA_ASSETS[base]) return EXTRA_ASSETS[base];
  const signature = SIGNATURE_RECIPE_IDS.indexOf(base);
  if (signature >= 0) return { image: '/assets/pixel/icones-3.0/signatures.png', columns: 7, rows: 1, index: signature };
  if (base in CLASSIC_RECIPE_IDS) return { image: '/assets/pixel/v040/icons.png', columns: 4, rows: 4, index: CLASSIC_RECIPE_IDS[base] };
  return null;
}
