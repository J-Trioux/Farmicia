'use client';
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { CROP_ATLAS_ROWS } from '@/lib/farm-visuals';
import { CROP_DRIPS } from '@/lib/crop-drips';
import { pixelIconAsset } from '@/lib/pixel-icons';
import { iconArtSize, snapIcon } from '@/lib/icon-snap';
import { CUE_EFFECT, cuesBetween, effectBox, framePosition, rosalieClip, sampleClip, type RosalieAction } from '@/lib/rosalie-anim';
/** 0.9.5 : les cultures de lignée prennent la couleur d’une variété ancienne (atlas v095). */
/**
 * 0.32.7 : `drip` (délai en secondes) = la plante est arrosée : une simple goutte
 * descend le long de sa forme (chemin propre à la culture et au stade,
 * lib/crop-drips.ts), puis disparaît au pied de la tige.
 */
export function CropSprite({ crop, stage, lineage = false, drip }: { crop: string; stage: number; lineage?: boolean; drip?: number }) {
  const path = drip === undefined ? null : CROP_DRIPS[crop]?.[stage] ?? null;
  return (
    <span
      className="crop-sprite"
      aria-hidden="true"
      style={{
        backgroundImage: lineage ? 'url(/assets/pixel/v095/crops-lineage.png)' : 'url(/assets/pixel/crops-atlas.png)',
        backgroundPosition: `${stage * 25}% ${((CROP_ATLAS_ROWS[crop] ?? 0) / 11) * 100}%`,
        '--crop-ground-shift': `${15 * (1 - 34 / ([34, 42, 48, 52, 56][stage] ?? 56))}%`,
      } as CSSProperties}
    >
      {path && (
        <i
          className="crop-drip"
          style={Object.fromEntries([['--drip-delay', `${drip}s`], ...path.flatMap(([x, y], i) => [[`--x${i}`, `${x}%`], [`--y${i}`, `${y}%`]])]) as CSSProperties}
        />
      )}
    </span>
  );
}
const props: Record<string, number> = {
  soil: 0,
  foundation: 1,
  workshop: 2,
  coop: 3,
  deadTree: 4,
  tree: 5,
  fruitTree: 6,
  greenhouseFoundation: 7,
  greenhouse: 8,
  bench: 9,
  irrigation: 10,
  auto: 11,
  hen: 12,
  hen2: 13,
  butterfly: 14,
  basket: 15,
  expand: 0,
  stove2: 2,
  stove3: 2,
};
/**
 * 0.32.11 — Icônes nettes (lib/icon-snap.ts). Un seul ResizeObserver pour
 * toutes les icônes : à chaque changement de taille (et de densité d’écran),
 * l’icône est redessinée à un multiple entier de sa grille, en pixels francs,
 * ou lissée si aucun multiple n’est assez proche. Variables posées sur
 * l’élément : --icon-draw, --icon-x, --icon-y (app/icones-nettes.css).
 */
