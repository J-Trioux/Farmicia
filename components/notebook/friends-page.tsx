'use client';
/**
 * 0.25 — Page Villageois du carnet (maquette 05-villageois de ChatGPT).
 *
 * Les cinq voisins en rangée (à la place du bandeau) ; à gauche la fiche du
 * voisin choisi (grand portrait, rôle, cœurs, citation, avantage à venir), à
 * droite trois encadrés de même dessin : offrir un cadeau, sa quête, ses
 * souvenirs. Goûts, niveaux d’amitié et conditions des quêtes inchangés.
 */
import { useState } from 'react';
import { CarnetHearts } from '@/components/notebook/carnet';
import { CarnetProgress } from '@/components/notebook/carnet-progress';
import { CarnetIcon as PixelIcon } from '@/components/notebook/carnet-icon';
import { CarnetPortrait as VillagerPortrait } from '@/components/notebook/carnet-portrait';
import type { AskConfirm } from '@/components/game-confirm';
import {
  HEART_STEPS,
  LINKS,
  QUESTS,
  VILLAGERS,
  fulfillment,
  giftPoints,
  itemLabel,
  itemName,
  orderBoard,
  type ActionArgument,
  type Game,
} from '@/lib/game';
import { Glyph } from '@/components/glyph';

type Dispatch = (action: string, argument?: ActionArgument) => unknown;

