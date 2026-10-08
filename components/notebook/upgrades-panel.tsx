'use client';
/**
 * 0.26 — Page Améliorer du carnet (maquette 06-ameliorer de ChatGPT).
 *
 * Bandeau du potager ; onglets Outils, Bâtiments, Embellissements, Domaine,
 * puis la Fête du village (dons) quand elle est ouverte ; à gauche la liste
 * paginée, à droite la fiche : paliers ou étapes, effet, coût, action.
 * Coûts, paliers, prérequis et états viennent du jeu (lib/farm-ui,
 * components/embellishments) ; chaque amélioration garde son icône.
 */
import { useState } from 'react';
import { CarnetBanner, CarnetPager, CarnetSegments, CarnetTabs } from '@/components/notebook/carnet';
import { DomainThumb, EmbellishSprite, RESTORE_TITLE, embellishPresentation, restorationPresentation } from '@/components/embellishments';
import { CarnetIcon as PixelIcon } from '@/components/notebook/carnet-icon';
import { DONATION_PROJECT, DONATION_TITLES, FEAST_DECOR, embellishmentEffect } from '@/lib/embellishments';
import { RESTORATIONS, restorationEffect } from '@/lib/restorations';
import { EMBELLISHMENTS, PLOT_STEPS, PROJECTS, UPGRADES, UPGRADE_PATHS, donationCost, donationSouvenir, donationTitle, donationsOpen, embellishmentStage, level, restorationStage, upgradeTier, type ActionArgument, type Game } from '@/lib/game';
import { upgradePresentation } from '@/lib/farm-ui';
import { UPGRADE_ICONS } from '@/lib/pixel-icons';
import { frenchNumber, frenchText } from '@/lib/typography';
import { Glyph } from '@/components/glyph';

type Dispatch = (action: string, argument?: ActionArgument) => unknown;
type View = 'tools' | 'buildings' | 'embellish' | 'domain' | 'feast';
const PER_PAGE = 5;
// 0.11.2 : trois pages dans « Améliorer » : les outils de Rosalie, les bâtiments et le terrain,
// les embellissements (dès le niveau 4). 0.26 : le domaine et la fête ont leur onglet.
const PAGES = {
  tools: ['watering-can', 'tools', 'auto'],
  buildings: ['expand', 'water', 'paths', 'workshop', 'coop', 'stove2', 'marmite', 'stove3'],
} as const;
const TAB_ICONS: Record<View, string> = { tools: 'outils', buildings: 'atelier', embellish: 'fontaine', domain: 'cagette', feast: 'laurier' };
const STATE_CHIP: Record<string, { tone: string; label: (n: string) => string }> = {
  installed: { tone: 'ok', label: () => 'Installé' },
  done: { tone: 'ok', label: () => 'Achevé' },
  available: { tone: 'ok', label: () => 'Disponible' },
  saving: { tone: 'warn', label: () => 'À économiser' },
  future: { tone: 'muted', label: (n) => `Niv. ${n}` },
  requires: { tone: 'muted', label: () => 'Plus tard' },
};

type Row = { id: string; name: string; icon: string; state: string; required: number; ready: boolean };

