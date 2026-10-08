/**
 * 0.33.0 — Ce qui sera prêt, et quand (notifications du navigateur,
 * components/ready-notifications.tsx).
 */
import { RECIPES, crop, stoveJobs, type Game } from './game.ts';

export type ReadyEvent = { at: number; kind: 'crop' | 'eggs' | 'dish' | 'orchard' | 'caravan'; id?: string };

/** Ce qui sera prêt, et quand. */
export function readyEvents(g: Game): ReadyEvent[] {
  const events: ReadyEvent[] = [];
  for (const plot of g.plots) if (plot) events.push({ at: plot.end, kind: 'crop', id: plot.crop });
  if (g.upgrades.includes('coop') && g.hens !== null) events.push({ at: g.hens, kind: 'eggs' });
  if (g.orchard !== null) events.push({ at: g.orchard, kind: 'orchard' });
  for (const job of stoveJobs(g)) if (job) events.push({ at: job.end, kind: 'dish', id: job.id });
  if (g.valley.trip) events.push({ at: g.valley.trip.returnAt, kind: 'caravan' });
  return events;
}

/** Texte d’une notification pour des évènements arrivés ensemble. */
export function readyText(events: ReadyEvent[]) {
  const parts: string[] = [];
  const crops = [...new Set(events.filter((e) => e.kind === 'crop').map((e) => crop(e.id || 'radis')?.name.toLowerCase()).filter(Boolean))];
  if (crops.length)
    parts.push(`${crops.length > 1 ? crops.slice(0, -1).join(', ') + ' et ' + crops.at(-1) : crops[0]} : prêt${crops.length > 1 ? 's' : ''} à récolter`);
  if (events.some((e) => e.kind === 'eggs')) parts.push('les poules ont pondu');
  for (const e of events.filter((entry) => entry.kind === 'dish')) parts.push(`${RECIPES.find((r) => r.id === e.id)?.name || 'un plat'} est cuit`);
  if (events.some((e) => e.kind === 'orchard')) parts.push('le verger a donné ses fruits');
  if (events.some((e) => e.kind === 'caravan')) parts.push('la caravane est rentrée');
  const text = parts.join(' · ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

