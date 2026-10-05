'use client';

import { useId, useState } from 'react';
import { PixelIcon, VillagerPortrait } from '@/components/farm/sprites';

export type FestivalDefinition = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  location?: string;
  actionLabel?: string;
};

export type FestivalDish = {
  id: string;
  name: string;
  iconId: string;
  quality: string;
  quantity: number;
  note?: string;
};

export type FestivalJuror = {
  id: string;
  name: string;
  role: string;
  portraitIndex: number;
  hearts?: number;
  reaction?: string;
};

export type FestivalAwardTone =
  | 'participation'
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'grand-prix';

export type FestivalAward = {
  label: string;
  tone: FestivalAwardTone;
  description?: string;
};

export type FestivalScoreDetail = {
  label: string;
  value: number;
  max?: number;
};

export type FestivalOutcome = {
  dishId?: string;
  dishName: string;
  score: number;
  maxScore?: number;
  award: FestivalAward;
  message: string;
  judgeId?: string;
  reactions?: Record<string, string>;
  breakdown?: readonly FestivalScoreDetail[];
};

export type FestivalBest = {
  dishName: string;
  score: number;
  maxScore?: number;
  award: FestivalAward;
};

export type FestivalPanelProps = {
  festival?: FestivalDefinition;
  unlocked: boolean;
  dishes: readonly FestivalDish[];
  jurors?: readonly FestivalJuror[];
  result?: FestivalOutcome | null;
  best?: FestivalBest | null;
  entries?: number;
  busy?: boolean;
  selectedDishId?: string;
  defaultSelectedDishId?: string;
  featuredJurorId?: string;
  themeName?: string;
  themeTip?: string;
  lastThemeName?: string;
  improvement?: string;
  lockTitle?: string;
  lockDescription?: string;
  emptyMessage?: string;
  onSelectDish?: (dishId: string) => void;
  onPresent?: (dishId: string) => unknown;
};

export const FLAVOR_FESTIVAL: FestivalDefinition = {
  id: 'fete-des-saveurs',
  eyebrow: 'Place du village',
  title: 'La Fête des Saveurs',
  description:
    'Choisissez une création de l’atelier et présentez-la au jury du village.',
  location: 'Sous les fanions, près du marché',
  actionLabel: 'Présenter ce plat',
};

export const FESTIVAL_JURY: readonly FestivalJuror[] = [
  {
    id: 'lucie',
    name: 'Lucie',
    role: 'Boulangère',
    portraitIndex: 1,
  },
  {
    id: 'marcel',
    name: 'Marcel',
    role: 'Maraîcher',
    portraitIndex: 2,
  },
  {
    id: 'jeanne',
    name: 'Jeanne',
    role: 'Herboriste',
    portraitIndex: 3,
  },
  {
    id: 'clara',
    name: 'Clara',
    role: 'Pâtissière',
    portraitIndex: 4,
  },
  {
    id: 'emile',
    name: 'Émile',
    role: 'Marchand',
    portraitIndex: 5,
  },
] as const;

function Hearts({ amount = 0 }: { amount?: number }) {
  const value = Math.max(0, Math.min(5, Math.floor(amount)));
  return (
    <span
      className="festival-hearts"
      aria-label={`${value} cœur${value > 1 ? 's' : ''} sur 5`}
    >
      <span aria-hidden="true">
        {'♥'.repeat(value)}
        {'♡'.repeat(5 - value)}
      </span>
    </span>
  );
}

function AwardSeal({ award }: { award: FestivalAward }) {
  return (
    <span className="festival-award" data-tone={award.tone}>
      <span className="festival-award-medal" aria-hidden="true">
        ★
      </span>
      <span>
        <small>Ruban obtenu</small>
        <b>{award.label}</b>
      </span>
    </span>
  );
}