const snapped = new Set<HTMLElement>();
let snapObserver: ResizeObserver | null = null;
let snapDpr = 0;
function applySnap(el: HTMLElement, width?: number, height?: number) {
  const art = Number(el.dataset.art);
  if (!art) return;
  if (width === undefined || height === undefined) {
    const style = getComputedStyle(el);
    width = parseFloat(style.width);
    height = parseFloat(style.height);
  }
  if (!(width > 0) || !(height > 0)) return;
  const dpr = window.devicePixelRatio || 1;
  const { mode, draw } = snapIcon(Math.min(width, height), dpr, art, el.dataset.cell ? 0.05 : undefined);
  el.dataset.snap = mode;
  if (el.dataset.cell) return;
  // Bord de l’icône sur un pixel physique entier : pas de colonne coupée.
  const ox = Math.round(((width - draw) / 2) * dpr) / dpr;
  const oy = Math.round(((height - draw) / 2) * dpr) / dpr;
  el.style.setProperty('--icon-draw', `${draw}px`);
  el.style.setProperty('--icon-x', `${ox - Number(el.dataset.cx || 0) * draw}px`);
  el.style.setProperty('--icon-y', `${oy - Number(el.dataset.cy || 0) * draw}px`);
}
function watchDensity() {
  snapDpr = window.devicePixelRatio || 1;
  const query = window.matchMedia(`(resolution: ${snapDpr}dppx)`);
  query.addEventListener('change', () => {
    snapped.forEach((el) => applySnap(el));
    watchDensity();
  }, { once: true });
}
function snapRef(el: HTMLSpanElement | null) {
  if (!el || typeof ResizeObserver === 'undefined') return;
  if (!snapObserver) {
    snapObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const box = entry.borderBoxSize?.[0];
        applySnap(entry.target as HTMLElement, box?.inlineSize ?? entry.contentRect.width, box?.blockSize ?? entry.contentRect.height);
      }
    });
    watchDensity();
  }
  snapped.add(el);
  snapObserver.observe(el);
  return () => {
    snapped.delete(el);
    snapObserver?.unobserve(el);
  };
}
export function PixelIcon({
  id,
  className = '',
}: {
  id: string;
  className?: string;
}) {
  const base = id.split('|')[0];
  if (base in CROP_ATLAS_ROWS)
    return (
      // 0.32.11 : la planche des cultures (cases de 128 px) n’est lissée qu’à
      // une échelle non entière ; à 64 px CSS sur écran Retina, pixels francs.
      <span className={`pixel-icon crop-icon ${className}`} ref={snapRef} data-art={128} data-cell="crop">
        <CropSprite crop={base} stage={4} lineage={/\|l[1-9]\d*(?:$|\|)/.test(id)} />
      </span>
    );
  const asset = pixelIconAsset(base);
  if (asset) return <SheetIcon id={base} asset={asset} className={className} />;
  if (base in props)
    return <PropSprite id={base} className={`pixel-icon ${className}`} />;
  // Un identifiant inconnu ne devient plus silencieusement une étoile.
  return null;
}
function SheetIcon({ id, asset, className }: { id: string; asset: NonNullable<ReturnType<typeof pixelIconAsset>>; className: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const attach = useCallback((el: HTMLSpanElement | null) => {
    ref.current = el;
    return snapRef(el);
  }, []);
  // Les planches HD conservent la grille native de 32 px.
  const hd = asset.image.includes('/icones-3.');
  const cx = asset.index % asset.columns;
  const cy = Math.floor(asset.index / asset.columns);
  // Une autre icône dans le même élément : la case change, la taille non.
  useEffect(() => {
    if (ref.current?.dataset.snap) applySnap(ref.current);
  }, [asset.image, cx, cy]);
  return (
    <span
      ref={attach}
      aria-hidden="true"
      data-icon={id}
      data-hd={hd || undefined}
      data-art={iconArtSize(asset.image) ?? undefined}
      data-cx={cx}
      data-cy={cy}
      className={`pixel-icon ${className}`}
      style={{
        backgroundImage: `url(${asset.image})`,
        backgroundSize: `${asset.columns * 100}% ${asset.rows * 100}%`,
        backgroundPosition: `${asset.columns > 1 ? (cx * 100) / (asset.columns - 1) : 0}% ${asset.rows > 1 ? (cy * 100) / (asset.rows - 1) : 0}%`,
        imageRendering: 'pixelated',
        '--icon-cols': asset.columns,
        '--icon-rows': asset.rows,
      } as CSSProperties}
    />
  );
}
export function PropSprite({
  id,
  className = '',
  style,
}: {
  id: string;
  className?: string;
  style?: CSSProperties;
}) {
  const i = props[id] ?? 0;
  return (
    <span
      aria-hidden="true"
      className={`prop-sprite ${className}`}
      style={{
        ...style,
        backgroundPosition: `${((i % 4) * 100) / 3}% ${(Math.floor(i / 4) * 100) / 3}%`,
      }}
    />
  );
}
export type { RosalieAction } from '@/lib/rosalie-anim';
/**
 * 0.9.7 — Rosalie animée image par image (sprites de l’auteur, 80 × 96, atlas 8 × 8).
 * Les durées varient d’une image à l’autre : la lecture se fait en JavaScript
 * (requestAnimationFrame), sans état React à chaque image. Les repères du geste
 * lancent les effets (eau, graines, terre, éclats) au bon moment.
 */
export function RosalieSprite({
  action,
  reduced = false,
  walkScale = 1,
  gestureScale = 1,
  repeat = false,
}: {
  action: RosalieAction;
  reduced?: boolean;
  walkScale?: number;
  /** 0.20 : rejoue un geste en boucle (bêcher, fêter un niveau). */
  repeat?: boolean;
  /** 0.9.9 : vitesse des gestes (outil amélioré = geste plus vif). */
  gestureScale?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const serial = useRef(0);
  const [effects, setEffects] = useState<{ key: number; id: string; offset: [number, number] }[]>([]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const clip = rosalieClip(action);
    // 0.23 : les animations de repos gardent leur rythme (pas celui de l’outil).
    const speed = action.startsWith('walk') ? walkScale : action.startsWith('repos') ? 1 : gestureScale;
    let shown = -1;
    let previous = 0;
    let frame = 0;
    let start = performance.now();
    const show = (elapsed: number) => {
      const { index, done } = sampleClip(clip, elapsed, reduced);
      if (index !== shown) {
        shown = index;
        el.style.backgroundPosition = framePosition(clip.frames[index]);
      }
      return done;
    };
    show(0);
    if (reduced || clip.frames.length < 2) return;
    const tick = (now: number) => {
      const elapsed = (now - start) * speed;
      const done = show(elapsed);
      for (const cue of cuesBetween(clip, previous, elapsed)) {
        const id = CUE_EFFECT[cue.type];
        // 0.32.5 : l’eau, les graines, la terre et l’éclat de récolte se jouent sur la
        // parcelle visée (ActionEffect, farm-map.tsx), plus à côté de Rosalie.
        if (id && !PLOT_EFFECTS.has(id)) setEffects((list) => [...list.slice(-3), { key: ++serial.current, id, offset: cue.offset }]);
      }
      previous = elapsed;
      if (done && repeat) {
        start = now;
        previous = 0;
      }
      if (!done || repeat) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [action, reduced, walkScale, gestureScale, repeat]);
  return (
    <>
      <span
        ref={ref}
        className={`rosalie-sprite ${action.startsWith('walk') ? 'walking' : ''}`}
        aria-hidden="true"
        // 0.32.5 : l’atlas de Rosalie (320 × 384 par image) est réduit en douceur
        // (image-rendering: auto, app/rosalie097.css). Le rendu « pixelated »
        // le réduisait au plus proche voisin : traits cassés, aspect basse résolution.
      />
      {!reduced &&
        effects.map((fx) => {
          const box = effectBox(fx.id, fx.offset);
          return (
            <span
              key={fx.key}
              className="rosalie-fx"
              aria-hidden="true"
              data-fx={fx.id}
              onAnimationEnd={() => setEffects((list) => list.filter((e) => e.key !== fx.key))}
              style={{
                imageRendering: 'pixelated',
                left: `${box.left}%`,
                top: `${box.top}%`,
                width: `${box.width}%`,
                height: `${box.height}%`,
                backgroundImage: `url(${box.image})`,
                backgroundSize: `${box.frames * 100}% 100%`,
                '--fx-duration': `${box.duration}ms`,
                '--fx-end': `${(box.frames * 100) / (box.frames - 1)}%`,
                '--fx-steps': box.frames,
              } as CSSProperties}
            />
          );
        })}
    </>
  );
}
/** Effets de geste dessinés sur la parcelle plutôt qu’à côté de Rosalie. */
const PLOT_EFFECTS = new Set(['water', 'seeds', 'soil', 'harvest']);
export function VillagerPortrait({ index }: { index: number }) {
  return (
    <span
      className="pixel-portrait"
      aria-hidden="true"
      style={{ backgroundPosition: `${(index / 5) * 100}% 100%` }}
    />
  );
}
