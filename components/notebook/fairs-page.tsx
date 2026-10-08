'use client';
/**
 * 0.25 — Page Foires du carnet (maquette 03-foires de ChatGPT).
 *
 * Deux foires, deux onglets, une même mise en page :
 *   - Foire des terroirs : un ou deux produits du panier à présenter (grille
 *     paginée), la note estimée et son détail, la récompense, « Présenter à la
 *     foire » ; une participation par saison, puis la saison suivante ;
 *   - Fête des Saveurs : un plat de l’atelier, sa note attendue, le jury du
 *     village, « Présenter ce plat », puis le dernier résultat et le meilleur
 *     souvenir.
 * L’écriteau du bandeau porte le vrai nom de la foire. Règles inchangées
 * (lib/game : fairEvaluation, festivalEvaluation).
 */
import { useState } from 'react';
import { CarnetBanner, CarnetHearts, CarnetPager, CarnetRewards, CarnetSegments, CarnetTabs } from '@/components/notebook/carnet';
import { CarnetIcon as PixelIcon } from '@/components/notebook/carnet-icon';
import { CarnetPortrait as VillagerPortrait } from '@/components/notebook/carnet-portrait';
import { useGameClock } from '@/hooks/use-game-clock';
import {
  FESTIVAL_AWARDS,
  FESTIVAL_THEMES,
  OUTCOMES,
  SEED_FIND_LEVEL,
  canAdvanceSeason,
  crop,
  dishName,
  dishParts,
  duration,
  fairCandidates,
  fairEntry,
  fairEvaluation,
  fairPay,
  festivalDishKeys,
  festivalEvaluation,
  festivalTheme,
  itemLabel,
  level,
  projectStatus,
  seasonFor,
  seasonReadyAt,
  type ActionArgument,
  type Game,
} from '@/lib/game';
import { Glyph } from '@/components/glyph';

type Dispatch = (action: string, argument?: ActionArgument) => unknown;
type View = 'terroirs' | 'saveurs';
/** Le jury de la Fête des Saveurs : les cinq voisins (index de leur portrait). */
const FESTIVAL_JURY = [
  { id: 'lucie', name: 'Lucie', portraitIndex: 1 },
  { id: 'marcel', name: 'Marcel', portraitIndex: 2 },
  { id: 'jeanne', name: 'Jeanne', portraitIndex: 3 },
  { id: 'clara', name: 'Clara', portraitIndex: 4 },
  { id: 'emile', name: 'Émile', portraitIndex: 5 },
] as const;
const PER_PAGE = 6;

/** Détail de la note de la foire des terroirs, avec le maximum de chaque part. */
const FAIR_PARTS = [
  ['quality', 'Qualité', 46],
  ['theme', 'Thème', 20],
  ['variety', 'Variété', 8],
  ['lineage', 'Lignée', 16],
  ['mastery', 'Maîtrise', 10],
  ['village', 'Village', 6],
] as const;
const FESTIVAL_PARTS = [
  ['quality', 'Qualité', 70],
  ['mastery', 'Maîtrise', 16],
  ['friendship', 'Amitiés', 10],
  ['affinity', 'Goûts du jury', 10],
  ['theme', 'Thème', 12],
  ['savoirFaire', 'Savoir-faire', 6],
] as const;

