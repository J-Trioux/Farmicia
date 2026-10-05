'use client';
import { useGameClock } from '@/hooks/use-game-clock';
import { useState } from 'react';

import {
  COURSE_NAMES,
  PROJECTS,
  VILLAGERS,
  activeBuffs,
  crop,
  duration,
  itemName,
  orchardFruit,
  planMenu,
  projectAvailable,
  projectStatus,
  stepTarget,
  type ActionArgument,
  type Game,
  type MenuLine,
  type MenuPlan,
  type VillageProject,
} from '@/lib/game';
import { PixelIcon, VillagerPortrait } from '@/components/farm/sprites';
import type { AskConfirm } from '@/components/game-confirm';
import { projectPicks } from '@/lib/farm-ui';

type Dispatch = (action: string, argument?: ActionArgument) => unknown;

const OUTCOME_LABELS: Record<string, string> = {
  rustique: 'rustique',
  reussi: 'réussi',
  savoureux: 'savoureux',
  chef: 'chef-d’œuvre',
};

function portraitIndex(id: string) {
  return (
    Math.max(
      0,
      VILLAGERS.findIndex((v) => v.id === id),
    ) + 1
  );
}

export function lineLabel(line: MenuLine) {
  if (line.kind === 'item') return `${line.amount} × ${itemName(line.item)}`;
  if (line.kind === 'distinct')
    return `${line.count} cultures différentes${line.each && line.each > 1 ? ` × ${line.each}` : ''} · valeur ${line.minValue} ◉ minimum`;
  return `${COURSE_NAMES[line.course]} · plat ${OUTCOME_LABELS[line.minOutcome]} ou mieux`;
}

function lineIcon(line: MenuLine) {
  if (line.kind === 'item') return line.item;
  if (line.kind === 'distinct') return 'basket';
  return line.course === 'entree'
    ? 'sauce'
    : line.course === 'plat'
      ? 'pain'
      : 'tarte';
}

/** Liste des lignes d’un menu, avec les produits que Rosalie utiliserait. */
export function MenuLines({
  lines,
  plan,
}: {
  lines: readonly MenuLine[];
  plan: MenuPlan;
}) {
  return (
    <ul className="menu-lines">
      {lines.map((line, index) => (
        <li key={index} data-ready={plan.status[index] || undefined}>
          <PixelIcon id={lineIcon(line)} />
          <div>
            <b>{lineLabel(line)}</b>
            <small>
              {plan.status[index]
                ? 'Prêt : ' +
                  Object.entries(plan.picks[index])
                    .map(
                      ([id, n]) => `${n > 1 ? n + ' × ' : ''}${itemName(id)}`,
                    )
                    .join(', ')
                : 'À réunir dans le panier'}
            </small>
          </div>
          <span aria-hidden="true">{plan.status[index] ? '✓' : '·'}</span>
        </li>
      ))}
    </ul>
  );
}

function deliver(
  dispatch: Dispatch,
  askConfirm: AskConfirm,
  action: string,
  plan: MenuPlan,
  extra: Record<string, unknown> = {},
) {
  const submit = () => dispatch(action, { ...extra, confirmSuperior: plan.usesSuperior });
  if (plan.usesSuperior) askConfirm({
    title: 'Contribuer avec une belle récolte ?',
    description: 'Ce projet accepte une qualité plus simple. Confirmez les produits qui seront livrés.',
    items: Object.entries(plan.used).map(([id, amount]) => `${amount} × ${itemName(id)}`),
    confirmLabel: 'Livrer au projet',
  }, submit);
  else submit();
}

