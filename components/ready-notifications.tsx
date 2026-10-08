'use client';
/**
 * 0.33.0 — Notifications du navigateur (réglage « Me prévenir quand c’est prêt »).
 *
 * Seulement quand l’onglet du jeu est en arrière-plan : une notification
 * quand des récoltes sont prêtes, que les poules ont pondu, qu’un plat est
 * cuit, que le verger a donné ou que la caravane est rentrée. Les évènements
 * proches sont regroupés en une seule notification, qui remplace la précédente.
 */
import { useEffect, useRef } from 'react';
import type { Game } from '@/lib/game';
import { readyEvents, readyText } from '@/lib/ready';

/** Demande la permission (à appeler sur un clic). */
export async function askNotificationPermission() {
  if (typeof Notification === 'undefined') return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  return (await Notification.requestPermission()) === 'granted';
}

/** Regroupement : la notification part une demi-minute après le premier évènement, avec ceux arrivés entre-temps. */
const GROUP_MS = 60_000;

export function useReadyNotifications(game: Game, enabled: boolean) {
  const latest = useRef(game);
  useEffect(() => {
    latest.current = game;
  }, [game]);
  useEffect(() => {
    if (!enabled || typeof document === 'undefined' || typeof Notification === 'undefined') return;
    let timer = 0;
    let since = Date.now();
    const schedule = () => {
      window.clearTimeout(timer);
      if (!document.hidden) {
        since = Date.now();
        return;
      }
      if (Notification.permission !== 'granted') return;
      const now = Date.now();
      const next = readyEvents(latest.current).filter((e) => e.at > now).sort((a, b) => a.at - b.at)[0];
      if (!next) return;
      timer = window.setTimeout(() => {
        const at = Date.now();
        if (document.hidden) {
          const due = readyEvents(latest.current).filter((e) => e.at > since && e.at <= at);
          if (due.length) {
            const note = new Notification('Farmicia', { body: readyText(due), icon: '/favicon.svg', tag: 'farmicia-pret' });
            note.onclick = () => {
              window.focus();
              note.close();
            };
            since = Math.max(...due.map((e) => e.at));
          }
        }
        schedule();
      }, Math.min(2_147_000_000, Math.max(1000, next.at - now + GROUP_MS / 2)));
    };
    document.addEventListener('visibilitychange', schedule);
    schedule();
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', schedule);
    };
  }, [enabled]);
}
