'use client';
/**
 * 0.24 — Page Atelier du carnet (maquette 10-atelier de ChatGPT).
 *
 * - Bandeau : la cuisine (décor de ChatGPT), Rosalie qui cuisine (son vrai
 *   sprite, image fixe en mouvement réduit) et les fourneaux avec leur état
 *   réel : libre, Rosalie arrive, en cuisson, prêt, verrouillé.
 * - Onglets : Classiques, Signatures, Amitié, puis Poulailler et Talents.
 * - Liste paginée des recettes à gauche, détail de la recette choisie à
 *   droite : maîtrise, durée, valeur, effet, ingrédients possédés/requis et
 *   une action principale. Les choix détaillés (autres récoltes, chances,
 *   grande marmite) restent derrière « Choisir d’autres récoltes ».
 * - Pas de spoil : les recettes des niveaux à venir restent en ombre.
 */
import { useState, type CSSProperties } from 'react';
import { CarnetBanner, CarnetPager, CarnetTabs } from '@/components/notebook/carnet';
import { CoopCard, STOVE_UPGRADES, TalentList, kitchenSlots, recipeState, type Dispatch } from '@/components/kitchen';
import { RecipeCard, startCooking } from '@/components/progression';
import { CarnetIcon as PixelIcon } from '@/components/notebook/carnet-icon';
import { CarnetProgress } from '@/components/notebook/carnet-progress';
import { type Errand } from '@/components/farm/farm-map';
import { type AskConfirm } from '@/components/game-confirm';
import { useGameClock } from '@/hooks/use-game-clock';
import {
  DISH_EFFECTS,
  MARMITE_TIME,
  RECIPES,
  UPGRADES,
  cookTime,
  crop,
  duration,
  itemName,
  readyDishes,
  recipeMastery,
  stoveJobs,
  type Game,
  type Recipe,
} from '@/lib/game';

const PER_PAGE = 5;
const FAMILIES = [
  { id: 'classics', label: 'Classiques', icon: 'recette', test: (r: Recipe) => !r.parent && !r.friend },
  { id: 'signatures', label: 'Signatures', icon: 'signature', test: (r: Recipe) => !!r.parent },
  { id: 'friends', label: 'Amitié', icon: 'lettre', test: (r: Recipe) => !!r.friend },
] as const;
type View = (typeof FAMILIES)[number]['id'] | 'coop' | 'talents';

/** Nom d’un ingrédient, sans sa qualité (« Blé », « Œuf »). */
const baseName = (id: string) => crop(id)?.name || (id === 'oeuf' ? 'Œuf' : itemName(id));

