'use client';
/**
 * Extrait de app/page.tsx (0.11.1). 0.17.5 : la cuisine a sa propre fenêtre
 * (components/kitchen.tsx). La page Atelier du carnet n’en est plus que la
 * porte : un résumé des fourneaux et du poulailler, et un bouton pour entrer.
 */
import { DoorOpen } from 'lucide-react';
import { type Errand } from '@/components/farm/farm-map';
import { PixelIcon } from '@/components/farm/sprites';
import { kitchenSlots } from '@/components/kitchen';
import { RECIPES, UPGRADES, defaultIngredients, readyDishes, recipeLock, stoveJobs, validIngredients, type Game } from '@/lib/game';
import { useGameClock } from '@/hooks/use-game-clock';

export function WorkshopPanel({
  game,
  now: snapshotNow,
  errands,
  onEnter,
}: {
  game: Game;
  now: number;
  errands: Errand[];
  /** Ouvre la fenêtre de la cuisine. */
  onEnter: () => void;
}) {
  const now = useGameClock() || snapshotNow;
  const workshop = game.upgrades.includes('workshop');
  if (!workshop && !game.upgrades.includes('coop'))
    return (
      <div className="empty-state">
        <PixelIcon id="foundation" />
        <h3>L’emplacement attend son atelier.</h3>
        <p>Installez l’Atelier de Rosalie dans Améliorer au niveau {UPGRADES.find((u) => u.id === 'workshop')!.level}.</p>
      </div>
    );
  const jobs = stoveJobs(game);
  const ready = readyDishes(game, now);
  const cooking = jobs.filter((job) => job && job.end > now).length;
  const { freeSlots } = kitchenSlots(game, errands);
  const cookable = RECIPES.filter((r) => !recipeLock(game, r) && validIngredients(game, r, defaultIngredients(game, r))).length;
  const lines = [
    workshop && (ready ? `${ready} plat${ready > 1 ? 's' : ''} à sortir` : cooking ? `${cooking} plat${cooking > 1 ? 's' : ''} sur le feu` : 'Fourneaux libres'),
    workshop && `${freeSlots} fourneau${freeSlots > 1 ? 'x' : ''} libre${freeSlots > 1 ? 's' : ''} sur ${jobs.length}`,
    workshop && `${cookable} recette${cookable > 1 ? 's' : ''} faisable${cookable > 1 ? 's' : ''} maintenant`,
    game.upgrades.includes('coop') && (game.hens ? (game.hens <= now ? 'Les œufs sont prêts' : 'Les poules pondent') : 'Les poules attendent leur blé'),
  ].filter(Boolean) as string[];
  return (
    <div className="kitchen-entrance" data-ready={ready > 0 || undefined}>
      <span className="kitchen-entrance-art" aria-hidden="true">
        <PixelIcon id="pain" />
      </span>
      <div>
        <h3>La cuisine de Rosalie</h3>
        <ul>
          {lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
      <button type="button" className="primary-button kitchen-enter" onClick={onEnter}>
        <DoorOpen size={18} aria-hidden="true" />
        Entrer dans la cuisine
      </button>
    </div>
  );
}
