'use client';
import { useGameClock } from '@/hooks/use-game-clock';
import { useState } from 'react';
import {
  CROPS,
  RECIPES,
  OUTCOMES,
  cropMastery,
  recipeMastery,
  recipeLock,
  duration,
  defaultIngredients,
  ingredientKeys,
  itemLabel,
  validIngredients,
  cookingProbabilities,
  cookTime,
  MARMITE_TIME,
  freeStove,
  stoveCount,
  DISH_EFFECTS,
  ingredientQuality,
  itemName,
  type ActionArgument,
  type Game,
  type Recipe,
} from '@/lib/game';
import { ContextualPixelIcon as PixelIcon } from '@/components/notebook/carnet-icon';
import type { AskConfirm } from '@/components/game-confirm';
type Props = {
  g: Game;
  dispatch: (action: string, arg?: ActionArgument) => unknown;
  now?: number;
};
/** 0.9.5 : l’Allant de Rosalie, ses sources et ce qu’il change. */



/**
 * 0.17.5 : lancer une recette (fiche ou carte de la cuisine). Une belle
 * récolte n’est jamais consommée sans confirmation.
 */
export function startCooking(
  g: Game,
  r: Recipe,
  keys: string[],
  portions: 1 | 2,
  dispatch: Props['dispatch'],
  askConfirm: AskConfirm,
  done?: () => void,
) {
  const submit = () => {
    dispatch('craft', { id: r.id, ingredients: keys, portions });
    done?.();
  };
  const superior = keys.filter((id) => itemName(id).includes('Belle') || itemName(id).includes('Exceptionnelle'));
  if (superior.length) askConfirm({
    title: 'Cuisiner avec une belle récolte ?',
    description: 'Cette recette peut utiliser des ingrédients ordinaires. Les ingrédients ci-dessous seront consommés.',
    items: keys.map((id) => itemLabel(g, id) + (portions === 2 ? ' × 2' : '')),
    confirmLabel: 'Préparer ce plat',
  }, submit);
  else submit();
}
export function RecipeCard({ g, dispatch, r, now: snapshotNow, askConfirm, freeSlots, openOptions = false }: Props & { r: Recipe; askConfirm: AskConfirm; freeSlots?: number; /** 0.24 : choix des récoltes déjà ouverts (Atelier du carnet). */ openOptions?: boolean }) {
  const now = useGameClock() || snapshotNow;
  const [selection, setSelection] = useState<string[] | null>(null);
  // 0.9.9 : grande marmite, deux portions d’un coup.
  const [double, setDouble] = useState(false);
  // 0.17.4 : les ingrédients sautent dans la marmite quand Rosalie part cuisiner.
  const [sent, setSent] = useState(0);
  const keys = selection || defaultIngredients(g, r),
    probabilities = cookingProbabilities(g, r.id, keys, now),
    effect = DISH_EFFECTS[r.parent || r.id],
    lock = recipeLock(g, r);
  const portions = double && g.upgrades.includes('marmite') ? 2 : 1;
  const enough = validIngredients(g, r, keys, portions);
  const slotsFree = freeSlots ?? (freeStove(g) >= 0 ? 1 : 0);
  const slots = Object.entries(r.needs).flatMap(
    ([id, n]) => Array(n).fill(id) as string[],
  );
  const time = cookTime(g, r, now, keys) * (portions === 2 ? MARMITE_TIME : 1);
  const best = OUTCOMES.reduce((top, q, i) => (probabilities[i] > probabilities[top] ? i : top), 0);
  const ingredients = Object.entries(keys.reduce<Record<string, number>>((counts, key) => {
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {}));
  return (
    <article className="crop-card recipe-card atelier-recipe">
      <header className="recipe-head">
        <PixelIcon id={r.id} className="catalog-icon" />
        <div>
          <h3>{r.name}</h3>
          <p>
            <b className="mastery-stars" aria-label={`Maîtrise ${recipeMastery(g, r.id)} sur 5`}>
              <span aria-hidden="true">{'★'.repeat(recipeMastery(g, r.id))}<i>{'★'.repeat(5 - recipeMastery(g, r.id))}</i></span>
            </b>{' '}
            · {g.recipeXP[r.parent || r.id] || 0} préparations
          </p>
        </div>
        <dl className="recipe-facts">
          <div><dt>Cuisson</dt><dd>{duration(time)}</dd></div>
          <div><dt>Valeur</dt><dd>{r.price * portions} ◉</dd></div>
        </dl>
      </header>
      {effect && (
        <p className="recipe-effect">
          À déguster : <b>{effect.name}</b> · {effect.desc}
        </p>
      )}
      <div className="recipe-counter" aria-label="Ingrédients choisis et stock disponible">
        <b>Sur le plan de travail</b>
        <ul key={`sent-${sent}`} data-sent={sent > 0 || undefined}>{ingredients.map(([id, count]) => {
          const needed = count * portions;
          const owned = g.stock[id] || 0;
          return <li key={id} data-missing={owned < needed || undefined}>
            <PixelIcon id={id} />
            <span>{itemLabel(g, id)}</span>
            <b>{owned} / {needed}</b>
          </li>;
        })}</ul>
      </div>
      {g.upgrades.includes('marmite') && (
        <div className="marmite-toggle">
          <input id={'marmite-' + r.id} type="checkbox" checked={double} onChange={(e) => setDouble(e.target.checked)} />
          <label htmlFor={'marmite-' + r.id}>
            Grande marmite · 2 portions
            <small>Ingrédients doublés, cuisson {MARMITE_TIME.toLocaleString('fr-FR')} fois plus longue.</small>
          </label>
        </div>
      )}
      <button
        className="primary-button atelier-cook"
        disabled={!slotsFree || !!lock || !enough}
        onClick={() => startCooking(g, r, keys, portions, dispatch, askConfirm, () => {
          setSelection(null);
          setSent((n) => n + 1);
        })}
      >
        {lock ||
          (!slotsFree
            ? stoveCount(g) > 1 ? 'Tous les fourneaux sont occupés' : 'Le fourneau est occupé'
            : enough
              ? portions === 2 ? 'Envoyer Rosalie cuisiner 2 portions' : 'Envoyer Rosalie cuisiner'
              : 'Ingrédients insuffisants')}
        {sent > 0 && (
          <span key={`puff-${sent}`} className="cook-puff" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
        )}
      </button>
      {!r.parent && RECIPES.some((variant) => variant.parent === r.id) && (
        <small className="recipe-note">Variante signature : maîtrise 3 (6 préparations).</small>
      )}
      <div className="recipe-odds-brief" aria-label={`Chance principale : ${OUTCOMES[best].name}, ${Math.round(probabilities[best] * 100)} %`}>
        <span>Résultat le plus probable : <b>{OUTCOMES[best].name} · {Math.round(probabilities[best] * 100)} %</b></span>
        <div className="probability-bar" aria-hidden="true">
          {OUTCOMES.map((q, i) => (
            <span key={q.id} className={'odds-' + q.id} style={{ flexGrow: Math.max(0.001, probabilities[i]) }} />
          ))}
        </div>
      </div>
      <details className="recipe-options" open={openOptions}>
        <summary>Choisir d’autres récoltes et voir toutes les chances</summary>
        <div className="recipe-options-body">
          <fieldset className="ingredient-selection">
            <legend>Ingrédients{portions === 2 ? ' · par portion' : ''}</legend>
            {slots.map((id, index) => (
              <label key={index}>
                <PixelIcon id={keys[index] || id} />
                <span>Ingrédient {index + 1}</span>
                <select
                  aria-label={`${r.name}, ingrédient ${index + 1}`}
                  value={keys[index]}
                  onChange={(e) => {
                    const next = [...keys];
                    next[index] = e.target.value;
                    setSelection(next);
                  }}
                >
                  {[...new Set([keys[index], id, ...ingredientKeys(g, id)])].map((k) => (
                    <option key={k} value={k}>
                      {itemLabel(g, k)} ({g.stock[k] || 0} en stock)
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </fieldset>
          <div className="probabilities" aria-label="Chances du prochain plat">
            <ul>{OUTCOMES.map((q, i) => (
              <li key={q.id} className={'odds-' + q.id} data-best={i === best || undefined}>
                <span>{q.name}</span>
                <b>{(probabilities[i] * 100).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %</b>
              </li>
            ))}</ul>
          </div>
          <details className="recipe-odds-help">
            <summary>Ce qui influence ces chances</summary>
            <p>Qualité moyenne des ingrédients : {ingredientQuality(keys).toFixed(1)}/2. Maîtrise de cette recette : {recipeMastery(g, r.id)}/5.</p>
            <p>Maîtrise et régularité réduisent les plats rustiques. Précision favorise les plats réussis et savoureux ; créativité et chance favorisent les meilleurs plats.</p>
            <p>Culture des ingrédients : {Object.keys(r.needs).filter((id) => CROPS.some((crop) => crop.id === id)).map((id) =>
              CROPS.find((crop) => crop.id === id)?.name + ' ' + cropMastery(g, id) + '/5').join(', ')}. Voie cuisine : {g.skillChoices.cuisine || 'à choisir'}.
              Lucie : {g.relations.lucie || 0} cœurs (maîtrise) · Jeanne : {g.relations.jeanne || 0} (créativité) · Clara : {g.relations.clara || 0} (chance). Leur cinquième cœur ajoute 5 points au talent associé.</p>
          </details>
        </div>
      </details>
    </article>
  );
}
