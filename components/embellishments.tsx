'use client';
/**
 * 0.11 — La ferme s’embellit : les six embellissements (trois étapes chacun)
 * et les dons à la fête du village, dans la page « Améliorer » du carnet.
 */
import type { CSSProperties } from 'react';
import {
  EMBELLISHMENTS,
  donationCost,
  donationSouvenir,
  donationTitle,
  embellishmentStage,
  level,
  type ActionArgument,
  type Game,
} from '@/lib/game';
import {
  DONATION_PROJECT,
  DONATION_TITLES,
  FEAST_DECOR,
  embellishmentEffect,
  type Embellishment,
} from '@/lib/embellishments';
import { PROJECTS } from '@/lib/projects';
import { RESTORATIONS, restorationEffect, restorationStage, type Restoration } from '@/lib/restorations';
import { frenchNumber, frenchText } from '@/lib/typography';

type State = 'done' | 'available' | 'saving' | 'future';

export function embellishPresentation(game: Game, entry: Embellishment) {
  const stage = embellishmentStage(game, entry.id);
  if (stage >= 3) return { stage, state: 'done' as State, cost: 0, required: 0, missing: 0 };
  const next = stage as 0 | 1 | 2;
  const cost = entry.costs[next];
  const required = entry.levels[next];
  const state: State = level(game) < required ? 'future' : game.coins < cost ? 'saving' : 'available';
  return { stage, state, cost, required, missing: Math.max(0, cost - game.coins) };
}

/** Aperçu de la planche : l’étape atteinte, ou la première en filigrane. */
export function EmbellishSprite({ entry, stage, ghost = false }: { entry: Embellishment; stage: number; ghost?: boolean }) {
  const style = {
    backgroundImage: `url(/assets/pixel/embellissements-hd/${entry.id}.png)`,
    backgroundPosition: `${(Math.max(1, stage) - 1) * 50}% 0`,
    aspectRatio: `128 / ${entry.cell}`,
  } as CSSProperties;
  return (
    <span className={`embellish-sprite${ghost ? ' ghost' : ''}`} style={style} aria-hidden="true">
      {entry.id === 'moulin' && stage >= 2 && <span className="embellish-anim moulin-wings still" />}
    </span>
  );
}

function restorationPresentation(game: Game, entry: Restoration) {
  const stage = restorationStage(game, entry.id);
  if (stage >= 3) return { stage, state: 'done' as State, cost: 0, required: 0, missing: 0 };
  const next = stage as 0 | 1 | 2;
  const cost = entry.costs[next];
  const required = entry.levels[next];
  const state: State = level(game) < required ? 'future' : game.coins < cost ? 'saving' : 'available';
  return { stage, state, cost, required, missing: Math.max(0, cost - game.coins) };
}

/**
 * 0.13 — Restaurer le domaine : les six lieux de l’anneau de la grande carte,
 * trois étapes chacun, un petit effet lié à un système voisin.
 */
