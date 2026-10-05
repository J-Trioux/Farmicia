'use client';
/** Extrait de app/page.tsx (0.11.1), à comportement identique. */
import { frenchText } from '@/lib/typography';
import { type AskConfirm } from '@/components/game-confirm';
import { PixelIcon } from '@/components/farm/sprites';
import { CROPS, buffActive, duration, itemLabel, marketEvent, nextMarketEvent, orderBoard, orderAvailable, orderReadyAt, orderReward, planMenu, satisfiesQuality, dishCourse, outcomeRank, dishParts, projectStatus, type MenuLine, type ActionArgument, type Game } from '@/lib/game';
import { useGameClock } from '@/hooks/use-game-clock';

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
export function OrdersPanel({
  game, now: snapshotNow, dispatch, askConfirm,
}: {
  game: Game;
  now: number;
  dispatch: (action: string, argument?: ActionArgument) => unknown;
  askConfirm: AskConfirm;
}) {
  const now = useGameClock() || snapshotNow;
  const offers = orderBoard(game);
  const event = marketEvent(game, now);
  const next = nextMarketEvent(game, now);
  const intuition = buffActive(game, 'intuition', now);
  const project = projectStatus(game);
  return (
    <section className="village-board" aria-label="Panneau des commandes du village">
      <header className="village-board-heading">
        <span className="board-pin" aria-hidden="true">✦</span>
        <div>
          <small>Place du village</small>
          <h3>Le panneau des commandes</h3>
          <p>{offers.length} offre{offers.length > 1 ? 's' : ''} sans échéance. Après une livraison, chaque place propose une nouvelle offre un peu plus tard.</p>
        </div>
      </header>
      <div className="village-offers">
        {offers.map((request) => {
          const plan = planMenu(game.stock, request.lines);
          const reward = plan.possible ? orderReward(game, request, plan, now) : request.reward;
          const steps = request.lines.map((line) => ownedForLine(game, line));
          // 0.11 : après une livraison, la place attend un peu avant l’offre suivante.
          const waiting = !orderAvailable(game, request.slot, now);
          const wait = waiting ? duration(Math.ceil((orderReadyAt(game, request.slot) - now) / 1000)) : '';
          return (
            <article className={'village-offer offer-' + request.kind + (waiting ? ' offer-waiting' : '')} key={request.slot}>
              <header>
                <span className="offer-number">N° {request.slot + 1}</span>
                <div>
                  <small>{request.kind === 'personal' ? 'Pour un voisin' : request.kind === 'simple' ? 'Récoltes'
                    : request.kind === 'dish' || request.kind === 'baker' ? 'Cuisine'
                    : request.kind === 'grand' || request.kind === 'prestige' ? 'Grand contrat'
                    : request.kind === 'signature' ? 'Spécialité du village'
                    : 'Panier assorti'}</small>
                  <h4>{request.title}</h4>
                  <p>{request.person}</p>
                </div>
                <PixelIcon id={request.crop} />
              </header>
              <ul className="offer-lines">
                {request.lines.map((line, index) => (
                  <li key={index} data-ready={steps[index].owned >= steps[index].required || undefined}>
                    <span>{orderLineName(game, line)}</span>
                    <b>{steps[index].owned} / {steps[index].required}</b>
                    {line.kind === 'item' && line.item.includes('|') &&
                      <small>Qualité minimale : {line.item.split('|')[1]}</small>}
                  </li>
                ))}
              </ul>
              <p className="offer-reward"><b>{reward} pièces</b><span>+{request.xp} XP{request.villagerId ? ' · +amitié' : ''}{request.kind === 'signature' ? ' · projet' : ''}</span></p>
              {request.note && <p className="offer-note">{request.note}</p>}
              {waiting && <output className="offer-wait">{frenchText(`${request.person.split(',')[0]} prépare cette commande : prête dans ${wait}.`)}</output>}
              {project?.step.kind === 'deliver' &&
                request.lines.some((line) => line.kind === 'item' &&
                  project.step.kind === 'deliver' &&
                  project.step.lines.some((needed) => needed.kind === 'item' &&
                    needed.item.split('|')[0] === line.item.split('|')[0])) &&
                <small className="offer-project-note">Produit utile au projet actif</small>}
              <button
                disabled={!plan.possible || waiting}
                onClick={() => {
                  const submit = () => dispatch('order', { slot: request.slot, confirmSuperior: plan.usesSuperior });
                  if (plan.usesSuperior) askConfirm({
                    title: 'Livrer une qualité supérieure ?',
                    description: 'Cette offre accepte une qualité plus simple. Vérifiez les produits choisis avant de confirmer.',
                    items: Object.entries(plan.used).map(([id, amount]) => `${amount} × ${itemLabel(game, id)}`),
                    confirmLabel: 'Livrer cette offre',
                  }, submit);
                  else submit();
                }}
              >
                {waiting ? 'Prête dans ' + wait : plan.possible ? 'Livrer cette offre' : 'À compléter'}
              </button>
            </article>
          );
        })}
      </div>
      <aside className="village-market-note">
        <PixelIcon id="soleil" />
        <div>
          <b>Coup de cœur : {event.label}</b>
          <span>+{Math.round(event.bonus * 100)} % à la vente · encore {duration((event.end - now) / 1000)}</span>
          {intuition && <small>Ensuite : {next.label}</small>}
        </div>
      </aside>
    </section>
  );
}
