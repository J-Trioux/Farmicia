'use client';
import { memo, useState, type CSSProperties } from 'react';
import { PixelIcon } from '@/components/farm/sprites';
import { useRollingNumber } from '@/hooks/use-rolling-number';

/**
 * Bourse du HUD : les pièces défilent, la pièce tourne quand elle en reçoit
 * et le gain monte au-dessus de la bourse (0.17).
 */
export const CoinCounter = memo(function CoinCounter({
  coins,
  reduced,
  live = true,
  paused = false,
}: {
  coins: number;
  reduced: boolean;
  /** Faux tant que la partie se charge : le premier montant n’est pas un gain. */
  live?: boolean;
  /** Vrai quand une fenêtre couvre la bourse : les gains attendent qu’elle se ferme. */
  paused?: boolean;
}) {
  const shown = useRollingNumber(coins, reduced || paused);
  const [previous, setPrevious] = useState(coins);
  const [pulse, setPulse] = useState(0);
  const [gain, setGain] = useState(0);
  const [pending, setPending] = useState(0);
  const [wasLive, setWasLive] = useState(live);
  if (wasLive !== live) setWasLive(live);
  if (previous !== coins) {
    setPrevious(coins);
    if (coins > previous && wasLive && live) {
      if (paused) setPending(pending + coins - previous);
      else {
        setPulse(pulse + 1);
        setGain(coins - previous);
      }
    }
  }
  // Fenêtre fermée : la pièce tourne pour tout ce qui a été gagné dedans.
  if (!paused && pending > 0) {
    setPending(0);
    setPulse(pulse + 1);
    setGain(pending);
  }
  return (
    <div className="hud-resource" aria-label={`${coins} pièces`} data-tip="Pièces">
      <span key={pulse} className={pulse ? 'coin-pulse' : undefined}>
        <PixelIcon id="coin" />
      </span>
      <b aria-hidden="true">{Math.round(shown).toLocaleString('fr-FR')}</b>
      {pulse > 0 && !reduced && (
        <em key={`gain-${pulse}`} className="coin-float" aria-hidden="true">
          +{gain.toLocaleString('fr-FR')}
        </em>
      )}
    </div>
  );
});

/**
 * Niveau : un médaillon entouré d’un anneau d’XP (0.17), qui se remplit en
 * douceur, brille à chaque gain et éclate en rayons au passage de niveau.
 * Sur téléphone, la barre d’XP d’origine reste affichée.
 */
export const XpBar = memo(function XpBar({
  level,
  progress,
  label,
  live = true,
}: {
  level: number;
  progress: number;
  label: string;
  /** Faux tant que la partie se charge : pas de gain ni de passage de niveau. */
  live?: boolean;
}) {
  const [previous, setPrevious] = useState(progress);
  const [shine, setShine] = useState(0);
  const [previousLevel, setPreviousLevel] = useState(level);
  const [burst, setBurst] = useState(0);
  const [wasLive, setWasLive] = useState(live);
  const animate = wasLive && live;
  if (wasLive !== live) setWasLive(live);
  if (previous !== progress) {
    setPrevious(progress);
    if (animate) setShine(shine + 1);
  }
  if (previousLevel !== level) {
    setPreviousLevel(level);
    if (level > previousLevel && animate) setBurst(burst + 1);
  }
  return (
    <div
      className="hud-level"
      data-tip={label}
      style={{ '--xp': Math.max(0, Math.min(100, progress)) } as CSSProperties}
      aria-label={`Niveau ${level}, ${label}, progression ${Math.round(progress)} pour cent`}
    >
      <b key={`level-${burst}`} className={burst ? 'level-pop' : undefined}>
        <span className="level-prefix">Niv. </span>
        {level}
      </b>
      {burst > 0 && <span key={`burst-${burst}`} className="level-burst" aria-hidden="true" />}
      <span className="xp-track">
        <i style={{ width: `${progress}%` }}>
          {shine > 0 && <em key={shine} className="xp-shine" />}
        </i>
      </span>
      {shine > 0 && <span key={`ring-${shine}`} className="xp-ring-shine" aria-hidden="true" />}
      {/* 0.11.1 : sur téléphone, l’unité « XP » se cache ; le libellé complet reste dans aria-label. */}
      <small>{label.endsWith(' XP') ? <>{label.slice(0, -3)}<span className="xp-unit"> XP</span></> : label}</small>
    </div>
  );
});
