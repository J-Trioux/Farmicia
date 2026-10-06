/**
 * 0.22 — Quel son pour quelle action du joueur.
 *
 * Les gestes faits par Rosalie sur la carte (semer, arroser, récolter, bêcher,
 * cuisiner, ramasser les œufs, fêter un niveau) ont leur son dans
 * components/farm/farm-map.tsx, calé sur l’animation. Ici : ce qui se passe
 * dans les fenêtres (boutique, panier, commandes, projets…).
 */
import type { Game } from '@/lib/game';

/** Actions sonorisées sur la carte, au rythme des gestes : rien ici. */
const ON_MAP = new Set(['plant', 'water', 'harvest', 'bulkTick', 'bulkStart', 'bulkCancel', 'sowAll', 'waterAll', 'harvestAll',
  'craft', 'collect', 'hens', 'orchard', 'selectSeed', 'scene', 'setting', 'trackGoal']);

/** Actions dont l’échec mérite un petit son (le joueur attendait un résultat). */
const MAY_FAIL = new Set(['buy', 'sell', 'sellMany', 'sellSurplus', 'order', 'upgrade', 'embellish', 'renovate', 'projectFund',
  'projectDeliver', 'gift', 'donate', 'eat', 'preserve', 'mission', 'quest', 'festival', 'fair']);

export type Cue = { name: string; duck?: number } | null;

export function cueFor(action: string, before: Game, after: Game, message: string): Cue {
  if (ON_MAP.has(action)) return null;
  if (before === after) return MAY_FAIL.has(action) ? { name: 'ui-erreur' } : null;
  const coins = after.coins - before.coins;
  if (after.projects.done.length > before.projects.done.length) return { name: 'projet', duck: 3.5 };
  if (action === 'festival' || action === 'fair') return { name: 'fete', duck: 3 };
  if (['upgrade', 'embellish', 'renovate', 'projectFund', 'projectDeliver', 'amendTerroir'].includes(action))
    return { name: 'chantier', duck: 1.6 };
  if (action === 'order' || action === 'mission' || action === 'quest') return { name: 'commande', duck: 1.8 };
  if (action === 'buy' || coins < 0) return { name: 'achat' };
  if (coins > 0) return { name: 'pieces' };
  if (/Exceptionnelle|Chef-d’œuvre/.test(message)) return { name: 'recolte-exceptionnelle', duck: 1.5 };
  return { name: 'ui-notif' };
}
