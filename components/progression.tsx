'use client';
import { useGameClock } from '@/hooks/use-game-clock';
import { useState } from 'react';
import { ALLANT_BASE, allant, allantPercent, allantSources, gardenCrossing } from '@/lib/allant';
import {
  CROPS,
  RECIPES,
  OUTCOMES,
  SPECIALIZATIONS,
  QUESTS,
  VILLAGERS,
  LINKS,
  SKILL_PATHS,
  skillRank,
  skillProgress,
  orderBoard,
  HEART_STEPS,
  cropMasterySteps,
  cropFamily,
  CROP_FAMILY_NAMES,
  specializationDescription,
  cropMastery,
  recipeMastery,
  recipeLock,
  growTime,
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
  giftPoints,
  ingredientQuality,
  fulfillment,
  masteryGain,
  itemName,
  type ActionArgument,
  type Game,
  type Recipe,
  type CropFamily,
} from '@/lib/game';
import { PixelIcon, VillagerPortrait } from '@/components/farm/sprites';
import type { AskConfirm } from '@/components/game-confirm';
type Props = {
  g: Game;
  dispatch: (action: string, arg?: ActionArgument) => unknown;
  now?: number;
};
/** 0.9.5 : l’Allant de Rosalie, ses sources et ce qu’il change. */
function AllantCard({ g, now: snapshotNow }: { g: Game; now?: number }) {
  const now = useGameClock() || snapshotNow;
  const speed = allant(g, now);
  const sources = allantSources(g, now);
  const percent = allantPercent(speed).toFixed(1).replace('.', ',');
  const crossing = gardenCrossing(speed).toFixed(1).replace('.', ',');
  return <section className="allant-card" aria-labelledby="allant-title">
    <div className="allant-head">
      <h4 id="allant-title">L’allant de Rosalie</h4>
      <b>{percent} %/s</b>
      <small>traverse le potager en {crossing} s</small>
    </div>
    <ul>
      {sources.map((source) => <li key={source.id} data-active={source.factor > 1 || source.id === 'base' || undefined}>
        <span>{source.label}</span>
        <b>{source.id === 'base' ? `${allantPercent(ALLANT_BASE).toFixed(0)} %/s` : source.factor > 1 ? `+${Math.round((source.factor - 1) * 100)} %` : '—'}</b>
      </li>)}
    </ul>
    <small>Le niveau, les Sentiers de gravier, l’habitude du potager (150, 600 puis 1 500 récoltes) et le jus des vendanges (Second souffle) la rendent plus vive.</small>
  </section>;
}

export function CultureJournal({ g, dispatch, now: snapshotNow }: Props & { now?: number }) {
  const now = useGameClock() || snapshotNow;
  const families = ['primeurs', 'grains', 'legumes', 'fruits'] as const;
  const [family, setFamily] = useState<CropFamily>('primeurs');
  return <div className="mastery-album">
    <header><h3>L’album des cultures</h3><p>La récolte ouvre les rangs ; cuisine et livraisons ajoutent quelques points. Chaque famille donne un savoir-faire différent.</p></header>
    <AllantCard g={g} now={now} />
    <div className="mastery-family-nav" aria-label="Familles de cultures">{families.map((item) => <button key={item} type="button" aria-pressed={family === item} onClick={() => setFamily(item)}><b>{CROP_FAMILY_NAMES[item]}</b><small>{CROPS.filter((crop) => cropFamily(crop.id) === item).length} cultures · {CROPS.filter((crop) => cropFamily(crop.id) === item).reduce((sum, crop) => sum + Math.max(0, cropMastery(g, crop.id)-1),0)} rangs gagnés</small></button>)}</div>
    {families.filter((item) => item === family).map((family) => <section key={family} className="mastery-family">
      <h4>{CROP_FAMILY_NAMES[family]}</h4>
      <div className="mastery-pages">{CROPS.filter((crop) => cropFamily(crop.id) === family).map((c) => {
        const rank = cropMastery(g, c.id);
        const xp = g.cropXP[c.id] || 0;
        const steps = cropMasterySteps(c.id);
        const next = steps[Math.min(rank, 4)];
        const chosen = g.specializations[c.id];
        return <article className="mastery-entry" key={c.id}>
          <div className="mastery-entry-heading"><PixelIcon id={c.id} className="catalog-icon" />
            <div><h5>{c.name}</h5><small>{g.collection[c.id] || 0} récoltes · prochain semis {duration(growTime(g, c.id))}</small></div>
            <b>Rang {rank}/5</b></div>
          <progress aria-label={'Maîtrise de ' + c.name}
            value={rank === 5 ? 1 : xp - steps[rank - 1]}
            max={rank === 5 ? 1 : next - steps[rank - 1]} />
          <small>{rank === 5 ? 'Maîtrise accomplie' : xp + ' / ' + next + ' points · +' + masteryGain(c.id) + ' par récolte'}</small>
          <p className="mastery-next">{rank < 2 ? 'Prochain rang : croissance plus rapide.'
            : rank === 2 ? 'Prochain rang : choisissez un savoir-faire.'
            : rank === 3 ? 'Prochain rang : plus de belles récoltes.'
            : rank === 4 ? 'Prochain rang : graines signature.'
            : 'Graines signature actives.'}</p>
          {rank >= 3 && <details className="mastery-choice-details" open={!chosen}><summary>{chosen ? `Savoir-faire choisi : ${SPECIALIZATIONS.find((entry) => entry.id === chosen)?.name} · modifier` : 'Choisir le savoir-faire de cette culture'}</summary><div className="mastery-choices">
            {SPECIALIZATIONS.map((choice) => <button key={choice.id}
              aria-pressed={chosen === choice.id}
              disabled={chosen === choice.id || (!!chosen && g.coins < 25)}
              onClick={() => dispatch('specialize', { crop: c.id, specialization: choice.id })}>
              <b>{choice.name}{chosen === choice.id ? ' ✓' : ''}</b>
              <small>{specializationDescription(c.id, choice.id)}</small>
            </button>)}
            <small>{chosen ? 'Changer de savoir-faire : 25 pièces.' : 'Premier choix gratuit.'}</small>
          </div></details>}
        </article>;
      })}</div>
    </section>)}
  </div>;
}

