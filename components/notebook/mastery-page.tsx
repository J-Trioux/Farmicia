'use client';
/**
 * 0.26 — Page Maîtrise du carnet (maquette 07-maitrise de ChatGPT).
 *
 * Bandeau du potager ; onglets des quatre familles de cultures, puis l’Allant
 * de Rosalie ; à gauche les cultures de la famille (paginées), à droite la
 * fiche : rang, points, prochain rang, et dès le rang 3 le choix du caractère
 * (Précoce, Abondante, Artisanale) avec son coût de changement. Valeurs et
 * descriptions exactes de lib/game.
 */
import { useState, type CSSProperties } from 'react';
import { CarnetBanner, CarnetPager, CarnetSegments, CarnetTabs } from '@/components/notebook/carnet';
import { CarnetIcon as PixelIcon } from '@/components/notebook/carnet-icon';
import { CarnetProgress } from '@/components/notebook/carnet-progress';
import { useGameClock } from '@/hooks/use-game-clock';
import { ALLANT_BASE, allant, allantPercent, allantSources, bulkElan, gardenCrossing } from '@/lib/allant';
import {
  CROPS,
  CROP_FAMILY_NAMES,
  SPECIALIZATIONS,
  cropFamily,
  cropMastery,
  cropMasterySteps,
  duration,
  growTime,
  level,
  masteryGain,
  specializationDescription,
  type ActionArgument,
  type CropFamily,
  type Game,
} from '@/lib/game';
import { Glyph } from '@/components/glyph';

type Dispatch = (action: string, argument?: ActionArgument) => unknown;
type View = CropFamily | 'allant';
const FAMILIES = ['primeurs', 'grains', 'legumes', 'fruits'] as const;
const FAMILY_SHORT: Record<CropFamily, string> = { primeurs: 'Primeurs', grains: 'Grains', legumes: 'Jardin', fruits: 'Fruits' };
const FAMILY_ICONS: Record<CropFamily, string> = { primeurs: 'radis', grains: 'ble', legumes: 'tomate', fruits: 'fraise' };
const SPEC_ICONS: Record<string, string> = { precoce: 'sablier', abondante: 'cagette', artisanale: 'etoile' };
const PER_PAGE = 5;

