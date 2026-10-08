'use client';
/**
 * Projets du village : ce qui reste partagé. 0.25 : la page Projets du carnet
 * est dans components/notebook/projects-page.tsx.
 */
import { useGameClock } from '@/hooks/use-game-clock';
import { COURSE_NAMES, activeBuffs, duration, itemName, type Game, type MenuLine } from '@/lib/game';
import { ContextualPixelIcon as PixelIcon } from '@/components/notebook/carnet-icon';

const OUTCOME_LABELS: Record<string, string> = {
  rustique: 'rustique',
  reussi: 'réussi',
  savoureux: 'savoureux',
  chef: 'chef-d’œuvre',
};

export function lineLabel(line: MenuLine) {
  if (line.kind === 'item') return `${line.amount} × ${itemName(line.item)}`;
  if (line.kind === 'distinct')
    return `${line.count} cultures différentes${line.each && line.each > 1 ? ` × ${line.each}` : ''} · valeur ${line.minValue} ◉ minimum`;
  return `${COURSE_NAMES[line.course]} · plat ${OUTCOME_LABELS[line.minOutcome]} ou mieux`;
}

/** Pastilles des effets de plats actifs, affichées dans le HUD. */
export function BuffChips({ g, now: snapshotNow }: { g: Game; now: number }) {
  const now = useGameClock() || snapshotNow;
  const buffs = activeBuffs(g, now);
  if (!buffs.length) return null;
  return (
    <ul className="buff-chips" aria-label="Effets de plats actifs">
      {buffs.map((buff) => (
        <li key={buff.id} title={buff.desc}>
          {/* 0.24 : les braises du carnet pour le « Four chaud ». */}
          {buff.id === 'atelier' && <PixelIcon id="braises" />}
          <b>{buff.name}</b>
          <small>{duration((buff.end - now) / 1000)}</small>
        </li>
      ))}
    </ul>
  );
}
