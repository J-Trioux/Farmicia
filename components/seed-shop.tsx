'use client';
/**
 * 0.17.1 — La graineterie, en bois et parchemin.
 *
 * À gauche, le présentoir : un sachet par culture, posé sur des étagères
 * (nom, prix de la graine, stock). 0.17.2 : les prochaines graines y sont
 * en ombre, sans leur nom (pas de spoil), avec leur niveau. À droite, le comptoir : la culture choisie,
 * ses quatre chiffres utiles et les achats en un clic (×1, ×5, ×10, Max).
 * Chaque achat fait jaillir des graines, rebondir le stock et le sachet ;
 * la bourse de l’enseigne défile et montre la dépense.
 */
import { memo, useState, type CSSProperties } from 'react';
import { GrowTimeTip } from '@/components/grow-time-tip';
import { PixelIcon } from '@/components/farm/sprites';
import { useRollingNumber } from '@/hooks/use-rolling-number';
import { useGameClock } from '@/hooks/use-game-clock';
import { inSeason } from '@/lib/farm-ui';
import { CROPS, absenceCrop, careDouble, crop, duration, growTime, level, maxAffordable, type ActionArgument, type Game } from '@/lib/game';

/** Prochaines graines montrées en ombre sur le présentoir ; les suivantes sont comptées. */
const LOCKED_SHOWN = 3;
/** Graines qui jaillissent à chaque achat. */
const SEEDS = 9;

/**
 * Bourse de l’enseigne : le total défile ; une dépense tombe en rouge, une
 * recette (0.17.3, panier) monte en vert.
 */
export const ShopPurse = memo(function ShopPurse({ coins, reduced }: { coins: number; reduced: boolean }) {
  const shown = useRollingNumber(coins, reduced);
  const [previous, setPrevious] = useState(coins);
  const [change, setChange] = useState<{ key: number; amount: number } | null>(null);
  if (previous !== coins) {
    setPrevious(coins);
    setChange({ key: (change?.key || 0) + 1, amount: coins - previous });
  }
  const gain = !!change && change.amount > 0;
  return (
    <div className="shop-purse" aria-label={`${coins} pièces disponibles`}>
      <span key={`coin-${change?.key || 0}`} className={change ? (gain ? 'purse-gain' : 'purse-shake') : undefined}>
        <PixelIcon id="coin" />
      </span>
      <b aria-hidden="true">{Math.round(shown).toLocaleString('fr-FR')}</b>
      {change && !reduced && (
        <em key={`change-${change.key}`} className={gain ? 'purse-earned' : 'purse-spent'} aria-hidden="true">
          {gain ? '+' : '−'}
          {Math.abs(change.amount).toLocaleString('fr-FR')}
        </em>
      )}
    </div>
  );
});

