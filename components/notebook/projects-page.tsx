'use client';
/**
 * 0.25 — Page Projets du carnet (maquette 01-projets de ChatGPT).
 *
 * - Bandeau : le village ; à gauche, l’écriteau du projet avec le vrai hôte.
 * - Onglets : En cours (si un projet est lancé), Choisir, Réalisations.
 * - En cours : les étapes en ligne (icône, intitulé, progression), l’étape
 *   active et son geste (livrer, participer), la récompense, puis la suite.
 * - Choisir : liste paginée de tous les projets (en pause, conseillé, à portée,
 *   à découvrir, disponibles, plus tard) et leur fiche à côté.
 * - Réalisations : les projets achevés, et la cueillette du verger.
 * Aucune règle ne change : ordre et conditions des étapes viennent de lib/game.
 */
import { useState } from 'react';
import { CarnetBanner, CarnetPager, CarnetRewards, CarnetSegments, CarnetTabs } from '@/components/notebook/carnet';
import { CarnetIcon as PixelIcon } from '@/components/notebook/carnet-icon';
import { CarnetPortrait as VillagerPortrait } from '@/components/notebook/carnet-portrait';
import type { AskConfirm } from '@/components/game-confirm';
import { useGameClock } from '@/hooks/use-game-clock';
import { projectPicks, projectRewardValue } from '@/lib/farm-ui';
import {
  PROJECTS,
  VILLAGERS,
  crop,
  duration,
  itemName,
  orchardFruit,
  planMenu,
  projectAvailable,
  projectReward,
  projectStatus,
  stepTarget,
  type ActionArgument,
  type Game,
  type MenuPlan,
  type VillageProject,
} from '@/lib/game';
import { lineLabel } from '@/components/projects';
import { Glyph } from '@/components/glyph';

type Dispatch = (action: string, argument?: ActionArgument) => unknown;
type Step = VillageProject['steps'][number];
type View = 'current' | 'choose' | 'done';
const PER_PAGE = 5;

const portraitIndex = (id: string) => Math.max(0, VILLAGERS.findIndex((v) => v.id === id)) + 1;
const hostName = (id: string) => VILLAGERS.find((v) => v.id === id)?.name || '';

/** Icône d’une étape (sources d’origine des icônes du jeu). */
function stepIcon(step: Step) {
  switch (step.kind) {
    case 'harvest':
      return step.crop === '*' ? 'faucille' : step.crop;
    case 'cook':
      return step.recipe === '*' ? 'casserole' : step.recipe;
    case 'deliver':
      return 'cagette';
    case 'fund':
    case 'sell':
      return 'piece';
    case 'festival':
    case 'fair':
      return 'rosette';
    case 'signatureOrder':
      return 'signature';
    default:
      return 'plan';
  }
}

function deliver(dispatch: Dispatch, askConfirm: AskConfirm, plan: MenuPlan) {
  const submit = () => dispatch('projectDeliver', { confirmSuperior: plan.usesSuperior });
  if (plan.usesSuperior)
    askConfirm(
      {
        title: 'Contribuer avec une belle récolte ?',
        description: 'Ce projet accepte une qualité plus simple. Confirmez les produits qui seront livrés.',
        items: Object.entries(plan.used).map(([id, amount]) => `${amount} × ${itemName(id)}`),
        confirmLabel: 'Livrer au projet',
      },
      submit,
    );
  else submit();
}

/** État d’un projet pour la liste « Choisir ». */
function projectTag(g: Game, project: VillageProject, picks: ReturnType<typeof projectPicks>) {
  if (!g.projects.active && picks.current?.id === project.id) return { label: 'En pause', tone: 'ok' };
  if (picks.advised?.project.id === project.id) return { label: 'Conseillé', tone: 'ok' };
  if (picks.nearby?.project.id === project.id) return { label: 'À portée', tone: 'ok' };
  if (picks.explore?.project.id === project.id) return { label: 'À découvrir', tone: 'info' };
  if (projectAvailable(g, project)) return { label: 'Disponible', tone: 'muted' };
  const before = project.requires?.find((id) => !g.projects.done.includes(id));
  return { label: before ? 'Plus tard' : `Niv. ${project.level}`, tone: 'muted' };
}

