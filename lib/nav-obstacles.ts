/**
 * 0.16 — Emprise au sol des objets posés sur la carte au fil du jeu : Rosalie
 * contourne leur pied (elle passe derrière ou devant, jamais au travers). Les
 * poteaux de la guirlande et de l’arche seuls bloquent : elle passe dessous.
 * Mêmes conditions d’affichage que components/farm/farm-map.tsx.
 */
import { objectSize } from './echelle.ts';
import { EMBELLISHMENTS, FEAST_DECOR_READY, embellishmentStage, feastDecorFor } from './embellishments.ts';
import { level, type Game } from './game.ts';
import { ANCHORS, type AnchorId, type Px, type RectPx } from './world.ts';

/** Bande au sol : largeur et profondeur (px de la grille), pieds au milieu du bord bas. */
const band = (foot: Px, w: number, depth: number): RectPx => ({ x: foot.x - w / 2, y: foot.y - depth, w, h: depth });
const object = (id: AnchorId, sprite: string, depth = 14): RectPx => {
  const [w, h] = objectSize(sprite);
  return band(ANCHORS[id], w * 0.85, Math.min(depth, h * 0.5));
};
/** Pieds des embellissements (largeur, profondeur), 0.19 : à leur nouvelle échelle. */
const EMBELLISH_FOOT: Record<string, readonly [number, number]> = {
  fontaine: [54, 18],
  pigeonnier: [46, 16],
  epouvantail: [12, 6],
  ruches: [56, 14],
  moulin: [56, 20],
  barque: [0, 0],
};

export function worldObstacles(g: Game): RectPx[] {
  const out: RectPx[] = [];
  if (g.terroirBuilds.includes('soleil')) out.push(object('compost', 'compost'));
  if (g.terroirBuilds.includes('humide')) out.push(object('rigoles', 'rigoles', 8));
  if (g.terroirBuilds.includes('abrite')) out.push(object('haie', 'haie', 8));
  if (g.projects.done.includes('pepiniere-voisins')) out.push(object('pepiniere', 'pepiniere'));
  if (g.projects.done.includes('halle-terroirs')) out.push(object('halle', 'halle-varietes', 16));
  if (level(g) >= 3) out.push(object('caravane', 'caravane-retour', 14));
  if (g.valley.projectDone) out.push(object('relais', 'relais-vallee', 12));
  if (g.upgrades.includes('water')) out.push(band(ANCHORS.irrigation, 10, 6));
  if (g.upgrades.includes('tools')) out.push(object('etabli', 'etabli', 12));
  if (g.upgrades.includes('auto')) out.push(object('semoir', 'semoir', 12));
  for (const entry of EMBELLISHMENTS) {
    const [w, depth] = EMBELLISH_FOOT[entry.id];
    if (w && embellishmentStage(g, entry.id)) out.push(band(ANCHORS[entry.id], w, depth));
  }
  if (FEAST_DECOR_READY)
    for (const decor of feastDecorFor(g.donations || 0)) {
      const [w] = decor.size;
      if (decor.id === 'lampions' || decor.id === 'arche') {
        const post = decor.id === 'lampions' ? w / 2 - 3 : w / 2 - 4;
        out.push(band({ x: decor.foot.x - post, y: decor.foot.y }, 5, 5), band({ x: decor.foot.x + post, y: decor.foot.y }, 5, 5));
      } else out.push(band(decor.foot, w * 0.9, decor.id === 'estrade' ? 20 : 14));
    }
  return out;
}
