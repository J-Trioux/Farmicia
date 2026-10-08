'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { RosalieSprite } from '@/components/farm/sprites';
import {
  ATELIER_ROSALIE_CAPTIONS,
  atelierRosalieBeat,
  atelierRosalieMood,
  atelierRosalieReaction,
  atelierRosalieStill,
  type AtelierRosalieBeat,
  type AtelierRosalieContext,
} from '@/lib/atelier-rosalie';

export type AtelierRosalieProps = AtelierRosalieContext & { reduced: boolean };

function watchVisibility(listener: () => void) {
  document.addEventListener('visibilitychange', listener);
  return () => document.removeEventListener('visibilitychange', listener);
}

/** Petites séquences de cuisine, interrompues immédiatement par une vraie action. */
export function AtelierRosalie({ cookingCount, readyCount, arriving, collecting, reduced, launchToken }: AtelierRosalieProps) {
  const context = { cookingCount, readyCount, arriving, collecting, launchToken };
  const previous = useRef<AtelierRosalieContext | null>(null);
  const [pose, setPose] = useState(() => ({ ...atelierRosalieBeat(context, 0), serial: 0 }));
  const hidden = useSyncExternalStore(watchVisibility, () => document.hidden, () => false);
  const mood = atelierRosalieMood(context);

  useEffect(() => {
    const current = { cookingCount, readyCount, arriving, collecting, launchToken };
    const reaction = atelierRosalieReaction(previous.current, current);
    previous.current = current;
    if (reduced) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    let deadline = 0;
    let remaining = 0;
    let index = 0;
    let disposed = false;

    const schedule = () => {
      if (disposed || document.hidden) return;
      deadline = performance.now() + remaining;
      timer = setTimeout(() => {
        timer = undefined;
        play(atelierRosalieBeat(current, index++));
      }, remaining);
    };

    const play = (next: AtelierRosalieBeat) => {
      if (disposed) return;
      setPose((old) => ({ ...next, serial: old.serial + 1 }));
      remaining = next.duration;
      schedule();
    };

    const visibility = () => {
      if (document.hidden) {
        if (timer !== undefined) {
          clearTimeout(timer);
          timer = undefined;
          remaining = Math.max(0, deadline - performance.now());
        }
      } else {
        schedule();
      }
    };

    document.addEventListener('visibilitychange', visibility);
    play(atelierRosalieBeat(current, reaction ? 0 : index++, reaction));
    return () => {
      disposed = true;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', visibility);
    };
    // Le tick de progression du parent ne redémarre pas les séquences.
  }, [cookingCount, readyCount, arriving, collecting, reduced, launchToken]);

  const action = reduced ? atelierRosalieStill(context) : pose.action;
  return (
    <div className="atelier-stage-rosalie" data-action={action} data-mood={mood} aria-hidden="true">
      <span className="atelier-stage-actor">
        <RosalieSprite key={pose.serial} action={action} reduced={reduced || hidden} repeat={!reduced && pose.repeat} />
      </span>
      <span className="atelier-rosalie-caption">{ATELIER_ROSALIE_CAPTIONS[mood]}</span>
    </div>
  );
}
