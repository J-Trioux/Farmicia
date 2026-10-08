'use client';
/**
 * Cuisine de Rosalie : ce que partagent la page Atelier du carnet
 * (components/notebook/atelier-page.tsx) et le reste du jeu.
 *
 * 0.17.5 : la cuisine avait sa propre fenêtre. 0.24 : elle revient dans le
 * carnet, sur une seule page (maquette 10-atelier de ChatGPT) : fourneaux sur
 * le bandeau, recettes en liste paginée, détail à côté.
 */
import { type Errand } from '@/components/farm/farm-map';
import { ContextualPixelIcon as PixelIcon } from '@/components/notebook/carnet-icon';
import { CarnetProgress } from '@/components/notebook/carnet-progress';
import {
  defaultIngredients,
  duration,
  henFeed,
  ingredientKeys,
  recipeLock,
  stoveJobs,
  validIngredients,
  type ActionArgument,
  type Game,
  type Recipe,
} from '@/lib/game';

export type Dispatch = (action: string, argument?: ActionArgument) => unknown;

export const STAT_LABELS: Record<keyof Game['stats'], string> = {
  mastery: 'Maîtrise',
  precision: 'Précision',
  creativity: 'Créativité',
  regularity: 'Régularité',
  luck: 'Chance',
};
export const STAT_HINTS: Record<keyof Game['stats'], string> = {
  mastery: 'moins de plats rustiques',
  precision: 'plus de plats réussis et savoureux',
  creativity: 'plus de grands plats',
  regularity: 'moins de plats rustiques',
  luck: 'plus de chefs-d’œuvre',
};
/** Amélioration qui ajoute chaque fourneau (le premier vient avec l’atelier). */
export const STOVE_UPGRADES = [null, 'stove2', 'stove3'] as const;

/** Fourneaux libres, recettes déjà en route déduites. */
export function kitchenSlots(game: Game, errands: Errand[]) {
  const free = stoveJobs(game).filter((job) => !job).length;
  const heading = errands.filter((errand) => errand.action === 'craft').length;
  return { heading, freeSlots: Math.max(0, free - heading) };
}

/** Ce que la recette demande, ce qui est en stock, ce qui manque (par portion). */
export function recipeState(g: Game, r: Recipe) {
  const lock = recipeLock(g, r);
  const keys = defaultIngredients(g, r);
  const needs = Object.entries(r.needs).map(([id, need]) => {
    const owned = ingredientKeys(g, id).reduce((sum, key) => sum + (g.stock[key] || 0), 0);
    return { id, need, owned };
  });
  const one = !lock && validIngredients(g, r, keys, 1);
  const two = one && g.upgrades.includes('marmite') && validIngredients(g, r, keys, 2);
  // Recette d’un niveau à venir : en ombre, sans nom (pas de spoil).
  const mystery = lock.startsWith('Niveau');
  return { lock, keys, needs, one, two, mystery };
}

/** Talents de cuisinière : jauges et points à placer. */
export function TalentList({ game, dispatch }: { game: Game; dispatch: Dispatch }) {
  const points = game.talentPoints;
  return (
    <section className="carnet-card atelier-talents" aria-labelledby="atelier-talents-title">
      <h4 id="atelier-talents-title">
        Talents de cuisinière
        {points > 0 && <small> · {points} point{points > 1 ? 's' : ''} à placer</small>}
      </h4>
      <ul>
        {(Object.keys(STAT_LABELS) as (keyof Game['stats'])[]).map((stat) => (
          <li key={stat}>
            <span className="talent-name">{STAT_LABELS[stat]}</span>
            <CarnetProgress value={game.stats[stat]} max={20} label={`Talent : ${STAT_LABELS[stat]}`} />
            <b className="talent-value">{game.stats[stat]}</b>
            <small>{STAT_HINTS[stat]}</small>
            {points > 0 && (
              <button
                type="button"
                className="carnet-mini"
                disabled={game.stats[stat] >= 20}
                onClick={() => dispatch('talent', { stat })}
                aria-label={`Ajouter un point de talent en ${STAT_LABELS[stat]}`}
              >
                +1
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Le petit poulailler : nourrir de blé, ramasser les œufs. */
export function CoopCard({ game, now, dispatch, errands }: { game: Game; now: number; dispatch: Dispatch; errands: Errand[] }) {
  const feeding = errands.some((errand) => errand.action === 'hens');
  const hensReady = !!game.hens && game.hens <= now;
  const wheat = game.stock.ble || 0;
  return (
    <section className="carnet-card atelier-coop" data-ready={hensReady || undefined} aria-labelledby="atelier-coop-title">
      <span className="atelier-coop-art" aria-hidden="true">
        <PixelIcon id="poulailler" />
      </span>
      <div>
        <h4 id="atelier-coop-title">Le petit poulailler</h4>
        <p>
          {feeding
            ? 'Rosalie y va…'
            : game.hens
              ? hensReady
                ? 'Les œufs sont prêts à ramasser.'
                : `Les poules pondent : œufs dans ${duration((game.hens - now) / 1000)}.`
              : `${henFeed(game)} blés donnent 4 œufs. Blé dans le panier : ${wheat}.`}
        </p>
      </div>
      <button
        type="button"
        className="carnet-action"
        disabled={feeding || (game.hens !== null ? game.hens > now : wheat < henFeed(game))}
        onClick={() => dispatch('hens')}
      >
        <PixelIcon id={game.hens ? 'oeuf' : 'ble'} />
        {game.hens ? 'Ramasser les œufs' : 'Nourrir les poules'}
      </button>
    </section>
  );
}
