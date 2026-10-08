'use client';
/**
 * 0.25 — Page Vallée du carnet (maquette 04-vallee de ChatGPT).
 *
 * Bandeau de la vallée, avec les deux destinations posées dessus ; onglets
 * des tournées (durée) ; à gauche le chargement de la caravane (caisses et
 * réserve, en −/+), à droite la tournée choisie, les récompenses estimées et
 * « Envoyer la caravane ». Pendant le trajet : sa progression, puis l’accueil
 * de la caravane. En bas, le relais de la vallée. Règles inchangées
 * (lib/valley.ts, actions valleySelect, valleyTour, valleyLoad, valleyDepart,
 * valleyClaim).
 */
import { useState, type CSSProperties } from 'react';
import { CarnetBanner, CarnetPager, CarnetRewards, CarnetSegments } from '@/components/notebook/carnet';
import { ContextualPixelIcon as PixelIcon } from '@/components/notebook/carnet-icon';
import { CarnetProgress } from '@/components/notebook/carnet-progress';
import { useGameClock } from '@/hooks/use-game-clock';
import { REGIONS, VALLEY_PROJECT_TARGET, VALLEY_TOURS, cargoLimit, tourMinimum, tourOf, valleyCapacity, valleyPreview, type RegionId } from '@/lib/valley';
import { UNLOCKS, crop, duration, itemLabel, level, price, recipe, valleyRequests, valleyUnlocked, type ActionArgument, type Game } from '@/lib/game';
import { Glyph } from '@/components/glyph';

type Props = { game: Game; now: number; dispatch: (action: string, arg?: ActionArgument) => unknown };
const PER_PAGE = 4;
const REGION_ICONS: Record<RegionId, string> = { moulins: 'moulin', vergers: 'barque' };
function unitName(game: Game, item: string) {
  return itemLabel(game, item).replace(' · Ordinaire', '').replace(' · Réussi', '');
}

