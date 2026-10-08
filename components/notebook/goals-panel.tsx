'use client';
/**
 * 0.27 — Page Objectifs du carnet (maquette 11-objectifs de ChatGPT).
 *
 * Bandeau du jardin ; onglets À réclamer, En cours, Terminés ; une ligne par
 * objectif (icône de sa catégorie, titre, avancement, récompenses, action),
 * paginée ; en pied, le rappel des objectifs suivis (trois au plus).
 */
import { useState } from 'react';
import { CarnetBanner, CarnetPager, CarnetRewards, CarnetTabs } from '@/components/notebook/carnet';
import { CarnetIcon as PixelIcon } from '@/components/notebook/carnet-icon';
import { CarnetProgress } from '@/components/notebook/carnet-progress';
import { CROPS, GOALS, goalProgress, goalReward, goalVisible, type ActionArgument, type Game, type Goal } from '@/lib/game';
import { Glyph } from '@/components/glyph';
import { frenchNumber } from '@/lib/typography';

type View = 'ready' | 'active' | 'claimed';
const PER_PAGE = 4;
const CATEGORY_ICONS: Record<string, string> = { Village: 'commande', Cuisine: 'casserole', Collection: 'album', Maîtrise: 'loupe', Ferme: 'faucille' };

export function GoalsPanel({ game, dispatch }: { game: Game; dispatch: (action: string, argument?: ActionArgument) => unknown }) {
  const available = GOALS.filter((goal) => !game.claimed.includes(goal.id) && goalVisible(game, goal));
  const lists: Record<View, Goal[]> = {
    ready: available.filter((goal) => goalProgress(game, goal) >= goal.target),
    active: available.filter((goal) => goalProgress(game, goal) < goal.target),
    claimed: GOALS.filter((goal) => game.claimed.includes(goal.id)),
  };
  const [view, setView] = useState<View>(lists.ready.length ? 'ready' : 'active');
  const [pageIndex, setPageIndex] = useState<Record<string, number>>({});
  const shown: View = lists[view].length || view === 'active' ? view : 'active';
  const list = lists[shown];
  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  const page = Math.min(pageIndex[shown] || 0, pages - 1);
  const tracked = game.trackedGoals.length;

  return (
    <div className="carnet-stack goals-page">
      <CarnetBanner id="objectifs" focusY={50} />
      <CarnetTabs<View>
        label="Objectifs"
        value={shown}
        onChange={setView}
        items={[
          { id: 'ready', label: 'À réclamer', icon: 'planchette', count: lists.ready.length, hidden: !lists.ready.length },
          { id: 'active', label: `En cours · ${lists.active.length}`, short: 'En cours', icon: 'sablier' },
          { id: 'claimed', label: `Terminés · ${lists.claimed.length}`, short: 'Terminés', icon: 'laurier', hidden: !lists.claimed.length },
        ]}
      />
      <ul className="goal-rows" aria-label="Objectifs">
        {list.slice(page * PER_PAGE, (page + 1) * PER_PAGE).map((goal) => {
          const value = Math.min(goalProgress(game, goal), goal.target);
          const seeds = goal.seeds ? `${goal.seeds.amount} graines de ${(CROPS.find((c) => c.id === goal.seeds?.id)?.name || goal.seeds.id).toLowerCase()}` : '';
          const isTracked = game.trackedGoals.includes(goal.id);
          return (
            <li key={goal.id} className="goal-row" data-state={shown}>
              <span className="goal-row-art" aria-hidden="true">
                <PixelIcon id={CATEGORY_ICONS[goal.category] || 'planchette'} />
              </span>
              <div className="goal-row-main">
                <h4>{goal.title}</h4>
                <p>
                  {shown !== 'active' && <Glyph id="coche" />}
                  {goal.desc} · {frenchNumber(value)}
                  {' '}/{' '}
                  {frenchNumber(goal.target)}
                </p>
                <CarnetProgress value={value} max={goal.target} label={goal.title} valueText={`${frenchNumber(value)} sur ${frenchNumber(goal.target)}`} />
              </div>
              <CarnetRewards {...goalReward(game, goal)} extra={seeds ? [{ icon: 'sachet', label: seeds }] : []} />
              {shown === 'ready' ? (
                <button type="button" className="carnet-action" onClick={() => dispatch('mission', goal.id)}>
                  Réclamer
                </button>
              ) : shown === 'active' ? (
                <button
                  type="button"
                  className="carnet-secondary goal-track"
                  aria-pressed={isTracked}
                  disabled={!isTracked && tracked >= 3}
                  onClick={() => dispatch('trackGoal', goal.id)}
                >
                  {isTracked ? (
                    <>
                      <Glyph id="coche" /> Suivi
                    </>
                  ) : (
                    'Suivre'
                  )}
                </button>
              ) : (
                <span className="carnet-seal">Réclamé</span>
              )}
            </li>
          );
        })}
        {!list.length && <li className="carnet-list-empty">Tous les objectifs sont réclamés. De nouveaux défis arrivent avec les niveaux.</li>}
      </ul>
      <CarnetPager page={page} pages={pages} label="Pages des objectifs" onPage={(n) => setPageIndex({ ...pageIndex, [shown]: n })} />
      <p className="carnet-band carnet-band-current goals-note">
        <PixelIcon id="planchette" />
        <span>
          Suivez jusqu’à trois objectifs près du potager · {tracked}
          {' '}/{' '}3 suivis.
        </span>
      </p>
    </div>
  );
}