export function FairsPage({ game, dispatch }: { game: Game; dispatch: Dispatch }) {
  const status = projectStatus(game);
  const [view, setView] = useState<View>(status?.step.kind === 'fair' ? 'terroirs' : status?.step.kind === 'festival' ? 'saveurs' : 'terroirs');
  const season = seasonFor(game.season.index);
  const theme = festivalTheme(game);
  const hint =
    status && (status.step.kind === 'fair' || status.step.kind === 'festival')
      ? `${status.project.title} : obtenez au moins ${status.step.minScore}/100 à ${status.step.kind === 'fair' ? 'la foire des terroirs' : 'la Fête des Saveurs'}.`
      : '';
  return (
    <div className="carnet-stack fairs-page">
      <CarnetBanner
        id="foires"
        panelWidth={42}
        panel={
          <span className="carnet-panel-text">
            <b>{view === 'terroirs' ? season.label : theme.name}</b>
            <small>{view === 'terroirs' ? 'Foire des terroirs : un ou deux produits différents.' : `Fête des Saveurs · ${theme.tip}`}</small>
          </span>
        }
      />
      <CarnetTabs<View>
        label="Choisir une foire"
        value={view}
        onChange={setView}
        items={[
          { id: 'terroirs', label: 'Foire des terroirs', icon: 'rosette' },
          { id: 'saveurs', label: 'Fête des Saveurs', icon: 'laurier' },
        ]}
      />
      {hint && <p className="carnet-band carnet-band-current"><PixelIcon id="plan" /><span>{hint}</span></p>}
      {view === 'terroirs' ? <Terroirs game={game} dispatch={dispatch} /> : <Saveurs game={game} dispatch={dispatch} />}
    </div>
  );
}

