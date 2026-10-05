'use client';
/** Extrait de app/page.tsx (0.11.1), à comportement identique. */
import { useEffect, useState } from 'react';
import { EmbellishPanel } from '@/components/embellishments';
import { PixelIcon } from '@/components/farm/sprites';
import { EMBELLISHMENTS, RESTORATIONS, restorationStage, PLOT_STEPS, embellishmentStage, UPGRADES, UPGRADE_PATHS, upgradeTier, level, type ActionArgument, type Game } from '@/lib/game';
import { upgradePresentation } from '@/lib/farm-ui';

export function UpgradesPanel({
  game, dispatch, focusRestore = false,
}: {
  game: Game;
  /** 0.13 : ouvert depuis un lieu de l’anneau, sur « Restaurer le domaine ». */
  focusRestore?: boolean;
  dispatch: (action: string, argument?: ActionArgument) => unknown;
}) {
  // 0.11.2 : trois pages dans « Améliorer » : les outils de Rosalie, les bâtiments et le terrain,
  // les embellissements (dès le niveau 4).
  const PAGES = {
    tools: ['watering-can', 'tools', 'auto'],
    buildings: ['expand', 'water', 'paths', 'workshop', 'coop', 'stove2', 'marmite', 'stove3'],
  } as const;
  // Au niveau 1, seul « Un jardin plus grand » est ouvert : on commence par les bâtiments.
  const [view, setView] = useState<'tools' | 'buildings' | 'embellish'>(() => (focusRestore ? 'embellish' : level(game) < 2 ? 'buildings' : 'tools'));
  useEffect(() => {
    if (focusRestore) document.getElementById('restore-title')?.scrollIntoView({ block: 'start' });
  }, [focusRestore]);
  const embellishOpen = level(game) >= Math.min(...EMBELLISHMENTS.map((entry) => entry.levels[0]));
  const page = view === 'embellish' && !embellishOpen ? 'tools' : view;
  const ready = (ids: readonly string[]) => ids.filter((id) => upgradePresentation(game, id).state === 'available').length;
  const embellishReady = EMBELLISHMENTS.filter((entry) => {
    const stage = embellishmentStage(game, entry.id);
    return stage < 3 && level(game) >= entry.levels[stage as 0 | 1 | 2] && game.coins >= entry.costs[stage as 0 | 1 | 2];
  }).length + RESTORATIONS.filter((entry) => {
    const stage = restorationStage(game, entry.id);
    return stage < 3 && level(game) >= entry.levels[stage as 0 | 1 | 2] && game.coins >= entry.costs[stage as 0 | 1 | 2];
  }).length;
  const tabs = [
    { id: 'tools' as const, label: 'Outils', count: ready(PAGES.tools) },
    { id: 'buildings' as const, label: 'Bâtiments', count: ready(PAGES.buildings) },
    ...(embellishOpen ? [{ id: 'embellish' as const, label: 'Embellissements', count: embellishReady }] : []),
  ];
  const switcher = (
    <fieldset className="upgrade-switch">
      <legend className="sr-only">Pages de la section Améliorer</legend>
      {tabs.map((tab) => (
        <button key={tab.id} type="button" aria-pressed={page === tab.id} data-view={tab.id} onClick={() => setView(tab.id)}
          aria-label={tab.count ? `${tab.label}, ${tab.count} disponible${tab.count > 1 ? 's' : ''}` : undefined}>
          {tab.label}{tab.count > 0 && <b className="upgrade-switch-count" aria-hidden="true">{tab.count}</b>}
        </button>
      ))}
    </fieldset>
  );
  if (page === 'embellish')
    return <div className="upgrade-catalogue">{switcher}<EmbellishPanel game={game} dispatch={dispatch} /></div>;
  const items = PAGES[page].map((id) => UPGRADES.find((item) => item.id === id)!);
  return (
    <div className="upgrade-catalogue">
      {switcher}
      <header>
        {page === 'tools' ? (
          <>
            <h3>Les outils de Rosalie</h3>
            <p>Avec eux, Rosalie arrose, récolte et sème d’elle-même, parcelle après parcelle, et poursuit si d’autres parcelles le demandent en route. Chaque palier rend son geste plus vif ; son Allant règle sa marche.</p>
          </>
        ) : (
          <>
            <h3>Les bâtiments et le terrain</h3>
            <p>Agrandir le jardin, l’irriguer, tracer des sentiers, puis bâtir l’atelier, le poulailler et équiper la cuisine.</p>
          </>
        )}
      </header>
      <div className="upgrade-grid">
        {items.map((upgrade) => {
          const presentation = upgradePresentation(game, upgrade.id);
          const path = UPGRADE_PATHS[upgrade.id as keyof typeof UPGRADE_PATHS];
          const tier = path ? upgradeTier(game, upgrade.id as keyof typeof UPGRADE_PATHS) : 0;
          const labels = {
            installed: 'Terminé', available: 'Disponible',
            saving: 'À économiser', future: 'Niveau ' + presentation.required,
            requires: 'Après : ' + presentation.needs,
          };
          return (
            <article key={upgrade.id} data-upgrade={upgrade.id} className={'upgrade-card state-' + presentation.state}>
              <span className="upgrade-state">{labels[presentation.state]}</span>
              <PixelIcon id={upgrade.id} />
              <h3>{upgrade.name}</h3>
              <p>{upgrade.desc}</p>
              {path ? (
                <div className="upgrade-steps" aria-label={tier + ' paliers sur 5'}>
                  {path.costs.map((cost, index) => (
                    <span key={index} data-done={index < tier || undefined}
                      title={'Palier ' + (index + 1) + ' · ' + cost + ' pièces'} />
                  ))}
                  <small>Palier {tier}/5 · geste de {((tier ? path.speeds[tier - 1] : path.speeds[0]) / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} s{tier > 0 && tier < 5 ? ' → ' + (path.speeds[tier] / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + ' s' : ''}</small>
                </div>
              ) : <small>{upgrade.id === 'expand' ? `${game.plots.length}/${PLOT_STEPS[PLOT_STEPS.length - 1]} parcelles` : 'Aménagement unique'}</small>}
              <small>{presentation.state === 'saving'
                ? 'Il manque ' + presentation.missing + ' pièces'
                : presentation.state === 'installed' ? 'Installé'
                : 'Coût : ' + presentation.cost + ' pièces'}</small>
              <button disabled={presentation.state !== 'available'}
                onClick={() => dispatch('upgrade', upgrade.id)}>
                {presentation.state === 'available'
                  ? path ? 'Améliorer au palier ' + (tier + 1)
                    : 'Aménager · ' + presentation.cost + ' pièces'
                  : labels[presentation.state]}
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