export function AtelierPage({
  game,
  now: snapshotNow,
  dispatch,
  askConfirm,
  errands,
  reduced,
}: {
  game: Game;
  now: number;
  dispatch: Dispatch;
  askConfirm: AskConfirm;
  errands: Errand[];
  reduced: boolean;
}) {
  const now = useGameClock() || snapshotNow;
  const workshop = game.upgrades.includes('workshop');
  const coop = game.upgrades.includes('coop');
  const [view, setView] = useState<View>(workshop ? 'classics' : 'coop');
  const [pageIndex, setPageIndex] = useState<Record<string, number>>({});
  const [chosen, setChosen] = useState('');
  const [advanced, setAdvanced] = useState(false);
  const [sent, setSent] = useState(0);
  const { freeSlots } = kitchenSlots(game, errands);
  const cooking = stoveJobs(game).some((job) => job && job.end > now);
  const states = new Map(RECIPES.map((r) => [r.id, recipeState(game, r)]));
  const family = FAMILIES.find((entry) => entry.id === view);
  const rank = (r: Recipe) => {
    const s = states.get(r.id)!;
    return s.one ? 0 : !s.lock ? 1 : 2;
  };
  const inFamily = (test: (r: Recipe) => boolean) => RECIPES.filter(test);
  const known = family ? inFamily(family.test).filter((r) => !states.get(r.id)!.mystery).sort((a, b) => rank(a) - rank(b)) : [];
  const mysteries = family ? inFamily(family.test).filter((r) => states.get(r.id)!.mystery).sort((a, b) => a.level - b.level) : [];
  // Liste : recettes connues, puis la prochaine recette à découvrir (en ombre).
  const rows: (Recipe | { mystery: Recipe; more: number })[] = [
    ...known,
    ...(mysteries.length ? [{ mystery: mysteries[0], more: mysteries.length - 1 }] : []),
  ];
  const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const page = Math.min(pageIndex[view] || 0, pages - 1);
  const shown = rows.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  const selected = known.find((r) => r.id === chosen) || known[0];

  if (!workshop && !coop)
    return (
      <div className="carnet-empty">
        <PixelIcon id="atelier" />
        <h4>L’emplacement attend son atelier.</h4>
        <p>Installez l’Atelier de Rosalie dans Améliorer au niveau {UPGRADES.find((u) => u.id === 'workshop')!.level}.</p>
      </div>
    );

  return (
    <div className="atelier-page" data-cooking={cooking || undefined}>
      <CarnetBanner id="atelier">
        {workshop && <Stoves game={game} now={now} dispatch={dispatch} errands={errands} />}
        <span className="atelier-rosalie" data-still={reduced || undefined} aria-hidden="true" />
        <span className="atelier-steam" aria-hidden="true"><i /><i /><i /></span>
      </CarnetBanner>
      <CarnetTabs<View>
        label="Recettes et basse-cour"
        value={view}
        onChange={(next) => {
          setView(next);
          setAdvanced(false);
        }}
        items={[
          ...FAMILIES.map((entry) => ({
            id: entry.id,
            label: entry.label,
            icon: entry.icon,
            count: inFamily(entry.test).filter((r) => states.get(r.id)!.one).length,
            hidden: !workshop || (entry.id !== 'classics' && !inFamily(entry.test).some((r) => !states.get(r.id)!.mystery)),
          })),
          { id: 'coop', label: 'Poulailler', icon: 'poulailler', count: game.hens && game.hens <= now ? 1 : 0, hidden: !coop },
          { id: 'talents', label: 'Talents', icon: 'etoile', count: game.talentPoints, hidden: !workshop },
        ]}
      />
      {view === 'coop' ? (
        <div className="atelier-solo">
          <CoopCard game={game} now={now} dispatch={dispatch} errands={errands} />
        </div>
      ) : view === 'talents' ? (
        <div className="atelier-solo">
          <TalentList game={game} dispatch={dispatch} />
        </div>
      ) : (
        <div className="carnet-split">
          <div className="carnet-list-column">
            <ul className="carnet-list" aria-label={`Recettes ${family?.label.toLowerCase()}`}>
              {shown.map((row) => {
                if ('mystery' in row)
                  return (
                    <li key="mystery">
                      <div className="carnet-row" data-state="mystery">
                        <span className="carnet-row-art" aria-hidden="true">
                          <PixelIcon id={row.mystery.id} />
                        </span>
                        <span className="carnet-row-label">
                          <b>Recette à découvrir</b>
                          {row.more > 0 && <small>et {row.more} autre{row.more > 1 ? 's' : ''} ensuite</small>}
                        </span>
                        <span className="carnet-chip" data-tone="muted">
                          <PixelIcon id="cadenas" className="inline-icon" /> Niv.{' '}{row.mystery.level}
                        </span>
                      </div>
                    </li>
                  );
                const s = states.get(row.id)!;
                const state = s.one ? 'ready' : s.lock ? 'locked' : 'missing';
                return (
                  <li key={row.id}>
                    <button
                      type="button"
                      className="carnet-row recipe-row"
                      data-state={state}
                      aria-pressed={selected?.id === row.id}
                      onClick={() => {
                        setChosen(row.id);
                        setAdvanced(false);
                      }}
                    >
                      <span className="carnet-row-art" aria-hidden="true">
                        <PixelIcon id={row.id} />
                      </span>
                      <span className="carnet-row-label">
                        <b>{row.name}</b>
                      </span>
                      {state === 'ready' ? (
                        <span className="carnet-chip" data-tone="ok">Prêt</span>
                      ) : state === 'locked' ? (
                        <span className="carnet-chip" data-tone="muted"><PixelIcon id="cadenas" className="inline-icon" /> Fermée</span>
                      ) : (
                        <span className="carnet-chip" data-tone="warn">À compléter</span>
                      )}
                    </button>
                  </li>
                );
              })}
              {!rows.length && <li className="carnet-list-empty">Aucune recette dans cette famille pour l’instant.</li>}
            </ul>
            <CarnetPager page={page} pages={pages} label="Pages des recettes" onPage={(next) => setPageIndex({ ...pageIndex, [view]: next })} />
          </div>
          {selected ? (
            advanced ? (
              <aside className="carnet-detail atelier-advanced" aria-label={`Choix détaillés pour ${selected.name}`}>
                <button type="button" className="carnet-link-button carnet-back" onClick={() => setAdvanced(false)}>
                  ‹ Retour à la recette
                </button>
                <RecipeCard key={selected.id} g={game} dispatch={dispatch} now={now} r={selected} askConfirm={askConfirm} freeSlots={freeSlots} openOptions />
              </aside>
            ) : (
              <RecipeDetail
                key={selected.id}
                game={game}
                now={now}
                r={selected}
                freeSlots={freeSlots}
                sent={sent}
                onCook={(portions) =>
                  startCooking(game, selected, states.get(selected.id)!.keys, portions, dispatch, askConfirm, () => setSent((n) => n + 1))
                }
                onAdvanced={() => setAdvanced(true)}
              />
            )
          ) : (
            <div className="carnet-detail carnet-empty">
              <p>Les recettes de cette famille s’ouvriront avec vos découvertes.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Les fourneaux, posés sur le bandeau : un état par fourneau, la cloche quand un plat est prêt. */
function Stoves({ game, now, dispatch, errands }: { game: Game; now: number; dispatch: Dispatch; errands: Errand[] }) {
  const jobs = stoveJobs(game);
  const ready = readyDishes(game, now);
  const { heading } = kitchenSlots(game, errands);
  const collecting = errands.some((errand) => errand.action === 'collect');
  return (
    <section className="atelier-stoves" aria-label="Les fourneaux" data-ready={ready > 0 || undefined}>
      <h4>Les fourneaux</h4>
      <ol>
        {STOVE_UPGRADES.map((upgradeId, index) => {
          if (index >= jobs.length) {
            const upgrade = UPGRADES.find((entry) => entry.id === upgradeId);
            return (
              <li key={index} className="atelier-stove" data-state="locked" title={`${upgrade?.name || 'Fourneau'} : dans Améliorer`}>
                <b>{index + 1}</b>
                <span>Niveau{' '}{upgrade?.level}</span>
              </li>
            );
          }
          const job = jobs[index];
          if (!job) {
            const arriving = jobs.slice(0, index + 1).filter((entry) => !entry).length <= heading;
            return (
              <li key={index} className="atelier-stove" data-state={arriving ? 'arriving' : 'free'} title={arriving ? 'Rosalie arrive à l’atelier' : undefined}>
                <b>{index + 1}</b>
                <span>{arriving ? 'En route' : 'Libre'}</span>
              </li>
            );
          }
          const done = job.end <= now;
          const name = RECIPES.find((recipe) => recipe.id === job.id)?.name || 'Plat';
          const total = job.start ? job.end - job.start : 0;
          const progress = done ? 100 : total > 0 ? Math.min(100, Math.max(0, ((now - job.start!) / total) * 100)) : 0;
          return (
            <li
              key={index}
              className="atelier-stove"
              data-state={done ? 'ready' : 'busy'}
              style={{ '--cook': `${progress}%` } as CSSProperties}
              title={`${name}${job.portions === 2 ? ' × 2' : ''}`}
            >
              <b>{index + 1}</b>
              <PixelIcon id={job.id} />
              <span>{done ? 'Prêt' : duration((job.end - now) / 1000)}</span>
              <CarnetProgress value={progress} max={100} label={`Cuisson : ${name}`} valueText={done ? 'Plat prêt' : `${Math.floor(progress)} %`} />
            </li>
          );
        })}
      </ol>
      {ready > 0 && (
        <button type="button" className="carnet-action atelier-collect" disabled={collecting} onClick={() => dispatch('collect')}>
          <PixelIcon id="cloche" className="inline-icon" />
          {collecting ? 'Rosalie y va…' : ready > 1 ? `Sortir les ${ready} plats` : 'Sortir le plat'}
        </button>
      )}
    </section>
  );
}

function RecipeDetail({
  game,
  now,
  r,
  freeSlots,
  sent,
  onCook,
  onAdvanced,
}: {
  game: Game;
  now: number;
  r: Recipe;
  freeSlots: number;
  sent: number;
  onCook: (portions: 1 | 2) => void;
  onAdvanced: () => void;
}) {
  const s = recipeState(game, r);
  const mastery = recipeMastery(game, r.id);
  const effect = DISH_EFFECTS[r.parent || r.id];
  const missing = s.needs.filter((n) => n.owned < n.need);
  const label = s.lock
    ? s.lock
    : !s.one
      ? 'Ingrédients insuffisants'
      : !freeSlots
        ? 'Fourneaux occupés'
        : 'Cuisiner';
  return (
    <article className="carnet-detail atelier-detail" aria-labelledby={`atelier-${r.id}`}>
      <header className="carnet-detail-head">
        <span className="carnet-detail-art" aria-hidden="true">
          <PixelIcon id={r.id} />
        </span>
        <div>
          <h4 id={`atelier-${r.id}`}>{r.name}</h4>
          <p className="carnet-detail-sub">Maîtrise {mastery}{' '}/{' '}5</p>
          <span className="carnet-steps" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((step) => (
              <i key={step} data-on={step < mastery || undefined} />
            ))}
          </span>
        </div>
      </header>
      <div className="carnet-facts">
        <span className="carnet-fact">
          <PixelIcon id="horloge" className="inline-icon" />
          {duration(cookTime(game, r, now, s.keys))}
        </span>
        <span className="carnet-fact">
          <PixelIcon id="piece" />
          {r.price}{' '}pièces
        </span>
      </div>
      {effect && (
        <p className="carnet-band atelier-effect" data-effect={effect.id}>
          <PixelIcon id={effect.id === 'atelier' ? 'braises' : 'etoile'} />
          <span>
            <b>{effect.name}</b> · {effect.desc}
          </span>
        </p>
      )}
      <h5 className="carnet-rule">Ingrédients</h5>
      {s.lock ? (
        <p className="carnet-note">
          <PixelIcon id="cadenas" className="inline-icon" /> {s.lock}
        </p>
      ) : (
        <ul className="carnet-ingredients" aria-label="Ingrédients, en stock sur nécessaires">
          {s.needs.map((n) => (
            <li key={n.id} data-missing={n.owned < n.need || undefined}>
              <PixelIcon id={n.id} />
              <span>
                {baseName(n.id)} · {n.owned}
                {' '}/{' '}
                {n.need}
              </span>
            </li>
          ))}
        </ul>
      )}
      {!s.lock && missing.length > 0 && (
        <p className="carnet-note">Il manque {missing.map((n) => `${n.need - n.owned} × ${baseName(n.id).toLowerCase()}`).join(', ')}.</p>
      )}
      <div className="carnet-detail-actions">
        <button type="button" className="carnet-primary atelier-cook" disabled={!s.one || !freeSlots} onClick={() => onCook(1)}>
          <PixelIcon id="casserole" />
          {label}
          {sent > 0 && (
            <span key={`puff-${sent}`} className="cook-puff" aria-hidden="true">
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
            className="carnet-secondary"
            disabled={!freeSlots}
            title={`Grande marmite : 2 portions, cuisson ${MARMITE_TIME.toLocaleString('fr-FR')} fois plus longue`}
            aria-label={`Cuisiner 2 portions de ${r.name} dans la grande marmite`}
            onClick={() => onCook(2)}
          >
            ×{' '}2
          </button>
        )}
      </div>
      {!s.lock && (
        <button type="button" className="carnet-link-button" onClick={onAdvanced}>
          Choisir d’autres récoltes ›
        </button>
      )}
    </article>
  );
}
