/** Shared source of truth for motion across DOM, canvas and action queue. */
export function reduceMotionFor(systemReduced: boolean, settings: { reduceMotion: boolean; forceAnimations: boolean }) {
  return settings.reduceMotion || (systemReduced && !settings.forceAnimations);
}