export function MasteryPage({ game, dispatch, now: snapshotNow }: { game: Game; dispatch: Dispatch; now: number }) {
  const now = useGameClock() || snapshotNow;
  const [view, setView] = useState<View>('primeurs');
  const [chosen, setChosen] = useState<Record<string, string>>({});
  const [pageIndex, setPageIndex] = useState<Record<string, number>>({});
  const open = (family: CropFamily) => CROPS.filter((c) => cropFamily(c.id) === family && c.level <= level(game));
  const all = (family: CropFamily) => CROPS.filter((c) => cropFamily(c.id) === family);
  const choosable = (id: string) => cropMastery(game, id) >= 3 && !game.specializations[id];
  const family = view === 'allant' ? null : view;
  const list = family ? open(family) : [];
  const later = family ? all(family).length - list.length : 0;
  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  const page = Math.min(pageIndex[view] || 0, pages - 1);
  const selected = list.find((c) => c.id === chosen[view]) || list.find((c) => choosable(c.id)) || list[0];

  return (
    <div className="carnet-stack mastery-page">
      <CarnetBanner id="maitrise" />
      <CarnetTabs<View>
        label="Familles de cultures"
        value={view}
        onChange={setView}
        items={[
          ...FAMILIES.map((f) => ({ id: f, label: CROP_FAMILY_NAMES[f], short: FAMILY_SHORT[f], icon: FAMILY_ICONS[f], count: open(f).filter((c) => choosable(c.id)).length, hidden: !open(f).length })),
          { id: 'allant' as const, label: 'Allant', icon: 'sentier' },
        ]}
      />
      {view === 'allant' ? (
        <Allant game={game} now={now} />
      ) : (
        <div className="carnet-split">
          <div className="carnet-list-column">
            <ul className="carnet-list" aria-label={family ? CROP_FAMILY_NAMES[family] : ''}>
              {list.slice(page * PER_PAGE, (page + 1) * PER_PAGE).map((c) => {
                const rank = cropMastery(game, c.id);
                return (
                  <li key={c.id}>
                    <button type="button" className="carnet-row" aria-pressed={selected?.id === c.id} onClick={() => setChosen({ ...chosen, [view]: c.id })}>
                      <span className="carnet-row-art" aria-hidden="true">
                        <PixelIcon id={c.id} />
                      </span>
                      <span className="carnet-row-label">
                        <b>{c.name}</b>
                        <small>{game.collection[c.id] || 0} récoltes</small>
                      </span>
                      <span className="carnet-chip" data-tone={choosable(c.id) ? 'ok' : rank === 5 ? 'ok' : 'muted'}>
                        {choosable(c.id) ? 'À choisir' : `Rang ${rank}/5`}
                      </span>
                    </button>
                  </li>
                );
              })}
              {later > 0 && (
                <li>
                  <div className="carnet-row" data-state="mystery">
                    <span className="carnet-row-art" aria-hidden="true">
                      <PixelIcon id="sachet" />
                    </span>
                    <span className="carnet-row-label">
                      <b>{later > 1 ? `${later} cultures à découvrir` : 'Une culture à découvrir'}</b>
                      <small>avec les prochains niveaux</small>
                    </span>
                  </div>
                </li>
              )}
            </ul>
            <CarnetPager page={page} pages={pages} label="Pages des cultures" onPage={(n) => setPageIndex({ ...pageIndex, [view]: n })} />
          </div>
          {selected && <CropDetail key={selected.id} game={game} id={selected.id} dispatch={dispatch} />}
        </div>
      )}
    </div>
  );
}

function CropDetail({ game, id, dispatch }: { game: Game; id: string; dispatch: Dispatch }) {
  const c = CROPS.find((entry) => entry.id === id)!;
  const rank = cropMastery(game, id);
  const xp = game.cropXP[id] || 0;
  const steps = cropMasterySteps(id);
  const next = steps[Math.min(rank, 4)];
  const current = game.specializations[id];
  const [pick, setPick] = useState<string>(current || '');
  const choice = SPECIALIZATIONS.find((entry) => entry.id === pick);
  const changing = !!current && pick !== current;
  return (
    <article className="carnet-detail" aria-labelledby={`crop-${id}`}>
      <header className="carnet-detail-head">
        <span className="carnet-detail-art" aria-hidden="true">
          <PixelIcon id={id} />
        </span>
        <div>
          <h4 id={`crop-${id}`}>{c.name}</h4>
          <p className="carnet-detail-sub">
            Maîtrise {rank}/5 · prochain semis {duration(growTime(game, id))}
          </p>
          <CarnetSegments value={rank} max={5} segments={5} label={`Rang ${rank} sur 5`} />
        </div>
      </header>
      <div className="carnet-progress-line">
        <CarnetProgress value={rank === 5 ? 1 : xp - steps[rank - 1]} max={rank === 5 ? 1 : next - steps[rank - 1]} label={`Maîtrise de ${c.name}`} valueText={rank === 5 ? 'Maîtrise accomplie' : `${xp} sur ${next} points`} />
        <small>{rank === 5 ? 'Maîtrise accomplie' : `${xp} / ${next} points · +${masteryGain(id)} par récolte`}</small>
      </div>
      <p className="carnet-band">
        <PixelIcon id="loupe" />
        <span>
          {rank < 2
            ? 'Prochain rang : croissance plus rapide.'
            : rank === 2
              ? 'Prochain rang : choisissez un caractère pour cette culture.'
              : rank === 3
                ? 'Prochain rang : plus de belles récoltes.'
                : rank === 4
                  ? 'Prochain rang : graines signature.'
                  : 'Graines signature actives.'}
        </span>
      </p>
      <h5 className="carnet-rule">
        Choisir un caractère
        {rank >= 3 && <small>{current ? 'changer : 25 pièces' : 'premier choix gratuit'}</small>}
      </h5>
      {rank < 3 ? (
        <p className="carnet-note">Le choix s’ouvre au rang 3.</p>
      ) : (
        <>
          <fieldset className="carnet-choices" style={{ '--choices': SPECIALIZATIONS.length } as CSSProperties}>
            <legend className="sr-only">Caractère de {c.name}</legend>
            {SPECIALIZATIONS.map((entry) => (
              <button key={entry.id} type="button" className="carnet-choice" aria-pressed={pick === entry.id} onClick={() => setPick(entry.id)}>
                <span className="carnet-tile-check" aria-hidden="true">
                  {pick === entry.id && <Glyph id="coche" />}
                </span>
                <PixelIcon id={SPEC_ICONS[entry.id] || 'etoile'} />
                <b>
                  {entry.name}
                  {current === entry.id ? ' · actuel' : ''}
                </b>
                <small>{specializationDescription(id, entry.id)}</small>
              </button>
            ))}
          </fieldset>
          <div className="carnet-detail-actions">
            <button
              type="button"
              className="carnet-primary"
              disabled={!choice || pick === current || (changing && game.coins < 25)}
              onClick={() => dispatch('specialize', { crop: id, specialization: pick })}
            >
              <PixelIcon id={id} />
              {!choice ? 'Choisissez un caractère' : pick === current ? `${choice.name} : choisi` : changing ? `Passer à ${choice.name} · 25 pièces` : `Choisir ${choice.name}`}
            </button>
          </div>
        </>
      )}
    </article>
  );
}

