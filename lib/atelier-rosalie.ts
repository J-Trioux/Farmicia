import { clipDuration, rosalieClip, type RosalieAction } from './rosalie-anim.ts';

export type AtelierRosalieContext = {
  cookingCount: number;
  readyCount: number;
  arriving: boolean;
  collecting: boolean;
  launchToken: number;
};

export type AtelierRosalieMood = 'idle' | 'cooking' | 'ready' | 'arriving' | 'collecting';
export type AtelierRosalieBeat = { action: RosalieAction; duration: number; repeat: boolean };

/** Les réactions suivent les événements de l’atelier, jamais l’horloge du jeu. */
export function atelierRosalieReaction(previous: AtelierRosalieContext | null, current: AtelierRosalieContext): RosalieAction | null {
  if (!previous) return null;
  if (current.collecting && !previous.collecting) return 'celebrate';
  if (current.readyCount > previous.readyCount) return 'celebrate';
  if (current.launchToken !== previous.launchToken || current.cookingCount > previous.cookingCount) return 'cook';
  if (current.arriving && !previous.arriving) return 'repos-chapeau';
  return null;
}

export function atelierRosalieMood(context: AtelierRosalieContext): AtelierRosalieMood {
  if (context.collecting) return 'collecting';
  if (context.arriving) return 'arriving';
  if (context.readyCount > 0) return 'ready';
  return context.cookingCount > 0 ? 'cooking' : 'idle';
}

export const ATELIER_ROSALIE_CAPTIONS: Record<AtelierRosalieMood, string> = {
  idle: 'Une nouvelle recette ?',
  cooking: 'Ça mijote !',
  ready: 'À table !',
  arriving: 'Je prépare le tablier !',
  collecting: 'Bon appétit !',
};

const beat = (action: RosalieAction, duration = clipDuration(rosalieClip(action)), repeat = false): AtelierRosalieBeat => ({ action, duration, repeat });
const COOKING = [
  beat('cook', 3_200, true),
  beat('idle', 700),
  beat('cook', 2_400, true),
  beat('repos-chapeau'),
  beat('cook', 3_200, true),
  beat('repos-cheveux'),
  beat('cook', 2_400, true),
  beat('repos-fredonne'),
];
const WAITING = [
  beat('idle', 5_000),
  beat('repos-chapeau'),
  beat('idle', 4_000),
  beat('repos-fredonne'),
  beat('idle', 5_000),
  beat('repos-cheveux'),
  beat('idle', 4_000),
  beat('repos-un-pied'),
];
const READY = [
  beat('idle', 3_200),
  beat('repos-fredonne'),
  beat('idle', 3_600),
  beat('repos-chapeau'),
  beat('idle', 3_200),
  beat('repos-cheveux'),
];

/** Une célébration est toujours ponctuelle ; les séquences de fond n’en contiennent pas. */
export function atelierRosalieBeat(context: AtelierRosalieContext, index: number, reaction: RosalieAction | null = null): AtelierRosalieBeat {
  if (reaction) return beat(reaction);
  if (context.arriving || context.collecting) return beat('idle', 3_000);
  const sequence = context.cookingCount > 0 ? COOKING : context.readyCount > 0 ? READY : WAITING;
  return sequence[((index % sequence.length) + sequence.length) % sequence.length];
}

/** Pas de séquence ni de minuterie quand les mouvements sont réduits. */
export function atelierRosalieStill(context: AtelierRosalieContext): RosalieAction {
  if (context.collecting || context.readyCount > 0) return 'celebrate';
  if (context.cookingCount > 0) return 'cook';
  return 'idle';
}