export function ValleyPanel({ game, now: snapshotNow, dispatch }: Props) {
  const now = useGameClock() || snapshotNow;
  const [page, setPage] = useState(0);
  const valley = game.valley;
  const region = valley.region;
  const trip = valley.trip;
  const preferred = REGIONS[region].preference as readonly string[];
  const stock = Object.entries(game.stock)
    .filter(([item, amount]) => amount > 0 && (item === 'oeuf' || !!crop(item.split('|')[0]) || !!recipe(item.split('|')[0])))
    .sort(([a], [b]) => Number(preferred.includes(b.split('|')[0])) - Number(preferred.includes(a.split('|')[0])) || a.localeCompare(b, 'fr'));
  const request = valleyRequests(game, region);
  const tour = tourOf(valley.tour);
  const preview = valleyPreview(valley.cargo, region, (item) => price(game, item, now), tour.id);
  const ready = !!trip && now >= trip.returnAt;
  const remaining = trip ? Math.max(0, Math.ceil((trip.returnAt - now) / 1000)) : 0;
  const pages = Math.max(1, Math.ceil(stock.length / PER_PAGE));
  const shownPage = Math.min(page, pages - 1);

  if (!valleyUnlocked(game))
    return (
      <div className="carnet-stack valley-page">
        <CarnetBanner id="vallee" />
        <div className="carnet-empty">
          <PixelIcon id="valley" />
          <h4>La caravane arrive au niveau {UNLOCKS.caravan}.</h4>
          <p>Continuez à cultiver : les deux routes resteront ouvertes, sans date limite.</p>
        </div>
      </div>
    );

  return (
    <div className="carnet-stack valley-page">
      <CarnetBanner id="vallee">
        {!trip && (
        <fieldset className="carnet-banner-choices">
          <legend className="sr-only">Destination de la caravane</legend>
          {(['moulins', 'vergers'] as RegionId[]).map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={id === region}
              title={`${REGIONS[id].note} · réputation ${valley.reputations[id]} · ${valley.shipments[id]} trajet${valley.shipments[id] > 1 ? 's' : ''}`}
              onClick={() => dispatch('valleySelect', { region: id })}
            >
              <PixelIcon id={REGION_ICONS[id]} />
              <span>{REGIONS[id].name}</span>
              {id === region && <Glyph id="coche" />}
            </button>
          ))}
        </fieldset>
        )}
      </CarnetBanner>
      {trip ? (
        <div className="carnet-split">
          <section className="carnet-detail" aria-labelledby="valley-trip-title" aria-live="polite">
            <header className="carnet-detail-head">
              <span className="carnet-detail-art" aria-hidden="true">
                <PixelIcon id="valley" />
              </span>
              <div>
                <h4 id="valley-trip-title">{ready ? 'La caravane est revenue !' : `En route vers ${REGIONS[trip.region].name}`}</h4>
                <p className="carnet-detail-sub">{ready ? 'Récompense prête à recevoir' : `Retour dans ${duration(remaining)}`}</p>
              </div>
            </header>
            <CarnetProgress className="carnet-gauge-wide" value={now - trip.departedAt} max={trip.returnAt - trip.departedAt} label="Trajet de la caravane" valueText={ready ? 'Caravane revenue' : `Retour dans ${duration(remaining)}`} />
            <h5 className="carnet-rule">Dans la caravane</h5>
            <ul className="carnet-ingredients">
              {trip.cargo.map((line) => (
                <li key={line.item}>
                  <PixelIcon id={line.item.split('|')[0]} />
                  <span>
                    {unitName(game, line.item)} · {line.amount}
                  </span>
                </li>
              ))}
            </ul>
            <p className="carnet-note">
              {trip.preference}
              {trip.combination ? ` · ${trip.combination}` : ''}
            </p>
          </section>
          <section className="carnet-detail" aria-labelledby="valley-claim-title">
            <h5 className="carnet-rule" id="valley-claim-title">Récompenses</h5>
            <CarnetRewards coins={trip.coins} xp={trip.xp} extra={[{ icon: 'lettre', label: `+${trip.reputation} réputation` }]} />
            <div className="carnet-detail-actions">
              <button type="button" className="carnet-primary" disabled={!ready} onClick={() => dispatch('valleyClaim')}>
                <PixelIcon id="valley" />
                {ready ? 'Accueillir la caravane' : `Retour dans ${duration(remaining)}`}
              </button>
            </div>
          </section>
        </div>
      ) : (
        <div className="carnet-split">
          <div className="carnet-list-column valley-load">
            <h5 className="carnet-rule">
              Dans la caravane
              <small>
                {valley.cargo.length}/{valleyCapacity(valley)} caisses · {cargoLimit(valley, region)} par caisse
              </small>
            </h5>
            <ul className="valley-crates" style={{ '--crates': valleyCapacity(valley) } as CSSProperties}>
              {Array.from({ length: valleyCapacity(valley) }, (_, i) => {
                const line = valley.cargo[i];
                return (
                  <li key={i} data-empty={!line || undefined}>
                    {line ? (
                      <>
                        <PixelIcon id={line.item.split('|')[0]} />
                        <span className="carnet-stepper-label">
                          <b>{unitName(game, line.item)}</b>
                          <small>×{line.amount}</small>
                        </span>
                        <button type="button" className="carnet-icon-button" aria-label={`Retirer ${unitName(game, line.item)}`} onClick={() => dispatch('valleyLoad', { item: line.item, amount: 0 })}>
                          <Glyph id="croix" />
                        </button>
                      </>
                    ) : (
                      <small>Caisse libre</small>
                    )}
                  </li>
                );
              })}
            </ul>
            <h5 className="carnet-rule">Réserve disponible</h5>
            {stock.length ? (
              <ul className="carnet-list valley-stock">
                {stock.slice(shownPage * PER_PAGE, (shownPage + 1) * PER_PAGE).map(([item, owned]) => {
                  const loaded = valley.cargo.find((line) => line.item === item)?.amount || 0;
                  const max = Math.min(owned, cargoLimit(valley, region));
                  const wanted = preferred.includes(item.split('|')[0]);
                  return (
                    <li key={item} className="carnet-stepper" data-wanted={wanted || undefined}>
                      <PixelIcon id={item.split('|')[0]} />
                      <span className="carnet-stepper-label">
                        <b>{unitName(game, item)}</b>
                        <small>
                          ×{owned}
                          {wanted ? ' · recherché' : ''}
                          {item.includes('|l') ? ' · spécialité' : ''}
                        </small>
                      </span>
                      <span className="carnet-stepper-controls">
                        <button type="button" disabled={loaded <= 0} onClick={() => dispatch('valleyLoad', { item, amount: loaded - 1 })} aria-label={`Retirer une unité de ${unitName(game, item)}`}>
                          <Glyph id="moins" />
                        </button>
                        <output aria-label={`${loaded} chargé`}>{loaded}</output>
                        <button
                          type="button"
                          disabled={loaded >= max || (!loaded && valley.cargo.length >= valleyCapacity(valley))}
                          onClick={() => dispatch('valleyLoad', { item, amount: loaded + 1 })}
                          aria-label={`Charger une unité de ${unitName(game, item)}`}
                        >
                          <Glyph id="plus" />
                        </button>
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="carnet-list-empty">Votre réserve est vide. Récoltez puis revenez préparer la caravane.</p>
            )}
            <CarnetPager page={shownPage} pages={pages} label="Pages de la réserve" onPage={setPage} />
            <section className="carnet-band carnet-relay" aria-labelledby="valley-relay-title">
              <PixelIcon id="plan" />
              <span className="carnet-band-text">
                <b id="valley-relay-title">Relais de la vallée{valley.projectDone ? ' · construit' : ''}</b>
                <small>
                  {valley.projectDone
                    ? 'Troisième caisse de caravane et relais visible sur la ferme.'
                    : 'Chaque livraison apporte des matériaux ; les assortiments en apportent plus.'}
                  {valley.famousSignature ? ` · « ${valley.famousSignature}, la spécialité de Rosalie »` : ''}
                </small>
              </span>
              <span className="carnet-relay-gauge">
                <small>
                  {valley.projectDone ? VALLEY_PROJECT_TARGET : Math.min(valley.projectPoints, VALLEY_PROJECT_TARGET)}
                  {' '}/{' '}
                  {VALLEY_PROJECT_TARGET} matériaux
                </small>
                <CarnetSegments value={valley.projectDone ? VALLEY_PROJECT_TARGET : valley.projectPoints} max={VALLEY_PROJECT_TARGET} segments={4} />
              </span>
            </section>
          </div>
          <section className="carnet-detail" aria-labelledby="valley-tour-title">
            <header className="carnet-detail-head">
              <span className="carnet-detail-art" aria-hidden="true">
                <PixelIcon id="valley" />
              </span>
              <div>
                <h4 id="valley-tour-title">{tour.name}</h4>
                <p className="carnet-detail-sub">Retour garanti dans {duration(preview.seconds)}</p>
              </div>
            </header>
            <fieldset className="carnet-segmented">
              <legend className="sr-only">Durée de la tournée</legend>
              {VALLEY_TOURS.map((entry) => {
                const locked = entry.level > level(game);
                return (
                  <button
                    key={entry.id}
                    type="button"
                    aria-pressed={entry.id === tour.id}
                    disabled={locked}
                    title={locked ? `S’ouvre au niveau ${entry.level}` : entry.id === 'court' ? 'Tarif de base' : `Caisses ×${entry.crate} · +${Math.round((entry.reward - 1) * 100)} %`}
                    onClick={() => dispatch('valleyTour', { id: entry.id })}
                  >
                    {locked ? `${entry.short} · niv.\u00a0${entry.level}` : entry.short}
                  </button>
                );
              })}
            </fieldset>
            <p className="carnet-band carnet-band-info">
              <PixelIcon id={REGION_ICONS[region]} />
              <span>
                <b>{REGIONS[region].voice}</b> · « {REGIONS[region].greeting} »
                <small>
                  Sur l’avis : {request.length ? request.map((id) => crop(id)?.name || recipe(id)?.name || id).join(' · ') : 'tous les produits de la ferme sont bienvenus'}.
                </small>
              </span>
            </p>
            <p className="carnet-note">
              {preview.units} produit{preview.units > 1 ? 's' : ''} chargé{preview.units > 1 ? 's' : ''} · {preview.preference}
              {preview.combination ? ` · ${preview.combination}` : ` · ${tourMinimum(tour.id)} produits minimum`}
            </p>
            <h5 className="carnet-rule">Récompenses estimées</h5>
            <CarnetRewards coins={preview.coins} xp={preview.xp} extra={[{ icon: 'lettre', label: `+${preview.reputation} réputation` }]} />
            <div className="carnet-detail-actions">
              <button type="button" className="carnet-primary" disabled={preview.units < tourMinimum(tour.id)} onClick={() => dispatch('valleyDepart')}>
                <PixelIcon id="valley" />
                Envoyer la caravane
              </button>
            </div>
            <p className="carnet-note carnet-center">
              Vente immédiate estimée : {preview.directValue} pièces · réputation {valley.reputations[region]} (paliers 2, 5 et 8 : recette locale et graines, caisses de 3, graines offertes).
            </p>
          </section>
        </div>
      )}
      {trip && (
        <section className="carnet-band carnet-relay" aria-labelledby="valley-relay-title">
          <PixelIcon id="plan" />
          <span className="carnet-band-text">
            <b id="valley-relay-title">Relais de la vallée{valley.projectDone ? ' · construit' : ''}</b>
            <small>
              {valley.projectDone
                ? 'Troisième caisse de caravane et relais visible sur la ferme.'
                : 'Chaque livraison apporte des matériaux ; les assortiments en apportent plus.'}
              {valley.famousSignature ? ` · « ${valley.famousSignature}, la spécialité de Rosalie »` : ''}
            </small>
          </span>
          <span className="carnet-relay-gauge">
            <small>
              {valley.projectDone ? VALLEY_PROJECT_TARGET : Math.min(valley.projectPoints, VALLEY_PROJECT_TARGET)}
              {' '}/{' '}
              {VALLEY_PROJECT_TARGET} matériaux
            </small>
            <CarnetSegments value={valley.projectDone ? VALLEY_PROJECT_TARGET : valley.projectPoints} max={VALLEY_PROJECT_TARGET} segments={4} />
          </span>
        </section>
      )}
    </div>
  );
}
