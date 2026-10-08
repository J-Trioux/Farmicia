'use client';
/**
 * 0.26 — Page Lignées du carnet (maquette 08-lignees de ChatGPT).
 *
 * En tête, deux compteurs (graines à choisir, variétés conservées) à la place
 * du bandeau ; onglets Graines, Variétés, Terroirs ; liste paginée à gauche,
 * fiche à droite :
 *   - graine prometteuse : origine, nom à donner, caractères au choix avec leur
 *     compromis, « Choisir ce caractère », ou la laisser passer ;
 *   - variété conservée : génération, graines, caractères, bilan, multiplier,
 *     renommer ;
 *   - terroir : son effet, ses parcelles, son aménagement.
 * Mêmes règles qu’avant (actions selectSeed, discardSeed, propagateLineage,
 * renameLineage, amendTerroir).
 */
import { useState, type CSSProperties } from 'react';
import { CarnetPager, CarnetSegments, CarnetTabs } from '@/components/notebook/carnet';
import { ContextualPixelIcon as PixelIcon } from '@/components/notebook/carnet-icon';
import { AMENDMENTS, LINEAGE_SALE, TERROIRS, TRAITS, crop, level, lineageSeedEvery, price, propagationCost, terroirForPlot, type ActionArgument, type Game, type TraitId } from '@/lib/game';
import { Glyph } from '@/components/glyph';
import { useGameClock } from '@/hooks/use-game-clock';
import { frenchNumber } from '@/lib/typography';

type Props = { game: Game; dispatch: (action: string, argument?: ActionArgument) => unknown };
type View = 'finds' | 'lineages' | 'terroirs';
const PER_PAGE = 5;
const traitData = (id: TraitId) => TRAITS.find((entry) => entry.id === id)!;
const TRAIT_ICONS: Record<string, string> = { precoce: 'sablier', abondante: 'cagette', savoureuse: 'casserole', robuste: 'arrosoir', artisanale: 'etoile' };
const QUALITY = ['ordinaire', 'belle', 'exceptionnelle'];
const terroirPlots = (id: string) => (id === 'soleil' ? '1 à 6' : id === 'humide' ? '7 à 12' : '13 à 18');

export function LineagesPanel({ game, dispatch }: Props) {
  const [view, setView] = useState<View>(game.seedFinds.length ? 'finds' : game.lineages.length ? 'lineages' : 'finds');
  const [chosen, setChosen] = useState<Record<string, string>>({});
  const [pageIndex, setPageIndex] = useState<Record<string, number>>({});
  const rows: { id: string; icon: string; name: string; sub: string; chip: string; tone: string }[] =
    view === 'finds'
      ? game.seedFinds.map((find) => {
          const parent = game.lineages.find((lineage) => lineage.id === find.parentId);
          return {
            id: String(find.id),
            icon: find.crop,
            name: parent ? `Évolution de ${parent.name}` : `${crop(find.crop).name} prometteur`,
            sub: `Récolte ${find.sourceQuality}`,
            chip: 'À choisir',
            tone: 'ok',
          };
        })
      : view === 'lineages'
        ? game.lineages.map((lineage) => ({
            id: String(lineage.id),
            icon: lineage.crop,
            name: lineage.name,
            sub: `${crop(lineage.crop).name} · génération ${lineage.generation}/2`,
            chip: `${lineage.seeds} graine${lineage.seeds > 1 ? 's' : ''}`,
            tone: lineage.seeds ? 'ok' : 'muted',
          }))
        : TERROIRS.map((zone) => {
            const built = game.terroirBuilds.includes(zone.id);
            const open = game.plots.some((_, index) => terroirForPlot(index) === zone.id);
            return { id: zone.id, icon: zone.crops[0], name: zone.name, sub: `Parcelles ${terroirPlots(zone.id)}`, chip: built ? 'Aménagé' : open ? 'À aménager' : 'À défricher', tone: built ? 'ok' : 'muted' };
          });
  const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const page = Math.min(pageIndex[view] || 0, pages - 1);
  const selected = rows.find((row) => row.id === chosen[view]) || rows[0];

  return (
    <div className="carnet-stack lineages-page">
      <div className="carnet-counters">
        <span>
          <PixelIcon id="graine-doree" />
          <b>{game.seedFinds.length}</b> graine{game.seedFinds.length > 1 ? 's' : ''} à choisir
        </span>
        <span>
          <PixelIcon id="cagette" />
          <b>{game.lineages.length}</b> variété{game.lineages.length > 1 ? 's' : ''} conservée{game.lineages.length > 1 ? 's' : ''}
        </span>
        <span>
          <PixelIcon id="sentier" />
          <b>{game.terroirBuilds.length}/3</b> terroirs aménagés
        </span>
      </div>
      <CarnetTabs<View>
        label="Lignées"
        value={view}
        onChange={setView}
        items={[
          { id: 'finds', label: 'Graines', icon: 'graine-doree', count: game.seedFinds.length },
          { id: 'lineages', label: 'Variétés', icon: 'lineage' },
          { id: 'terroirs', label: 'Terroirs', icon: 'sentier' },
        ]}
      />
      <div className="carnet-split">
        <div className="carnet-list-column">
          <ul className="carnet-list" aria-label={view === 'finds' ? 'Graines à sélectionner' : view === 'lineages' ? 'Variétés conservées' : 'Terroirs'}>
            {rows.slice(page * PER_PAGE, (page + 1) * PER_PAGE).map((row) => (
              <li key={row.id}>
                <button type="button" className="carnet-row" aria-pressed={selected?.id === row.id} onClick={() => setChosen({ ...chosen, [view]: row.id })}>
                  <span className="carnet-row-art" aria-hidden="true">
                    <PixelIcon id={row.icon} />
                  </span>
                  <span className="carnet-row-label">
                    <b>{row.name}</b>
                    <small>{row.sub}</small>
                  </span>
                  <span className="carnet-chip" data-tone={row.tone}>
                    {row.chip}
                  </span>
                </button>
              </li>
            ))}
            {!rows.length && (
              <li className="carnet-list-empty">
                {view === 'finds'
                  ? 'Arrosez et récoltez : une belle récolte peut révéler une graine prometteuse. Les graines classiques restent toujours disponibles.'
                  : 'Choisissez un caractère pour une graine prometteuse : elle devient une variété de votre ferme.'}
              </li>
            )}
          </ul>
          <CarnetPager page={page} pages={pages} label="Pages des lignées" onPage={(n) => setPageIndex({ ...pageIndex, [view]: n })} />
        </div>
        {!selected && (
          <div className="carnet-detail carnet-empty">
            <PixelIcon id={view === 'finds' ? 'graine-doree' : 'lineage'} />
            <h4>{view === 'finds' ? 'Aucune graine à choisir' : 'Aucune variété pour l’instant'}</h4>
            <p>Une belle récolte, surtout arrosée, peut révéler une graine prometteuse.</p>
          </div>
        )}
        {selected &&
          (view === 'finds' ? (
            <FindDetail key={selected.id} game={game} id={Number(selected.id)} dispatch={dispatch} />
          ) : view === 'lineages' ? (
            <LineageDetail key={selected.id} game={game} id={Number(selected.id)} dispatch={dispatch} />
          ) : (
            <TerroirDetail game={game} id={selected.id} dispatch={dispatch} />
          ))}
      </div>
    </div>
  );
}

