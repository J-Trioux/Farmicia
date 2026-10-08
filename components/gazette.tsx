'use client';
/**
 * 0.33.0 — La gazette de Farmicia.
 *
 * S’ouvre au premier passage de la journée (et après une longue absence) :
 * le ciel du moment et son effet, les trois demandes du jour, ce qui a poussé
 * pendant l’absence. On la rouvre en touchant le ciel ou les demandes du jour
 * dans le coin haut gauche.
 */
import type { ReactNode } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { PixelIcon } from '@/components/farm/sprites';
import { RECIPES, crop, type Game } from '@/lib/game';
import { dailyIcon, dailyLabel } from '@/lib/daily';
import { WEATHER_EFFECTS, nextWeather, weatherEnds, weatherFor } from '@/lib/weather';
import { awayLabel, type absenceSummary } from '@/lib/farm-ui';

export type AbsenceInfo = ReturnType<typeof absenceSummary>;

/** « 14 h 20 ». */
export function clockLabel(time: number) {
  const d = new Date(time);
  return `${d.getHours()} h ${String(d.getMinutes()).padStart(2, '0')}`;
}
/** « Jeudi 8 octobre ». */
function dateLabel(time: number) {
  const text = new Date(time).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function Gazette({
  game,
  now,
  open,
  absence,
  onCollect,
  onClose,
}: {
  game: Game;
  now: number;
  open: boolean;
  absence?: AbsenceInfo;
  onCollect: () => void;
  onClose: () => void;
}) {
  const sky = weatherFor(game, now);
  const next = nextWeather(game, now);
  const daily = game.daily;
  const done = daily?.requests.filter((r) => r.done).length ?? 0;
  const absenceItems: ReactNode[] = [];
  if (absence) {
    for (const [id, count] of Object.entries(absence.crops))
      absenceItems.push(
        <li key={id}>
          <PixelIcon id={id} />
          <span>
            {crop(id).name} · {count} parcelle{count > 1 ? 's' : ''} à récolter
          </span>
        </li>,
      );
    if (absence.eggs) absenceItems.push(<li key="eggs"><PixelIcon id="oeuf" /><span>Des œufs frais au poulailler</span></li>);
    if (absence.orchard) absenceItems.push(<li key="orchard"><PixelIcon id="fruitTree" /><span>Le verger a donné ses fruits</span></li>);
    if (absence.dish)
      absenceItems.push(
        <li key="dish">
          <PixelIcon id={absence.dish} />
          <span>{RECIPES.find((r) => r.id === absence.dish)?.name} est prêt à l’atelier</span>
        </li>,
      );
  }
  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="paper-dialog absence-dialog gazette-dialog">
        <DialogTitle>La gazette de Farmicia</DialogTitle>
        <DialogDescription>
          {dateLabel(now)}
          {absence ? ` · absence : ${awayLabel(absence.away)}, la ferme a continué de pousser.` : ''}
        </DialogDescription>
        <div className="dialog-scroll gazette-body">
          <section className="gazette-sky" aria-label="Le ciel">
            <h4>Le ciel</h4>
            <p className="gazette-weather">
              <PixelIcon id={sky.pixel} />
              <span>
                <b>{sky.label}</b>
                {WEATHER_EFFECTS[sky.pixel]}
              </span>
            </p>
            <small>
              Jusqu’à {clockLabel(weatherEnds(game, now))}, puis {next.label.toLowerCase()} : {WEATHER_EFFECTS[next.pixel].charAt(0).toLowerCase() + WEATHER_EFFECTS[next.pixel].slice(1)}
            </small>
          </section>
          {daily && (
            <section className="gazette-daily" aria-label="Les demandes du jour">
              <h4>
                Les demandes du jour <b>{done}/{daily.requests.length}</b>
              </h4>
              <ul>
                {daily.requests.map((request, index) => (
                  <li key={index} data-done={request.done || undefined}>
                    <PixelIcon id={dailyIcon(request)} />
                    <span className="gazette-request">
                      <b>{dailyLabel(request, (id) => crop(id).name)}</b>
                      <span className="gazette-progress" aria-hidden="true">
                        <i style={{ width: `${(request.count / request.target) * 100}%` }} />
                      </span>
                      <small>
                        {request.done ? 'Faite, merci !' : `${request.count}/${request.target}`}
                      </small>
                    </span>
                    <span className="gazette-reward" aria-label={`Récompense : ${request.coins} pièces et ${request.xp} XP`}>
                      <span>+{request.coins.toLocaleString('fr-FR')} <PixelIcon id="piece" className="inline-icon" /></span>
                      <span>+{request.xp.toLocaleString('fr-FR')} XP</span>
                    </span>
                  </li>
                ))}
              </ul>
              <p className="gazette-note">
                Elles se font en jouant et paient dès qu’elles sont faites. Rien n’est perdu sinon : demain, trois nouvelles demandes.
                {daily.previous && daily.previous.total > 0 ? ` La dernière fois : ${daily.previous.done}/${daily.previous.total}.` : ''}
              </p>
            </section>
          )}
          {absenceItems.length > 0 && (
            <section className="gazette-absence" aria-label="Pendant votre absence">
              <h4>Pendant votre absence</h4>
              <ul className="absence-list">{absenceItems}</ul>
              {absence && absence.ripe > 0 && !absence.canHarvest && (
                <p className="absence-hint">
                  Les cultures se cueillent sur la carte : glissez sur les parcelles, ou installez les outils de jardinier pour lancer une cueillette progressive.
                </p>
              )}
            </section>
          )}
        </div>
        <div className="absence-actions">
          {absence?.collectable && (
            <button className="primary-button" onClick={onCollect}>
              {absence.ripe > 0 && absence.canHarvest ? 'Envoyer Rosalie tout récupérer et cueillir' : 'Envoyer Rosalie tout récupérer'}
            </button>
          )}
          <button className={absence?.collectable ? 'secondary-button' : 'primary-button'} onClick={onClose}>
            Au travail !
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
