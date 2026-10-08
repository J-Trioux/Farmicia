'use client';
/**
 * 0.25 — Page Commandes du carnet (maquette 02-commandes de ChatGPT).
 *
 * Bandeau du marché ; onglets Récoltes, Paniers, Cuisine ; à gauche les offres
 * (paginées), à droite l’offre choisie : produits demandés (possédés/requis),
 * récompenses, état et l’action « Livrer cette offre ». En bas de la fiche, le
 * coup de cœur du marché. Mêmes offres, mêmes règles qu’avant (lib/game) ;
 * une qualité supérieure n’est jamais livrée sans confirmation.
 */
import { useState } from 'react';
import { frenchText } from '@/lib/typography';
import { type AskConfirm } from '@/components/game-confirm';
import { CarnetBanner, CarnetPager, CarnetRewards, CarnetTabs } from '@/components/notebook/carnet';
import { CarnetIcon as PixelIcon } from '@/components/notebook/carnet-icon';
import { CarnetPortrait as VillagerPortrait } from '@/components/notebook/carnet-portrait';
import { CROPS, VILLAGERS, buffActive, duration, itemLabel, marketEvent, nextMarketEvent, orderBoard, orderAvailable, orderReadyAt, orderReward, planMenu, satisfiesQuality, dishCourse, outcomeRank, dishParts, projectStatus, type MenuLine, type ActionArgument, type Game, type OrderKind } from '@/lib/game';
import { useGameClock } from '@/hooks/use-game-clock';
import { Glyph } from '@/components/glyph';

const PER_PAGE = 4;
const CATEGORIES = [
  { id: 'harvest', label: 'Récoltes', icon: 'cagette', kinds: ['simple', 'personal', 'signature'] },
  { id: 'baskets', label: 'Paniers', icon: 'marche', kinds: ['market'] },
  { id: 'kitchen', label: 'Cuisine', icon: 'casserole', kinds: ['dish', 'baker', 'grand', 'prestige'] },
] as const;
type Category = (typeof CATEGORIES)[number]['id'];
const KIND_LABEL: Record<OrderKind, string> = {
  personal: 'Pour un voisin',
  simple: 'Récoltes',
  dish: 'Cuisine',
  baker: 'Cuisine',
  grand: 'Grand contrat',
  prestige: 'Grand contrat',
  signature: 'Spécialité du village',
  market: 'Panier assorti',
};

function ownedForLine(game: Game, line: MenuLine) {
  if (line.kind === 'item')
    return {
      owned: Math.min(line.amount, Object.entries(game.stock)
        .filter(([id, quantity]) => quantity > 0 && satisfiesQuality(id, line.item))
        .reduce((sum, [, quantity]) => sum + quantity, 0)),
      required: line.amount,
    };
  if (line.kind === 'course')
    return {
      owned: Object.entries(game.stock).some(([id, quantity]) =>
        quantity > 0 && dishCourse(id) === line.course &&
        outcomeRank(dishParts(id).qualityId) >= outcomeRank(line.minOutcome)) ? 1 : 0,
      required: 1,
    };
  // 0.11 : une culture compte quand elle a assez d’unités pour le panier.
  return {
    owned: Math.min(line.count, CROPS.filter((crop) =>
      Object.entries(game.stock).reduce((sum, [id, quantity]) =>
        sum + (quantity > 0 && id.split('|')[0] === crop.id ? quantity : 0), 0) >= (line.each || 1)).length),
    required: line.count,
  };
}
function orderLineName(game: Game, line: MenuLine) {
  if (line.kind === 'item') return itemLabel(game, line.item);
  if (line.kind === 'course') return line.course === 'entree' ? 'Entrée cuisinée'
    : line.course === 'plat' ? 'Plat cuisiné' : 'Dessert cuisiné';
  return line.each && line.each > 1 ? `Cultures différentes · ${line.each} de chaque` : 'Cultures différentes';
}
function lineIcon(line: MenuLine) {
  if (line.kind === 'item') return line.item.split('|')[0];
  if (line.kind === 'course') return line.course === 'entree' ? 'sauce' : line.course === 'plat' ? 'pain' : 'tarte';
  return 'cagette';
}
/** Portrait du demandeur : le voisin nommé dans l’offre (« Marcel, le maraîcher »). */
function personIndex(person: string, villagerId?: string) {
  const name = person.split(',')[0].trim();
  const index = VILLAGERS.findIndex((v) => v.id === villagerId || v.name === name);
  return index >= 0 ? index + 1 : 0;
}

