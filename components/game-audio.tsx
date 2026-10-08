'use client';
/**
 * 0.22 — Chef d’orchestre : relie le jeu au son (lib/audio/engine.ts).
 *
 * - Musique de la saison ; arrangement « jour » de l’aube à l’heure dorée,
 *   « soir » le soir et la nuit (fondu calé sur le morceau).
 * - Ambiance : oiseaux le jour, grillons les nuits d’été et d’automne, pluie.
 * - Fenêtres : un froissement de papier à l’ouverture et à la fermeture ;
 *   clic de bois sur les boutons, page qui tourne sur les onglets.
 * - Cuisine : la clochette sonne quand un plat est prêt.
 *
 * Composant séparé : il suit l’horloge du jeu sans redessiner la page.
 */
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { useSky } from '@/components/farm/ambience';
import { gameAudio, type AudioPrefs, type Mood } from '@/lib/audio/engine';
import { seasonFor, type Game } from '@/lib/game';

const SERVER_PREFS: AudioPrefs = { on: false, music: 0, sfx: 0 };

export function useAudioPrefs() {
  return useSyncExternalStore(gameAudio.subscribe, gameAudio.getPrefs, () => SERVER_PREFS);
}

const NIGHT = new Set(['evening', 'night']);

export function GameAudio({ game, dialogOpen }: { game: Game; dialogOpen: boolean }) {
  const sky = useSky(game);
  const season = seasonFor(game.season.index).id;
  const mood: Mood = NIGHT.has(sky.phase) ? 'soir' : 'jour';
  const rainy = sky.weather === 'pluie';
  const ambience = !sky.ready
    ? null
    : rainy
      ? season === 'hiver' ? null : 'ambiance-pluie'
      : mood === 'soir'
        ? season === 'hiver' ? null : 'ambiance-grillons'
        : 'ambiance-oiseaux';
  const hens = game.upgrades.includes('coop');

  useEffect(() => gameAudio.install(), []);
  useEffect(() => {
    if (sky.ready) gameAudio.setScene({ season, mood, ambience, hens });
  }, [sky.ready, season, mood, ambience, hens]);

  // Fenêtres : ouverture et fermeture (pas au chargement).
  const wasOpen = useRef(dialogOpen);
  useEffect(() => {
    if (wasOpen.current === dialogOpen) return;
    wasOpen.current = dialogOpen;
    gameAudio.play(dialogOpen ? 'ui-ouvrir' : 'ui-fermer');
  }, [dialogOpen]);

  // Boutons et onglets hors de la carte (la carte a ses propres sons).
  useEffect(() => {
    const click = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const control = target?.closest?.('button, [role="tab"], summary, a[href]');
      if (!control || control.closest('.pixel-farm') || (control as HTMLButtonElement).disabled) return;
      const page = control.matches('[role="tab"], .carnet-chapter-head, .carnet-link, .carnet-tab, .carnet-cover, summary');
      gameAudio.play(page ? 'ui-page' : 'ui-clic', { rate: 0.96 + Math.random() * 0.08 });
    };
    document.addEventListener('click', click, true);
    return () => document.removeEventListener('click', click, true);
  }, []);

  // Cuisine : la clochette quand le prochain plat est prêt.
  const ends = [game.job, ...game.stoves].map((job) => job?.end).filter((end): end is number => typeof end === 'number');
  const nextEnd = ends.filter((end) => end > sky.now).sort((a, b) => a - b)[0];
  useEffect(() => {
    if (!nextEnd) return;
    const wait = nextEnd - Date.now();
    if (wait > 2_147_000_000) return;
    const timer = setTimeout(() => gameAudio.play('cuisine-pret', { duck: 1.6 }), Math.max(0, wait));
    return () => clearTimeout(timer);
  }, [nextEnd]);

  return null;
}