export function SkillsPanel({ g, dispatch }: Props) {
  return <div className="skills-book">
    <header><h3>Les gestes de Rosalie</h3><p>Découvrez des cultures, cuisinez des recettes différentes et livrez des offres variées. Une même action répétée ne fait pas monter ces voies.</p></header>
    <div className="skill-paths">{SKILL_PATHS.map((path) => {
      const rank = skillRank(g, path.id);
      const count = skillProgress(g, path.id);
      const selected = g.skillChoices[path.id];
      return <article key={path.id} className="skill-path">
        <small className="skill-stamp">Savoir-faire {rank}/3</small>
        <h4>{path.title}</h4><p>{path.hint}</p>
        <progress value={Math.min(count,6)} max={6} aria-label={path.title + ' : ' + count + ' découvertes'} />
        <small>{count} découverte{count > 1 ? 's' : ''} · choix à 3 · album complet à 6</small>
        <div className="skill-choices">{path.choices.map((choice) =>
          <button key={choice.id} aria-pressed={selected === choice.id}
            disabled={rank < 2 || selected === choice.id || (!!selected && g.coins < 50)}
            onClick={() => dispatch('skillChoice', { path: path.id, choice: choice.id })}>
            <b>{choice.name}{selected === choice.id ? ' ✓' : ''}</b><span>{choice.desc}</span>
          </button>)}</div>
        <small>{rank < 2 ? 'Encore ' + Math.max(0,3-count) + ' découverte(s) pour choisir.'
          : selected ? 'Changer de voie : 50 pièces.' : 'Premier choix gratuit.'}</small>
      </article>;
    })}</div>
  </div>;
}

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
export function RecipeCard({ g, dispatch, r, now: snapshotNow, askConfirm, freeSlots }: Props & { r: Recipe; askConfirm: AskConfirm; freeSlots?: number }) {
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
      <details className="recipe-options">
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
export function FriendBook({ g, dispatch, askConfirm }: Props & { askConfirm: AskConfirm }) {
  const [friendId, setFriendId] = useState(VILLAGERS[0].id);
  const [choices, setChoices] = useState<Record<string, string>>({});
  const stock = Object.keys(g.stock).filter((key) => g.stock[key] > 0);
  const personal = orderBoard(g).find((offer) => offer.kind === 'personal');
  return <div className="village-links">
    <header><h3>Les voisins de Rosalie</h3><p>Leurs commandes font grandir la relation sans délai. Les cadeaux sont utiles pour découvrir un goût ; varier les produits plaît davantage.</p></header>
    <div className="friend-roster" aria-label="Choisir un villageois">{VILLAGERS.map((v,index) => <button key={v.id} type="button" aria-pressed={friendId===v.id} onClick={() => setFriendId(v.id)}><VillagerPortrait index={index+1}/><span><b>{v.name}</b><small>{g.relations[v.id]||0}/5 ♥</small></span></button>)}</div>
    {VILLAGERS.map((v, index) => {
      if (v.id !== friendId) return null;
      const link = LINKS.find((entry) => entry.id === v.id);
      const q = QUESTS.find((entry) => entry.id === v.id)!;
      const hearts = g.relations[v.id] || 0;
      const points = g.friendship[v.id] || 0;
      const nextHeart = HEART_STEPS[Math.min(5, hearts + 1)];
      const completed = g.quests.includes(v.id);
      const delivery = fulfillment(g.stock, q.item, q.amount);
      const selected = stock.includes(choices[v.id]) ? choices[v.id]
        : stock.find((key) => v.likes.includes(key.split('|')[0])) || stock[0] || '';
      const repeat = g.giftHistory.includes(v.id + ':' + selected.split('|')[0]);
      const rewardIndex = hearts < 1 ? 0 : hearts < 3 ? 1 : 2;
      return <article className="village-link" key={v.id} data-featured={!!link || undefined}>
        <VillagerPortrait index={index + 1} />
        <div className="link-main"><div className="link-heading"><h4>{v.name}</h4><small>{v.role} · {link?.trait || 'La pâtissière du village'}</small></div>
          <p className="link-quote">« {link?.quote || 'Une belle assiette se partage toujours.'} »</p>
          <div className="link-hearts" aria-label={hearts + ' cœurs sur 5'}>{'♥'.repeat(hearts)}{'♡'.repeat(5-hearts)}
            <small>{hearts === 5 ? 'Amitié accomplie' : points + '/' + nextHeart + ' amitié · prochain cœur'}</small></div>
          <p className="link-next"><b>{hearts >= 5 ? 'Avantage acquis :' : 'À venir :'}</b> {q.tiers[rewardIndex]}
            {link && <span> · Spécialité : {link.specialty}</span>}</p>
          {personal?.villagerId === v.id && <div className="link-order">
            Commande personnelle affichée au panneau : {personal.amount} × {itemName(personal.crop)} · +{personal.xp} XP · +amitié.
          </div>}
          <div className="link-details"><h5>Échanger avec {v.name} · goûts, quête et souvenirs</h5>
            <p>Elle ou il apprécie : {v.likes.map((id) => itemName(id)).join(', ')}. Première découverte : points normaux ; produit répété : +1.</p>
            <div className="link-gift"><select aria-label={'Produit à offrir à ' + v.name} value={selected}
              onChange={(event) => setChoices({ ...choices, [v.id]: event.target.value })}>
              {!stock.length && <option value="">Panier vide</option>}
              {stock.map((key) => <option key={key} value={key}>{itemName(key)} ×{g.stock[key]}</option>)}
            </select><button disabled={!selected || hearts === 5}
              onClick={() => dispatch('gift', { villager: v.id, item: selected })}>
              Offrir · +{repeat ? 1 : selected ? giftPoints(v.likes, selected) : 0} amitié
            </button></div>
            <div className="link-quest"><b>{q.title}</b><span>{q.amount} × {itemName(q.item)} · {completed ? 'accomplie' : delivery.possible ? 'prête' : 'à réunir'}</span>
              <button disabled={completed || hearts < 2 || !delivery.possible}
                onClick={() => {
                  const submit = () => dispatch('quest', { id: v.id, confirmSuperior: delivery.usesSuperior });
                  if (delivery.usesSuperior) askConfirm({
                    title: `Livrer la quête de ${v.name} ?`,
                    description: 'Cette quête accepte une qualité plus simple. Vérifiez le produit choisi.',
                    items: Object.entries(delivery.used).map(([id, amount]) => `${amount} × ${itemLabel(g, id)}`),
                    confirmLabel: 'Livrer la quête',
                  }, submit);
                  else submit();
                }}>{completed ? 'Livrée ✓' : 'Livrer · +' + q.reward + ' pièces'}</button></div>
            {[3,5].map((milestone) => hearts >= milestone && <div className="link-memory" key={milestone}>
              <span>Souvenir des {milestone} cœurs</span>
              <button disabled={g.seenScenes.includes(v.id + '-' + milestone)}
                onClick={() => dispatch('scene', { scene: v.id + '-' + milestone })}>
                {g.seenScenes.includes(v.id + '-' + milestone) ? 'Conservé ✓' : 'Conserver'}
              </button></div>)}
          </div>
        </div>
      </article>;
    })}
  </div>;
}
