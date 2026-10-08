/**
 * 0.9.7 — Lecture des animations de Rosalie, sans DOM ni minuterie.
 * Reprend le lecteur livré avec les sprites (public/assets/pixel/rosalie-v100/player.mjs) :
 * durées par image, gestes joués une seule fois, image fixe en mouvement réduit,
 * repères d’effets (eau, graines, terre, éclats de récolte) déclenchés au bon moment.
 * Ces animations sont purement visuelles : l’état du jeu reste décidé par act().
 */
import { ROSALIE_CLIPS, ROSALIE_EFFECTS, ROSALIE_FRAME, type RosalieClip, type RosalieCue } from './rosalie-clips.ts';

export type RosalieAction =
  | 'idle'
  | 'walk-right'
  | 'walk-left'
  | 'walk-up'
  | 'walk-down'
  | 'plant'
  | 'water'
  | 'harvest'
  | 'hoe'
  | 'celebrate'
  | 'cook'
  | 'eggs'
  | RosalieRepos;

/**
 * 0.23 — Petites animations de repos, jouées une fois quand le joueur ne fait rien
 * (components/farm/rosalie-repos.ts choisit laquelle et quand).
 * 0.22.1 avait retiré les anciennes « attitudes » (images de marche figées).
 */
export const ROSALIE_REPOS = ['repos-cheveux', 'repos-un-pied', 'repos-etirement', 'repos-chapeau', 'repos-visiere',
  'repos-fredonne', 'repos-baille', 'repos-froid'] as const;
export type RosalieRepos = (typeof ROSALIE_REPOS)[number];

/** Action du jeu → animation. Sans animation dédiée : Rosalie reste au repos. */
export const ACTION_CLIP: Record<RosalieAction, string> = {
  idle: 'idle',
  'walk-down': 'walk-down',
  'walk-up': 'walk-up',
  'walk-right': 'walk-right',
  'walk-left': 'walk-left',
  harvest: 'harvest',
  water: 'water',
  plant: 'plant',
  ...(Object.fromEntries(ROSALIE_REPOS.map((id) => [id, id])) as Record<RosalieRepos, string>),
  // 1.0 : animations livrées par Astra.
  hoe: 'hoe',
  cook: 'cook',
  eggs: 'eggs',
  celebrate: 'celebrate',
};

export function rosalieClip(action: RosalieAction): RosalieClip {
  return ROSALIE_CLIPS[ACTION_CLIP[action]] ?? ROSALIE_CLIPS.idle;
}

export const clipDuration = (clip: RosalieClip) => clip.durations.reduce((a, b) => a + b, 0);

/** Image à afficher après `elapsed` ms. Un geste s’arrête sur sa dernière image. */
export function sampleClip(clip: RosalieClip, elapsed: number, reduced = false) {
  const duration = clipDuration(clip);
  const t0 = Math.max(0, Number.isFinite(elapsed) ? elapsed : 0);
  const done = !clip.loop && t0 >= duration;
  if (reduced) return { index: clip.reducedFrame, done: true, duration };
  const t = clip.loop ? t0 % duration : Math.min(t0, duration - 1e-6);
  let cursor = 0;
  for (let i = 0; i < clip.durations.length; i++) {
    cursor += clip.durations[i];
    if (t < cursor) return { index: i, done, duration };
  }
  return { index: clip.frames.length - 1, done, duration };
}

/** Repères franchis entre deux instants (jamais rejoués, jamais en arrière). */
export function cuesBetween(clip: RosalieClip, previous: number, current: number): RosalieCue[] {
  if (current < previous) return [];
  return clip.cues.filter((cue) => cue.at > previous && cue.at <= current);
}

/** Repère → effet à jouer. « water-stop » ne lance rien : l’eau s’arrête d’elle-même. */
export const CUE_EFFECT: Record<string, string | null> = {
  'water-start': 'water',
  'water-stop': null,
  seeds: 'seeds',
  soil: 'soil',
  'harvest-pop': 'harvest',
};

/** Position de fond (en %) d’une image de l’atlas (8 colonnes × ROSALIE_FRAME.rows). */
export function framePosition([col, row]: [number, number]) {
  const x = (col / (ROSALIE_FRAME.columns - 1)) * 100;
  const y = (row / (ROSALIE_FRAME.rows - 1)) * 100;
  return `${+x.toFixed(4)}% ${+y.toFixed(4)}%`;
}

/**
 * Boîte d’un effet dans la boîte de Rosalie (en %) : le point d’ancrage de
 * l’effet est posé au repère, compté depuis les pieds (pivot 40, 88).
 */
export function effectBox(effectId: string, offset: [number, number]) {
  const fx = ROSALIE_EFFECTS[effectId];
  const [fw, fh] = fx.frameSize;
  const x = ROSALIE_FRAME.pivot[0] + offset[0] - fx.anchor[0];
  const y = ROSALIE_FRAME.pivot[1] + offset[1] - fx.anchor[1];
  return {
    left: (x / ROSALIE_FRAME.w) * 100,
    top: (y / ROSALIE_FRAME.h) * 100,
    width: (fw / ROSALIE_FRAME.w) * 100,
    height: (fh / ROSALIE_FRAME.h) * 100,
    duration: fx.durations.reduce((a, b) => a + b, 0),
    frames: fx.frames,
    image: fx.image,
  };
}