export function ProjectsPage({ game, now: snapshotNow, dispatch, askConfirm }: { game: Game; now: number; dispatch: Dispatch; askConfirm: AskConfirm }) {
  const now = useGameClock() || snapshotNow;
  const status = projectStatus(game);
  const picks = projectPicks(game);
  const done = PROJECTS.filter((p) => game.projects.done.includes(p.id));
  const [view, setView] = useState<View>(status ? 'current' : 'choose');
  const [chosen, setChosen] = useState('');
  const [pageIndex, setPageIndex] = useState<Record<string, number>>({});
  const shownView: View = view === 'current' && !status ? 'choose' : view === 'done' && !done.length ? 'choose' : view;

  // Ordre de la liste : en pause, conseillé, à portée, à découvrir, autres disponibles, plus tard.
  const picked = [
    !game.projects.active ? picks.current : null,
    picks.advised?.project,
    picks.nearby?.project,
    picks.explore?.project,
  ].filter(Boolean) as VillageProject[];
  const choices = [
    ...picked,
    ...picks.others.filter((p) => !picked.includes(p)),
    ...picks.locked.filter((p) => !picked.includes(p)),
  ].filter((p, index, all) => all.indexOf(p) === index && p.id !== game.projects.active);
  const list = shownView === 'done' ? done : choices;
  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  const page = Math.min(pageIndex[shownView] || 0, pages - 1);
  const selected = list.find((p) => p.id === chosen) || list[0];
  const open = (id: string) => {
    setChosen(id);
    setView('choose');
    const index = choices.findIndex((p) => p.id === id);
    setPageIndex({ ...pageIndex, choose: Math.max(0, Math.floor(index / PER_PAGE)) });
  };

  return (
    <div className="carnet-stack projects-page">
      <CarnetBanner
        id="projets"
        panelWidth={62}
        panel={
          status ? (
            <>
              <span className="carnet-panel-portrait">
                <VillagerPortrait index={portraitIndex(status.project.host)} />
              </span>
              <span className="carnet-panel-text">
                <b>{status.project.title}</b>
                <small>Avec {hostName(status.project.host)} · {status.project.style}</small>
              </span>
            </>
          ) : (
            <>
              <span className="carnet-panel-portrait">
                <PixelIcon id="plan" />
              </span>
              <span className="carnet-panel-text">
                <b>{picks.advised || picks.current ? 'Choisissez un projet' : 'Un projet se prépare'}</b>
                <small>Aucun délai : les progrès restent acquis si vous changez de projet.</small>
              </span>
            </>
          )
        }
      />
      <CarnetTabs<View>
        label="Projets du village"
        value={shownView}
        onChange={setView}
        items={[
          { id: 'current', label: 'En cours', icon: 'plan', hidden: !status },
          { id: 'choose', label: status ? 'Autres projets' : 'Choisir', icon: 'projet-village', count: status ? 0 : choices.filter((p) => projectAvailable(game, p)).length },
          { id: 'done', label: `Réalisations · ${done.length}`, icon: 'laurier', hidden: !done.length },
        ]}
      />
      {shownView === 'current' && status ? (
        <ActiveProject game={game} now={now} dispatch={dispatch} askConfirm={askConfirm} picks={picked.filter((p) => p.id !== status.project.id).slice(0, 2)} onOpen={open} />
      ) : (
        <div className="carnet-split">
          <div className="carnet-list-column">
            <ul className="carnet-list" aria-label={shownView === 'done' ? 'Projets achevés' : 'Projets du village'}>
              {list.slice(page * PER_PAGE, (page + 1) * PER_PAGE).map((project) => {
                const tag = shownView === 'done' ? { label: 'Achevé', tone: 'ok' } : projectTag(game, project, picks);
                return (
                  <li key={project.id}>
                    <button
                      type="button"
                      className="carnet-row"
                      aria-pressed={selected?.id === project.id}
                      onClick={() => setChosen(project.id)}
                    >
                      <span className="carnet-row-art carnet-row-portrait" aria-hidden="true">
                        <VillagerPortrait index={portraitIndex(project.host)} />
                      </span>
                      <span className="carnet-row-label">
                        <b>{shownView === 'done' ? project.rewardName : project.title}</b>
                        <small>{shownView === 'done' ? project.title : project.style}</small>
                      </span>
                      <span className="carnet-chip" data-tone={tag.tone}>{tag.label}</span>
                    </button>
                  </li>
                );
              })}
              {!list.length && <li className="carnet-list-empty">Les prochains projets arriveront avec les niveaux.</li>}
            </ul>
            <CarnetPager page={page} pages={pages} label="Pages des projets" onPage={(next) => setPageIndex({ ...pageIndex, [shownView]: next })} />
          </div>
          {selected &&
            (shownView === 'done' ? (
              <DoneDetail game={game} now={now} project={selected} dispatch={dispatch} />
            ) : (
              <ProjectDetail game={game} project={selected} picks={picks} dispatch={dispatch} onStart={() => setView('current')} />
            ))}
        </div>
      )}
    </div>
  );
}

