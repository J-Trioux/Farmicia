'use client';
import { useState } from 'react';

import { FairPanel } from '@/components/lineages';
import {
  FESTIVAL_AWARDS,
  OUTCOMES,
  dishName,
  dishParts,
  festivalDishKeys,
  festivalEvaluation,
  festivalTheme,
  FESTIVAL_THEMES,
  projectStatus,
  type ActionArgument,
  type FestivalAwardId,
  type Game,
} from '@/lib/game';
import {
  FESTIVAL_JURY,
  FestivalPanel,
  type FestivalAward,
  type FestivalAwardTone,
} from './festival-panel';

const TONES: Record<FestivalAwardId, FestivalAwardTone> = {
  convive: 'participation',
  ruban: 'bronze',
  argent: 'silver',
  or: 'gold',
};

function award(id: FestivalAwardId): FestivalAward {
  const found = FESTIVAL_AWARDS.find((entry) => entry.id === id)!;
  return { label: found.name, tone: TONES[id] };
}

/** Relie le panneau de la Fête des Saveurs à l’état réel de la partie. */
export function FestivalTab({
  game,
  dispatch,
}: {
  game: Game;
  dispatch: (action: string, argument?: ActionArgument) => unknown;
}) {
  const status = projectStatus(game);
  const [view, setView] = useState<'village' | 'terroirs'>(status?.step.kind === 'fair' ? 'terroirs' : 'village');
  const theme = festivalTheme(game);
  const dishes = festivalDishKeys(game).slice(0, 6).map((id) => {
    const evaluation = festivalEvaluation(game, id);
    return {
      id,
      name: dishName(id).split(' · ')[0],
      iconId: id,
      quality:
        OUTCOMES.find((o) => o.id === dishParts(id).qualityId)?.name || '',
      quantity: game.stock[id] || 0,
      note: `Note attendue ${evaluation.score}/100 · ${evaluation.award.name}`,
    };
  });
  const last = game.festival.lastEntry;
  const lastEvaluation = last ? festivalEvaluation(game, last.dish, last.themeId) : null;
  const lastTheme = FESTIVAL_THEMES.find((entry) => entry.id === last?.themeId);
  const lastBreakdown = last?.breakdown || lastEvaluation?.breakdown;
  const advice = !last ? '' : !lastBreakdown?.theme
    ? 'Pour gagner des points, choisissez un plat accordé au thème.'
    : (lastBreakdown.quality || 0) < 55
      ? 'Un meilleur résultat culinaire changera davantage la note que les autres bonus.'
      : (lastBreakdown.mastery || 0) < 12
        ? 'Préparer d’autres fois cette recette augmentera sa maîtrise.'
        : 'Les liens du village et le savoir-faire cuisine départagent les meilleurs plats.';
  return (
    <div className="festival-tab">
      <div className="festival-switch" aria-label="Choisir une foire">
        <button type="button" aria-pressed={view === 'village'} onClick={() => setView('village')}><b>Fête des Saveurs</b><small>Présentez un plat au jury du village</small></button>
        <button type="button" aria-pressed={view === 'terroirs'} onClick={() => setView('terroirs')}><b>Foire des terroirs</b><small>Présentez vos récoltes de la saison</small></button>
      </div>
      {view === 'terroirs' && <FairPanel game={game} dispatch={dispatch} />}
      {view === 'village' && <>
      {status?.step.kind === 'fair' && <p className="festival-project-hint">{status.project.title} : obtenez au moins {status.step.minScore}/100 à la foire des terroirs.</p>}
      {status?.step.kind === 'festival' && (
        <p className="festival-project-hint">
          {status.project.title} : obtenez au moins {status.step.minScore}/100
          pour faire avancer le projet.
        </p>
      )}
      <FestivalPanel
        unlocked={game.upgrades.includes('workshop')}
        dishes={dishes}
        themeName={theme.name}
        themeTip={theme.tip}
        lastThemeName={lastTheme?.name}
        improvement={advice}
        jurors={FESTIVAL_JURY.map((juror) => ({
          ...juror,
          hearts: game.relations[juror.id] || 0,
        }))}
        entries={game.festival.entries}
        featuredJurorId={festivalEvaluation(game, '').leadJudge}
        result={
          last && lastEvaluation
            ? {
                dishId: last.dish,
                dishName: dishName(last.dish),
                score: last.score,
                award: award(last.award),
                message:
                  lastEvaluation.reactions.find(
                    (reaction) => reaction.judge === last.leadJudge,
                  )?.text || '',
                judgeId: last.leadJudge,
                reactions: Object.fromEntries(
                  lastEvaluation.reactions.map((reaction) => [
                    reaction.judge,
                    reaction.text,
                  ]),
                ),
                breakdown: [
                  {
                    label: 'Qualité',
                    value: lastBreakdown?.quality || 0,
                    max: 70,
                  },
                  {
                    label: 'Maîtrise',
                    value: lastBreakdown?.mastery || 0,
                    max: 16,
                  },
                  {
                    label: 'Amitiés',
                    value: lastBreakdown?.friendship || 0,
                    max: 10,
                  },
                  {
                    label: 'Goûts du jury',
                    value: lastBreakdown?.affinity || 0,
                    max: 10,
                  },
                  { label: 'Accord au thème', value: lastBreakdown?.theme || 0, max: 12 },
                  { label: 'Savoir-faire cuisine', value: lastBreakdown?.savoirFaire || 0, max: 6 },
                ],
              }
            : null
        }
        best={
          game.festival.bestDish && game.festival.bestAward
            ? {
                dishName: dishName(game.festival.bestDish),
                score: game.festival.bestScore,
                award: award(game.festival.bestAward),
              }
            : null
        }
        onPresent={(id) => dispatch('festival', { item: id })}
      /></>}
    </div>
  );
}
