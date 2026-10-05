'use client';
/**
 * Extrait de app/page.tsx (0.11.1). 0.17.3 : panier en bois et parchemin
 * (app/basket017.css) : filtres avec leur nombre, caisse du superflu, cagettes
 * par produit avec pastilles de qualité ; chaque vente fait jaillir des pièces.
 */
import { useRef, useState, type CSSProperties } from 'react';
import { type AskConfirm } from '@/components/game-confirm';
import { PixelIcon } from '@/components/farm/sprites';
import { crop, eatableDish, effectMinutes, surplus, itemLabel, marketBonus, stallEligible, type ActionArgument, type Game } from '@/lib/game';
import { useGameClock } from '@/hooks/use-game-clock';
import { groupBasket, type BasketEntry } from '@/lib/farm-ui';

const BASKET_FILTERS = [
  ['all', 'Tout'],
  ['crops', 'Récoltes'],
  ['dishes', 'Plats'],
  ['useful', 'Utiles'],
] as const;
/** « 3 belles », « 2 chefs-d’œuvre », « 1 ordinaire ». */
function qualityCount(amount: number, label: string) {
  const word = label.toLowerCase();
  if (!word) return String(amount);
  if (amount < 2 || /[sx]$/.test(word)) return `${amount} ${word}`;
  return `${amount} ${word === 'chef-d’œuvre' ? 'chefs-d’œuvre' : word + 's'}`;
}
export function BasketList({
  game,
  now: snapshotNow,
  dispatch,
  askConfirm,
}: {
  game: Game;
  now: number;
  dispatch: (action: string, argument?: ActionArgument) => unknown;
  askConfirm: AskConfirm;
}) {
  const now = useGameClock() || snapshotNow;
  const [filter, setFilter] =
    useState<(typeof BASKET_FILTERS)[number][0]>('all');
  const [sort, setSort] = useState<'value' | 'name'>('value');
  const [confirmSurplus, setConfirmSurplus] = useState(false);
  const [open, setOpen] = useState<string[]>([]);
  // 0.17.3 : pièces qui jaillissent du bouton de vente.
  const view = useRef<HTMLDivElement>(null);
  const [bursts, setBursts] = useState<{ key: number; x: number; y: number }[]>([]);
  const burstFrom = (target: Element) => {
    const box = view.current?.getBoundingClientRect();
    const from = target.getBoundingClientRect();
    if (!box) return;
    const key = (bursts.at(-1)?.key || 0) + 1;
    setBursts((list) => [...list.slice(-3), { key, x: from.left + from.width / 2 - box.left, y: from.top + from.height / 2 - box.top }]);
    setTimeout(() => setBursts((list) => list.filter((b) => b.key !== key)), 900);
  };
  const extra = surplus(game, now);
  const groups = groupBasket(game, now, filter, sort, extra.reserved);
  const counts = Object.fromEntries(
    BASKET_FILTERS.map(([value]) => [value, groupBasket(game, now, value, sort, extra.reserved).reduce((sum, g) => sum + g.amount, 0)]),
  );
  const toggle = (id: string) =>
    setOpen((list) =>
      list.includes(id) ? list.filter((entry) => entry !== id) : [...list, id],
    );
  /** Vend plusieurs variantes d’un coup ; demande confirmation si l’une est réservée. */
  const sellEntries = (entries: BasketEntry[], label: string, from?: Element) => {
    const total = entries.reduce((sum, entry) => sum + entry.amount, 0);
    const value = entries.reduce((sum, entry) => sum + entry.amount * entry.unit, 0);
    const submit = () => {
      if (from) burstFrom(from);
      return entries.length === 1
        ? dispatch('sell', { item: entries[0].key, amount: entries[0].amount })
        : dispatch('sellMany', { items: entries.map((entry) => entry.key) });
    };
    const reserved = entries.filter((entry) => entry.reserved > 0);
    if (!reserved.length) return submit();
    askConfirm(
      {
        title: 'Vendre des produits réservés ?',
        description: `${label} : ${total} produit${total > 1 ? 's' : ''} pour ${value} pièces. Une partie sert à un projet ou à une commande en cours, et la vente peut retarder cette livraison.`,
        items: reserved.map((entry) => `${entry.reserved} réservé${entry.reserved > 1 ? 's' : ''} · ${itemLabel(game, entry.key)}`),
        confirmLabel: 'Vendre quand même',
      },
      submit,
    );
  };
  const sellOne = (entry: BasketEntry, quantity: number, from?: Element) => {
    const submit = () => {
      if (from) burstFrom(from);
      return dispatch('sell', { item: entry.key, amount: quantity });
    };
    if (!entry.reserved || quantity <= entry.amount - entry.reserved) return submit();
    askConfirm(
      {
        title: 'Vendre un produit réservé ?',
        description: 'Ce produit sert à un projet ou à une commande en cours. La vente peut retarder cette livraison.',
        items: [`${quantity} × ${itemLabel(game, entry.key)}`],
        confirmLabel: 'Vendre quand même',
      },
      submit,
    );
  };
  return (
    <div className="basket-view" ref={view}>
      <div className="basket-toolbar">
        <fieldset className="basket-filters">
          <legend className="sr-only">Filtrer le panier</legend>
          {BASKET_FILTERS.map(([value, label]) => (
            <button
              key={value}
              aria-pressed={filter === value}
              aria-label={`${label}, ${counts[value]} produit${counts[value] > 1 ? 's' : ''}`}
              onClick={() => setFilter(value)}
            >
              {label}
              <small aria-hidden="true">{counts[value]}</small>
            </button>
          ))}
        </fieldset>
        <label className="basket-sort">
          Trier
          <select
            value={sort}
            onChange={(event) =>
              setSort(event.target.value as 'value' | 'name')
            }
          >
            <option value="value">par valeur</option>
            <option value="name">par nom</option>
          </select>
        </label>
      </div>
      <div className="surplus-bar">
        {confirmSurplus && extra.count > 0 ? (
          <>
            <p>
              Vendre {extra.count} produit{extra.count > 1 ? 's' : ''} pour{' '}
              {extra.coins} ◉ ? Les plats, les récoltes exceptionnelles et ce
              qui sert au projet ou à la commande en cours sont gardés.
            </p>
            <button
              onClick={(event) => {
                burstFrom(event.currentTarget);
                dispatch('sellSurplus');
                setConfirmSurplus(false);
              }}
            >
              Confirmer
            </button>
            <button
              className="secondary-action"
              onClick={() => setConfirmSurplus(false)}
            >
              Annuler
            </button>
          </>
        ) : (
          <>
            <span className="surplus-crate" aria-hidden="true">
              <PixelIcon id="basket" />
            </span>
            <p>
              {extra.count ? (
                <>
                  <b>Superflu</b> {extra.count} produit{extra.count > 1 ? 's' : ''} · {extra.coins.toLocaleString('fr-FR')} ◉
                </>
              ) : (
                'Tout ce qui reste sert au projet, aux commandes ou à la semence.'
              )}
            </p>
            <button
              disabled={!extra.count}
              onClick={() => setConfirmSurplus(true)}
            >
              Vendre le superflu
            </button>
          </>
        )}
      </div>
      {groups.length === 0 && (
        <p className="basket-empty-filter">Aucun produit dans ce filtre.</p>
      )}
      <ul className="basket-groups" aria-label="Produits du panier">
        {groups.map((group, index) => {
          const expanded = open.includes(group.id);
          const entries = group.qualities.flatMap((tier) => tier.entries);
          const goals = group.uses.filter((use) => use === 'Projet' || use === 'Commande');
          return (
            <li
              key={group.id}
              className="basket-group"
              style={{ '--i': Math.min(index, 8) } as CSSProperties}
              data-open={expanded || undefined}
              data-reserved={group.reserved > 0 || undefined}
            >
              <div className="basket-row">
                <button
                  className="basket-expand"
                  aria-expanded={expanded}
                  aria-controls={`basket-${group.id}`}
                  onClick={() => toggle(group.id)}
                >
                  <span className="basket-chevron" aria-hidden="true">
                    {expanded ? '▾' : '▸'}
                  </span>
                  <span className="basket-plate" aria-hidden="true">
                    <PixelIcon id={entries[0].key} />
                  </span>
                  <span className="basket-name">
                    <b>
                      {group.name} <span key={group.amount} className="basket-count">× {group.amount}</span>
                    </b>
                    <small className="basket-tiers">
                      {group.qualities.map((tier) => (
                        <span key={tier.rank} className="tier-chip" data-rank={tier.rank}>
                          {qualityCount(tier.amount, tier.label)}
                        </span>
                      ))}
                      {entries.some((entry) => entry.lineage) && (
                        <span className="tier-chip" data-lineage="">
                          {entries.filter((entry) => entry.lineage).length} lignée{entries.filter((entry) => entry.lineage).length > 1 ? 's' : ''}
                        </span>
                      )}
                    </small>
                  </span>
                </button>
                {goals.length > 0 && (
                  <ul className="item-uses basket-goals" aria-label="Utile pour">
                    {goals.map((use) => (
                      <li key={use} data-kind="goal">
                        {use}
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  className="basket-sell-all"
                  aria-label={`Vendre les ${group.amount} ${group.name} pour ${group.value} pièces`}
                  onClick={(event) => sellEntries(entries, group.name, event.currentTarget)}
                >
                  <span className="basket-verb">Tout vendre · </span>
                  <span className="basket-verb-short">Vendre · </span>
                  {group.value.toLocaleString('fr-FR')} <i className="coin-dot" aria-hidden="true" />
                </button>
              </div>
              {expanded && (
                <div className="basket-detail" id={`basket-${group.id}`}>
                  {group.qualities.map((tier) => (
                    <section key={tier.rank} className="basket-quality" data-rank={tier.rank}>
                      <header>
                        <b>{tier.label || group.name}</b>
                        <small>
                          × {tier.amount} · {tier.value} ◉
                        </small>
                        {group.qualities.length > 1 && (
                          <button
                            className="secondary-action"
                            aria-label={`Vendre ${tier.amount} ${group.name} de qualité ${tier.label.toLowerCase()} pour ${tier.value} pièces`}
                            onClick={(event) => sellEntries(tier.entries, `${group.name} · ${tier.label}`, event.currentTarget)}
                          >
                            <span className="basket-verb">Vendre cette qualité · </span>
                            <span className="basket-verb-short">Vendre · </span>
                            {tier.value} ◉
                          </button>
                        )}
                      </header>
                      <ul>
                        {tier.entries.map((entry) => {
                          const effect = eatableDish(entry.key);
                          const exceptionalCrop =
                            entry.key.includes('|exceptionnelle') && !!crop(group.id);
                          return (
                            <li key={entry.key}>
                              <span className="basket-variant">
                                <b>
                                  {entry.lineage || tier.label || group.name} × {entry.amount}
                                </b>
                                <small>
                                  {entry.unit} ◉ l’unité
                                  {marketBonus(game, entry.key, now) ? ' · bonus du marché' : ''}
                                  {stallEligible(game, entry.key) ? ' · étal +10 %' : ''}
                                  {entry.reserved
                                    ? ` · ${entry.reserved} réservé${entry.reserved > 1 ? 's' : ''}`
                                    : ''}
                                  {entry.uses.length ? ` · ${entry.uses.join(', ')}` : ''}
                                </small>
                              </span>
                              <span className="basket-actions">
                                {effect && (
                                  <button
                                    className="secondary-action"
                                    title={effect.desc}
                                    onClick={() => dispatch('eat', { item: entry.key })}
                                  >
                                    Déguster · {effectMinutes(entry.key)} min
                                  </button>
                                )}
                                {exceptionalCrop && (
                                  <button
                                    className="secondary-action"
                                    title="Transforme 1 récolte exceptionnelle en 3 graines et en points de maîtrise."
                                    onClick={() => dispatch('preserve', { item: entry.key })}
                                  >
                                    Garder en semence
                                  </button>
                                )}
                                {entry.amount > 1 && (
                                  <button
                                    className="sell-one"
                                    aria-label={`Vendre 1 ${itemLabel(game, entry.key)} pour ${entry.unit} pièces`}
                                    onClick={(event) => sellOne(entry, 1, event.currentTarget)}
                                  >
                                    ×1 · {entry.unit} ◉
                                  </button>
                                )}
                                <button
                                  aria-label={`Vendre ${entry.amount > 1 ? `les ${entry.amount}` : 'le'} ${itemLabel(game, entry.key)} pour ${entry.amount * entry.unit} pièces`}
                                  onClick={(event) => sellOne(entry, entry.amount, event.currentTarget)}
                                >
                                  {entry.amount > 1 ? 'Tout' : 'Vendre'} · {entry.amount * entry.unit} ◉
                                </button>
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {bursts.map((b) => (
        <span key={b.key} className="coin-burst" aria-hidden="true" style={{ left: b.x, top: b.y }}>
          {Array.from({ length: 8 }, (_, i) => (
            <i key={i} style={{ '--a': `${-150 + i * 17 + (b.key % 3) * 4}deg`, '--d': `${46 + (i % 3) * 14}px` } as CSSProperties} />
          ))}
        </span>
      ))}
    </div>
  );
}
