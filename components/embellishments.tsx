'use client';
/**
 * 0.11 — La ferme s’embellit : les six embellissements (trois étapes chacun)
 * et les dons à la fête du village, dans la page « Améliorer » du carnet.
 */
import type { CSSProperties } from 'react';
import { embellishmentStage, level, type Game } from '@/lib/game';
import { type Embellishment } from '@/lib/embellishments';
import { restorationStage, type Restoration } from '@/lib/restorations';

type State = 'done' | 'available' | 'saving' | 'future';

export function embellishPresentation(game: Game, entry: Embellishment) {
  const stage = embellishmentStage(game, entry.id);
  if (stage >= 3) return { stage, state: 'done' as State, cost: 0, required: 0, missing: 0 };
  const next = stage as 0 | 1 | 2;
  const cost = entry.costs[next];
  const required = entry.levels[next];
  const state: State = level(game) < required ? 'future' : game.coins < cost ? 'saving' : 'available';
  return { stage, state, cost, required, missing: Math.max(0, cost - game.coins) };
}

/** Aperçu de la planche : l’étape atteinte, ou la première en filigrane. */
export function EmbellishSprite({ entry, stage, ghost = false }: { entry: Embellishment; stage: number; ghost?: boolean }) {
  const style = {
    backgroundImage: `url(/assets/pixel/embellissements-hd/${entry.id}.png)`,
    backgroundPosition: `${(Math.max(1, stage) - 1) * 50}% 0`,
    aspectRatio: `128 / ${entry.cell}`,
  } as CSSProperties;
  return (
    <span className={`embellish-sprite${ghost ? ' ghost' : ''}`} style={style} aria-hidden="true">
      {entry.id === 'moulin' && stage >= 2 && <span className="embellish-anim moulin-wings still" />}
    </span>
  );
}

export function restorationPresentation(game: Game, entry: Restoration) {
  const stage = restorationStage(game, entry.id);
  if (stage >= 3) return { stage, state: 'done' as State, cost: 0, required: 0, missing: 0 };
  const next = stage as 0 | 1 | 2;
  const cost = entry.costs[next];
  const required = entry.levels[next];
  const state: State = level(game) < required ? 'future' : game.coins < cost ? 'saving' : 'available';
  return { stage, state, cost, required, missing: Math.max(0, cost - game.coins) };
}

/**
 * 0.13 — Restaurer le domaine : les six lieux de l’anneau de la grande carte,
 * trois étapes chacun. 0.26 : leur page est l’onglet « Domaine » d’Améliorer
 * (components/notebook/upgrades-panel.tsx), comme les embellissements et la fête.
 */
export const RESTORE_TITLE = 'Restaurer le domaine';

/** Image d’un lieu du domaine à son étape (la première, en filigrane, s’il est en friche). */
export function DomainThumb({ id, stage }: { id: string; stage: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- vignette fixe d’un lieu du domaine
    <img className="domain-thumb" data-ghost={!stage || undefined} src={`/assets/pixel/domaine/${id}-${Math.max(1, Math.min(3, stage))}.png`} alt="" draggable={false} />
  );
}