function ActiveProject({ g, dispatch, askConfirm }: { g: Game; dispatch: Dispatch; askConfirm: AskConfirm }) {
  const status = projectStatus(g)!;
  const { project } = status;
  const plan =
    status.step.kind === 'deliver'
      ? planMenu(g.stock, status.step.lines)
      : null;
  return (
    <section className="project-active" aria-labelledby="project-active-title">
      <header>
        <VillagerPortrait index={portraitIndex(project.host)} />
        <div>
          <span className="project-kicker">Grand projet en cours</span>
          <h3 id="project-active-title">{project.title}</h3>
          <p>{project.intro}</p>
        </div>
      </header>
      <ol className="project-steps">
        {project.steps.map((step, index) => {
          const state =
            index < status.index
              ? 'done'
              : index === status.index
                ? 'current'
                : 'future';
          return (
            <li key={index} data-state={state}>
              <span className="project-step-mark" aria-hidden="true">
                {state === 'done' ? '✓' : index + 1}
              </span>
              <div>
                <b>{step.text}</b>
                {state === 'current' && step.kind === 'fund' && (
                  <>
                    <progress
                      value={Math.min(g.coins, step.amount)}
                      max={step.amount}
                      aria-label={`Votre bourse : ${g.coins} pièces sur ${step.amount}`}
                    />
                    <small>
                      Votre bourse : {Math.min(g.coins, step.amount).toLocaleString('fr-FR')} /{' '}
                      {step.amount.toLocaleString('fr-FR')} pièces
                    </small>
                  </>
                )}
                {state === 'current' && step.kind !== 'deliver' && step.kind !== 'fund' && (
                  <>
                    <progress
                      value={status.count}
                      max={stepTarget(step)}
                      aria-label={`Avancement : ${status.count} sur ${stepTarget(step)}`}
                    />
                    <small>
                      {status.count} / {stepTarget(step)}
                      {step.kind === 'sell' ? ' pièces' : ''}
                      {step.kind === 'harvest' && step.minQuality
                        ? ' · l’arrosage améliore la qualité'
                        : ''}
                    </small>
                  </>
                )}
                {state === 'future' && step.kind === 'fund' && <small>Participation demandée à la fin du chantier</small>}
                {state === 'future' && step.kind !== 'deliver' && step.kind !== 'fund' && <small>
                  Déjà acquis : {Math.min(stepTarget(step), g.projects.evidence?.[project.id]?.[index] || 0)} / {stepTarget(step)}
                </small>}
                {state === 'future' && step.kind === 'deliver' && <small>À livrer quand cette étape sera active</small>}
              </div>
            </li>
          );
        })}
      </ol>
      {status.step.kind === 'fund' && (
        <div className="project-delivery">
          <button
            className="primary-button"
            disabled={g.coins < status.step.amount}
            onClick={() => dispatch('projectFund')}
          >
            {g.coins >= status.step.amount
              ? `Participer · ${status.step.amount.toLocaleString('fr-FR')} pièces`
              : `Il manque ${(status.step.amount - g.coins).toLocaleString('fr-FR')} pièces`}
          </button>
        </div>
      )}
      {plan && status.step.kind === 'deliver' && (
        <div className="project-delivery">
          <MenuLines lines={status.step.lines} plan={plan} />
          <button
            className="primary-button"
            disabled={!plan.possible}
            onClick={() => deliver(dispatch, askConfirm, 'projectDeliver', plan)}
          >
            {plan.possible ? 'Livrer cette étape' : 'Produits insuffisants'}
          </button>
        </div>
      )}
      <footer className="project-reward">
        <PixelIcon id="quality" />
        <p>
          <b>Récompense : {project.rewardName}</b>
          <small>
            {project.rewardDesc} · +{project.coins} pièces · +{project.xp} XP
          </small>
        </p>
      </footer>
    </section>
  );
}

function ProjectCard({
  g,
  project,
  dispatch,
  tag,
  reason,
}: {
  g: Game;
  project: VillageProject;
  dispatch: Dispatch;
  /** « En cours », « Conseillé » ou « À découvrir ». */
  tag?: string;
  reason?: string;
}) {
  const open = projectAvailable(g, project);
  const progress = g.projects.progress[project.id];
  return (
    <article
      className="project-card"
      data-open={open || undefined}
      data-pick={tag ? tag : undefined}
    >
      <VillagerPortrait index={portraitIndex(project.host)} />
      <div>
        {tag && <span className="project-pick-tag">{tag}</span>}
        <h4>{project.title}</h4>
        <small>{project.style}</small>
        {reason && <p className="project-pick-reason">{reason}</p>}
        <p>
          {project.rewardName} · {project.rewardDesc}
        </p>
        {progress && (
          <small>
            Étape {progress.step + 1}/{project.steps.length} conservée
          </small>
        )}
      </div>
      <button
        className="small-button"
        disabled={!open}
        onClick={() => dispatch('projectStart', { project: project.id })}
      >
        {open
          ? progress
            ? 'Reprendre'
            : 'Choisir ce projet'
          : project.requires?.some((id) => !g.projects.done.includes(id))
            ? 'Après ' + PROJECTS.find((item) => item.id === project.requires?.find((id) => !g.projects.done.includes(id)))?.title
            : `Niveau ${project.level}`}
      </button>
    </article>
  );
}

