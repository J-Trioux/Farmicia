'use client';
import { useState } from 'react';
import {
  CROPS,
  RECIPES,
  OUTCOMES,
  QUALITIES,
  SPECIALIZATIONS,
  QUESTS,
  VILLAGERS,
  HEART_STEPS,
  MASTERY_STEPS,
  cropMastery,
  recipeMastery,
  recipeLock,
  growTime,
  duration,
  defaultIngredients,
  validIngredients,
  cookingProbabilities,
  ingredientQuality,
  fulfillment,
  masteryGain,
  itemName,
  itemIcon,
  type ActionArgument,
  type Game,
  type Recipe,
} from '@/lib/game';
type Props = {
  g: Game;
  dispatch: (action: string, arg?: ActionArgument) => unknown;
};
export function CultureJournal({ g, dispatch }: Props) {
  return (
    <>
      <p className="progression-intro">
        Les cultures longues donnent davantage de points. Maîtrise 2 :
        croissance −10 % · 3 : spécialisation · 4 : meilleures qualités · 5 :
        une graine signature toutes les 5 récoltes.
      </p>
      <div className="catalog">
        {CROPS.map((c) => {
          const rank = cropMastery(g, c.id),
            xp = g.cropXP[c.id] || 0;
          return (
            <article className="crop-card" key={c.id}>
              <span className="catalog-icon">{c.icon}</span>
              <h3>{c.name}</h3>
              <b>Maîtrise {rank}/5</b>
              <small>
                {xp} points · +{masteryGain(c.id)} par récolte
                {rank < 5
                  ? ` · prochain palier : ${MASTERY_STEPS[rank]}`
                  : ' · graines signature actives'}
              </small>
              <progress
                aria-label={`Maîtrise de ${c.name}`}
                value={rank === 5 ? 1 : xp - MASTERY_STEPS[rank - 1]}
                max={
                  rank === 5 ? 1 : MASTERY_STEPS[rank] - MASTERY_STEPS[rank - 1]
                }
              />
              <small>Prochain semis : {duration(growTime(g, c.id))}</small>
              {rank < 3 ? (
                <p>
                  Spécialisation à {MASTERY_STEPS[2]} points · encore{' '}
                  {Math.max(0, MASTERY_STEPS[2] - xp)}.
                </p>
              ) : (
                <div className="specializations">
                  {SPECIALIZATIONS.map((s) => (
                    <button
                      key={s.id}
                      className="small-button"
                      aria-pressed={g.specializations[c.id] === s.id}
                      disabled={
                        g.specializations[c.id] === s.id ||
                        (!!g.specializations[c.id] && g.coins < 50)
                      }
                      onClick={() =>
                        dispatch('specialize', {
                          crop: c.id,
                          specialization: s.id,
                        })
                      }
                    >
                      <b>
                        {s.name}
                        {g.specializations[c.id] === s.id ? ' ✓' : ''}
                      </b>
                      <small>{s.desc}</small>
                    </button>
                  ))}
                  <small>
                    {g.specializations[c.id]
                      ? 'Changer : 50 pièces. Les plantes en cours gardent leur spécialisation.'
                      : 'Premier choix gratuit.'}
                  </small>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}
function RecipeCard({ g, dispatch, r }: Props & { r: Recipe }) {
  const [selection, setSelection] = useState<string[] | null>(null);
  const keys = selection || defaultIngredients(g, r),
    probabilities = cookingProbabilities(g, r.id, keys),
    lock = recipeLock(g, r);
  const slots = Object.entries(r.needs).flatMap(
    ([id, n]) => Array(n).fill(id) as string[],
  );
  return (
    <article className="crop-card recipe-card">
      <span className="catalog-icon">{r.icon}</span>
      <h3>{r.name}</h3>
      <b>Maîtrise {recipeMastery(g, r.id)}/5</b>
      <small>
        {g.recipeXP[r.parent || r.id] || 0} préparations · {duration(r.time)}
      </small>
      {!r.parent && !r.friend && (
        <small>Variante signature : maîtrise 3 (6 préparations).</small>
      )}
      <div className="ingredient-selection">
        {slots.map((id, index) => (
          <label key={index}>
            {itemIcon(id)} Ingrédient {index + 1}
            <select
              aria-label={`${r.name}, ingrédient ${index + 1}`}
              value={keys[index]}
              onChange={(e) => {
                const next = [...keys];
                next[index] = e.target.value;
                setSelection(next);
              }}
            >
              {(id === 'oeuf'
                ? [id]
                : QUALITIES.map((q) =>
                    q.id === 'ordinaire' ? id : id + '|' + q.id,
                  )
              ).map((k) => (
                <option key={k} value={k}>
                  {itemName(k)} ({g.stock[k] || 0} en stock)
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <div className="probabilities" aria-label="Chances du prochain plat">
        {OUTCOMES.map((q, i) => (
          <div key={q.id}>
            <span>
              {q.icon} {q.name}
            </span>
            <b>{(probabilities[i] * 100).toFixed(1)} %</b>
          </div>
        ))}
      </div>
      <details>
        <summary>Ce qui influence ces chances</summary>
        <p>
          Qualité moyenne des ingrédients : {ingredientQuality(keys).toFixed(1)}
          /2. Maîtrise de cette recette : {recipeMastery(g, r.id)}/5.
        </p>
        <p>
          Maîtrise et régularité réduisent les plats rustiques. Précision
          favorise les plats réussis et savoureux ; créativité et chance
          favorisent les meilleurs plats.
        </p>
        <p>
          Lucie : {g.relations.lucie || 0} cœurs (maîtrise) · Jeanne :{' '}
          {g.relations.jeanne || 0} (créativité) · Clara :{' '}
          {g.relations.clara || 0} (chance). Leur cinquième cœur ajoute 5 points
          au talent associé.
        </p>
      </details>
      <button
        className="small-button"
        disabled={!!g.job || !!lock || !validIngredients(g, r, keys)}
        onClick={() => {
          if (
            keys.some(
              (id) =>
                itemName(id).includes('Belle') ||
                itemName(id).includes('Exceptionnelle'),
            ) &&
            !window.confirm(
              'Utiliser ces ingrédients de qualité supérieure pour cette recette ?',
            )
          )
            return;
          dispatch('craft', { id: r.id, ingredients: keys });
          setSelection(null);
        }}
      >
        {lock ||
          (g.job
            ? 'Atelier occupé'
            : validIngredients(g, r, keys)
              ? 'Préparer ces ingrédients'
              : 'Ingrédients insuffisants')}
      </button>
    </article>
  );
}
export function RecipeBook(props: Props) {
  const groups = [
    {
      title: 'Les classiques',
      recipes: RECIPES.filter((r) => !r.parent && !r.friend),
    },
    {
      title: 'Les signatures',
      recipes: RECIPES.filter((r) => r.parent),
    },
    {
      title: 'Les recettes d’amitié',
      recipes: RECIPES.filter((r) => r.friend),
    },
  ];
  return (
    <div className="recipe-groups">
      {groups.map((group) => (
        <section key={group.title}>
          <h3>{group.title}</h3>
          <div className="catalog">
            {group.recipes.map((r) => (
              <RecipeCard key={r.id} {...props} r={r} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
export function FriendBook({ g, dispatch }: Props) {
  const [choices, setChoices] = useState<Record<string, string>>({});
  const stock = Object.keys(g.stock).filter((k) => g.stock[k] > 0);
  return (
    <div className="friend-book">
      {VILLAGERS.map((v) => {
        const q = QUESTS.find((q) => q.id === v.id)!,
          hearts = g.relations[v.id] || 0,
          complete = g.quests.includes(v.id),
          points = g.friendship[v.id] || 0;
        const delivery = fulfillment(g.stock, q.item, q.amount);
        const selected = stock.includes(choices[v.id])
          ? choices[v.id]
          : stock.find((k) => v.likes.includes(k.split('|')[0])) ||
            stock[0] ||
            '';
        return (
          <article className="friend-card" key={v.id}>
            <h3>
              {v.icon} {v.name}{' '}
              <span className="hearts">
                {'♥'.repeat(hearts)}
                {'♡'.repeat(5 - hearts)}
              </span>
            </h3>
            <p>
              {v.role} ·{' '}
              {hearts === 5
                ? 'Amitié accomplie'
                : `${points} points · prochain cœur à ${HEART_STEPS[hearts + 1]}`}
            </p>
            <div className="friend-perks">
              {q.tiers.map((text, i) => (
                <p
                  className={hearts >= [1, 3, 5][i] ? 'perk-active' : ''}
                  key={text}
                >
                  {hearts >= [1, 3, 5][i] ? '✓' : '♡'} {[1, 3, 5][i]} cœur
                  {i ? 's' : ''} : {text}
                </p>
              ))}
            </div>
            <label>
              Cadeau à offrir (favori : +2, autre : +1)
              <select
                aria-label={`Cadeau pour ${v.name}`}
                value={selected}
                onChange={(e) =>
                  setChoices({ ...choices, [v.id]: e.target.value })
                }
              >
                {!stock.length && <option value="">Panier vide</option>}
                {stock.map((k) => (
                  <option key={k} value={k}>
                    {itemName(k)} × {g.stock[k]}
                    {v.likes.includes(k.split('|')[0]) ? ' ♥' : ''}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="small-button"
              disabled={
                !selected || hearts === 5 || (!complete && points >= 12)
              }
              onClick={() =>
                dispatch('gift', { villager: v.id, item: selected })
              }
            >
              Offrir 1 produit
            </button>
            <div className="personal-quest">
              <b>{q.title}</b>
              <p>
                {complete
                  ? '✓ Quête accomplie'
                  : `${q.amount} × ${itemName(q.item)} · ${delivery.possible ? 'prêt' : 'incomplet'}`}
              </p>
              <small>
                À 2 cœurs · +{q.reward} pièces · débloque le troisième cœur.
              </small>
              <button
                className="small-button"
                disabled={complete || hearts < 2 || !delivery.possible}
                onClick={() => {
                  if (
                    delivery.usesSuperior &&
                    !window.confirm(
                      'Cette quête utilisera un produit de qualité supérieure. Continuer ?',
                    )
                  )
                    return;
                  dispatch('quest', {
                    id: v.id,
                    confirmSuperior: delivery.usesSuperior,
                  });
                }}
              >
                {complete ? 'Merci pour votre aide !' : 'Livrer la quête'}
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