function ActiveProject({
  game,
  now,
  dispatch,
  askConfirm,
  picks,
  onOpen,
}: {
  game: Game;
  now: number;
  dispatch: Dispatch;
  askConfirm: AskConfirm;
  picks: VillageProject[];
  onOpen: (id: string) => void;
}) {
  const status = projectStatus(game)!;
  const rewardValue = projectRewardValue(game, status.project, now);
  const { project, step } = status;
  const plan = step.kind === 'deliver' ? planMenu(game.stock, step.lines) : null;
  const evidence = game.projects.evidence?.[project.id] || [];
  return (
    <div className="project-active-page">
      <ol className="carnet-steps-row" aria-label="Étapes du projet">
        {project.steps.map((entry, index) => {
          const state = index < status.index ? 'done' : index === status.index ? 'current' : 'future';
          const target = entry.kind === 'deliver' ? entry.lines.length : stepTarget(entry);
          const value =
            state === 'done'
              ? target
              : state === 'current'
                ? entry.kind === 'fund'
                  ? Math.min(game.coins, entry.amount)
                  : plan
                    ? plan.status.filter(Boolean).length
                    : status.count
                : entry.kind === 'deliver' || entry.kind === 'fund'
                  ? 0
                  : Math.min(target, evidence[index] || 0);
          const max = entry.kind === 'fund' ? entry.amount : target;
          return (
            <li key={index} data-state={state} aria-current={state === 'current' ? 'step' : undefined}>
              <span className="carnet-step-art" aria-hidden="true">
                <PixelIcon id={stepIcon(entry)} />
                {state === 'done' && (
                  <i className="carnet-check">
                    <Glyph id="coche" />
                  </i>
                )}
              </span>
              <span className="carnet-step-text">{entry.text}</span>
              <CarnetSegments value={value} max={max} segments={4} label={`${entry.text} : ${state === 'done' ? 'fait' : `${value} sur ${max}`}`} />
            </li>
          );
        })}
      </ol>
      <section className="carnet-band carnet-band-current" aria-label="Étape en cours">
        <PixelIcon id={stepIcon(step)} />
        <div className="carnet-band-text">
          <b>{step.text}</b>
          {step.kind === 'fund' ? (
            <small>
              Votre bourse : {Math.min(game.coins, step.amount).toLocaleString('fr-FR')}
              {' '}/{' '}
              {step.amount.toLocaleString('fr-FR')} pièces
            </small>
          ) : plan && step.kind === 'deliver' ? (
            <ul className="carnet-inline-list">
              {step.lines.map((line, index) => (
                <li key={index} data-ready={plan.status[index] || undefined}>
                  {plan.status[index] && <Glyph id="coche" />}
                  {lineLabel(line)}
                </li>
              ))}
            </ul>
          ) : (
            <small>
              {status.count}
              {' '}/{' '}
              {status.target}
              {step.kind === 'sell' ? ' pièces' : ''}
              {step.kind === 'harvest' && step.minQuality ? ' · l’arrosage améliore la qualité' : ''}
              {status.target - status.count > 0 ? ` · encore ${(status.target - status.count).toLocaleString('fr-FR')}` : ''}
            </small>
          )}
        </div>
        {step.kind === 'fund' && (
          <button type="button" className="carnet-action" disabled={game.coins < step.amount} onClick={() => dispatch('projectFund')}>
            {game.coins >= step.amount
              ? `Participer · ${step.amount.toLocaleString('fr-FR')} pièces`
              : `Il manque ${(step.amount - game.coins).toLocaleString('fr-FR')} pièces`}
          </button>
        )}
        {plan && (
          <button type="button" className="carnet-action" disabled={!plan.possible} onClick={() => deliver(dispatch, askConfirm, plan)}>
            {plan.possible ? 'Livrer cette étape' : 'Produits insuffisants'}
          </button>
        )}
      </section>
      <section className="carnet-card carnet-reward" aria-labelledby="project-reward-title">
        <span className="carnet-reward-art" aria-hidden="true">
          <PixelIcon id="projet-village" />
        </span>
        <div>
          <h4 id="project-reward-title">
            <small>Récompense</small>
            {project.rewardName}
          </h4>
          <p>{project.rewardDesc}</p>
          {rewardValue && <p className="carnet-note carnet-reward-value">{rewardValue}</p>}
        </div>
        <CarnetRewards {...projectReward(project)} />
      </section>
      {picks.length > 0 && (
        <section className="carnet-next" aria-labelledby="project-next-title">
          <h5 className="carnet-rule" id="project-next-title">
            Pour la suite
          </h5>
          <ul>
            {picks.map((p) => (
              <li key={p.id}>
                <button type="button" className="carnet-row" onClick={() => onOpen(p.id)}>
                  <span className="carnet-row-art carnet-row-portrait" aria-hidden="true">
                    <VillagerPortrait index={portraitIndex(p.host)} />
                  </span>
                  <span className="carnet-row-label">
                    <b>{p.title}</b>
                    <small>{p.style}</small>
                  </span>
                  <Glyph id="chevron-droite" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {/* Le verger reste à portée depuis la page en cours. */}
      <Orchard game={game} now={now} dispatch={dispatch} />
    </div>
  );
}

function ProjectDetail({ game, project, picks, dispatch, onStart }: { game: Game; project: VillageProject; picks: ReturnType<typeof projectPicks>; dispatch: Dispatch; onStart: () => void }) {
  const now = useGameClock();
  const rewardValue = projectRewardValue(game, project, now);
  const open = projectAvailable(game, project);
  const progress = game.projects.progress[project.id];
  const reason = [picks.advised, picks.nearby, picks.explore].find((pick) => pick?.project.id === project.id)?.reason;
  const before = project.requires?.find((id) => !game.projects.done.includes(id));
  return (
    <article className="carnet-detail" aria-labelledby={`project-${project.id}`}>
      <header className="carnet-detail-head">
        <span className="carnet-detail-art carnet-detail-portrait" aria-hidden="true">
          <VillagerPortrait index={portraitIndex(project.host)} />
        </span>
        <div>
          <h4 id={`project-${project.id}`}>{project.title}</h4>
          <p className="carnet-detail-sub">
            Avec {hostName(project.host)} · {project.style}
          </p>
          {reason && <p className="carnet-note carnet-note-ok">{reason}</p>}
        </div>
      </header>
      <p className="carnet-text">{project.intro}</p>
      <ol className="carnet-mini-steps" aria-label="Étapes">
        {project.steps.map((step, index) => (
          <li key={index} data-done={(progress && index < progress.step) || undefined}>
            <PixelIcon id={stepIcon(step)} />
            <span>{step.text}</span>
          </li>
        ))}
      </ol>
      <p className="carnet-band">
        <PixelIcon id="projet-village" />
        <span>
          <b>{project.rewardName}</b> · {project.rewardDesc}
          {rewardValue && <small className="carnet-reward-value"> {rewardValue}</small>}
        </span>
      </p>
      <CarnetRewards {...projectReward(project)} />
      <div className="carnet-detail-actions">
        <button type="button" className="carnet-primary" disabled={!open} onClick={() => {
            dispatch('projectStart', { project: project.id });
            onStart();
          }}>
          {open
            ? progress
              ? `Reprendre · étape ${progress.step + 1}/${project.steps.length}`
              : game.projects.active
                ? 'Passer à ce projet'
                : 'Choisir ce projet'
            : before
              ? `Après ${PROJECTS.find((item) => item.id === before)?.title}`
              : `Niveau ${project.level}`}
        </button>
      </div>
      {open && game.projects.active && <p className="carnet-note">Le projet en cours garde ses progrès.</p>}
    </article>
  );
}

function DoneDetail({ game, now, project, dispatch }: { game: Game; now: number; project: VillageProject; dispatch: Dispatch }) {
  return (
    <article className="carnet-detail" aria-labelledby={`done-${project.id}`}>
      <header className="carnet-detail-head">
        <span className="carnet-detail-art" aria-hidden="true">
          <PixelIcon id="projet-village" />
        </span>
        <div>
          <h4 id={`done-${project.id}`}>{project.rewardName}</h4>
          <p className="carnet-detail-sub">
            {project.title} · avec {hostName(project.host)}
          </p>
        </div>
      </header>
      <p className="carnet-text">{project.outro}</p>
      <p className="carnet-band">
        <PixelIcon id="laurier" />
        <span>{project.rewardDesc}</span>
      </p>
      {project.reward === 'verger' && <Orchard game={game} now={now} dispatch={dispatch} />}
    </article>
  );
}

/** Le verger (récompense de « La fête du verger ») : une cueillette à la fois. */
function Orchard({ game, now, dispatch }: { game: Game; now: number; dispatch: Dispatch }) {
  if (game.orchard === null || !game.projects.done.some((id) => PROJECTS.find((p) => p.id === id)?.reward === 'verger')) return null;
  const ready = game.orchard <= now;
  const fruit = crop(orchardFruit(game)).name.toLowerCase();
  return (
    <p className="carnet-band carnet-orchard" data-ready={ready || undefined}>
      <PixelIcon id={orchardFruit(game)} />
      <span>
        <b>Le verger</b> · {ready ? `3 ${fruit}s à cueillir` : `prochaine cueillette dans ${duration((game.orchard - now) / 1000)}`}
      </span>
      <button type="button" className="carnet-action" disabled={!ready} onClick={() => dispatch('orchard')}>
        Cueillir
      </button>
    </p>
  );
}
