'use client';
/**
 * 0.17.5 — La cuisine de Rosalie, dans sa propre fenêtre.
 *
 * Demande de l’auteur : l’atelier du carnet n’était « absolument pas pratique ».
 * Choix retenus : une fenêtre à elle (comme la graineterie et le panier),
 * les fourneaux en bandeau fin toujours visible en haut, et toutes les
 * recettes en grille : chaque carte montre ses ingrédients (en stock / à
 * mettre), ce qui manque, et se cuisine en un clic. Le détail (autres
 * récoltes, chances, grande marmite, effet) s’ouvre à côté, à la demande.
 * Pas de spoil : les recettes des niveaux à venir sont en ombre, sans nom.
 */
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { BellRing, Clock, Lock, SlidersHorizontal, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { DialogNotice } from '@/components/notebook/dialog-notice';
import { RecipeCard, startCooking } from '@/components/progression';
import { PixelIcon } from '@/components/farm/sprites';
import { type Errand } from '@/components/farm/farm-map';
import { type AskConfirm } from '@/components/game-confirm';
import { useGameClock } from '@/hooks/use-game-clock';
import {
  RECIPES,
  UPGRADES,
  cookTime,
  crop,
  defaultIngredients,
  dishName,
  dishParts,
  duration,
  henFeed,
  ingredientKeys,
  isFestivalDish,
  itemName,
  MARMITE_TIME,
  readyDishes,
  recipeLock,
  recipeMastery,
  stoveJobs,
  validIngredients,
  type ActionArgument,
  type Game,
  type Recipe,
} from '@/lib/game';

type Dispatch = (action: string, argument?: ActionArgument) => unknown;

/** Nom d’un ingrédient, sans sa qualité (« Blé », « Œuf »). */
const baseName = (id: string) => crop(id)?.name || (id === 'oeuf' ? 'Œuf' : itemName(id));

const STAT_LABELS: Record<keyof Game['stats'], string> = {
  mastery: 'Maîtrise',
  precision: 'Précision',
  creativity: 'Créativité',
  regularity: 'Régularité',
  luck: 'Chance',
};
const STAT_HINTS: Record<keyof Game['stats'], string> = {
  mastery: 'moins de plats rustiques',
  precision: 'plus de plats réussis et savoureux',
  creativity: 'plus de grands plats',
  regularity: 'moins de plats rustiques',
  luck: 'plus de chefs-d’œuvre',
};
const STOVE_UPGRADES = [null, 'stove2', 'stove3'] as const;
/** Recettes des niveaux à venir montrées en ombre ; les suivantes sont comptées. */
const MYSTERY_SHOWN = 3;

const FAMILIES = [
  { id: 'all', label: 'Toutes', test: () => true },
  { id: 'classics', label: 'Classiques', test: (r: Recipe) => !r.parent && !r.friend },
  { id: 'signatures', label: 'Signatures', test: (r: Recipe) => !!r.parent },
  { id: 'friends', label: 'Amitié', test: (r: Recipe) => !!r.friend },
] as const;
type FamilyId = (typeof FAMILIES)[number]['id'];

/** Fourneaux libres, recettes déjà en route déduites. */
export function kitchenSlots(game: Game, errands: Errand[]) {
  const free = stoveJobs(game).filter((job) => !job).length;
  const heading = errands.filter((errand) => errand.action === 'craft').length;
  return { heading, freeSlots: Math.max(0, free - heading) };
}

/** Ce que la recette demande, ce qui est en stock, ce qui manque (par portion). */
function recipeState(g: Game, r: Recipe) {
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

export function KitchenDialog({
  open,
  onClose,
  game,
  now: snapshotNow,
  dispatch,
  askConfirm,
  errands,
  notice,
}: {
  open: boolean;
  onClose: () => void;
  game: Game;
  now: number;
  dispatch: Dispatch;
  askConfirm: AskConfirm;
  errands: Errand[];
  notice?: string;
}) {
  const now = useGameClock() || snapshotNow;
  const last = game.lastCooked && isFestivalDish(game.lastCooked) ? game.lastCooked : null;
  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="paper-dialog shop-dialog kitchen-dialog">
        <header className="shop-sign kitchen-sign">
          <span className="shop-awning" aria-hidden="true" />
          <div className="shop-title">
            <DialogTitle>La cuisine de Rosalie</DialogTitle>
            <DialogDescription>Un plat, un clic : Rosalie part le mettre sur le feu.</DialogDescription>
          </div>
          {last && (
            <output key={last} className={`kitchen-last reveal-${dishParts(last).qualityId}`} aria-label={`Dernière assiette, ${dishName(last)}`}>
              <span className="kitchen-last-plate" aria-hidden="true">
                <PixelIcon id={last} />
              </span>
              <span>
                <small>Dernière assiette</small>
                <b>{dishName(last)}</b>
              </span>
            </output>
          )}
        </header>
        <DialogNotice notice={notice} />
        <div className="dialog-scroll kitchen-scroll">
          <KitchenRange game={game} now={now} dispatch={dispatch} errands={errands} />
          {game.upgrades.includes('workshop') ? (
            <KitchenBook game={game} now={now} dispatch={dispatch} askConfirm={askConfirm} errands={errands} />
          ) : (
            <div className="empty-state">
              <PixelIcon id="foundation" />
              <h3>L’emplacement attend son atelier.</h3>
              <p>Installez l’Atelier de Rosalie dans Améliorer au niveau {UPGRADES.find((u) => u.id === 'workshop')!.level}.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Le bandeau des fourneaux : feux, cloche, poulailler et talents, toujours en vue. */
function KitchenRange({ game, now, dispatch, errands }: { game: Game; now: number; dispatch: Dispatch; errands: Errand[] }) {
  const workshop = game.upgrades.includes('workshop');
  const jobs = stoveJobs(game);
  const ready = readyDishes(game, now);
  const { heading } = kitchenSlots(game, errands);
  const collecting = errands.some((errand) => errand.action === 'collect');
  const feeding = errands.some((errand) => errand.action === 'hens');
  const hensReady = !!game.hens && game.hens <= now;
  return (
    <section className="kitchen-range" data-ready={ready > 0 || undefined} aria-label="Les fourneaux">
      {workshop && (
        <>
          <span className="kitchen-rosalie" aria-hidden="true" />
          <ol className="kitchen-stoves">
            {STOVE_UPGRADES.map((upgradeId, index) => {
              if (index >= jobs.length) {
                const upgrade = UPGRADES.find((entry) => entry.id === upgradeId);
                return (
                  <li key={index} className="kstove" data-state="locked" title={`${upgrade?.name || 'Fourneau'} : dans Améliorer`}>
                    <span className="kstove-hob" aria-hidden="true">
                      <Lock size={14} />
                    </span>
                    <span className="kstove-text">
                      <b>Fourneau {index + 1}</b>
                      <small>Niv. {upgrade?.level}</small>
                    </span>
                  </li>
                );
              }
              const job = jobs[index];
              if (!job) {
                // Les premiers fourneaux libres attendent les recettes en route.
                const arriving = jobs.slice(0, index + 1).filter((entry) => !entry).length <= heading;
                return (
                  <li key={index} className="kstove" data-state={arriving ? 'arriving' : 'free'}>
                    <span className="kstove-hob" aria-hidden="true" />
                    <span className="kstove-text">
                      <b>{arriving ? 'Rosalie arrive' : 'Libre'}</b>
                      <small>Fourneau {index + 1}</small>
                    </span>
                  </li>
                );
              }
              const done = job.end <= now;
              const name = RECIPES.find((recipe) => recipe.id === job.id)?.name;
              const total = job.start ? job.end - job.start : 0;
              const progress = done ? 100 : total > 0 ? Math.min(100, Math.max(0, ((now - job.start!) / total) * 100)) : 0;
              return (
                <li key={index} className="kstove" data-state={done ? 'ready' : 'busy'} style={{ '--cook': progress } as CSSProperties}>
                  <span className="kstove-hob" aria-hidden="true">
                    {!done && (
                      <span className="kstove-fire">
                        <i />
                        <i />
                        <i />
                      </span>
                    )}
                    <span className="kstove-pan">
                      <PixelIcon id={job.id} />
                    </span>
                    <span className="kstove-steam">
                      <i />
                      <i />
                    </span>
                  </span>
                  <span className="kstove-text">
                    <b>
                      {name}
                      {job.portions === 2 ? ' × 2' : ''}
                    </b>
                    <small>{done ? 'Prêt à sortir' : duration((job.end - now) / 1000)}</small>
                  </span>
                  {total > 0 && (
                    <progress value={Math.min(total, Math.max(0, now - job.start!))} max={total} aria-label={`Cuisson de ${name}`} />
                  )}
                </li>
              );
            })}
          </ol>
          <button
            className="atelier-collect kitchen-bell"
            data-ready={(ready > 0 && !collecting) || undefined}
            disabled={!ready || collecting}
            onClick={() => dispatch('collect')}
          >
            <BellRing size={17} aria-hidden="true" />
            {collecting ? 'Rosalie y va…' : ready ? `Sortir ${ready > 1 ? 'les ' + ready + ' plats' : 'le plat'}` : 'Rien à sortir'}
          </button>
        </>
      )}
      {game.upgrades.includes('coop') && (
        <section className="atelier-coop kitchen-coop" data-ready={hensReady || undefined} aria-label="Le petit poulailler">
          <span className="kitchen-hen" aria-hidden="true">
            <PixelIcon id="hen" />
          </span>
          <span className="kitchen-coop-text">
            <b>Poulailler</b>
            <small>
              {feeding
                ? 'Rosalie y va…'
                : game.hens
                  ? hensReady
                    ? 'Œufs prêts'
                    : `Œufs dans ${duration((game.hens - now) / 1000)}`
                  : `${henFeed(game)} blés → 4 œufs`}
            </small>
          </span>
          <button
            disabled={feeding || (game.hens !== null ? game.hens > now : (game.stock.ble || 0) < henFeed(game))}
            onClick={() => dispatch('hens')}
          >
            {game.hens ? 'Ramasser' : 'Nourrir'}
          </button>
        </section>
      )}
      {workshop && <KitchenTalents game={game} dispatch={dispatch} />}
    </section>
  );
}

/** Talents de cuisinière : un bouton dans le bandeau, les jauges s’ouvrent dessous. */
function KitchenTalents({ game, dispatch }: { game: Game; dispatch: Dispatch }) {
  const points = game.talentPoints;
  const box = useRef<HTMLDetailsElement>(null);
  const [open, setOpen] = useState(false);
  // Un clic ailleurs referme les jauges.
  useEffect(() => {
    if (!open) return;
    const away = (event: PointerEvent) => {
      if (box.current && !box.current.contains(event.target as Node)) box.current.open = false;
    };
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
  }, [open]);
  return (
    <details
      ref={box}
      className="kitchen-talents"
      data-points={points > 0 || undefined}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary aria-label={`Talents de cuisinière${points > 0 ? `, ${points} point${points > 1 ? 's' : ''} à placer` : ''}`}>
        <span aria-hidden="true">Talents</span>
        {points > 0 && (
          <b key={points} aria-hidden="true">
            {points}
          </b>
        )}
      </summary>
      <ul>
        {(Object.keys(STAT_LABELS) as (keyof Game['stats'])[]).map((stat) => (
          <li key={stat}>
            <span>{STAT_LABELS[stat]}</span>
            <b key={game.stats[stat]} className="talent-value">
              {game.stats[stat]}
            </b>
            <span className="talent-gauge" aria-hidden="true">
              <i style={{ width: `${Math.min(100, (game.stats[stat] / 20) * 100)}%` }} />
            </span>
            <small>{STAT_HINTS[stat]}</small>
            {points > 0 && (
              <button
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
    </details>
  );
}

/** Le livre en grille : filtres, cartes, et le détail d’une recette à côté. */
function KitchenBook({
  game,
  now,
  dispatch,
  askConfirm,
  errands,
}: {
  game: Game;
  now: number;
  dispatch: Dispatch;
  askConfirm: AskConfirm;
  errands: Errand[];
}) {
  const [family, setFamily] = useState<FamilyId>('all');
  const [readyOnly, setReadyOnly] = useState(false);
  const [detail, setDetail] = useState('');
  const [sent, setSent] = useState<{ id: string; key: number } | null>(null);
  const { freeSlots } = kitchenSlots(game, errands);
  const states = new Map(RECIPES.map((r) => [r.id, recipeState(game, r)]));
  const inFamily = (id: FamilyId) => RECIPES.filter(FAMILIES.find((f) => f.id === id)!.test);
  const rank = (r: Recipe) => {
    const s = states.get(r.id)!;
    return s.one ? 0 : !s.lock ? 1 : s.mystery ? 3 : 2;
  };
  const listed = inFamily(family).filter((r) => !readyOnly || states.get(r.id)!.one);
  const known = listed.filter((r) => !states.get(r.id)!.mystery).sort((a, b) => rank(a) - rank(b));
  const mysteries = listed.filter((r) => states.get(r.id)!.mystery).sort((a, b) => a.level - b.level);
  const cookable = RECIPES.filter((r) => states.get(r.id)!.one).length;
  const opened = RECIPES.find((r) => r.id === detail && !states.get(r.id)!.mystery);
  const cook = (r: Recipe, portions: 1 | 2) =>
    startCooking(game, r, states.get(r.id)!.keys, portions, dispatch, askConfirm, () =>
      setSent({ id: r.id, key: (sent?.key || 0) + 1 }),
    );
  return (
    <div className="kitchen-book">
      <fieldset className="kitchen-filters">
        <legend className="sr-only">Familles de recettes</legend>
        {FAMILIES.map((entry) => {
          const count = inFamily(entry.id).filter((r) => !states.get(r.id)!.mystery).length;
          return (
            <button key={entry.id} type="button" aria-pressed={family === entry.id} onClick={() => setFamily(entry.id)}>
              {entry.label}
              <small aria-hidden="true">{count}</small>
            </button>
          );
        })}
        <button type="button" className="kitchen-ready-filter" aria-pressed={readyOnly} onClick={() => setReadyOnly(!readyOnly)}>
          <span className="kitchen-check" aria-hidden="true" />
          Faisables maintenant
          <small aria-hidden="true">{cookable}</small>
        </button>
      </fieldset>
      <div className="kitchen-layout" data-detail={opened ? true : undefined}>
        <ul className="kitchen-grid" key={family + (readyOnly ? '-prêtes' : '')} aria-label="Recettes">
          {known.map((r, index) => {
            const s = states.get(r.id)!;
            const mastery = recipeMastery(game, r.id);
            const missing = s.needs.filter((n) => n.owned < n.need);
            const state = s.one ? 'ready' : s.lock ? 'locked' : 'missing';
            const burst = sent?.id === r.id ? sent.key : 0;
            return (
              <li key={r.id} style={{ '--i': Math.min(index, 12) } as CSSProperties}>
                <article className="recipe-tile" data-state={state} aria-current={opened?.id === r.id || undefined} aria-labelledby={`tile-${r.id}`}>
                  <header>
                    <span key={`plate-${burst}`} className="tile-plate" data-sent={burst > 0 || undefined} aria-hidden="true">
                      <PixelIcon id={r.id} />
                    </span>
                    <div>
                      <h4 id={`tile-${r.id}`}>{r.name}</h4>
                      <span className="mastery-stars" aria-label={`Maîtrise ${mastery} sur 5`}>
                        <span aria-hidden="true">
                          {'★'.repeat(mastery)}
                          <i>{'★'.repeat(5 - mastery)}</i>
                        </span>
                      </span>
                    </div>
                  </header>
                  <p className="tile-facts">
                    <span>
                      <Clock size={13} aria-hidden="true" /> {duration(cookTime(game, r, now, s.keys))}
                    </span>
                    <span>
                      {r.price} <i className="coin-dot" aria-hidden="true" />
                      <span className="sr-only">pièces</span>
                    </span>
                  </p>
                  {s.lock ? (
                    <p className="tile-lock">
                      <Lock size={13} aria-hidden="true" /> {s.lock}
                    </p>
                  ) : (
                    <ul className="tile-ingredients" aria-label="Ingrédients, en stock sur nécessaires">
                      {s.needs.map((n) => (
                        <li key={n.id} data-missing={n.owned < n.need || undefined}>
                          <PixelIcon id={n.id} />
                          <span>{baseName(n.id)}</span>
                          <b>
                            {n.owned}/{n.need}
                          </b>
                        </li>
                      ))}
                    </ul>
                  )}
                  {!s.lock && missing.length > 0 && (
                    <p className="tile-missing">
                      Il manque {missing.map((n) => `${n.need - n.owned} × ${baseName(n.id).toLowerCase()}`).join(', ')}
                    </p>
                  )}
                  {!s.lock && (
                  <div className="tile-actions">
                    <button
                      type="button"
                      className="atelier-cook tile-cook"
                      disabled={!s.one || !freeSlots}
                      onClick={() => cook(r, 1)}
                    >
                      {s.one && !freeSlots ? 'Fourneaux pleins' : 'Cuisiner'}
                      {burst > 0 && (
                        <span key={`puff-${burst}`} className="cook-puff" aria-hidden="true">
                          <i />
                          <i />
                          <i />
                          <i />
                        </span>
                      )}
                    </button>
                    {s.two && (
                      <button
                        type="button"
                        className="tile-double"
                        disabled={!freeSlots}
                        title={`Grande marmite : 2 portions, cuisson ${MARMITE_TIME.toLocaleString('fr-FR')} fois plus longue`}
                        aria-label={`Cuisiner 2 portions de ${r.name} dans la grande marmite`}
                        onClick={() => cook(r, 2)}
                      >
                        ×2
                      </button>
                    )}
                    <button
                      type="button"
                      className="tile-more"
                      aria-expanded={opened?.id === r.id}
                      aria-label={`Détails de ${r.name} : autres récoltes, chances, effet`}
                      title="Détails : autres récoltes, chances, effet"
                      onClick={() => setDetail(opened?.id === r.id ? '' : r.id)}
                    >
                      <SlidersHorizontal size={16} aria-hidden="true" />
                    </button>
                  </div>
                  )}
                </article>
              </li>
            );
          })}
          {mysteries.slice(0, MYSTERY_SHOWN).map((r) => (
            <li key={r.id}>
              <article className="recipe-tile mystery" data-state="mystery">
                <span className="sr-only">{`Recette à découvrir au niveau ${r.level}`}</span>
                <header aria-hidden="true">
                  <span className="tile-plate">
                    <PixelIcon id={r.id} />
                  </span>
                  <div>
                    <h4>?</h4>
                  </div>
                </header>
                <p className="tile-lock" aria-hidden="true">
                  <Lock size={13} /> Niv. {r.level}
                </p>
              </article>
            </li>
          ))}
          {mysteries.length > MYSTERY_SHOWN && (
            <li>
              <article className="recipe-tile mystery more" data-state="mystery">
                <span className="sr-only">{`Encore ${mysteries.length - MYSTERY_SHOWN} recettes à découvrir`}</span>
                <b aria-hidden="true">+{mysteries.length - MYSTERY_SHOWN}</b>
                <small aria-hidden="true">à découvrir</small>
              </article>
            </li>
          )}
          {!known.length && !mysteries.length && (
            <li className="kitchen-empty">
              {readyOnly ? 'Aucune recette de cette famille n’a encore tous ses ingrédients.' : 'Aucune recette dans cette famille pour l’instant.'}
            </li>
          )}
        </ul>
        {opened && (
          <aside className="kitchen-detail" aria-label={`Détails de ${opened.name}`}>
            <button type="button" className="kitchen-detail-close" aria-label="Fermer les détails" onClick={() => setDetail('')}>
              <X size={16} aria-hidden="true" />
            </button>
            <RecipeCard key={opened.id} g={game} dispatch={dispatch} now={now} r={opened} askConfirm={askConfirm} freeSlots={freeSlots} />
          </aside>
        )}
      </div>
    </div>
  );
}
