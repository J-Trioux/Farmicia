'use client';
/**
 * 0.32 — Rosalie dans la reliure : dans la place libre sous les chapitres, elle
 * respire et, de temps en temps, joue une de ses petites animations de repos
 * (0.23). Décor seulement : ni clic ni lecture d’écran. Masquée quand les
 * chapitres dépliés prennent la place (requête de conteneur, app/carnet032.css).
 */
import { useEffect, useState } from 'react';
import { RosalieSprite } from '@/components/farm/sprites';
import { clipDuration, rosalieClip, type RosalieAction } from '@/lib/rosalie-anim';

/** Les repos qui vont en toute saison (« froid » reste à l’hiver de la ferme). */
const CALM: RosalieAction[] = ['repos-cheveux', 'repos-un-pied', 'repos-etirement', 'repos-chapeau', 'repos-fredonne', 'repos-baille'];

export function SpineRosalie() {
  const [reduced] = useState(() => typeof document !== 'undefined' && document.documentElement.hasAttribute('data-reduce-motion'));
  const [action, setAction] = useState<RosalieAction>('idle');
  useEffect(() => {
    if (reduced) return;
    let timer = window.setTimeout(function next() {
      if (action === 'idle') {
        const pick = CALM[Math.floor(Math.random() * CALM.length)];
        setAction(pick);
      } else {
        setAction('idle');
      }
      timer = 0;
    }, action === 'idle' ? 9000 + Math.random() * 9000 : clipDuration(rosalieClip(action)) + 200);
    return () => window.clearTimeout(timer);
  }, [action, reduced]);
  return (
    <div className="carnet-spine-rosalie" aria-hidden="true">
      <span className="carnet-spine-rosalie-box">
        <RosalieSprite action={action} reduced={reduced} repeat={action === 'idle'} />
      </span>
      <i className="carnet-effect carnet-effect-butterfly" />
    </div>
  );
}