function LockedFestival({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section
      className="festival-locked"
      aria-labelledby="festival-locked-title"
    >
      <div className="festival-locked-workshop" aria-hidden="true">
        <PixelIcon id="workshop" />
        <span className="festival-lock-plate">◆</span>
      </div>
      <div>
        <span className="festival-kicker">Invitation à conserver</span>
        <h3 id="festival-locked-title">{title}</h3>
        <p>{description}</p>
        <small>
          La place de la fête reste visible sur la ferme en attendant.
        </small>
      </div>
    </section>
  );
}

export function FestivalPanel({
  festival = FLAVOR_FESTIVAL,
  unlocked,
  dishes,
  jurors = FESTIVAL_JURY,
  result = null,
  best = null,
  entries = 0,
  busy = false,
  selectedDishId,
  defaultSelectedDishId,
  featuredJurorId,
  themeName,
  themeTip,
  lastThemeName,
  improvement,
  lockTitle = 'La table de Rosalie n’est pas encore prête',
  lockDescription = 'Construisez l’atelier pour préparer un plat et rejoindre la Fête des Saveurs.',
  emptyMessage = 'Aucun plat cuisiné n’attend dans le panier. Préparez une recette à l’atelier, puis revenez la présenter.',
  onSelectDish,
  onPresent,
}: FestivalPanelProps) {
  const titleId = useId();
  const dishLegendId = useId();
  const [localSelection, setLocalSelection] = useState(
    defaultSelectedDishId || dishes[0]?.id || '',
  );
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');
  const candidateSelection = selectedDishId ?? localSelection;
  const selected =
    dishes.find((dish) => dish.id === candidateSelection) || dishes[0] || null;
  const activeJurorId = result?.judgeId || featuredJurorId;
  const isBusy = busy || submitting;

  function chooseDish(id: string) {
    if (selectedDishId === undefined) setLocalSelection(id);
    onSelectDish?.(id);
    setActionError('');
  }

  async function presentDish(event: { preventDefault: () => void }) {
    event.preventDefault();
    if (!selected || !onPresent || isBusy) return;
    setSubmitting(true);
    setActionError('');
    try {
      await onPresent(selected.id);
    } catch {
      setActionError(
        'La présentation n’a pas abouti. Le plat est resté dans le panier.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!unlocked)
    return <LockedFestival title={lockTitle} description={lockDescription} />;

  return (
    <section
      className="festival-panel"
      aria-labelledby={titleId}
      data-festival={festival.id}
    >
      <header className="festival-heading">
        <div className="festival-bunting" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
        <div>
          <span className="festival-kicker">{festival.eyebrow}</span>
          <h3 id={titleId}>{festival.title}</h3>
          <p>{festival.description}</p>
          {themeName && <p className="festival-theme"><b>Thème : {themeName}</b> · {themeTip}</p>}
        </div>
        <dl className="festival-visit">
          <div>
            <dt>Présentations</dt>
            <dd>{entries}</dd>
          </div>
          {festival.location && (
            <div>
              <dt>Rendez-vous</dt>
              <dd>{festival.location}</dd>
            </div>
          )}
        </dl>
      </header>

      <form className="festival-layout" onSubmit={presentDish}>
        <section className="festival-pantry" aria-labelledby={dishLegendId}>
          <div className="festival-section-title">
            <span aria-hidden="true">01</span>
            <div>
              <h4 id={dishLegendId}>Choisir l’assiette</h4>
              <p>Le plat choisi est partagé avec le jury. Six assiettes au maximum sont proposées ici.</p>
            </div>
          </div>

          {dishes.length ? (
            <fieldset className="festival-dish-list" disabled={isBusy}>
              <legend className="sr-only">Plat présenté au jury</legend>
              {dishes.map((dish) => {
                const checked = selected?.id === dish.id;
                return (
                  <label
                    className="festival-dish"
                    data-selected={checked || undefined}
                    key={dish.id}
                  >
                    <input
                      type="radio"
                      name="festival-dish"
                      value={dish.id}
                      checked={checked}
                      onChange={() => chooseDish(dish.id)}
                    />
                    <PixelIcon
                      id={dish.iconId}
                      className="festival-dish-icon"
                    />
                    <span className="festival-dish-copy">
                      <b>{dish.name}</b>
                      <small>{dish.note || 'Création de l’atelier'}</small>
                    </span>
                    <span className="festival-dish-meta">
                      <span className="festival-quality">{dish.quality}</span>
                      <small>× {dish.quantity}</small>
                    </span>
                  </label>
                );
              })}
            </fieldset>
          ) : (
            <div className="festival-empty">
              <PixelIcon id="basket" />
              <div>
                <b>Le panier attend votre recette</b>
                <p>{emptyMessage}</p>
              </div>
            </div>
          )}

          <div className="festival-presentation-action">
            <div aria-live="polite">
              <small>Plat retenu</small>
              <b>{selected?.name || 'Aucun plat disponible'}</b>
            </div>
            <button
              className="festival-present-button"
              type="submit"
              disabled={!selected || !onPresent || isBusy}
            >
              <span aria-hidden="true">✦</span>
              {isBusy ? 'Le jury goûte…' : festival.actionLabel || 'Présenter'}
            </button>
          </div>
          {actionError && (
            <p className="festival-action-error" role="alert">
              {actionError}
            </p>
          )}
        </section>

        <section className="festival-stage" aria-label="Jury et résultat">
          <div className="festival-section-title">
            <span aria-hidden="true">02</span>
            <div>
              <h4>La table du jury</h4>
              <p>Cinq regards du village, une dégustation commune.</p>
            </div>
          </div>

          <ul className="festival-jury" aria-label="Jury de la fête">
            {jurors.map((juror) => {
              const active = juror.id === activeJurorId;
              const reaction = result?.reactions?.[juror.id] || juror.reaction;
              return (
                <li
                  className="festival-juror"
                  data-active={active || undefined}
                  key={juror.id}
                >
                  <VillagerPortrait index={juror.portraitIndex} />
                  <div>
                    <b>{juror.name}</b>
                    <small>{reaction || juror.role}</small>
                    {juror.hearts !== undefined && (
                      <Hearts amount={juror.hearts} />
                    )}
                  </div>
                  {active && (
                    <span className="festival-juror-pin">Juge du jour</span>
                  )}
                </li>
              );
            })}
          </ul>

          {result ? (
            <div className="festival-result" aria-live="polite">
              <div className="festival-result-score">
                <small>Note du jury</small>
                <strong>{result.score}</strong>
                <span>/ {result.maxScore ?? 100}</span>
              </div>
              <div className="festival-result-copy">
                <small>{result.dishName}</small>
                <AwardSeal award={result.award} />
                <p>« {result.message} »</p>
                {lastThemeName && <small>Thème présenté : {lastThemeName}</small>}
                {improvement && <p className="festival-advice">Pour la prochaine fête : {improvement}</p>}
              </div>
              {!!result.breakdown?.length && (
                <dl className="festival-score-details">
                  {result.breakdown.map((detail) => (
                    <div key={detail.label}>
                      <dt>{detail.label}</dt>
                      <dd>
                        +{detail.value}
                        {detail.max ? ` / ${detail.max}` : ''}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          ) : (
            <div className="festival-result festival-result-waiting">
              <div className="festival-table-silhouette" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <div>
                <b>Le jury est installé</b>
                <p>
                  Choisissez un plat pour révéler sa note, son ruban et les
                  réactions du village.
                </p>
              </div>
            </div>
          )}

          <aside className="festival-best" aria-label="Meilleur résultat">
            <span className="festival-best-flag" aria-hidden="true">
              ★
            </span>
            {best ? (
              <div>
                <small>Meilleur souvenir de la fête</small>
                <b>{best.dishName}</b>
                <span>
                  {best.score}/{best.maxScore ?? 100} · {best.award.label}
                </span>
              </div>
            ) : (
              <div>
                <small>Meilleur souvenir de la fête</small>
                <b>Le cadre attend son premier ruban</b>
              </div>
            )}
          </aside>
        </section>
      </form>
    </section>
  );
}
