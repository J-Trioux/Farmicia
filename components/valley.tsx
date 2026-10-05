'use client';
import { useGameClock } from '@/hooks/use-game-clock';
import { useState } from 'react';
import Image from 'next/image';
import { PixelIcon } from '@/components/farm/sprites';
import { REGIONS, VALLEY_PROJECT_TARGET, VALLEY_TOURS, cargoLimit, tourMinimum, tourOf, valleyCapacity, valleyPreview, type RegionId } from '@/lib/valley';
import { UNLOCKS, crop, duration, itemLabel, level, price, recipe, valleyRequests, valleyUnlocked, type ActionArgument, type Game } from '@/lib/game';

type Props = { game: Game; now: number; dispatch: (action: string, arg?: ActionArgument) => unknown };
function unitName(game: Game, item: string) { return itemLabel(game, item).replace(' · Ordinaire', '').replace(' · Réussi', ''); }
export function ValleyPanel({ game, now: snapshotNow, dispatch }: Props) {
  const now = useGameClock() || snapshotNow;
  const [showAll, setShowAll] = useState(false);
  const valley = game.valley;
  const region = valley.region;
  const trip = valley.trip;
  const stock = Object.entries(game.stock)
    .filter(([item, amount]) => amount > 0 && (item === 'oeuf' || !!crop(item.split('|')[0]) || !!recipe(item.split('|')[0])))
    .sort(([a], [b]) => Number((REGIONS[region].preference as readonly string[]).includes(b.split('|')[0])) - Number((REGIONS[region].preference as readonly string[]).includes(a.split('|')[0])) || a.localeCompare(b, 'fr'));
  const request = valleyRequests(game, region);
  const tour = tourOf(valley.tour);
  const preview = valleyPreview(valley.cargo, region, (item) => price(game, item, now), tour.id);
  const ready = trip && now >= trip.returnAt;
  const remaining = trip ? Math.max(0, Math.ceil((trip.returnAt - now) / 1000)) : 0;
  if (!valleyUnlocked(game)) return <div className="valley-locked"><Image src="/assets/pixel/v090/valley.png" width={768} height={432} unoptimized alt="Le Bourg des Moulins et le Port des Vergers, de part et d’autre de la rivière"/><p>Au niveau {UNLOCKS.caravan}, Rosalie pourra charger sa première caravane. Continuez à cultiver : les deux routes resteront ouvertes, sans date limite.</p></div>;
  return <div className="valley-panel">
    <div className="valley-map"><Image src="/assets/pixel/v090/valley.png" width={768} height={432} unoptimized alt="Carte pixel art de la vallée : les Moulins à gauche, le Port des Vergers à droite"/><span className="valley-map-label mills">Bourg des Moulins</span><span className="valley-map-label port">Port des Vergers</span></div>
    <div className="valley-routes">
      {(['moulins','vergers'] as RegionId[]).map((id) => <button key={id} type="button" className={id === region ? 'chosen' : ''} disabled={!!trip} onClick={() => dispatch('valleySelect', { region: id })} aria-pressed={id === region}>
        <strong>{REGIONS[id].name}</strong><small>{REGIONS[id].note}</small><span>Réputation {valley.reputations[id]} · {valley.shipments[id]} trajet{valley.shipments[id] > 1 ? 's' : ''}</span>
      </button>)}
    </div>
    {trip ? <section className={`valley-travel ${ready ? 'arrived' : ''}`} aria-live="polite">
      <div className="valley-travel-head"><strong>{ready ? 'La caravane est revenue !' : `En route vers ${REGIONS[trip.region].name}`}</strong><span>{ready ? 'Récompense prête à réclamer' : `Retour dans ${duration(remaining)}`}</span></div>
      <div className="valley-travel-bar"><i style={{width:`${Math.min(100, Math.max(2, ((now - trip.departedAt)/(trip.returnAt-trip.departedAt))*100))}%`}}/></div>
      <p>{trip.cargo.map((line) => `${line.amount} ${unitName(game,line.item)}`).join(' · ')}</p>
      <p>{trip.preference}{trip.combination ? ` · ${trip.combination}` : ''}</p>
      <div className="valley-preview"><b>+{trip.coins} pièces</b><b>+{trip.xp} XP</b><b>+{trip.reputation} réputation</b></div>
      {ready && <button className="valley-primary" type="button" onClick={() => dispatch('valleyClaim')}>Accueillir la caravane et recevoir les récompenses</button>}
    </section> : <>
      <div className="valley-voice"><strong>{REGIONS[region].voice}</strong><p>« {REGIONS[region].greeting} »</p></div>
      <div className="valley-wanted"><strong>Sur l’avis du moment</strong><p>{request.length ? request.map((id) => crop(id)?.name || recipe(id)?.name || id).join(' · ') : 'Tous les produits de la ferme sont bienvenus.'} {game.lineages.length > 0 && 'Les variétés signature sont aussi reconnues.'}</p><small>Ces préférences changent après une livraison. Elles n’expirent jamais et les autres produits restent acceptés.</small></div>
      <fieldset className="valley-tours">
        <legend>Durée de la tournée</legend>
        {VALLEY_TOURS.map((entry) => {
          const locked = entry.level > level(game);
          return <button key={entry.id} type="button" aria-pressed={entry.id === tour.id} disabled={locked}
            onClick={() => dispatch('valleyTour', { id: entry.id })}
            title={locked ? `S’ouvre au niveau ${entry.level}` : entry.name}>
            <b>{entry.short}</b>
            <small>{locked ? `Niveau ${entry.level}` : entry.id === 'court' ? `${duration(REGIONS[region].travel)} · tarif de base` : `caisses ×${entry.crate} · +${Math.round((entry.reward - 1) * 100)} %`}</small>
          </button>;
        })}
      </fieldset>
      <div className="valley-section-title"><h4>Charger la caravane</h4><span>{valley.cargo.length}/{valleyCapacity(valley)} emplacements · {cargoLimit(valley,region)} par caisse</span></div>
      <div className="valley-cargo">
        {Array.from({length:valleyCapacity(valley)},(_,i) => { const line=valley.cargo[i]; return <div key={i} className={line?'filled':''}>{line ? <><PixelIcon id={line.item.split('|')[0]}/><span><b>{unitName(game,line.item)}</b><small>{line.amount} dans cette caisse</small></span><button type="button" aria-label={`Retirer ${unitName(game,line.item)}`} onClick={() => dispatch('valleyLoad',{item:line.item,amount:0})}>×</button></> : <span>Emplacement libre</span>}</div>; })}
      </div>
      {stock.length ? <><div className="valley-section-title"><h4>Réserve disponible</h4><button type="button" onClick={() => setShowAll(!showAll)}>{showAll ? 'Voir moins' : `Tout voir (${stock.length})`}</button></div>
      <div className="valley-stock">{stock.slice(0,showAll?stock.length:8).map(([item, owned]) => {
        const loaded=valley.cargo.find((line)=>line.item===item)?.amount||0;
        const max=Math.min(owned,cargoLimit(valley,region));
        const wanted=(REGIONS[region].preference as readonly string[]).includes(item.split('|')[0]);
        return <div key={item} className="valley-stock-line"><PixelIcon id={item.split('|')[0]}/><span><b>{unitName(game,item)}</b><small>{owned} possédé{owned>1?'s':''}{wanted?' · recherché':''}{item.includes('|l')?' · spécialité':''}</small></span><button type="button" disabled={loaded<=0} onClick={() => dispatch('valleyLoad',{item,amount:loaded-1})} aria-label={`Retirer une unité de ${unitName(game,item)}`}>−</button><b aria-label={`${loaded} chargé`}>{loaded}</b><button type="button" disabled={loaded>=max || (!loaded && valley.cargo.length>=valleyCapacity(valley))} onClick={() => dispatch('valleyLoad',{item,amount:loaded+1})} aria-label={`Charger une unité de ${unitName(game,item)}`}>+</button></div>;
      })}</div></> : <p className="valley-empty">Votre réserve est vide. Récoltez puis revenez préparer la caravane.</p>}
      <div className="valley-depart"><div><strong>Retour garanti dans {duration(preview.seconds)}</strong><p>{preview.units} produit{preview.units>1?'s':''} consommé{preview.units>1?'s':''} · {preview.preference}</p><p>{preview.combination || `${tourMinimum(tour.id) === 2 ? 'Deux' : tourMinimum(tour.id)} produits minimum. Associez des récoltes ou un plat pour augmenter la récompense.`}</p><div className="valley-preview"><b>{preview.coins} pièces</b><b>{preview.xp} XP</b><b>{preview.reputation} réputation</b></div><small>Vente immédiate estimée : {preview.directValue} pièces. La réputation ouvre des recettes et des capacités.</small></div><button className="valley-primary" type="button" disabled={preview.units < tourMinimum(tour.id)} onClick={() => dispatch('valleyDepart')}>Envoyer la caravane</button></div>
    </>}
    <div className="valley-progress"><section><h4>Relais de la vallée {valley.projectDone && '· construit'}</h4><p>Chaque livraison compte : récoltes, plats et spécialités. Les assortiments apportent plus de matériaux au relais.</p><div className="valley-travel-bar"><i style={{width:`${Math.min(100,valley.projectPoints/VALLEY_PROJECT_TARGET*100)}%`}}/></div><small>{valley.projectPoints}/{VALLEY_PROJECT_TARGET} matériaux · récompense : troisième emplacement de caravane et relais visible sur la ferme.</small></section><section><h4>Paliers régionaux</h4><p>2 réputation : recette locale et graines · 5 : caisses de 3 produits (multipliées par la tournée) · 8 : graines offertes aux retours suivants.</p>{valley.famousSignature && <p className="valley-signature">Sur l’avis de la vallée : « {valley.famousSignature}, la spécialité de Rosalie »</p>}</section></div>
  </div>;
}
