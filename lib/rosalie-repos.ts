/**
 * 0.23 — Rosalie au repos : quelle petite animation, et quand.
 *
 * Après 12 à 25 secondes sans rien faire, Rosalie joue une fois une petite
 * animation (remettre une mèche, tenir sur un pied, s’étirer…), puis reprend
 * sa respiration de repos. Jamais deux fois la même de suite. Certaines
 * dépendent du moment : la main en visière au soleil, le bâillement le soir,
 * les mains frottées l’hiver. Toute action du joueur l’interrompt.
 *
 * Fonctions pures (testées dans tests/v023.test.ts) ; la minuterie est dans
 * components/farm/rosalie-repos.ts.
 */
import type { DayPhase } from './farm-visuals.ts';
import { ROSALIE_REPOS, type RosalieRepos } from './rosalie-anim.ts';

/** Calme nécessaire avant une animation : entre 12 et 25 secondes. */
export const REPOS_CALM_MS = [12_000, 25_000] as const;

export type ReposContext = { phase: DayPhase; season: string; weather: string };

/** Animations possibles à ce moment, avec leur poids (2 = deux fois plus probable). */
export function reposChoices({ phase, season, weather }: ReposContext): [RosalieRepos, number][] {
  const dark = phase === 'evening' || phase === 'night';
  const sunny = !dark && phase !== 'dawn' && weather !== 'pluie' && weather !== 'brume';
  const weights: Record<RosalieRepos, number> = {
    'repos-cheveux': 1,
    'repos-un-pied': 1,
    'repos-etirement': phase === 'dawn' ? 2 : 1,
    'repos-chapeau': 1,
    'repos-visiere': sunny ? 1 : 0,
    'repos-fredonne': 1,
    'repos-baille': dark ? 2 : 0,
    'repos-froid': season === 'hiver' ? 2 : 0,
  };
  return ROSALIE_REPOS.filter((id) => weights[id] > 0).map((id) => [id, weights[id]]);
}

/** Tire une animation au hasard (pondéré), jamais la même que la précédente. */
export function pickRepos(context: ReposContext, last: RosalieRepos | null, random = Math.random): RosalieRepos {
  const choices = reposChoices(context).filter(([id]) => id !== last);
  const total = choices.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = random() * total;
  for (const [id, weight] of choices) {
    roll -= weight;
    if (roll < 0) return id;
  }
  return choices.at(-1)![0];
}

/** Délai de calme avant la prochaine animation. */
export const reposDelay = (random = Math.random) =>
  REPOS_CALM_MS[0] + random() * (REPOS_CALM_MS[1] - REPOS_CALM_MS[0]);

export const isRepos = (action: string): action is RosalieRepos => (ROSALIE_REPOS as readonly string[]).includes(action);