export function OrdersPanel({
  game, now: snapshotNow, dispatch, askConfirm,
}: {
  game: Game;
  now: number;
  dispatch: (action: string, argument?: ActionArgument) => unknown;
  askConfirm: AskConfirm;
}) {
  const now = useGameClock() || snapshotNow;
  const offers = orderBoard(game).map((request) => {
    const plan = planMenu(game.stock, request.lines);
    const waiting = !orderAvailable(game, request.slot, now);
    return { request, plan, waiting, ready: plan.possible && !waiting };
  });
  const inCategory = (id: Category) => offers.filter((offer) => (CATEGORIES.find((c) => c.id === id)!.kinds as readonly string[]).includes(offer.request.kind));
  const firstReady = CATEGORIES.find((c) => inCategory(c.id).some((offer) => offer.ready))?.id;
  const [category, setCategory] = useState<Category | null>(null);
  const shownCategory: Category = category && inCategory(category).length ? category : firstReady || CATEGORIES.find((c) => inCategory(c.id).length)?.id || 'harvest';
  const [chosen, setChosen] = useState<number | null>(null);
  const [pageIndex, setPageIndex] = useState<Record<string, number>>({});
  const list = inCategory(shownCategory).sort((a, b) => Number(b.ready) - Number(a.ready) || a.request.slot - b.request.slot);
  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  const page = Math.min(pageIndex[shownCategory] || 0, pages - 1);
  const selected = list.find((offer) => offer.request.slot === chosen) || list[0];
  const event = marketEvent(game, now);
  const next = nextMarketEvent(game, now);
  const intuition = buffActive(game, 'intuition', now);
  const project = projectStatus(game);

  return (
    <div className="carnet-stack orders-page">
      <CarnetBanner id="commandes" />
      <CarnetTabs<Category>
        label="Familles de commandes"
        value={shownCategory}
        onChange={(id) => {
          setCategory(id);
          setChosen(null);
        }}
        items={CATEGORIES.map((c) => ({
          id: c.id,
          label: c.label,
          icon: c.icon,
          count: inCategory(c.id).filter((offer) => offer.ready).length,
          hidden: !inCategory(c.id).length,
        }))}
      />
      <div className="carnet-split">
        <div className="carnet-list-column">
          <ul className="carnet-list" aria-label="Offres du village">
            {list.slice(page * PER_PAGE, (page + 1) * PER_PAGE).map(({ request, ready, waiting }) => (
              <li key={request.slot}>
                <button
                  type="button"
                  className="carnet-row order-row"
                  data-state={ready ? 'ready' : waiting ? 'waiting' : 'missing'}
                  aria-pressed={selected?.request.slot === request.slot}
                  onClick={() => setChosen(request.slot)}
                >
                  <span className="carnet-row-art carnet-row-portrait" aria-hidden="true">
                    <VillagerPortrait index={personIndex(request.person, request.villagerId)} />
                  </span>
                  <span className="carnet-row-label">
                    <b>{request.title}</b>
                    <small>{request.person}</small>
                  </span>
                  {ready ? (
                    <span className="carnet-chip" data-tone="ok">Prête</span>
                  ) : waiting ? (
                    <span className="carnet-chip" data-tone="muted">
                      <PixelIcon id="horloge" className="inline-icon" /> {duration(Math.ceil((orderReadyAt(game, request.slot) - now) / 1000))}
                    </span>
                  ) : (
                    <span className="carnet-chip" data-tone="warn">À compléter</span>
                  )}
                </button>
              </li>
            ))}
            {!list.length && <li className="carnet-list-empty">Aucune offre dans cette famille pour l’instant.</li>}
          </ul>
          <CarnetPager page={page} pages={pages} label="Pages des offres" onPage={(n) => setPageIndex({ ...pageIndex, [shownCategory]: n })} />
            <p className="carnet-band carnet-band-info orders-market">
              <PixelIcon id="marche" />
              <span>
                <b>Coup de cœur du marché : {event.label}</b>
                <small>
                  +{Math.round(event.bonus * 100)}{' '}% à la vente · encore {duration((event.end - now) / 1000)}
                  {intuition ? ` · ensuite : ${next.label}` : ''}
                </small>
              </span>
            </p>
        </div>
        {selected && (() => {
          const { request, plan, waiting } = selected;
          const reward = plan.possible ? orderReward(game, request, plan, now) : request.reward;
          const steps = request.lines.map((line) => ownedForLine(game, line));
          const wait = waiting ? duration(Math.ceil((orderReadyAt(game, request.slot) - now) / 1000)) : '';
          const helpsProject = project?.step.kind === 'deliver' &&
            request.lines.some((line) => line.kind === 'item' && project.step.kind === 'deliver' &&
              project.step.lines.some((needed) => needed.kind === 'item' && needed.item.split('|')[0] === line.item.split('|')[0]));
          return (
            <article className="carnet-detail order-detail" aria-labelledby={`order-${request.slot}`}>
              <header className="carnet-detail-head">
                <span className="carnet-detail-art carnet-detail-portrait" aria-hidden="true">
                  <VillagerPortrait index={personIndex(request.person, request.villagerId)} />
                </span>
                <div>
                  <h4 id={`order-${request.slot}`}>{request.title}</h4>
                  <p className="carnet-detail-sub">{KIND_LABEL[request.kind]} · {request.person}</p>
                </div>
              </header>
              <h5 className="carnet-rule">Produits demandés</h5>
              <ul className="carnet-needs">
                {request.lines.map((line, index) => {
                  const ok = steps[index].owned >= steps[index].required;
                  return (
                    <li key={index} data-ready={ok || undefined}>
                      <PixelIcon id={lineIcon(line)} />
                      <span>
                        {orderLineName(game, line)}
                        {line.kind === 'item' && line.item.includes('|') && <small> · qualité minimale : {line.item.split('|')[1]}</small>}
                      </span>
                      <b>
                        {steps[index].owned}
                        {' '}/{' '}
                        {steps[index].required}
                      </b>
                      {ok && <Glyph id="coche" label="réuni" />}
                    </li>
                  );
                })}
              </ul>
              <h5 className="carnet-rule">Récompenses</h5>
              <CarnetRewards
                coins={reward}
                xp={request.xp}
                extra={[
                  ...(request.villagerId ? [{ icon: 'lettre', label: '+ amitié' }] : []),
                  ...(request.kind === 'signature' ? [{ icon: 'plan', label: 'Projet' }] : []),
                ]}
              />
              {request.note && <p className="carnet-note">{request.note}</p>}
              {helpsProject && <p className="carnet-note carnet-note-ok">Produit utile au projet en cours.</p>}
              <p className="carnet-status" data-tone={waiting ? 'muted' : plan.possible ? 'ok' : 'warn'} aria-live="polite">
                {waiting
                  ? frenchText(`${request.person.split(',')[0]} prépare cette commande : prête dans ${wait}.`)
                  : plan.possible
                    ? 'Cette commande est prête.'
                    : 'Encore quelques produits à réunir dans le panier.'}
              </p>
              <div className="carnet-detail-actions">
                <button
                  type="button"
                  className="carnet-primary order-deliver"
                  disabled={!plan.possible || waiting}
                  onClick={() => {
                    const submit = () => dispatch('order', { slot: request.slot, confirmSuperior: plan.usesSuperior });
                    if (plan.usesSuperior) askConfirm({
                      title: 'Livrer une qualité supérieure ?',
                      description: 'Cette offre accepte une qualité plus simple. Vérifiez les produits choisis avant de confirmer.',
                      items: Object.entries(plan.used).map(([id, amount]) => `${amount} × ${itemLabel(game, id)}`),
                      confirmLabel: 'Livrer cette offre',
                    }, submit);
                    else submit();
                  }}
                >
                  <PixelIcon id="cagette" />
                  {waiting ? 'Prête dans ' + wait : plan.possible ? 'Livrer cette offre' : 'À compléter'}
                </button>
              </div>
            </article>
          );
        })()}
      </div>
    </div>
  );
}
