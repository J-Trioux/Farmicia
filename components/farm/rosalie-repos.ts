'use client';
/**
 * 0.23 — Rosalie au repos : la minuterie (le choix est dans lib/rosalie-repos.ts).
 *
 * - Rosalie au repos (action « idle ») et aucune entrée du joueur pendant
 *   12 à 25 s → une petite animation, jouée une fois ;
 * - à la fin, elle reprend sa respiration de repos et le compte repart ;
 * - un clic, une touche ou la molette pendant l’animation l’interrompt
 *   (retour immédiat au repos) ; un trajet ou un geste la remplace ;
 * - rien en mouvement réduit, ni quand l’onglet est caché.
 */
import { useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import { useAmbiencePreview } from '@/components/farm/ambience';
import { dayPhase, weatherFor } from '@/lib/farm-visuals';
import { seasonFor, type Game } from '@/lib/game';
import { clipDuration, rosalieClip, type RosalieAction, type RosalieRepos } from '@/lib/rosalie-anim';
import { isRepos, pickRepos, reposDelay } from '@/lib/rosalie-repos';

const INPUTS = ['pointerdown', 'keydown', 'wheel'] as const;

/** Développement seulement : ?repos=3000 raccourcit l’attente (en ms) pour voir les animations. */
function devCalm(): number | null {
  if (process.env.NODE_ENV === 'production' || typeof window === 'undefined') return null;
  const ms = Number(new URLSearchParams(window.location.search).get('repos'));
  return ms > 0 ? ms : null;
}

export function useRosalieRepos({ action, setAction, game, reduced, disabled }: {
  action: RosalieAction;
  setAction: Dispatch<SetStateAction<RosalieAction>>;
  game: Game;
  reduced: boolean;
  disabled: boolean;
}) {
  const dev = useAmbiencePreview();
  const context = useRef({ game, dev });
  const last = useRef<RosalieRepos | null>(null);
  useEffect(() => {
    context.current = { game, dev };
  }, [game, dev]);

  useEffect(() => {
    if (reduced || disabled) return;
    let timer = 0;
    const listen = (handler: () => void) => {
      for (const type of INPUTS) window.addEventListener(type, handler, { capture: true, passive: true });
      return () => {
        for (const type of INPUTS) window.removeEventListener(type, handler, { capture: true });
      };
    };
    if (action === 'idle') {
      const arm = () => {
        window.clearTimeout(timer);
        timer = window.setTimeout(play, devCalm() ?? reposDelay());
      };
      const play = () => {
        if (document.hidden) return arm();
        const { game: g, dev: d } = context.current;
        const now = Date.now();
        const next = pickRepos({
          phase: d.phase ?? dayPhase(now),
          season: seasonFor(g.season.index).id,
          weather: d.weather || weatherFor(g, now).id,
        }, last.current);
        last.current = next;
        setAction((current) => (current === 'idle' ? next : current));
      };
      arm();
      const stop = listen(arm);
      return () => {
        window.clearTimeout(timer);
        stop();
      };
    }
    if (isRepos(action)) {
      const back = () => setAction((current) => (current === action ? 'idle' : current));
      timer = window.setTimeout(back, clipDuration(rosalieClip(action)));
      const stop = listen(back);
      return () => {
        window.clearTimeout(timer);
        stop();
      };
    }
  }, [action, setAction, reduced, disabled]);
}
