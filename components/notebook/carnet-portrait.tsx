'use client';

import { CARNET_PORTRAITS } from '@/lib/carnet-icons';

export function CarnetPortrait({ index }: { index: number }) {
  const villager = CARNET_PORTRAITS[index] || CARNET_PORTRAITS[0];
  return (
    <span
      className="pixel-portrait carnet-pixel-portrait"
      aria-hidden="true"
      data-villager={villager}
      style={{
        backgroundImage: `url(/assets/pixel/carnet-v040/portraits/${villager}.png?v=yeux-flamme-2)`,
        backgroundPosition: 'center',
        backgroundSize: '100% 100%',
        imageRendering: 'pixelated',
      }}
    />
  );
}
