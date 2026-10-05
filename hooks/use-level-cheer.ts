'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * 0.20 — Avant la fenêtre d’un passage de niveau, Rosalie le fête sur la carte
 * (halo doré, zoom sur elle : components/farm/farm-map.tsx). La fête attend
 * que la carte soit visible (`mapVisible`), puis la fenêtre du niveau s’ouvre
 * quand Rosalie a fini (événement rosalie:celebrated), ou au bout de 7 s.
 *
 * Renvoie le niveau en cours de fête (0 : aucun) et de quoi en annoncer un.
 */
export function useLevelCheer(mapVisible: boolean) {
  const [cheerFor, setCheerFor] = useState(0);
  const sent = useRef(0);
  useEffect(() => {
    const done = (event: Event) => {
      const level = Number((event as CustomEvent<number>).detail);
      setCheerFor((current) => (current === level ? 0 : current));
    };
    window.addEventListener('rosalie:celebrated', done);
    return () => window.removeEventListener('rosalie:celebrated', done);
  }, []);
  useEffect(() => {
    if (!cheerFor || !mapVisible || sent.current === cheerFor) return;
    sent.current = cheerFor;
    const level = cheerFor;
    window.dispatchEvent(new CustomEvent('rosalie:levelup', { detail: level }));
    // Sécurité : si la carte ne répond pas, la fenêtre du niveau s’ouvre quand même.
    window.setTimeout(() => setCheerFor((current) => (current === level ? 0 : current)), 7000);
  }, [cheerFor, mapVisible]);
  const announce = useCallback((levels: number[]) => setCheerFor(Math.max(...levels)), []);
  return [cheerFor, announce] as const;
}
