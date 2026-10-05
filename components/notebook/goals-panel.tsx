'use client';
/** Extrait de app/page.tsx (0.11.1), à comportement identique. */
import { CROPS, GOALS, goalProgress, type ActionArgument, type Game } from '@/lib/game';

export function GoalsPanel({
  game,
  dispatch,
}: {
  game: Game;
  dispatch: (action: string, argument?: ActionArgument) => unknown;
}) {
  const available = GOALS.filter((goal) => !game.claimed.includes(goal.id));
  const ready = available.filter((goal) => goalProgress(game, goal) >= goal.target);
  const active = available.filter((goal) => goalProgress(game, goal) < goal.target);
  const claimed = GOALS.filter((goal) => game.claimed.includes(goal.id));
  function card(goal: (typeof GOALS)[number], state: 'ready' | 'active' | 'claimed') {
    const value = goalProgress(game, goal);
    const reward = '+' + goal.reward + ' pièces · +' + goal.xp + ' XP' +
      (goal.seeds ? ' · ' + goal.seeds.amount + ' graines de ' + (CROPS.find((crop) => crop.id === goal.seeds?.id)?.name || goal.seeds.id) : '');
    return <article className={'goal-card goal-' + state} key={goal.id}>
      <div>
        <small className="goal-category">{goal.category}</small>
        <h4>{goal.title}</h4>
        <p>{goal.desc}</p>
        <progress value={Math.min(value, goal.target)} max={goal.target}
          aria-label={goal.title + ' : ' + Math.min(value, goal.target) + ' sur ' + goal.target} />
        <small>{Math.min(value, goal.target)} / {goal.target} · {reward}</small>
      </div>
      {state === 'ready' ? <button onClick={() => dispatch('mission', goal.id)}>Réclamer</button>
        : state === 'active' ? <button className="goal-track"
            aria-pressed={game.trackedGoals.includes(goal.id)}
            disabled={!game.trackedGoals.includes(goal.id) && game.trackedGoals.length >= 3}
            onClick={() => dispatch('trackGoal', goal.id)}>
            {game.trackedGoals.includes(goal.id) ? 'Suivi ✓' : 'Suivre'}
          </button> : <span className="goal-claimed">Réclamé ✓</span>}
    </article>;
  }
  return <div className="goal-book">
    <header><h3>Les petits et grands défis</h3><p>Suivez jusqu’à trois objectifs près du potager. Chaque récompense se réclame ici.</p></header>
    {ready.length > 0 && <section><h4>Récompenses à réclamer <b>{ready.length}</b></h4><div className="goal-list">{ready.map((goal) => card(goal, 'ready'))}</div></section>}
    <section><h4>En cours <b>{active.length}</b></h4><div className="goal-list">{active.map((goal) => card(goal, 'active'))}</div></section>
    {claimed.length > 0 && <details className="goal-archive"><summary>Objectifs terminés · {claimed.length}</summary>
      <div className="goal-list">{claimed.map((goal) => card(goal, 'claimed'))}</div></details>}
  </div>;
}
