'use client';
/**
 * 0.27 — Page Collection du carnet (maquette 12-collection de ChatGPT).
 *
 * Onglets Récoltes et Plats, et les compteurs de la partie ; une grille de six
 * cartes par page : la culture et ses récoltes (et ses exceptionnelles), ou le
 * plat et son meilleur résultat. Pas de spoil : une culture ou une recette
 * d’un niveau à venir reste en ombre, sans nom.
 */
import { useState } from 'react';
import { CarnetPager, CarnetTabs } from '@/components/notebook/carnet';
import { CarnetIcon as PixelIcon } from '@/components/notebook/carnet-icon';
import { CROPS, OUTCOMES, RECIPES, level, type Game } from '@/lib/game';

type View = 'crops' | 'dishes';
const PER_PAGE = 6;
type Card = { id: string; name: string; sub: string; badge?: string; tone?: string; mystery?: number; empty?: boolean };

export function CollectionPanel({ game }: { game: Game }) {
  const [view, setView] = useState<View>('crops');
  const [pageIndex, setPageIndex] = useState<Record<string, number>>({});
  const lv = level(game);
  const crops: Card[] = CROPS.map((item) => {
    const count = game.collection[item.id] || 0;
    const exceptional = game.exceptional[item.id] || 0;
    if (!count && item.level > lv) return { id: item.id, name: '', sub: '', mystery: item.level };
    return {
      id: item.id,
      name: item.name,
      sub: `${count} récolte${count > 1 ? 's' : ''}`,
      badge: exceptional ? `${exceptional} exceptionnelle${exceptional > 1 ? 's' : ''}` : count ? 'Récoltée' : undefined,
      tone: exceptional ? 'gold' : 'ok',
      empty: !count,
    };
  });
  const dishes: Card[] = RECIPES.filter((r) => !r.parent).map((r) => {
    const best = game.dishBest[r.id];
    if (best === undefined && r.level > lv) return { id: r.id, name: '', sub: '', mystery: r.level };
    return {
      id: r.id,
      name: r.name,
      sub: best === undefined ? 'Pas encore cuisiné' : 'Meilleur résultat',
      badge: best === undefined ? undefined : OUTCOMES[best].name,
      tone: best !== undefined && best >= 2 ? 'gold' : 'ok',
      empty: best === undefined,
    };
  });
  const list = view === 'crops' ? crops : dishes;
  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  const page = Math.min(pageIndex[view] || 0, pages - 1);

  return (
    <div className="carnet-stack collection-page">
      <div className="carnet-counters carnet-counters-4">
        <span>
          <PixelIcon id="faucille" />
          <b>{game.harvests.toLocaleString('fr-FR')}</b> récoltes
        </span>
        <span>
          <PixelIcon id="commande" />
          <b>{game.orders.toLocaleString('fr-FR')}</b> commandes
        </span>
        <span>
          <PixelIcon id="casserole" />
          <b>{game.crafted.toLocaleString('fr-FR')}</b> plats
        </span>
        <span>
          <PixelIcon id="piece" />
          <b>{game.sold.toLocaleString('fr-FR')}</b> pièces vendues
        </span>
      </div>
      <CarnetTabs<View>
        label="Collection"
        value={view}
        onChange={setView}
        items={[
          { id: 'crops', label: `Récoltes · ${crops.filter((c) => !c.mystery && !c.empty).length}/${CROPS.length}`, short: 'Récoltes', icon: 'faucille' },
          { id: 'dishes', label: `Plats · ${dishes.filter((c) => !c.mystery && !c.empty).length}/${dishes.length}`, short: 'Plats', icon: 'casserole' },
        ]}
      />
      <ul className="collection-cards" aria-label={view === 'crops' ? 'Récoltes' : 'Plats'}>
        {list.slice(page * PER_PAGE, (page + 1) * PER_PAGE).map((card) => (
          <li key={card.id} className="collection-card" data-mystery={card.mystery ? true : undefined} data-empty={card.empty || undefined}>
            {card.mystery ? (
              <>
                <span className="sr-only">{view === 'crops' ? 'Culture' : 'Recette'} à découvrir au niveau {card.mystery}</span>
                <PixelIcon id={card.id} />
                <b aria-hidden="true">?</b>
                <span className="carnet-chip" data-tone="muted" aria-hidden="true">
                  <PixelIcon id="cadenas" className="inline-icon" /> Niv.{' '}{card.mystery}
                </span>
              </>
            ) : (
              <>
                <PixelIcon id={card.id} />
                <b>{card.name}</b>
                <small>{card.sub}</small>
                {card.badge ? (
                  <span className="carnet-chip" data-tone={card.tone}>
                    {card.badge}
                  </span>
                ) : (
                  <span className="carnet-chip" data-tone="muted">
                    {view === 'crops' ? 'À récolter' : 'À cuisiner'}
                  </span>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
      <CarnetPager page={page} pages={pages} label="Pages de la collection" onPage={(n) => setPageIndex({ ...pageIndex, [view]: n })} />
    </div>
  );
}
