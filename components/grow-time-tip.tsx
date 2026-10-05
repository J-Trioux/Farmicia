'use client';

import { useId, type ReactNode } from 'react';
import { growTimeTooltip } from '@/lib/farm-ui';
import type { Game } from '@/lib/game';

/**
 * Temps de pousse avec le détail des modificateurs. L’info-bulle s’affiche au
 * survol, au focus clavier et au toucher (le bouton reçoit alors le focus).
 */
export function GrowTimeTip({
  game,
  cropId,
  now,
  children,
}: {
  game: Game;
  cropId: string;
  now: number;
  children: ReactNode;
}) {
  const id = useId();
  const lines = growTimeTooltip(game, cropId, now);
  return (
    <span className="grow-time">
      <button type="button" className="grow-time-trigger" aria-describedby={id}>
        {children}
        <span className="grow-time-info" aria-hidden="true">
          i
        </span>
      </button>
      <span role="tooltip" id={id} className="grow-time-tip">
        {lines.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </span>
    </span>
  );
}