export function SeedShop({
  game,
  now: snapshotNow,
  initialCrop,
  reduced,
  dispatch,
  onBought,
}: {
  game: Game;
  now: number;
  /** Culture ouverte au comptoir à l’arrivée (celle du dock). */
  initialCrop: string;
  reduced: boolean;
  dispatch: (action: string, argument?: ActionArgument) => unknown;
  /** Après un achat : la culture devient celle du dock. */
  onBought: (id: string) => void;
}) {
  const now = useGameClock() || snapshotNow;
  const current = level(game);
  const unlocked = CROPS.filter((item) => item.level <= current);
  // 0.17.2 : les prochaines graines, en ombre, sans leur nom (pas de spoil).
  const locked = CROPS.filter((item) => item.level > current).sort((a, b) => a.level - b.level);
  const [pick, setPick] = useState(
    unlocked.some((item) => item.id === initialCrop) ? initialCrop : unlocked[0].id,
  );
  const [bought, setBought] = useState<{ key: number; id: string; amount: number | 'max' } | null>(null);
  const item = crop(pick);
  const stock = game.seeds[item.id] || 0;
  const missing = Math.max(0, item.cost - game.coins);
  const season = inSeason(game, item.id);
  return (
    <div className="seed-shop">
      <section className="shop-shelves" aria-label="Présentoir des graines">
        <ul>
          {unlocked.map((entry) => {
            const count = game.seeds[entry.id] || 0;
            const fresh = inSeason(game, entry.id);
            return (
              <li key={entry.id}>
                <button
                  type="button"
                  className="seed-packet"
                  aria-pressed={pick === entry.id}
                  data-season={fresh || undefined}
                  data-empty={count === 0 || undefined}
                  aria-label={`${entry.name} : ${entry.cost} pièce${entry.cost > 1 ? 's' : ''} la graine, ${count} en stock${fresh ? ', de saison' : ''}`}
                  onClick={() => setPick(entry.id)}
                >
                  <span
                    key={`art-${bought?.id === entry.id ? bought.key : 0}`}
                    className={`packet-art ${bought?.id === entry.id ? 'packet-hop' : ''}`}
                    aria-hidden="true"
                  >
                    <PixelIcon id={entry.id} />
                  </span>
                  <b>{entry.name}</b>
                  <small aria-hidden="true">
                    {entry.cost} <i className="coin-dot" />
                  </small>
                  {count > 0 && (
                    <span key={`stock-${count}`} className="packet-stock" aria-hidden="true">
                      {count}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
          {locked.slice(0, LOCKED_SHOWN).map((entry) => (
            <li key={entry.id}>
              <span className="seed-packet locked">
                <span className="sr-only">{`Graine mystère : se débloque au niveau ${entry.level}`}</span>
                <span className="packet-art" aria-hidden="true">
                  <PixelIcon id={entry.id} />
                </span>
                <b aria-hidden="true">?</b>
                <small aria-hidden="true">
                  <PixelIcon id="cadenas" className="inline-icon" /> Niv. {entry.level}
                </small>
              </span>
            </li>
          ))}
          {locked.length > LOCKED_SHOWN && (
            <li>
              <span className="seed-packet locked more">
                <span className="sr-only">{`Encore ${locked.length - LOCKED_SHOWN} graines à découvrir`}</span>
                <b aria-hidden="true">+{locked.length - LOCKED_SHOWN}</b>
                <small aria-hidden="true">à découvrir</small>
              </span>
            </li>
          )}
        </ul>
      </section>

      <section className="shop-counter" aria-label={`Comptoir : ${item.name}`}>
        <div key={`hero-${item.id}`} className="counter-hero">
          <span className="counter-plate" aria-hidden="true">
            <PixelIcon id={item.id} />
          </span>
          <div>
            <h3>{item.name}</h3>
            {season && <em className="season-badge">De saison · +8 %</em>}
            {/* 0.33.0 : les cultures longues se sèment avant de partir. */}
            {absenceCrop(item.id) && <em className="season-badge absence-badge">Idéale pendant une absence</em>}
            <p>{item.tag}</p>
            {careDouble(item.id) > 0 && (
              <p className="care-note">Arrosée : +{Math.round(careDouble(item.id) * 100)} % de chances de récolte double.</p>
            )}
          </div>
        </div>
        <dl className="counter-stats">
          <div>
            <dt>
              <PixelIcon id="horloge" className="inline-icon" /> Pousse
            </dt>
            <dd>
              <GrowTimeTip game={game} cropId={item.id} now={now}>
                {duration(growTime(game, item.id, now))}
              </GrowTimeTip>
            </dd>
          </div>
          <div>
            <dt>
              <i className="coin-dot" aria-hidden="true" /> Vente
            </dt>
            <dd>{item.price} pièces</dd>
          </div>
          <div>
            <dt>
              <PixelIcon id="etoile" className="inline-icon" /> Expérience
            </dt>
            <dd>{item.xp} XP</dd>
          </div>
          <div>
            <dt>
              <PixelIcon id="seeds" /> En stock
            </dt>
            <dd key={`stock-${stock}`} className={bought?.id === item.id ? 'stock-pop' : undefined}>
              {stock}
            </dd>
          </div>
        </dl>
        <fieldset className="buy-amounts">
          <legend className="sr-only">Acheter des graines de {item.name.toLowerCase()}</legend>
          {missing > 0 ? (
            <button type="button" disabled>
              Il manque {missing} pièce{missing > 1 ? 's' : ''}
            </button>
          ) : (
            ([1, 5, 10, 'max'] as const).map((amount) => {
              const count = amount === 'max' ? maxAffordable(game, item.id) : amount;
              const cost = count * item.cost;
              return (
                <button
                  type="button"
                  key={amount}
                  data-amount={amount}
                  disabled={cost > game.coins || count < 1}
                  aria-label={`Acheter ${count} graine${count > 1 ? 's' : ''} de ${item.name.toLowerCase()} pour ${cost} pièces`}
                  onClick={() => {
                    dispatch('buy', { crop: item.id, amount });
                    onBought(item.id);
                    setBought({ key: (bought?.key || 0) + 1, id: item.id, amount });
                  }}
                >
                  <b>{amount === 'max' ? `Max ×${count}` : `×${amount}`}</b>
                  <small>
                    {cost.toLocaleString('fr-FR')} <i className="coin-dot" aria-hidden="true" />
                  </small>
                  {bought?.amount === amount && bought.id === item.id && !reduced && (
                    <span key={`burst-${bought.key}`} className="seed-burst" aria-hidden="true">
                      {Array.from({ length: SEEDS }, (_, i) => (
                        <i key={i} style={{ '--a': `${(360 / SEEDS) * i + (bought.key % 2) * 20}deg`, '--d': `${34 + ((i * 7) % 5) * 6}px` } as CSSProperties} />
                      ))}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </fieldset>
      </section>
    </div>
  );
}
