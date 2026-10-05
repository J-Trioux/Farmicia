'use client';
import { useEffect, useRef, useState } from 'react';

/**
 * Nombre qui défile jusqu’à sa nouvelle valeur (0.5.5). Seul le composant qui
 * l’utilise se redessine pendant le défilement ; sans animation si le
 * mouvement est réduit.
 */
export function useRollingNumber(value: number, reduced: boolean, ms = 650) {
  const [shown, setShown] = useState(value);
  const shownRef = useRef(value);
  useEffect(() => {
    const from = shownRef.current;
    if (from === value) return;
    if (reduced) {
      shownRef.current = value;
      const timer = setTimeout(() => setShown(value), 0);
      return () => clearTimeout(timer);
    }
    const started = performance.now();
    const handle = { frame: 0 };
    const step = (time: number) => {
      const t = Math.min(1, (time - started) / ms);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = Math.round(from + (value - from) * eased);
      shownRef.current = next;
      setShown(next);
      if (t < 1) handle.frame = requestAnimationFrame(step);
    };
    handle.frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(handle.frame);
  }, [value, reduced, ms]);
  return shown;
}