export function FriendsPage({ game, dispatch, askConfirm }: { game: Game; dispatch: Dispatch; askConfirm: AskConfirm }) {
  const [friendId, setFriendId] = useState<string>(VILLAGERS[0].id);
  const [choices, setChoices] = useState<Record<string, string>>({});
  const stock = Object.keys(game.stock).filter((key) => game.stock[key] > 0);
  const personal = orderBoard(game).find((offer) => offer.kind === 'personal');
  const index = Math.max(0, VILLAGERS.findIndex((v) => v.id === friendId));
  const v = VILLAGERS[index];
  const link = LINKS.find((entry) => entry.id === v.id);
  const q = QUESTS.find((entry) => entry.id === v.id)!;
  const hearts = game.relations[v.id] || 0;
  const points = game.friendship[v.id] || 0;
  const nextHeart = HEART_STEPS[Math.min(5, hearts + 1)];
  const completed = game.quests.includes(v.id);
  const delivery = fulfillment(game.stock, q.item, q.amount);
  const selected = stock.includes(choices[v.id]) ? choices[v.id] : stock.find((key) => v.likes.includes(key.split('|')[0])) || stock[0] || '';
  const repeat = game.giftHistory.includes(v.id + ':' + selected.split('|')[0]);
  const rewardIndex = hearts < 1 ? 0 : hearts < 3 ? 1 : 2;
  const gain = repeat ? 1 : selected ? giftPoints(v.likes, selected) : 0;

  return (
    <div className="carnet-stack friends-page">
      <fieldset className="carnet-roster">
        <legend className="sr-only">Choisir un villageois</legend>
        {VILLAGERS.map((villager, i) => (
          <button key={villager.id} type="button" aria-pressed={friendId === villager.id} onClick={() => setFriendId(villager.id)}>
            <VillagerPortrait index={i + 1} />
            <b>{villager.name}</b>
            <CarnetHearts value={game.relations[villager.id] || 0} />
          </button>
        ))}
      </fieldset>
      <div className="carnet-split">
        <article className="carnet-detail friend-card" aria-labelledby="friend-name">
          <span className="friend-portrait" aria-hidden="true">
            <VillagerPortrait index={index + 1} />
          </span>
          <h4 id="friend-name">{v.name}</h4>
          <p className="carnet-detail-sub">
            {v.role}
            {link?.trait ? ` · ${link.trait}` : ''}
          </p>
          <p className="friend-hearts">
            <CarnetHearts value={hearts} />
            <small>{hearts === 5 ? 'Amitié accomplie' : `${points}/${nextHeart} amitié · prochain cœur`}</small>
          </p>
          <CarnetProgress key={v.id} className="friend-progress" value={hearts === 5 ? 1 : points - HEART_STEPS[hearts]} max={hearts === 5 ? 1 : nextHeart - HEART_STEPS[hearts]} label={`Amitié avec ${v.name}`} valueText={hearts === 5 ? 'Amitié accomplie' : `${points} sur ${nextHeart} points, prochain cœur`} />
          <p className="friend-quote">« {link?.quote || 'Une belle assiette se partage toujours.'} »</p>
          <p className="carnet-band">
            <PixelIcon id="etoile" />
            <span>
              <b>{hearts >= 5 ? 'Avantage acquis :' : 'À venir :'}</b> {q.tiers[rewardIndex]}
              {link && <small>Spécialité : {link.specialty}</small>}
            </span>
          </p>
        </article>
        <div className="carnet-boxes">
          <section className="carnet-card carnet-box" aria-labelledby="friend-gift">
            <h5 className="carnet-box-title" id="friend-gift">
              <PixelIcon id="lettre" />
              Offrir un cadeau
            </h5>
            <div className="carnet-box-row">
              <span className="carnet-select">
                {selected && <PixelIcon id={selected.split('|')[0]} />}
                <select aria-label={'Produit à offrir à ' + v.name} value={selected} onChange={(event) => setChoices({ ...choices, [v.id]: event.target.value })}>
                  {!stock.length && <option value="">Panier vide</option>}
                  {stock.map((key) => (
                    <option key={key} value={key}>
                      {itemName(key)} ×{game.stock[key]}
                    </option>
                  ))}
                </select>
              </span>
              <button type="button" className="carnet-action" disabled={!selected || hearts === 5} onClick={() => dispatch('gift', { villager: v.id, item: selected })}>
                Offrir · +{gain}
              </button>
            </div>
            <p className="carnet-note">
              {v.name} aime : {v.likes.map((id) => itemName(id)).join(', ')}. Un produit déjà offert ne rapporte plus que +1.
            </p>
          </section>
          <section className="carnet-card carnet-box" aria-labelledby="friend-quest">
            <h5 className="carnet-box-title" id="friend-quest">
              <PixelIcon id="plan" />
              {q.title}
            </h5>
            <div className="carnet-box-row">
              <span className="carnet-box-item">
                <PixelIcon id={q.item.split('|')[0]} />
                {itemName(q.item)} · {q.amount}
              </span>
              <span className="carnet-chip" data-tone={completed ? 'ok' : delivery.possible ? 'ok' : hearts < 2 ? 'muted' : 'warn'}>
                {completed ? 'Livrée' : hearts < 2 ? 'Dès 2 cœurs' : delivery.possible ? 'Prête' : 'À réunir'}
              </span>
              <button
                type="button"
                className="carnet-action"
                disabled={completed || hearts < 2 || !delivery.possible}
                onClick={() => {
                  const submit = () => dispatch('quest', { id: v.id, confirmSuperior: delivery.usesSuperior });
                  if (delivery.usesSuperior)
                    askConfirm(
                      {
                        title: `Livrer la quête de ${v.name} ?`,
                        description: 'Cette quête accepte une qualité plus simple. Vérifiez le produit choisi.',
                        items: Object.entries(delivery.used).map(([id, amount]) => `${amount} × ${itemLabel(game, id)}`),
                        confirmLabel: 'Livrer la quête',
                      },
                      submit,
                    );
                  else submit();
                }}
              >
                {completed ? 'Livrée' : `Livrer · +${q.reward} pièces`}
              </button>
            </div>
            {personal?.villagerId === v.id && (
              <p className="carnet-note carnet-note-ok">
                Commande personnelle au panneau : {personal.amount} × {itemName(personal.crop)} · +{personal.xp} XP · +amitié.
              </p>
            )}
          </section>
          <section className="carnet-card carnet-box" aria-labelledby="friend-memories">
            <h5 className="carnet-box-title" id="friend-memories">
              <PixelIcon id="album" />
              Souvenirs
            </h5>
            <ul className="carnet-box-list">
              {[3, 5].map((milestone) => {
                const scene = v.id + '-' + milestone;
                const kept = game.seenScenes.includes(scene);
                return (
                  <li key={milestone}>
                    <span>Souvenir des {milestone} cœurs</span>
                    {hearts >= milestone ? (
                      <button type="button" className="carnet-mini-action" data-done={kept || undefined} disabled={kept} onClick={() => dispatch('scene', { scene })}>
                        {kept ? (
                          <>
                            <Glyph id="coche" /> Conservé
                          </>
                        ) : (
                          'Conserver'
                        )}
                      </button>
                    ) : (
                      <span className="carnet-chip" data-tone="muted">
                        <PixelIcon id="cadenas" className="inline-icon" /> À découvrir
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
