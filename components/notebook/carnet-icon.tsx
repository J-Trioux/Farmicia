'use client';

import { PixelIcon } from '@/components/farm/sprites';
import { carnetIconAsset } from '@/lib/carnet-icons';
import { useCarnetAssets } from '@/components/notebook/carnet-assets';

/** Même pack v040 pour la reliure, les pages et leurs contrôles. */
export function CarnetIcon({ id, className = '' }: { id: string; className?: string }) {
  const image = carnetIconAsset(id);
  const base = id.split('|')[0];
  if (!image) return <PixelIcon id={id} className={className} />;
  return (
    <span
      aria-hidden="true"
      data-icon={base}
      data-hd="true"
      data-native-size="64"
      data-lineage={/\|l[1-9]\d*(?:$|\|)/.test(id) || undefined}
      className={`pixel-icon carnet-pixel-icon ${className}`}
      style={{ backgroundImage: `url(${image})`, backgroundSize: '100% 100%', backgroundPosition: 'center', imageRendering: 'pixelated' }}
    />
  );
}

/** Pour les contrôles partagés entre la ferme et le Carnet. */
export function ContextualPixelIcon(props: { id: string; className?: string }) {
  const inCarnet = useCarnetAssets();
  return inCarnet ? <CarnetIcon {...props} /> : <PixelIcon {...props} />;
}
