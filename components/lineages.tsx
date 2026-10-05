'use client';
import { useState } from 'react';
import { PixelIcon } from '@/components/farm/sprites';
import { useGameClock } from '@/hooks/use-game-clock';
import { AMENDMENTS, SEED_FIND_LEVEL, TERROIRS, TRAITS, canAdvanceSeason, crop, duration, fairPay, seasonReadyAt, fairCandidates, fairEntry, fairEvaluation, itemLabel, level, seasonFor, terroirForPlot, type ActionArgument, type Game, type TraitId } from '@/lib/game';

type Props = { game: Game; dispatch: (action: string, argument?: ActionArgument) => unknown };
const traitData = (id: TraitId) => TRAITS.find((entry) => entry.id === id)!;

export function LineagesPanel({ game, dispatch }: Props) {
  const [names, setNames] = useState<Record<number, string>>({});
  return <section className="living-album" aria-label="Album des lignées">
    <header className="living-intro"><PixelIcon id="seeds" /><div><h4>Les variétés de Rosalie</h4><p>Une belle récolte peut révéler une graine prometteuse. Choisissez un caractère, replantez cette lignée, puis faites-la connaître au village.</p></div></header>
    <div className="living-overview"><span><b>{game.seedFinds.length}</b> graine{game.seedFinds.length > 1 ? 's' : ''} à choisir</span><span><b>{game.lineages.length}</b> variété{game.lineages.length > 1 ? 's' : ''} conservée{game.lineages.length > 1 ? 's' : ''}</span><span><b>{game.terroirBuilds.length}/3</b> terroirs aménagés</span></div>
    {game.seedFinds.length > 0 && <div className="living-finds"><h4>Graines à sélectionner · {game.seedFinds.length}</h4>{game.seedFinds.map((find) => {
      const parent = game.lineages.find((lineage) => lineage.id === find.parentId);
      return <article className="living-find" key={find.id}>
        <div className="living-find-head"><PixelIcon id={find.crop} /><div><b>{parent ? `Faire évoluer ${parent.name}` : `${crop(find.crop).name} prometteur`}</b><small>Origine : {TERROIRS.find((zone) => zone.id === find.nativeTerroir)?.name} · récolte {find.sourceQuality}</small></div></div>
        {!parent && <label>Nom de la variété <input maxLength={24} value={names[find.id] || ''} placeholder={`${crop(find.crop).name} de Rosalie`} onChange={(event) => setNames({ ...names, [find.id]: event.target.value })} /></label>}
        <div className="living-traits">{find.options.map((id) => { const data = traitData(id); return <button key={id} onClick={() => dispatch('selectSeed', { candidateId: find.id, trait: id, name: names[find.id] })}><strong>{data.name}</strong><span>{data.effect}</span><small>Compromis : {data.tradeoff}</small><b>Choisir ce caractère</b></button>; })}</div>
        <button className="living-discard" onClick={() => dispatch('discardSeed', { candidateId: find.id })}>Laisser passer cette graine</button>
      </article>;
    })}</div>}
    {!game.seedFinds.length && !game.lineages.length && <p className="living-empty">Arrosez et récoltez quelques premières parcelles : les graines remarquables apparaîtront ici. Les graines classiques restent toujours disponibles.</p>}
    {!!game.lineages.length && <><h4>Variétés conservées · {game.lineages.length}</h4><div className="living-lineages">{game.lineages.map((lineage) => {
      const seedCost = game.projects.done.includes('pepiniere-voisins') ? 1 : 2;
      const coinCost = seedCost === 1 ? 12 : 20;
      return <article className="living-lineage" key={lineage.id}>
        <div className="living-find-head"><PixelIcon id={lineage.crop} /><div><b>{lineage.name}</b><small>{crop(lineage.crop).name} · génération {lineage.generation}/2 · {lineage.seeds} graine{lineage.seeds > 1 ? 's' : ''}</small></div></div>
        <p>{lineage.traits.map((id) => traitData(id).name).join(' + ')} · terroir d’origine : {TERROIRS.find((zone) => zone.id === lineage.nativeTerroir)?.short}</p>
        <ul>{lineage.traits.map((id) => <li key={id}><b>{traitData(id).name}</b> : {traitData(id).effect} <small>{traitData(id).tradeoff}</small></li>)}</ul>
        <p className="living-record">{lineage.harvests} récoltes · {lineage.orders} commande{lineage.orders > 1 ? 's' : ''} · meilleure qualité : {['ordinaire', 'belle', 'exceptionnelle'][lineage.bestQuality] || 'ordinaire'}</p>
        {lineage.traits.length < 2 && <small>Prochaine évolution après trois récoltes de cette lignée.</small>}
        <div className="living-lineage-actions"><button disabled={game.coins < coinCost || (game.seeds[lineage.crop] || 0) < seedCost} onClick={() => dispatch('propagateLineage', { lineageId: lineage.id })}>Multiplier +2 graines · {seedCost} classique{seedCost > 1 ? 's' : ''} + {coinCost} ◉</button><details><summary>Renommer</summary><label>Nouveau nom <input maxLength={24} value={names[-lineage.id] ?? lineage.name} onChange={(event) => setNames({ ...names, [-lineage.id]: event.target.value })} /></label><button onClick={() => dispatch('renameLineage', { lineageId: lineage.id, name: names[-lineage.id] ?? lineage.name })}>Enregistrer</button></details></div>
      </article>;
    })}</div></>}
    <details className="living-terroirs"><summary>Les trois terroirs · {game.terroirBuilds.length}/3 aménagés</summary><p>Chaque groupe de six parcelles a sa terre. Une culture peut pousser partout ; son terroir favori offre simplement un avantage.</p><div className="living-terroir-grid">{TERROIRS.map((zone) => {
      const config = AMENDMENTS.find((entry) => entry.terroir === zone.id)!;
      const openCount = game.plots.filter((_, index) => terroirForPlot(index) === zone.id).length;
      const open = openCount > 0;
      const built = game.terroirBuilds.includes(zone.id);
      return <article key={zone.id} data-terroir={zone.id}><h5>{zone.name}</h5><p>{zone.effect}</p><small>Parcelles {zone.id === 'soleil' ? '1–6' : zone.id === 'humide' ? '7–12' : '13–18'} · {open ? `${openCount}/6 accessibles` : 'à défricher'}</small><div><b>{config.name}</b><span>{config.effect}</span></div><button disabled={!open || built || level(game) < config.level || game.coins < config.cost} onClick={() => dispatch('amendTerroir', { terroir: zone.id })}>{built ? 'Aménagé' : !open ? 'Terrain à ouvrir' : level(game) < config.level ? `Niveau ${config.level}` : `Aménager · ${config.cost} ◉`}</button></article>;
    })}</div></details>
  </section>;
}