function RestoreSection({ game, dispatch }: { game: Game; dispatch: (action: string, argument?: ActionArgument) => unknown }) {
  const first = Math.min(...RESTORATIONS.map((entry) => entry.levels[0]));
  return (
    <section className="restore-box" aria-labelledby="restore-title">
      <h4 id="restore-title">Restaurer le domaine</h4>
      <p>{frenchText(level(game) < first
        ? `Autour de la ferme, le lavoir, les champs, la grange, le bois, les vignes et le chai attendent d’être remis en état. Les premiers travaux s’ouvrent au niveau ${first}.`
        : 'Autour de la ferme, six lieux en friche attendent d’être remis en état. Chacun aide un peu un travail voisin. Cliquez sur un lieu de la carte pour revenir ici.')}</p>
      <div className="embellish-grid">
        {RESTORATIONS.map((entry) => {
          const view = restorationPresentation(game, entry);
          const next = view.stage < 3 ? ((view.stage + 1) as 1 | 2 | 3) : null;
          const labels: Record<State, string> = {
            done: 'Restauré',
            available: 'Disponible',
            saving: 'À économiser',
            future: 'Niveau ' + view.required,
          };
          return (
            <article key={entry.id} className={'embellish-card restore-card state-' + view.state} data-restore={entry.id}>
              <span className="upgrade-state">{labels[view.state]}</span>
              <div className="embellish-text">
                <small>{entry.system}</small>
                <h4>{entry.name}</h4>
                <p className="embellish-stage">
                  {view.stage ? frenchText(`Étape ${view.stage}/3 : ${entry.stages[view.stage - 1]}`) : 'En friche'}
                </p>
                {view.stage > 0 && <p>{frenchText(restorationEffect(entry, view.stage as 1 | 2 | 3))}</p>}
                {next && (
                  <p className="embellish-next">
                    {frenchText(`${view.stage ? 'Étape suivante' : 'Première étape'} : ${entry.stages[next - 1]}. ${restorationEffect(entry, next)}`)}
                  </p>
                )}
              </div>
              <div className="upgrade-steps" aria-label={`${view.stage} étapes sur 3`}>
                {entry.costs.map((value, index) => (
                  <span key={index} data-done={index < view.stage || undefined}
                    title={`Étape ${index + 1} · niveau ${entry.levels[index]} · ${frenchNumber(value)} pièces`} />
                ))}
              </div>
              {next ? (
                <button disabled={view.state !== 'available'} onClick={() => dispatch('renovate', { id: entry.id })}>
                  {view.state === 'available' ? `Restaurer · ${frenchNumber(view.cost)} pièces`
                    : view.state === 'saving' ? `Il manque ${frenchNumber(view.missing)} pièces`
                    : `Au niveau ${view.required} · ${frenchNumber(view.cost)} pièces`}
                </button>
              ) : <span className="embellish-done">Restauré ✓</span>}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function EmbellishPanel({
  game,
  dispatch,
}: {
  game: Game;
  dispatch: (action: string, argument?: ActionArgument) => unknown;
}) {
  const donations = game.donations || 0;
  const feastOpen = game.projects.done.includes(DONATION_PROJECT);
  const title = donationTitle(donations);
  const nextTitle = DONATION_TITLES.find((entry) => entry.count > donations);
  const banquet = PROJECTS.find((project) => project.id === DONATION_PROJECT);
  const cost = donationCost(donations);
  return (
    <div className="embellish-book">
      <header>
        <h3>Embellir la ferme</h3>
        <p>{frenchText('Chaque embellissement se voit sur la carte et s’améliore en trois étapes. Chacun aide un peu un travail voisin : l’arrosage, les voisins, les semis de garde, la qualité, l’atelier ou les récoltes.')}</p>
      </header>
      <div className="embellish-grid">
        {EMBELLISHMENTS.map((entry) => {
          const view = embellishPresentation(game, entry);
          const next = view.stage < 3 ? ((view.stage + 1) as 1 | 2 | 3) : null;
          const labels: Record<State, string> = {
            done: 'Terminé',
            available: 'Disponible',
            saving: 'À économiser',
            future: 'Niveau ' + view.required,
          };
          return (
            <article key={entry.id} className={'embellish-card state-' + view.state}>
              <span className="upgrade-state">{labels[view.state]}</span>
              <EmbellishSprite entry={entry} stage={view.stage || 1} ghost={!view.stage} />
              <div className="embellish-text">
                <small>{entry.system}</small>
                <h4>{entry.name}</h4>
                <p className="embellish-stage">
                  {view.stage ? frenchText(`Étape ${view.stage}/3 : ${entry.stages[view.stage - 1]}`) : 'Pas encore construit'}
                </p>
                {view.stage > 0 && <p>{frenchText(embellishmentEffect(entry, view.stage as 1 | 2 | 3))}</p>}
                {next && (
                  <p className="embellish-next">
                    {frenchText(`${view.stage ? 'Étape suivante' : 'Première étape'} : ${entry.stages[next - 1]}. ${embellishmentEffect(entry, next)}`)}
                  </p>
                )}
              </div>
              <div className="upgrade-steps" aria-label={`${view.stage} étapes sur 3`}>
                {entry.costs.map((value, index) => (
                  <span key={index} data-done={index < view.stage || undefined}
                    title={`Étape ${index + 1} · niveau ${entry.levels[index]} · ${frenchNumber(value)} pièces`} />
                ))}
              </div>
              {next ? (
                <button
                  disabled={view.state !== 'available'}
                  onClick={() => dispatch('embellish', { id: entry.id })}
                  data-tutorial-embellish={entry.id}
                >
                  {view.state === 'available' ? `Construire · ${frenchNumber(view.cost)} pièces`
                    : view.state === 'saving' ? `Il manque ${frenchNumber(view.missing)} pièces`
                    : `Au niveau ${view.required} · ${frenchNumber(view.cost)} pièces`}
                </button>
              ) : <span className="embellish-done">Achevé ✓</span>}
            </article>
          );
        })}
      </div>
      <RestoreSection game={game} dispatch={dispatch} />
      <section className="feast-box" aria-labelledby="feast-title">
        <h4 id="feast-title">La fête du village</h4>
        {feastOpen ? (
          <>
            <p>{frenchText('Vos dons financent la fête du village. Chacun ajoute un souvenir au livre d’or, jamais un bonus : c’est pour le plaisir de la vallée.')}</p>
            <p className="feast-count">
              <b>{donations} don{donations > 1 ? 's' : ''}</b>
              {title && <span>{frenchText(`Titre : ${title}`)}</span>}
              {nextTitle && <small>{frenchText(`Prochain titre à ${nextTitle.count} dons : ${nextTitle.title}`)}</small>}
            </p>
            <button disabled={game.coins < cost} onClick={() => dispatch('donate')}>
              {game.coins < cost ? `Il manque ${frenchNumber(cost - game.coins)} pièces` : `Offrir ${frenchNumber(cost)} pièces`}
            </button>
            <p className="feast-next">{frenchText(`Prochain souvenir : ${donationSouvenir(donations)}.`)}</p>
            <ul className="feast-decor-list" aria-label="Décors de la fête">
              {FEAST_DECOR.map((decor) => (
                <li key={decor.id} data-done={donations >= decor.count || undefined}>
                  {donations >= decor.count ? '✓ ' : ''}{frenchText(`${decor.name} · ${decor.count} don${decor.count > 1 ? 's' : ''}`)}
                </li>
              ))}
            </ul>
            {donations > 0 && (
              <details>
                <summary>Le livre d’or · {donations} souvenir{donations > 1 ? 's' : ''}</summary>
                <ol reversed>
                  {Array.from({ length: Math.min(donations, 30) }, (_, i) => donations - 1 - i).map((index) => (
                    <li key={index}>{frenchText(donationSouvenir(index))}</li>
                  ))}
                </ol>
              </details>
            )}
          </>
        ) : (
          <p>{frenchText(`Après ${banquet?.title.toLowerCase() || 'le grand banquet'} (niveau ${banquet?.level || 24}), la fête du village acceptera vos dons.`)}</p>
        )}
      </section>
    </div>
  );
}
