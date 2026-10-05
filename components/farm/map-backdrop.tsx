'use client';
/**
 * 0.21 — Le décor de la carte, teinté de la saison.
 *
 * Jusqu’en 0.20, la teinte de la saison était un `filter` CSS posé sur les deux
 * images de la carte : Firefox le recalculait à chaque image et le jeu y
 * gelait. Les teintes sont désormais cuites dans les images
 * (scripts/cuire-saisons.py, formules exactes des filtres CSS, sans perte) :
 * aucun filtre à l’exécution, rendu identique.
 *
 * La petite carte (1 536 × 1 024) s’affiche aussitôt ; dès que la carte HD
 * (4 608 × 3 072) est chargée, la petite est retirée de l’affichage : le
 * navigateur ne compose plus qu’une seule grande image.
 */
import { memo, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { MAP_IMAGE, MAP_IMAGE_HD } from '@/lib/world';

export type SeasonId = 'printemps' | 'ete' | 'automne' | 'hiver';

/** Images de la carte pour une saison (teinte cuite). */
export const seasonMap = (season: SeasonId) => ({
  low: `/assets/pixel/carte-hd/saisons/${season}.png`,
  high: `/assets/pixel/carte-hd/saisons/${season}-x3.webp`,
});

export const MapBackdrop = memo(function MapBackdrop({ season }: { season: SeasonId }) {
  const { low, high } = seasonMap(season);
  const hd = useRef<HTMLImageElement>(null);
  // Saison dont la carte HD est affichée (la petite carte est alors retirée).
  const [ready, setReady] = useState('');
  useEffect(() => {
    // Image déjà en cache : chargée avant que React ne branche onLoad.
    const img = hd.current;
    if (!img?.complete || !img.naturalWidth) return;
    const done = setTimeout(() => setReady(season), 0);
    return () => clearTimeout(done);
  }, [season]);
  return (
    <>
      <Image
        className="farm-backdrop"
        src={low}
        alt="Le domaine de Rosalie en pixel art : le mas, la place de la fête, le potager clos, le verger, l’atelier, l’étang, la rivière et ses ponts, le bois, les vignes, les grands champs et le village au loin"
        width={MAP_IMAGE.width}
        height={MAP_IMAGE.height}
        priority
        unoptimized
        decoding="async"
        sizes="(min-width: 901px) 2400px, 1080px"
        draggable={false}
        data-covered={ready === season || undefined}
      />
      {/* 1.0 : carte HD (tuiles redessinées par Astra), par-dessus la carte d’origine. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- grande image chargée après la carte d’origine */}
      <img
        key={season}
        ref={hd}
        className="farm-backdrop farm-backdrop-hd"
        src={high}
        alt=""
        aria-hidden="true"
        width={MAP_IMAGE_HD.width}
        height={MAP_IMAGE_HD.height}
        decoding="async"
        draggable={false}
        onLoad={() => setReady(season)}
      />
    </>
  );
});