export function UpgradesPanel({
  game, dispatch, focusRestore = false,
}: {
  game: Game;
  /** 0.13 : ouvert depuis un lieu de l’anneau, sur « Restaurer le domaine ». */
  focusRestore?: boolean;
  dispatch: Dispatch;
}) {
  const embellishOpen = level(game) >= Math.min(...EMBELLISHMENTS.map((entry) => entry.levels[0]));
  const feastOpen = donationsOpen(game);
  // Au niveau 1, seul « Un jardin plus grand » est ouvert : on commence par les bâtiments.
  const [view, setView] = useState<View>(() => (focusRestore ? 'domain' : level(game) < 2 ? 'buildings' : 'tools'));
  const [chosen, setChosen] = useState<Record<string, string>>({});
  const [pageIndex, setPageIndex] = useState<Record<string, number>>({});
  // Ouvert depuis un lieu de la carte : la page est recréée (clé) sur l’onglet Domaine.
  const page: View = (view === 'embellish' || view === 'domain') && !embellishOpen ? 'tools' : view === 'feast' && !feastOpen ? 'embellish' : view;

  const upgradeRows = (ids: readonly string[]): Row[] =>
    ids.map((id) => {
      const upgrade = UPGRADES.find((item) => item.id === id)!;
      const p = upgradePresentation(game, id);
      return { id, name: upgrade.name, icon: UPGRADE_ICONS[id], state: p.state, required: p.required, ready: p.state === 'available' };
    });
  const embellishRows: Row[] = EMBELLISHMENTS.map((entry) => {
    const p = embellishPresentation(game, entry);
    return { id: entry.id, name: entry.name, icon: entry.id, state: p.state, required: p.required, ready: p.state === 'available' };
  });
  const domainRows: Row[] = RESTORATIONS.map((entry) => {
    const p = restorationPresentation(game, entry);
    return { id: entry.id, name: entry.name, icon: 'cagette', state: p.state, required: p.required, ready: p.state === 'available' };
  });
  const lists: Record<string, Row[]> = {
    tools: upgradeRows(PAGES.tools),
    buildings: upgradeRows(PAGES.buildings),
    embellish: embellishRows,
    domain: domainRows,
  };
  const count = (rows: Row[]) => rows.filter((row) => row.ready).length;
  const tabs = [
    { id: 'tools' as const, label: 'Outils', icon: TAB_ICONS.tools, count: count(lists.tools) },
    { id: 'buildings' as const, label: 'Bâtiments', icon: TAB_ICONS.buildings, count: count(lists.buildings) },
    { id: 'embellish' as const, label: 'Embellissements', short: 'Embellir', icon: TAB_ICONS.embellish, count: count(lists.embellish), hidden: !embellishOpen },
    { id: 'domain' as const, label: 'Domaine', icon: TAB_ICONS.domain, count: count(lists.domain), hidden: !embellishOpen },
    { id: 'feast' as const, label: 'Fête', icon: TAB_ICONS.feast, hidden: !feastOpen },
  ];
  const rows = lists[page] || [];
  const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const current = Math.min(pageIndex[page] || 0, pages - 1);
  const selected = rows.find((row) => row.id === chosen[page]) || rows.find((row) => row.ready) || rows[0];
  const choose = (id: string) => setChosen({ ...chosen, [page]: id });

  return (
    <div className="carnet-stack upgrades-page">
      <CarnetBanner id="ameliorer" />
      <CarnetTabs<View> label="Pages de la section Améliorer" value={page} onChange={setView} items={tabs} />
      {page === 'feast' ? (
        <Feast game={game} dispatch={dispatch} />
      ) : (
        <div className="carnet-split">
          <div className="carnet-list-column">
            <ul className="carnet-list" aria-label={tabs.find((tab) => tab.id === page)?.label}>
              {rows.slice(current * PER_PAGE, (current + 1) * PER_PAGE).map((row) => {
                const chip = STATE_CHIP[row.state];
                return (
                  <li key={row.id}>
                    <button type="button" className="carnet-row" data-carnet-item={row.id} aria-pressed={selected?.id === row.id} onClick={() => choose(row.id)}>
                      <span className="carnet-row-art" aria-hidden="true">
                        <PixelIcon id={row.icon} />
                      </span>
                      <span className="carnet-row-label">
                        <b>{row.name}</b>
                      </span>
                      <span className="carnet-chip" data-tone={chip.tone}>
                        {(row.state === 'installed' || row.state === 'done') && <Glyph id="coche" />}
                        {(row.state === 'future' || row.state === 'requires') && <PixelIcon id="cadenas" className="inline-icon" />}
                        {chip.label(String(row.required))}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <CarnetPager page={current} pages={pages} label="Pages des améliorations" onPage={(n) => setPageIndex({ ...pageIndex, [page]: n })} />
          </div>
          {selected &&
            (page === 'embellish' ? (
              <EmbellishDetail game={game} id={selected.id} dispatch={dispatch} />
            ) : page === 'domain' ? (
              <RestoreDetail game={game} id={selected.id} dispatch={dispatch} />
            ) : (
              <UpgradeDetail game={game} id={selected.id} dispatch={dispatch} />
            ))}
        </div>
      )}
    </div>
  );
}

function UpgradeDetail({ game, id, dispatch }: { game: Game; id: string; dispatch: Dispatch }) {
  const upgrade = UPGRADES.find((item) => item.id === id)!;
  const presentation = upgradePresentation(game, id);
  const path = UPGRADE_PATHS[id as keyof typeof UPGRADE_PATHS];
  const tier = path ? upgradeTier(game, id as keyof typeof UPGRADE_PATHS) : 0;
  const seconds = (ms: number) => (ms / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 2 });
  const labels = {
    installed: 'Terminé',
    available: 'Disponible',
    saving: `Il manque ${frenchNumber(presentation.missing)} pièces`,
    future: 'Niveau ' + presentation.required,
    requires: 'Après : ' + presentation.needs,
  };
  return (
    <article className="carnet-detail" data-upgrade={id} aria-labelledby={`upgrade-${id}`}>
      <header className="carnet-detail-head">
        <span className="carnet-detail-art" aria-hidden="true">
          <PixelIcon id={UPGRADE_ICONS[id]} />
        </span>
        <div>
          <h4 id={`upgrade-${id}`}>{upgrade.name}</h4>
          {path ? (
            <>
              <p className="carnet-detail-sub">
                Palier {tier}/5 · geste de {seconds(tier ? path.speeds[tier - 1] : path.speeds[0])}{' '}s
                {tier > 0 && tier < 5 ? ` → ${seconds(path.speeds[tier])} s` : ''}
              </p>
              <CarnetSegments value={tier} max={5} segments={5} label={`${tier} paliers sur 5`} />
            </>
          ) : (
            <p className="carnet-detail-sub">{id === 'expand' ? `${game.plots.length}/${PLOT_STEPS[PLOT_STEPS.length - 1]} parcelles` : 'Aménagement unique'}</p>
          )}
        </div>
      </header>
      <p className="carnet-text">{upgrade.desc}</p>
      {path && (
        <ol className="carnet-tiers" aria-label="Paliers">
          {path.costs.map((cost, index) => (
            <li key={index} data-done={index < tier || undefined} data-next={index === tier || undefined}>
              <b>{index + 1}</b>
              <span>Niv.{' '}{path.levels[index]}</span>
              <small>{frenchNumber(cost)}{' '}◉</small>
            </li>
          ))}
        </ol>
      )}
      <p className="carnet-status" data-tone={presentation.state === 'available' || presentation.state === 'installed' ? 'ok' : presentation.state === 'saving' ? 'warn' : 'muted'}>
        {presentation.state === 'installed' ? 'Installé' : presentation.state === 'available' ? `Coût : ${frenchNumber(presentation.cost)} pièces` : labels[presentation.state]}
      </p>
      <div className="carnet-detail-actions">
        <button type="button" className="carnet-primary" disabled={presentation.state !== 'available'} onClick={() => dispatch('upgrade', id)}>
          <PixelIcon id="outils" />
          {presentation.state === 'available'
            ? path
              ? `Améliorer au palier ${tier + 1}`
              : `Aménager · ${frenchNumber(presentation.cost)} pièces`
            : labels[presentation.state]}
        </button>
      </div>
    </article>
  );
}

function Stages({ costs, levels, stage }: { costs: readonly number[]; levels: readonly number[]; stage: number }) {
  return (
    <ol className="carnet-tiers" aria-label={`${stage} étapes sur 3`}>
      {costs.map((cost, index) => (
        <li key={index} data-done={index < stage || undefined} data-next={index === stage || undefined}>
          <b>{index + 1}</b>
          <span>Niv.{' '}{levels[index]}</span>
          <small>{frenchNumber(cost)}{' '}◉</small>
        </li>
      ))}
    </ol>
  );
}

function EmbellishDetail({ game, id, dispatch }: { game: Game; id: string; dispatch: Dispatch }) {
  const entry = EMBELLISHMENTS.find((item) => item.id === id)!;
  const view = embellishPresentation(game, entry);
  const next = view.stage < 3 ? ((view.stage + 1) as 1 | 2 | 3) : null;
  return (
    <article className="carnet-detail" aria-labelledby={`embellish-${id}`}>
      <header className="carnet-detail-head">
        <span className="carnet-detail-art carnet-detail-sprite" aria-hidden="true">
          <EmbellishSprite entry={entry} stage={view.stage || 1} ghost={!view.stage} />
        </span>
        <div>
          <h4 id={`embellish-${id}`}>{entry.name}</h4>
          <p className="carnet-detail-sub">{entry.system}</p>
          <CarnetSegments value={view.stage} max={3} segments={3} label={`${view.stage} étapes sur 3`} />
        </div>
      </header>
      <p className="carnet-text">{view.stage ? frenchText(`Étape ${view.stage}/3 : ${entry.stages[view.stage - 1]}. ${embellishmentEffect(entry, view.stage as 1 | 2 | 3)}`) : 'Pas encore construit.'}</p>
      {next && (
        <p className="carnet-band">
          <PixelIcon id={entry.id} />
          <span>{frenchText(`${view.stage ? 'Étape suivante' : 'Première étape'} : ${entry.stages[next - 1]}. ${embellishmentEffect(entry, next)}`)}</span>
        </p>
      )}
      <Stages costs={entry.costs} levels={entry.levels} stage={view.stage} />
      <div className="carnet-detail-actions">
        <button type="button" className="carnet-primary" disabled={!next || view.state !== 'available'} onClick={() => dispatch('embellish', { id: entry.id })} data-tutorial-embellish={entry.id}>
          <PixelIcon id={entry.id} />
          {!next
            ? 'Achevé'
            : view.state === 'available'
              ? `Construire · ${frenchNumber(view.cost)} pièces`
              : view.state === 'saving'
                ? `Il manque ${frenchNumber(view.missing)} pièces`
                : `Au niveau ${view.required} · ${frenchNumber(view.cost)} pièces`}
        </button>
      </div>
    </article>
  );
}

function RestoreDetail({ game, id, dispatch }: { game: Game; id: string; dispatch: Dispatch }) {
  const entry = RESTORATIONS.find((item) => item.id === id)!;
  const view = restorationPresentation(game, entry);
  const next = view.stage < 3 ? ((view.stage + 1) as 1 | 2 | 3) : null;
  return (
    <article className="carnet-detail" aria-labelledby="restore-title" data-restore={id}>
      <header className="carnet-detail-head">
        <span className="carnet-detail-art carnet-detail-sprite" aria-hidden="true">
          <DomainThumb id={entry.id} stage={view.stage} />
        </span>
        <div>
          <h4 id="restore-title">{entry.name}</h4>
          <p className="carnet-detail-sub">{RESTORE_TITLE} · {entry.system}</p>
          <CarnetSegments value={view.stage} max={3} segments={3} label={`${view.stage} étapes sur 3`} />
        </div>
      </header>
      <p className="carnet-text">{view.stage ? frenchText(`Étape ${view.stage}/3 : ${entry.stages[view.stage - 1]}. ${restorationEffect(entry, view.stage as 1 | 2 | 3)}`) : 'En friche.'}</p>
      {next && (
        <p className="carnet-band">
          <PixelIcon id="outils" />
          <span>{frenchText(`${view.stage ? 'Étape suivante' : 'Première étape'} : ${entry.stages[next - 1]}. ${restorationEffect(entry, next)}`)}</span>
        </p>
      )}
      <Stages costs={entry.costs} levels={entry.levels} stage={view.stage} />
      <div className="carnet-detail-actions">
        <button type="button" className="carnet-primary" disabled={!next || view.state !== 'available'} onClick={() => dispatch('renovate', { id: entry.id })}>
          <PixelIcon id="outils" />
          {!next
            ? 'Restauré'
            : view.state === 'available'
              ? `Restaurer · ${frenchNumber(view.cost)} pièces`
              : view.state === 'saving'
                ? `Il manque ${frenchNumber(view.missing)} pièces`
                : `Au niveau ${view.required} · ${frenchNumber(view.cost)} pièces`}
        </button>
      </div>
      <p className="carnet-note carnet-center">Cliquez sur un lieu de la carte pour revenir ici.</p>
    </article>
  );
}

/** La fête du village : les dons (après le grand banquet ou au niveau 25), le livre d’or. */
function Feast({ game, dispatch }: { game: Game; dispatch: Dispatch }) {
  const donations = game.donations || 0;
  const title = donationTitle(donations);
  const nextTitle = DONATION_TITLES.find((entry) => entry.count > donations);
  const cost = donationCost(donations);
  const banquet = PROJECTS.find((project) => project.id === DONATION_PROJECT);
  return (
    <div className="carnet-split">
      <section className="carnet-detail" aria-labelledby="feast-title">
        <header className="carnet-detail-head">
          <span className="carnet-detail-art" aria-hidden="true">
            <PixelIcon id="laurier" />
          </span>
          <div>
            <h4 id="feast-title">La fête du village</h4>
            <p className="carnet-detail-sub">
              {donations} don{donations > 1 ? 's' : ''}
              {title ? ` · ${frenchText(title)}` : ''}
            </p>
          </div>
        </header>
        <p className="carnet-text">{frenchText(`Vos dons financent la fête du village ouverte après ${banquet?.title.toLowerCase() || 'le grand banquet'} ou au niveau 25. Chacun ajoute un souvenir au livre d’or, jamais un bonus : c’est pour le plaisir de la vallée.`)}</p>
        <p className="carnet-band">
          <PixelIcon id="album" />
          <span>
            {frenchText(`Prochain souvenir : ${donationSouvenir(donations)}.`)}
            {nextTitle && <small>{frenchText(`Prochain titre à ${nextTitle.count} dons : ${nextTitle.title}`)}</small>}
          </span>
        </p>
        <div className="carnet-detail-actions">
          <button type="button" className="carnet-primary" disabled={game.coins < cost} onClick={() => dispatch('donate')}>
            <PixelIcon id="piece" />
            {game.coins < cost ? `Il manque ${frenchNumber(cost - game.coins)} pièces` : `Offrir ${frenchNumber(cost)} pièces`}
          </button>
        </div>
      </section>
      <section className="carnet-detail" aria-labelledby="feast-decor-title">
        <h5 className="carnet-rule" id="feast-decor-title">Décors de la fête</h5>
        <ul className="carnet-box-list">
          {FEAST_DECOR.map((decor) => (
            <li key={decor.id}>
              <span>{frenchText(decor.name)}</span>
              <span className="carnet-chip" data-tone={donations >= decor.count ? 'ok' : 'muted'}>
                {donations >= decor.count ? <Glyph id="coche" /> : null}
                {decor.count} don{decor.count > 1 ? 's' : ''}
              </span>
            </li>
          ))}
        </ul>
        {donations > 0 && (
          <details className="carnet-more">
            <summary>
              Le livre d’or · {donations} souvenir{donations > 1 ? 's' : ''}
            </summary>
            <ol reversed>
              {Array.from({ length: Math.min(donations, 30) }, (_, i) => donations - 1 - i).map((index) => (
                <li key={index}>{frenchText(donationSouvenir(index))}</li>
              ))}
            </ol>
          </details>
        )}
      </section>
    </div>
  );
}

/** Embellissements construisibles (pastille de la page) : voir lib/farm-ui. */
export const embellishReady = (game: Game) =>
  EMBELLISHMENTS.filter((entry) => {
    const stage = embellishmentStage(game, entry.id);
    return stage < 3 && level(game) >= entry.levels[stage as 0 | 1 | 2] && game.coins >= entry.costs[stage as 0 | 1 | 2];
  }).length +
  RESTORATIONS.filter((entry) => {
    const stage = restorationStage(game, entry.id);
    return stage < 3 && level(game) >= entry.levels[stage as 0 | 1 | 2] && game.coins >= entry.costs[stage as 0 | 1 | 2];
  }).length;