function Terroirs({ game, dispatch }: { game: Game; dispatch: Dispatch }) {
  const now = useGameClock();
  const [chosen, setChosen] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const season = seasonFor(game.season.index);
  const candidates = fairCandidates(game).sort((a, b) => a.localeCompare(b, 'fr')).slice(0, 30);
  const selected = chosen.filter((key) => candidates.includes(key));
  const evaluation = fairEvaluation(game, selected);
  const entered = fairEntry(game);
  const pay = fairPay(game, evaluation.score);
  const progressDone = canAdvanceSeason(game);
  const waitMs = now ? seasonReadyAt(game) - now : 0;
  const advance = progressDone && waitMs <= 0;
  const pages = Math.max(1, Math.ceil(candidates.length / PER_PAGE));
  const shownPage = Math.min(page, pages - 1);
  const sameCrop = selected.length === 2 && selected[0].split('|')[0] === selected[1].split('|')[0];
  const honour = season.crops.map((id) => crop(id).name).join(' · ');

  if (level(game) < SEED_FIND_LEVEL)
    return (
      <div className="carnet-empty">
        <PixelIcon id="rosette" />
        <h4>La première foire ouvre au niveau {SEED_FIND_LEVEL}.</h4>
        <p>Elle n’a aucune date limite.</p>
      </div>
    );

  const nextSeason = (
    <section className="carnet-card fair-next" aria-labelledby="fair-next-title">
      <h5 className="carnet-rule" id="fair-next-title">La saison suivante</h5>
      <p className="carnet-note">
        Elle s’ouvre après cette foire, quatre récoltes et une livraison ou une préparation, au moins 8{' '}heures après la précédente. Aucune récolte n’expire.
      </p>
      <button
        type="button"
        className="carnet-secondary carnet-wide"
        disabled={!advance}
        onClick={() => {
          dispatch('seasonNext');
          setChosen([]);
        }}
      >
        {advance ? 'Choisir la saison suivante' : progressDone ? `Saison suivante dans ${duration(Math.ceil(waitMs / 1000))}` : 'Saison suivante : progression en cours'}
      </button>
    </section>
  );

  if (entered)
    return (
      <div className="carnet-split">
        <section className="carnet-detail" aria-labelledby="fair-done-title">
          <header className="carnet-detail-head">
            <span className="carnet-detail-art" aria-hidden="true">
              <PixelIcon id="rosette" />
            </span>
            <div>
              <h4 id="fair-done-title">Participation terminée</h4>
              <p className="carnet-score">
                <b>{entered.score}</b>
                {' '}/{' '}100
              </p>
            </div>
          </header>
          <ScoreParts parts={FAIR_PARTS} breakdown={entered.breakdown} />
          <CarnetRewards coins={entered.coins} xp={entered.xp} />
          <p className="carnet-note">Une seule participation par saison.</p>
        </section>
        {nextSeason}
      </div>
    );

  return (
    <div className="carnet-split">
      <div className="carnet-list-column">
        <div className="carnet-column-head">
          <h5 className="carnet-rule">Sélectionnez vos produits</h5>
          <p className="carnet-note">À l’honneur : {honour}. Les produits présentés sont consommés.</p>
        </div>
        {candidates.length ? (
          <ul className="carnet-grid" aria-label="Produits du panier">
            {candidates.slice(shownPage * PER_PAGE, (shownPage + 1) * PER_PAGE).map((key) => {
              const on = selected.includes(key);
              const [, quality] = itemLabel(game, key).split(' · ');
              return (
                <li key={key}>
                  <button
                    type="button"
                    className="carnet-tile"
                    aria-pressed={on}
                    onClick={() => setChosen((current) => (current.includes(key) ? current.filter((item) => item !== key) : current.length < 2 ? [...current, key] : [current[1], key]))}
                  >
                    <span className="carnet-tile-check" aria-hidden="true">{on && <Glyph id="coche" />}</span>
                    <PixelIcon id={key} />
                    <b>{itemLabel(game, key).split(' · ')[0]}</b>
                    <small>
                      {quality || 'Ordinaire'} · ×{game.stock[key]}
                    </small>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="carnet-list-empty">Le panier est vide. Récoltez une culture ou préparez un plat avant de participer.</p>
        )}
        <CarnetPager page={shownPage} pages={pages} label="Pages des produits" onPage={setPage} />
      </div>
      <section className="carnet-detail fair-detail" aria-labelledby="fair-title">
        <header className="carnet-detail-head">
          <span className="carnet-detail-art" aria-hidden="true">
            <PixelIcon id="rosette" />
          </span>
          <div>
            <h4 id="fair-title">Votre présentation</h4>
            <p className="carnet-score">
              <small>Note estimée</small> <b>{evaluation.score}</b>
              {' '}/{' '}100
            </p>
          </div>
        </header>
        <ScoreParts parts={FAIR_PARTS} breakdown={evaluation.breakdown} />
        <CarnetRewards coins={pay.coins} xp={pay.xp} />
        {sameCrop && <p className="carnet-note">Deux produits différents, pas deux fois la même culture.</p>}
        <div className="carnet-detail-actions">
          <button type="button" className="carnet-primary fair-submit" disabled={!selected.length || sameCrop} onClick={() => dispatch('fair', { items: selected })}>
            <PixelIcon id="rosette" />
            Présenter à la foire
          </button>
        </div>
        <p className="carnet-note carnet-center">Une participation par saison.</p>
      </section>
    </div>
  );
}

function Saveurs({ game, dispatch }: { game: Game; dispatch: Dispatch }) {
  const [chosen, setChosen] = useState('');
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState(0);
  const dishes = festivalDishKeys(game).slice(0, 6);
  const selected = dishes.includes(chosen) ? chosen : dishes[0] || '';
  const evaluation = festivalEvaluation(game, selected);
  const last = game.festival.lastEntry;
  const lastEvaluation = last ? festivalEvaluation(game, last.dish, last.themeId) : null;
  const lastTheme = FESTIVAL_THEMES.find((entry) => entry.id === last?.themeId);
  const lead = last?.leadJudge || evaluation.leadJudge;
  const pages = Math.max(1, Math.ceil(dishes.length / 4));
  const shownPage = Math.min(page, pages - 1);

  if (!game.upgrades.includes('workshop'))
    return (
      <div className="carnet-empty">
        <PixelIcon id="atelier" />
        <h4>La table de Rosalie n’est pas encore prête</h4>
        <p>Construisez l’atelier pour préparer un plat et rejoindre la Fête des Saveurs.</p>
      </div>
    );

  return (
    <div className="carnet-split">
      <div className="carnet-list-column">
        <ul className="carnet-list" aria-label="Plats à présenter">
          {dishes.slice(shownPage * 4, (shownPage + 1) * 4).map((id) => {
            const e = festivalEvaluation(game, id);
            return (
              <li key={id}>
                <button type="button" className="carnet-row" aria-pressed={selected === id} onClick={() => setChosen(id)}>
                  <span className="carnet-row-art" aria-hidden="true">
                    <PixelIcon id={id} />
                  </span>
                  <span className="carnet-row-label">
                    <b>{dishName(id).split(' · ')[0]}</b>
                    <small>
                      {OUTCOMES.find((o) => o.id === dishParts(id).qualityId)?.name} · ×{game.stock[id]}
                    </small>
                  </span>
                  <span className="carnet-chip" data-tone={e.matches ? 'ok' : 'muted'}>
                    {e.score}/100
                  </span>
                </button>
              </li>
            );
          })}
          {!dishes.length && <li className="carnet-list-empty">Aucun plat cuisiné n’attend dans le panier. Préparez une recette à l’atelier, puis revenez la présenter.</li>}
        </ul>
        <CarnetPager page={shownPage} pages={pages} label="Pages des plats" onPage={setPage} />
        {last && lastEvaluation && (
          <section className="carnet-card festival-last" aria-labelledby="festival-last-title">
            <h5 className="carnet-rule" id="festival-last-title">Dernière fête</h5>
            <p>
              <b>{dishName(last.dish)}</b> · {last.score}/100 · {FESTIVAL_AWARDS.find((a) => a.id === last.award)?.name}
            </p>
            <p className="carnet-note">
              « {lastEvaluation.reactions.find((r) => r.judge === last.leadJudge)?.text} »{lastTheme ? ` · thème : ${lastTheme.name}` : ''}
            </p>
            {game.festival.bestDish && game.festival.bestAward && (
              <p className="carnet-note">
                Meilleur souvenir : {dishName(game.festival.bestDish)} · {game.festival.bestScore}/100 · {FESTIVAL_AWARDS.find((a) => a.id === game.festival.bestAward)?.name}
              </p>
            )}
          </section>
        )}
      </div>
      <section className="carnet-detail festival-detail" aria-labelledby="festival-title">
        <header className="carnet-detail-head">
          <span className="carnet-detail-art" aria-hidden="true">
            <PixelIcon id={selected || 'laurier'} />
          </span>
          <div>
            <h4 id="festival-title">{selected ? dishName(selected).split(' · ')[0] : 'Votre présentation'}</h4>
            <p className="carnet-score">
              <small>Note attendue</small> <b>{selected ? evaluation.score : 0}</b>
              {' '}/{' '}100
            </p>
            {selected && <p className="carnet-detail-sub">{evaluation.award.name}{evaluation.matches ? ' · accordé au thème' : ''}</p>}
          </div>
        </header>
        {selected && <ScoreParts parts={FESTIVAL_PARTS} breakdown={evaluation.breakdown} compact />}
        <ul className="festival-jury-row" aria-label="Le jury du village">
          {FESTIVAL_JURY.map((juror) => (
            <li key={juror.id} data-lead={juror.id === lead || undefined}>
              <VillagerPortrait index={juror.portraitIndex} />
              <b>{juror.name}</b>
              <CarnetHearts value={game.relations[juror.id] || 0} />
              {juror.id === lead && <small>Juge du jour</small>}
            </li>
          ))}
        </ul>
        <div className="carnet-detail-actions">
          <button
            type="button"
            className="carnet-primary"
            disabled={!selected || busy}
            onClick={async () => {
              setBusy(true);
              try {
                await dispatch('festival', { item: selected });
              } finally {
                setBusy(false);
              }
            }}
          >
            <PixelIcon id="laurier" />
            {busy ? 'Le jury goûte…' : 'Présenter ce plat'}
          </button>
        </div>
        <p className="carnet-note carnet-center">Présentations : {game.festival.entries}</p>
      </section>
    </div>
  );
}

function ScoreParts({
  parts,
  breakdown,
  compact = false,
}: {
  parts: readonly (readonly [string, string, number])[];
  breakdown: Record<string, number>;
  compact?: boolean;
}) {
  return (
    <dl className="carnet-score-parts" data-compact={compact || undefined}>
      {parts.map(([key, label, max]) => (
        <div key={key}>
          <dt>{label}</dt>
          <dd>
            <CarnetSegments value={breakdown[key] || 0} max={max} segments={5} />
            <span>
              {breakdown[key] || 0}
              {' '}/{' '}
              {max}
            </span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