function FindDetail({ game, id, dispatch }: Props & { id: number }) {
  const find = game.seedFinds.find((entry) => entry.id === id);
  const [name, setName] = useState('');
  const [pick, setPick] = useState<TraitId | ''>('');
  if (!find) return null;
  const parent = game.lineages.find((lineage) => lineage.id === find.parentId);
  const trait = pick ? traitData(pick) : null;
  return (
    <article className="carnet-detail" aria-labelledby={`find-${id}`}>
      <header className="carnet-detail-head">
        <span className="carnet-detail-art" aria-hidden="true">
          <PixelIcon id={find.crop} />
        </span>
        <div>
          <h4 id={`find-${id}`}>{parent ? `Faire évoluer ${parent.name}` : `${crop(find.crop).name} prometteur`}</h4>
          <p className="carnet-detail-sub">
            Origine : {TERROIRS.find((zone) => zone.id === find.nativeTerroir)?.name} · récolte {find.sourceQuality}
          </p>
          {!parent && (
            <label className="carnet-field">
              <span className="sr-only">Nom de la variété</span>
              <input maxLength={24} value={name} placeholder={`${crop(find.crop).name} de Rosalie`} onChange={(event) => setName(event.target.value)} />
            </label>
          )}
        </div>
      </header>
      <h5 className="carnet-rule">Choisir un caractère</h5>
      <fieldset className="carnet-choices" style={{ '--choices': find.options.length } as CSSProperties}>
        <legend className="sr-only">Caractère de la variété</legend>
        {find.options.map((option) => {
          const data = traitData(option);
          return (
            <button key={option} type="button" className="carnet-choice" aria-pressed={pick === option} onClick={() => setPick(option)}>
              <span className="carnet-tile-check" aria-hidden="true">
                {pick === option && <Glyph id="coche" />}
              </span>
              <PixelIcon id={TRAIT_ICONS[option] || 'etoile'} />
              <b>{data.name}</b>
              <small>{data.effect}</small>
              <small className="carnet-choice-cost">Compromis : {data.tradeoff}</small>
            </button>
          );
        })}
      </fieldset>
      <div className="carnet-detail-actions">
        <button type="button" className="carnet-primary" disabled={!trait} onClick={() => trait && dispatch('selectSeed', { candidateId: find.id, trait: trait.id, name: name || undefined })}>
          <PixelIcon id="graine-doree" />
          {trait ? `Choisir ${trait.name}` : 'Choisissez un caractère'}
        </button>
      </div>
      <button type="button" className="carnet-link-button" onClick={() => dispatch('discardSeed', { candidateId: find.id })}>
        Laisser passer cette graine
      </button>
    </article>
  );
}