export function ProjectsPanel({
  g,
  now: snapshotNow,
  dispatch,
  askConfirm,
}: {
  g: Game;
  now: number;
  dispatch: Dispatch;
  askConfirm: AskConfirm;
}) {
  const now = useGameClock() || snapshotNow;
  const [showAll, setShowAll] = useState(false);
  const picks = projectPicks(g);
  const done = PROJECTS.filter((p) => g.projects.done.includes(p.id));
  const hidden = picks.others.length + picks.locked.length;
  const paused = !g.projects.active && picks.current;
  return (
    <div className="projects-panel">
      {g.projects.active ? (
        <ActiveProject g={g} dispatch={dispatch} askConfirm={askConfirm} />
      ) : (
        <div className="project-intro">
          <b>{picks.advised || paused ? 'Choisissez un projet du village.' : 'Un prochain projet se prépare.'}</b>
          <p>
            Aucun délai : chaque projet avance à votre rythme et ses progrès
            restent acquis si vous en changez.
          </p>
        </div>
      )}
      {(paused || picks.advised || picks.nearby || picks.explore) && (
        <section aria-labelledby="project-picks-title">
          <h3 className="project-heading" id="project-picks-title">
            {g.projects.active ? 'Pour la suite' : 'Pour commencer'}
          </h3>
          <div className="project-list project-picks">
            {paused && (
              <ProjectCard g={g} project={paused} dispatch={dispatch} tag="En pause" />
            )}
            {picks.advised && (
              <ProjectCard g={g} project={picks.advised.project} dispatch={dispatch}
                tag="Conseillé" reason={picks.advised.reason} />
            )}
            {picks.nearby && (
              <ProjectCard g={g} project={picks.nearby.project} dispatch={dispatch}
                tag="À portée" reason={picks.nearby.reason} />
            )}
            {picks.explore && (
              <ProjectCard g={g} project={picks.explore.project} dispatch={dispatch}
                tag="À découvrir" reason={picks.explore.reason} />
            )}
          </div>
        </section>
      )}
      {hidden > 0 && (
        <button
          type="button"
          className="project-show-more"
          aria-expanded={showAll}
          aria-controls="project-all"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? 'Masquer les autres projets' : `Voir tous les projets · ${hidden} de plus`}
        </button>
      )}
      {showAll && (
        <div id="project-all">
          {picks.others.length > 0 && (
            <section>
              <h3 className="project-heading">Aussi disponibles · {picks.others.length}</h3>
              <div className="project-list">
                {picks.others.map((project) => (
                  <ProjectCard key={project.id} g={g} project={project} dispatch={dispatch} />
                ))}
              </div>
            </section>
          )}
          {picks.locked.length > 0 && (
            <section>
              <h3 className="project-heading">Plus tard · {picks.locked.length}</h3>
              <div className="project-list">
                {picks.locked.map((project) => (
                  <ProjectCard key={project.id} g={g} project={project} dispatch={dispatch} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
      {done.length > 0 && (
        <details className="project-archive project-achievements">
          <summary>Réalisations du village · {done.length}</summary>
          <div className="project-list">
            {done.map((project) => (
              <article className="project-card project-done" key={project.id}>
                <span className="project-ribbon" aria-hidden="true">
                  ★
                </span>
                <div>
                  <h4>{project.rewardName}</h4>
                  <small>{project.title}</small>
                  <p>{project.outro}</p>
                  <p>{project.rewardDesc}</p>
                </div>
                {project.reward === 'verger' && g.orchard !== null && (
                  <button
                    className="small-button"
                    disabled={g.orchard > now}
                    onClick={() => dispatch('orchard')}
                  >
                    {g.orchard <= now
                      ? `Cueillir 3 ${crop(orchardFruit(g)).name.toLowerCase()}s`
                      : duration((g.orchard - now) / 1000)}
                  </button>
                )}
              </article>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

/** Pastilles des effets de plats actifs, affichées dans le HUD. */
export function BuffChips({ g, now: snapshotNow }: { g: Game; now: number }) {
  const now = useGameClock() || snapshotNow;
  const buffs = activeBuffs(g, now);
  if (!buffs.length) return null;
  return (
    <ul className="buff-chips" aria-label="Effets de plats actifs">
      {buffs.map((buff) => (
        <li key={buff.id} title={buff.desc}>
          <b>{buff.name}</b>
          <small>{duration((buff.end - now) / 1000)}</small>
        </li>
      ))}
    </ul>
  );
}
