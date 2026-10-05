'use client';
/** Extrait de app/page.tsx (0.11.1), à comportement identique. */
import { PixelIcon } from '@/components/farm/sprites';
import { CROPS, OUTCOMES, RECIPES, type Game } from '@/lib/game';

export function CollectionPanel({ game }: { game: Game }) {
  return (
    <div>
      <div className="collection-stats">
        <span>
          <b>{game.harvests}</b> récoltes
        </span>
        <span>
          <b>{game.sold}</b> pièces vendues
        </span>
        <span>
          <b>{game.orders}</b> commandes
        </span>
        <span>
          <b>{game.crafted}</b> plats
        </span>
      </div>
      <div className="collection-grid">
        {CROPS.map((item) => (
          <article key={item.id}>
            <PixelIcon id={item.id} />
            <b>{item.name}</b>
            <small>{game.collection[item.id] || 0} récoltés</small>
            {(game.exceptional[item.id] || 0) > 0 && (
              <small className="collection-exceptional">
                ★ {game.exceptional[item.id]} exceptionnelle
                {game.exceptional[item.id] > 1 ? 's' : ''}
              </small>
            )}
          </article>
        ))}
      </div>
      <h3 className="collection-heading">La vitrine des plats</h3>
      <div className="collection-grid">
        {RECIPES.filter((r) => !r.parent).map((r) => {
          const best = game.dishBest[r.id];
          return (
            <article key={r.id} data-empty={best === undefined || undefined}>
              <PixelIcon id={r.id} />
              <b>{r.name}</b>
              <small>
                {best === undefined
                  ? 'Pas encore cuisiné'
                  : `Meilleur : ${OUTCOMES[best].name}`}
              </small>
            </article>
          );
        })}
      </div>
    </div>
  );
}