function LineageDetail({ game, id, dispatch }: Props & { id: number }) {
  const lineage = game.lineages.find((entry) => entry.id === id);
  const [name, setName] = useState(lineage?.name || '');
  const now = useGameClock();
  if (!lineage) return null;
  const { seeds: seedCost, coins: coinCost } = propagationCost(game, lineage.crop);
  return (
    <article className="carnet-detail" aria-labelledby={`lineage-${id}`}>
      <header className="carnet-detail-head">
        <span className="carnet-detail-art" aria-hidden="true">
          <PixelIcon id={lineage.crop} />
        </span>
        <div>
          <h4 id={`lineage-${id}`}>{lineage.name}</h4>
          <p className="carnet-detail-sub">
            {crop(lineage.crop).name} · terroir d’origine : {TERROIRS.find((zone) => zone.id === lineage.nativeTerroir)?.short}
          </p>
          <CarnetSegments value={lineage.generation} max={2} segments={2} label={`Génération ${lineage.generation} sur 2`} />
        </div>
      </header>
      <ul className="carnet-box-list">
        {lineage.traits.map((trait) => (
          <li key={trait}>
            <span>
              <b>{traitData(trait).name}</b> · {traitData(trait).effect}
              <small> {traitData(trait).tradeoff}</small>
            </span>
          </li>
        ))}
      </ul>
      <p className="carnet-note">
        {lineage.harvests} récoltes · {lineage.orders} commande{lineage.orders > 1 ? 's' : ''} · meilleure qualité : {QUALITY[lineage.bestQuality] || 'ordinaire'}
        {lineage.traits.length < 2 ? ' · prochaine évolution après trois récoltes de cette lignée.' : ''}
      </p>
      <div className="carnet-detail-actions">
        <button type="button" className="carnet-primary" disabled={game.coins < coinCost || (game.seeds[lineage.crop] || 0) < seedCost} onClick={() => dispatch('propagateLineage', { lineageId: lineage.id })}>
          <PixelIcon id="sachet" />
          Multiplier · +1 graine
        </button>
      </div>
      <p className="carnet-note carnet-center">
        {lineage.seeds} graine{lineage.seeds > 1 ? 's' : ''} de lignée · multiplier : {seedCost} graines classiques (vous en avez {game.seeds[lineage.crop] || 0}) et {frenchNumber(coinCost)} pièces
      </p>
      {/* 0.32.3 : ce que la lignée rapporte, pour juger si la multiplier vaut le coup. */}
      <p className="carnet-note carnet-center lineage-gain">
        Rapporte : {frenchNumber(price(game, `${lineage.crop}|ordinaire|l${lineage.id}`, now))} pièces la récolte au lieu de {frenchNumber(price(game, lineage.crop, now))} (+{Math.round((LINEAGE_SALE - 1) * 100)} %) · une graine rendue toutes les {lineageSeedEvery(game)} récoltes
      </p>
      <div className="carnet-box-row carnet-rename">
        <label className="carnet-field">
          <span className="sr-only">Nouveau nom</span>
          <input maxLength={24} value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <button type="button" className="carnet-action" disabled={!name.trim() || name === lineage.name} onClick={() => dispatch('renameLineage', { lineageId: lineage.id, name })}>
          Renommer
        </button>
      </div>
    </article>
  );
}

function TerroirDetail({ game, id, dispatch }: Props & { id: string }) {
  const zone = TERROIRS.find((entry) => entry.id === id)!;
  const config = AMENDMENTS.find((entry) => entry.terroir === zone.id)!;
  const openCount = game.plots.filter((_, index) => terroirForPlot(index) === zone.id).length;
  const open = openCount > 0;
  const built = game.terroirBuilds.includes(zone.id);
  return (
    <article className="carnet-detail" aria-labelledby={`terroir-${id}`} data-terroir={zone.id}>
      <header className="carnet-detail-head">
        <span className="carnet-detail-art" aria-hidden="true">
          <PixelIcon id={zone.crops[0]} />
        </span>
        <div>
          <h4 id={`terroir-${id}`}>{zone.name}</h4>
          <p className="carnet-detail-sub">
            Parcelles {terroirPlots(zone.id)} · {open ? `${openCount}/6 accessibles` : 'à défricher'}
          </p>
        </div>
      </header>
      <p className="carnet-text">{zone.effect}</p>
      <p className="carnet-note">Favorables : {zone.crops.map((c) => crop(c).name).join(' · ')}. Une culture peut pousser partout ; son terroir favori offre simplement un avantage.</p>
      <p className="carnet-band">
        <PixelIcon id="outils" />
        <span>
          <b>{config.name}</b> · {config.effect}
        </span>
      </p>
      <div className="carnet-detail-actions">
        <button type="button" className="carnet-primary" disabled={!open || built || level(game) < config.level || game.coins < config.cost} onClick={() => dispatch('amendTerroir', { terroir: zone.id })}>
          <PixelIcon id="outils" />
          {built ? 'Aménagé' : !open ? 'Terrain à ouvrir' : level(game) < config.level ? `Niveau ${config.level}` : `Aménager · ${config.cost} pièces`}
        </button>
      </div>
    </article>
  );
}
