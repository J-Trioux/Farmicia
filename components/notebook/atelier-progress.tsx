'use client';

import { useEffect, useRef } from 'react';
import { cookingSnapshot, type CookingSnapshot } from '@/lib/atelier-cooking';

export type AtelierProgressProps = {
  start?: number;
  end: number;
  now: number;
  label: string;
  reduced: boolean;
  /** Legacy jobs only: explicit nominal milliseconds, never a replacement deadline. */
  fallbackDurationMs?: number;
};

function remainingText(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const secondPart = String(seconds % 60).padStart(2, '0');
  if (minutes >= 60) return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}:${secondPart}`;
  return `${String(minutes).padStart(2, '0')}:${secondPart}`;
}

function accessibleText(snapshot: CookingSnapshot) {
  if (snapshot.done) return '100 %, cuisson terminée';
  if (snapshot.timingSource === 'invalid') return 'Horodatage de cuisson indisponible';
  const elapsed = snapshot.durationMs === null ? 'Durée totale inconnue' : `${snapshot.timingSource === 'fallback-duration' ? 'Estimation : ' : ''}${Math.floor(snapshot.progress * 100)} %`;
  return `${elapsed}, ${snapshot.remainingSeconds} seconde${snapshot.remainingSeconds === 1 ? '' : 's'} restante${snapshot.remainingSeconds === 1 ? '' : 's'}`;
}

function percentageText(snapshot: CookingSnapshot) {
  if (snapshot.done) return '100%';
  if (snapshot.durationMs === null) return '—';
  return `${snapshot.timingSource === 'fallback-duration' ? '≈' : ''}${Math.floor(snapshot.progress * 100)}%`;
}

/** Only the fill and its readout update; no game state or frame-by-frame React renders. */
export function AtelierProgress({ start, end, now, label, reduced, fallbackDurationMs }: AtelierProgressProps) {
  const initial = cookingSnapshot({ start, end }, now, fallbackDurationMs);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const progressRef = useRef<HTMLProgressElement>(null);
  const fillRef = useRef<HTMLElement>(null);
  const percentageRef = useRef<HTMLElement>(null);
  const timeRef = useRef<HTMLTimeElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current, progress = progressRef.current, fill = fillRef.current;
    const percentage = percentageRef.current, time = timeRef.current;
    if (!wrapper || !progress || !fill || !percentage || !time) return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    let timer: number | undefined;
    let frame: number | undefined;
    let animation: Animation | undefined;

    const stop = () => {
      if (timer !== undefined) window.clearTimeout(timer);
      if (frame !== undefined) window.cancelAnimationFrame(frame);
      animation?.cancel();
      timer = undefined;
      frame = undefined;
      animation = undefined;
    };

    const paint = () => {
      stop();
      const currentTime = Date.now();
      const snapshot = cookingSnapshot({ start, end }, currentTime, fallbackDurationMs);
      const still = reduced || media.matches;
      wrapper.dataset.phase = snapshot.phase;
      wrapper.dataset.timingSource = snapshot.timingSource;
      if (still) wrapper.dataset.reduced = 'true';
      else delete wrapper.dataset.reduced;
      fill.style.transform = `scaleX(${snapshot.progress})`;
      if (snapshot.durationMs !== null || snapshot.done) progress.value = snapshot.progress;
      else progress.removeAttribute('value');
      progress.setAttribute('aria-valuetext', accessibleText(snapshot));
      percentage.textContent = percentageText(snapshot);
      time.textContent = snapshot.timingSource === 'invalid' ? '—:—' : remainingText(snapshot.remainingSeconds);
      if (snapshot.timingSource === 'invalid') time.removeAttribute('datetime');
      else time.dateTime = `PT${snapshot.remainingSeconds}S`;

      if (document.hidden || snapshot.done || snapshot.timingSource === 'invalid') return;
      if (!still && snapshot.durationMs !== null && snapshot.effectiveStart !== null) {
        const delay = Math.max(0, snapshot.effectiveStart - currentTime);
        if (typeof fill.animate === 'function') {
          // Begin at the current fraction; mounting halfway through never replays from zero.
          animation = fill.animate(
            [{ transform: `scaleX(${snapshot.progress})` }, { transform: 'scaleX(1)' }],
            { duration: delay ? snapshot.durationMs : snapshot.remainingMs, delay, easing: 'linear', fill: 'forwards' },
          );
        } else {
          // Local DOM fallback for browsers without WAAPI; React and the game remain idle.
          const advance = () => {
            const current = cookingSnapshot({ start, end }, Date.now(), fallbackDurationMs);
            fill.style.transform = `scaleX(${current.progress})`;
            if (current.done) paint();
            else frame = window.requestAnimationFrame(advance);
          };
          frame = window.requestAnimationFrame(advance);
        }
      }
      // ceil(remainingMs / 1000) changes on the deadline's second boundaries,
      // rather than on an arbitrary interval anchored to component mount time.
      const untilNextSecond = snapshot.remainingMs % 1000 || 1000;
      timer = window.setTimeout(paint, Math.min(1000, untilNextSecond) + 1);
    };

    const visibilityChanged = () => {
      stop();
      if (!document.hidden) paint();
    };
    paint();
    document.addEventListener('visibilitychange', visibilityChanged);
    media.addEventListener('change', paint);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', visibilityChanged);
      media.removeEventListener('change', paint);
    };
  }, [start, end, now, reduced, fallbackDurationMs]);

  return (
    <span
      ref={wrapperRef}
      className="atelier-live-progress"
      data-phase={initial.phase}
      data-timing-source={initial.timingSource}
      data-reduced={reduced || undefined}
    >
      <progress ref={progressRef} className="sr-only" value={initial.durationMs !== null || initial.done ? initial.progress : undefined} max={1} aria-label={label} aria-valuetext={accessibleText(initial)} />
      <span className="atelier-live-track" aria-hidden="true">
        <i ref={fillRef} className="atelier-live-fill" style={{ width: '100%', transformOrigin: 'left center', transform: `scaleX(${initial.progress})`, transition: 'none' }} />
      </span>
      <span className="atelier-live-readout" aria-hidden="true">
        <b ref={percentageRef}>{percentageText(initial)}</b>
        <time ref={timeRef} dateTime={initial.timingSource === 'invalid' ? undefined : `PT${initial.remainingSeconds}S`}>{initial.timingSource === 'invalid' ? '—:—' : remainingText(initial.remainingSeconds)}</time>
      </span>
    </span>
  );
}
