'use client';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { CROP_ATLAS_ROWS } from '@/lib/farm-visuals';
import { CUE_EFFECT, cuesBetween, effectBox, framePosition, rosalieClip, sampleClip, type RosalieAction } from '@/lib/rosalie-anim';
const ROOT = '/assets/pixel/v040/';
/** 0.9.5 : les cultures de lignée prennent la couleur d’une variété ancienne (atlas v095). */
export function CropSprite({ crop, stage, lineage = false }: { crop: string; stage: number; lineage?: boolean }) {
  return (
    <span
      className="crop-sprite"
      aria-hidden="true"
      style={{
        backgroundImage: lineage ? 'url(/assets/pixel/v095/crops-lineage.png)' : 'url(/assets/pixel/crops-atlas.png)',
        backgroundPosition: `${stage * 25}% ${((CROP_ATLAS_ROWS[crop] ?? 0) / 11) * 100}%`,
        '--crop-ground-shift': `${15 * (1 - 34 / ([34, 42, 48, 52, 56][stage] ?? 56))}%`,
      } as CSSProperties}
    />
  );
}
const icons: Record<string, number> = {
  coin: 0,
  seeds: 1,
  water: 2,
  'watering-can': 2,
  tools: 3,
  pain: 4,
  confiture: 5,
  sauce: 6,
  ratatouille: 7,
  violette: 8,
  brioche: 9,
  infusion: 10,
  tarte: 11,
  oeuf: 12,
  soleil: 13,
  doree: 13,
  pluie: 14,
  brume: 14,
  quality: 15,
  marmite: 7,
};
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
export function PixelIcon({
  id,
  className = '',
}: {
  id: string;
  className?: string;
}) {
  const base = id.split('|')[0].replace('_maison', '');
  if (base in CROP_ATLAS_ROWS)
    return (
      <span className={`pixel-icon crop-icon ${className}`}>
        <CropSprite crop={base} stage={4} lineage={/\|l[1-9]\d*(?:$|\|)/.test(id)} />
      </span>
    );
  const carnetIcon = {
    basket: 0, valley: 1, lineage: 2,
    savoirfaire: 3, album: 4, guidebook: 5,
  }[base];
  if (carnetIcon !== undefined)
    return <span aria-hidden="true" className={'pixel-icon ' + className}
      style={{
        backgroundImage: 'url(/assets/pixel/carnet-v016/icons.png)',
        backgroundSize: '300% 200%',
        backgroundPosition: `${(carnetIcon % 3) * 50}% ${Math.floor(carnetIcon / 3) * 100}%`,
        imageRendering: 'pixelated',
      }} />;
  const recipeIcon = {
    potage: 0, assiette: 1, galette: 2,
    clafoutis: 3, veloute: 4, jus: 5,
    melonade: 6, fougasse: 7, pickles: 8,
  }[base];
  if (recipeIcon !== undefined)
    return <span aria-hidden="true" className={'pixel-icon ' + className}
      style={{
        backgroundImage: 'url(/assets/pixel/recettes-v016/icons.png)',
        backgroundSize: '300% 300%',
        backgroundPosition: `${(recipeIcon % 3) * 50}% ${Math.floor(recipeIcon / 3) * 50}%`,
        imageRendering: 'pixelated',
      }} />;
  if (base in props)
    return <PropSprite id={base} className={`pixel-icon ${className}`} />;
  const markIcon = {
    'season-printemps': 0, 'season-ete': 1, 'season-automne': 2, 'season-hiver': 3,
    paths: 4, souffle: 5,
  }[base];
  if (markIcon !== undefined)
    return <span aria-hidden="true" className={'pixel-icon ' + className}
      style={{ backgroundImage: 'url(/assets/pixel/v095/icons.png)',
        backgroundSize: '600% 100%', backgroundPosition: (markIcon * 20) + '% 0%',
        imageRendering: 'pixelated' }} />;
  const i = icons[base] ?? 15;
  return (
    <span
      aria-hidden="true"
      className={`pixel-icon ${className}`}
      style={{
        backgroundImage: `url(${ROOT}icons.png)`,
        backgroundSize: '400% 400%',
        backgroundPosition: `${((i % 4) * 100) / 3}% ${(Math.floor(i / 4) * 100) / 3}%`,
      }}
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
    const speed = action.startsWith('walk') ? walkScale : gestureScale;
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
        if (id) setEffects((list) => [...list.slice(-3), { key: ++serial.current, id, offset: cue.offset }]);
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
export function VillagerPortrait({ index }: { index: number }) {
  return (
    <span
      className="pixel-portrait"
      aria-hidden="true"
      style={{ backgroundPosition: `${(index / 5) * 100}% 100%` }}
    />
  );
}
