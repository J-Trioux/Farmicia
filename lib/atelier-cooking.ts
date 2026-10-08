export type CookingPhase = 'preparation' | 'doux' | 'dore' | 'ready';
export type CookingTimingSource = 'timestamps' | 'fallback-duration' | 'end-only' | 'invalid';

export type CookingSnapshot = {
  progress: number;
  remainingMs: number;
  remainingSeconds: number;
  done: boolean;
  phase: CookingPhase;
  /** A fallback is a display estimate, never a change to the game's deadline. */
  timingSource: CookingTimingSource;
  effectiveStart: number | null;
  durationMs: number | null;
};

/** CookJob timestamps are milliseconds; cookTime() must be converted from seconds by its caller. */
export function cookingSnapshot(
  job: { start?: number; end: number },
  now: number,
  fallbackDurationMs?: number,
): CookingSnapshot {
  const invalid: CookingSnapshot = {
    progress: 0, remainingMs: 0, remainingSeconds: 0, done: false,
    phase: 'preparation', timingSource: 'invalid', effectiveStart: null, durationMs: null,
  };
  if (!Number.isFinite(job.end) || !Number.isFinite(now)) return invalid;
  const difference = job.end - now;
  if (!Number.isFinite(difference)) return invalid;
  const remainingMs = Math.max(0, difference);
  const done = now >= job.end;
  let timingSource: CookingTimingSource = 'end-only';
  let effectiveStart: number | null = null;
  let durationMs: number | null = null;
  if (job.start !== undefined && Number.isFinite(job.start) && job.end > job.start && Number.isFinite(job.end - job.start)) {
    timingSource = 'timestamps';
    effectiveStart = job.start;
    durationMs = job.end - job.start;
  } else if (fallbackDurationMs !== undefined && Number.isFinite(fallbackDurationMs) && fallbackDurationMs > 0 && Number.isFinite(job.end - fallbackDurationMs)) {
    timingSource = 'fallback-duration';
    effectiveStart = job.end - fallbackDurationMs;
    durationMs = fallbackDurationMs;
  }
  // Without a valid start or explicit nominal duration, show the actual remaining time;
  // no invented elapsed percentage is assigned to a legacy job.
  const fraction = durationMs === null ? 0 : 1 - remainingMs / durationMs;
  const progress = done ? 1 : Math.max(0, Math.min(1, fraction));
  return {
    progress, remainingMs, remainingSeconds: Math.ceil(remainingMs / 1000), done,
    phase: done ? 'ready' : progress < 0.25 ? 'preparation' : progress < 0.8 ? 'doux' : 'dore',
    timingSource, effectiveStart, durationMs,
  };
}
