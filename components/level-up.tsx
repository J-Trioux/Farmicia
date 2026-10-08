'use client';
import type { CSSProperties } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { PixelIcon } from '@/components/farm/sprites';
import { crop } from '@/lib/game';
import { levelFocus } from '@/lib/farm-ui';
import { levelIconCards } from '@/lib/level-icons';

export type LevelUpInfo = {
  level: number;
  crop: string | null;
  system: string;
};

const CONFETTI_COLORS = [
  '#f6c955',
  '#b3432f',
  '#5d9a3c',
  '#4aa3d8',
  '#fff6dc',
  '#c98a4b',
];

/** Demande à la carte de glisser vers un point (en % de la carte). */
export function focusFarm(point: { x: number; y: number }) {
  window.dispatchEvent(new CustomEvent('rosalie:focus', { detail: point }));
}

/**
 * Passage de niveau en plein écran (0.5.5) : bannière qui se déroule,
 * confettis pixel, cartes de déblocage qui se retournent l’une après
 * l’autre ; à la fermeture, la caméra glisse vers la nouveauté.
 */
export function LevelUpScene({
  info,
  onClose,
}: {
  info: LevelUpInfo | undefined;
  onClose: () => void;
}) {
  const cards = info
    ? [
        ...(info.crop
          ? [
              {
                icon: info.crop,
                title: `${crop(info.crop).name}`,
                text: 'Nouvelle culture · une graine offerte',
              },
            ]
          : []),
        ...levelIconCards(info.system)
          .map((card) => ({
            ...card,
            text: 'Débloqué',
          })),
      ]
    : [];
  const focus = info ? levelFocus(info.level) : null;
  function close(goThere: boolean) {
    onClose();
    if (goThere && focus) setTimeout(() => focusFarm(focus), 180);
  }
  return (
    <Dialog open={!!info} onOpenChange={(open) => !open && close(false)}>
      <DialogContent className="levelup-dialog" showCloseButton={false}>
        <div className="levelup-confetti" aria-hidden="true">
          {Array.from({ length: 36 }, (_, i) => (
            <i
              key={i}
              style={
                {
                  '--x': `${(i * 37) % 100}%`,
                  '--delay': `${(i % 9) * 0.07}s`,
                  '--drift': `${((i * 53) % 60) - 30}px`,
                  '--spin': `${(i % 2 ? 1 : -1) * (180 + ((i * 29) % 360))}deg`,
                  '--fall': `${1.6 + ((i * 7) % 10) / 10}s`,
                  background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                } as CSSProperties
              }
            />
          ))}
        </div>
        <div className="levelup-banner">
          <span className="levelup-kicker" aria-hidden="true">
            ✦ Nouveau palier ✦
          </span>
          <DialogTitle>Niveau {info?.level}</DialogTitle>
          <DialogDescription>
            La ferme s’agrandit à votre rythme.
          </DialogDescription>
        </div>
        <ul className="levelup-cards">
          {cards.map((card, i) => (
            <li key={card.title} style={{ '--i': i } as CSSProperties}>
              <div className="levelup-card">
                <div className="levelup-card-back" aria-hidden="true">
                  <PixelIcon id="quality" />
                </div>
                <div className="levelup-card-front">
                  {card.icon && <PixelIcon id={card.icon} />}
                  <b>{card.title}</b>
                  <small>{card.text}</small>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <div className="levelup-actions">
          {focus && (
            <button className="primary-button" onClick={() => close(true)}>
              Voir {focus.label}
            </button>
          )}
          <button className="secondary-button" onClick={() => close(false)}>
            Retour à la ferme
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
