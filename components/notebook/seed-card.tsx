'use client';
/** Extrait de app/page.tsx (0.11.1). 0.17.1 : la graineterie est dans components/seed-shop.tsx. */
import { duration, gardeYield, growTime, type Game } from '@/lib/game';
import { useGameClock } from '@/hooks/use-game-clock';

/** 0.9.5 : choix du semis normal ou d’un semis de garde pour les absences. */
export function GardeSelect({ game, cropId, hours, value, onChange, now: snapshotNow, className = '' }: {
  game: Game; cropId: string; hours: number[]; value: number;
  onChange: (hours: number) => void; now: number; className?: string;
}) {
  const now = useGameClock() || snapshotNow;
  return (
    <label className={`dock-garde-select ${className}`}
      title="Le semis de garde pousse lentement pendant votre absence et rend plusieurs récoltes d’un coup.">
      <span className="dock-label">Semis</span>
      <select value={value} onChange={(event) => onChange(Number(event.target.value))}
        data-garde={value || undefined}>
        <option value={0}>Normal · {duration(growTime(game, cropId, now))}</option>
        {hours.map((h) => (
          <option key={h} value={h}>
            Garde {h} h · ×{gardeYield(game, cropId, h, now)}
          </option>
        ))}
      </select>
    </label>
  );
}