export function FairPanel({ game, dispatch }: Props) {
  const [chosen, setChosen] = useState<string[]>([]);
  const theme = seasonFor(game.season.index);
  const candidates = fairCandidates(game).sort((a, b) => a.localeCompare(b, 'fr')).slice(0, 30);
  const selected = chosen.filter((key) => candidates.includes(key));
  const evaluation = fairEvaluation(game, selected);
  const entered = fairEntry(game);
  // 0.11 : une saison dure au moins 8 h ; la foire se recharge avec elle.
  const now = useGameClock();
  const progressDone = canAdvanceSeason(game);
  const waitMs = now ? seasonReadyAt(game) - now : 0;
  const advance = progressDone && waitMs <= 0;
  const pay = fairPay(game, evaluation.score);
  return <section className="living-fair" aria-label="Foire des terroirs">
    <header><span className="fair-sun" aria-hidden="true">✦</span><div><small>Saison choisie · tour {Math.floor(game.season.index / 4) + 1}</small><h4>{theme.label}</h4><p>{theme.note}</p></div></header>
    <p className="fair-theme">À l’honneur : {theme.crops.map((id) => crop(id).name).join(' · ')}. Les recettes avec ces ingrédients conviennent aussi.</p>
    {level(game) < SEED_FIND_LEVEL ? <p>La première foire ouvre au niveau {SEED_FIND_LEVEL}. Elle n’a aucune date limite.</p> : entered ? <div className="fair-result"><b>Participation terminée · {entered.score}/100</b><p>Qualité {entered.breakdown.quality} · thème {entered.breakdown.theme} · variété {entered.breakdown.variety} · lignée {entered.breakdown.lineage} · maîtrise {entered.breakdown.mastery} · village {entered.breakdown.village}</p><small>+{entered.coins} pièces · +{entered.xp} XP. Une seule participation par saison.</small></div> : <>
      <p>Présentez un ou deux produits différents de votre panier. Une variété de votre ferme et une belle qualité peuvent renforcer votre note. Les produits présentés sont consommés.</p>
      <div className="fair-candidates">{candidates.map((key) => <button key={key} type="button" aria-pressed={selected.includes(key)} onClick={() => setChosen((current) => current.includes(key) ? current.filter((item) => item !== key) : current.length < 2 ? [...current, key] : [current[1], key])}><PixelIcon id={key} /><span>{itemLabel(game, key)}</span><b>×{game.stock[key]}</b></button>)}</div>
      {!candidates.length && <p>Le panier est vide. Récoltez une culture ou préparez un plat avant de participer.</p>}
      {selected.length > 0 && <div className="fair-preview"><b>Note estimée : {evaluation.score}/100</b><small>Qualité {evaluation.breakdown.quality} · accord au thème {evaluation.breakdown.theme} · variété {evaluation.breakdown.variety} · lignée {evaluation.breakdown.lineage} · maîtrise {evaluation.breakdown.mastery} · liens du village {evaluation.breakdown.village}</small><span>Récompense : {pay.coins} ◉ · {pay.xp} XP</span></div>}
      <button className="fair-submit" disabled={!selected.length || (selected.length === 2 && selected[0].split('|')[0] === selected[1].split('|')[0])} onClick={() => dispatch('fair', { items: selected })}>Présenter à la foire</button>
    </>}
    <div className="fair-next"><p>Une nouvelle saison s’ouvre après cette foire, quatre récoltes et une livraison ou préparation, et au moins 8 heures après la précédente (trois foires par jour au plus). Aucune récolte n’expire.</p><button disabled={!advance} onClick={() => { dispatch('seasonNext'); setChosen([]); }}>Choisir la saison suivante {advance ? '→' : progressDone ? `· dans ${duration(Math.ceil(waitMs / 1000))}` : '· progression en cours'}</button></div>
  </section>;
}