/** L’allant de Rosalie : sa vitesse de marche et ce qui la rend plus vive. */
function Allant({ game, now }: { game: Game; now: number }) {
  const speed = allant(game, now);
  const sources = allantSources(game, now);
  const percent = allantPercent(speed).toFixed(1).replace('.', ',');
  const crossing = gardenCrossing(speed).toFixed(1).replace('.', ',');
  return (
    <div className="carnet-split">
      <section className="carnet-detail" aria-labelledby="allant-title">
        <header className="carnet-detail-head">
          <span className="carnet-detail-art" aria-hidden="true">
            <PixelIcon id="sentier" />
          </span>
          <div>
            <h4 id="allant-title">L’allant de Rosalie</h4>
            <p className="carnet-score">
              <b>{percent}</b> %/s
            </p>
            <p className="carnet-detail-sub">Traverse le potager en {crossing}{' '}s</p>
          </div>
        </header>
        <p className="carnet-text">Le niveau, les Sentiers de gravier, l’habitude du potager (150, 600 puis 1 500 récoltes) et le jus des vendanges (Second souffle) la rendent plus vive.</p>
        <p className="carnet-text">
          Élan des tournées · récolter +{Math.round((bulkElan(game, 'harvest') - 1) * 100)} %, arroser +{Math.round((bulkElan(game, 'water') - 1) * 100)} %, semer +{Math.round((bulkElan(game, 'sow') - 1) * 100)} %. Chaque palier d’outil ajoute 6 %.
        </p>
      </section>
      <section className="carnet-detail" aria-labelledby="allant-sources">
        <h5 className="carnet-rule" id="allant-sources">Ce qui compte</h5>
        <ul className="carnet-box-list">
          {sources.map((source) => (
            <li key={source.id}>
              <span>{source.label}</span>
              <span className="carnet-chip" data-tone={source.factor > 1 || source.id === 'base' ? 'ok' : 'muted'}>
                {source.id === 'base' ? `${allantPercent(ALLANT_BASE).toFixed(0)} %/s` : source.factor > 1 ? `+${Math.round((source.factor - 1) * 100)} %` : '—'}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
