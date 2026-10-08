import { ICON_ALIASES, ICON_IDS, SIGNATURE_RECIPE_IDS } from './pixel-icons';
import { CROP_ATLAS_ROWS } from './farm-visuals';

/** PNG individuels : grille native 64 × 64, export exact à ×4. */
export const CARNET_ICON_IDS = [
  ...ICON_IDS,
  'basket', 'valley', 'lineage', 'savoirfaire', 'album', 'guidebook',
  'potage', 'assiette', 'galette', 'clafoutis', 'veloute', 'jus', 'melonade', 'fougasse', 'pickles',
  'season-printemps', 'season-ete', 'season-automne', 'season-hiver', 'souffle', 'braises',
  'action-arroser', 'action-recolter', 'action-panier', 'action-semer', 'action-carnet',
  'pain', 'confiture', 'sauce', 'ratatouille', 'violette', 'brioche', 'infusion', 'tarte',
  ...SIGNATURE_RECIPE_IDS,
  ...Object.keys(CROP_ATLAS_ROWS),
] as const;

const ids = new Set<string>(CARNET_ICON_IDS);

export function carnetIconAsset(id: string): string | null {
  const base = id.split('|')[0];
  const canonical = ICON_ALIASES[base] || base;
  return ids.has(canonical) ? `/assets/pixel/carnet-v040/${canonical}.png` : null;
}

export const CARNET_PORTRAITS = ['rosalie', 'lucie', 'marcel', 'jeanne', 'clara', 'emile'] as const;
