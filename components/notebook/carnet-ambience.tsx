import type { CSSProperties } from 'react';

type Accent = {
  kind: 'butterfly' | 'water' | 'steam' | 'fire';
  /** Positions dans l’illustration entière, avant son cadrage dans le bandeau. */
  x: number;
  y: number;
  width?: number;
  height?: number;
  delay?: number;
};

const SCENES: Readonly<Record<string, readonly Accent[]>> = {
  projets: [{ kind: 'water', x: 63, y: 70 }, { kind: 'water', x: 67, y: 69, delay: -1.8 }],
  commandes: [{ kind: 'water', x: 83, y: 64 }, { kind: 'water', x: 86, y: 66, delay: -2.1 }],
  foires: [{ kind: 'butterfly', x: 78, y: 46, delay: -3 }],
  vallee: [{ kind: 'water', x: 53, y: 66 }, { kind: 'water', x: 56, y: 77, delay: -2 }, { kind: 'water', x: 67, y: 90, delay: -4 }],
  maitrise: [{ kind: 'butterfly', x: 54, y: 48 }, { kind: 'butterfly', x: 25, y: 57, delay: -4.3 }],
  objectifs: [{ kind: 'butterfly', x: 49, y: 56, delay: -2 }],
  ameliorer: [{ kind: 'butterfly', x: 31, y: 55 }, { kind: 'butterfly', x: 67, y: 47, delay: -3.5 }],
  'savoir-faire-culture': [{ kind: 'butterfly', x: 22, y: 49, delay: -1.4 }],
  'savoir-faire-commerce': [{ kind: 'water', x: 84, y: 48 }],
  'savoir-faire-cuisine': [{ kind: 'steam', x: 33, y: 49, width: 2.2, height: 13 }],
  atelier: [{ kind: 'fire', x: 53.5, y: 46, width: 11, height: 32 }],
};

const SIZE = { butterfly: [3.3, 8.25], water: [3.5, 4.4], steam: [2.2, 13], fire: [11, 32] } as const;

/** Petites animations décoratives, solidaires du cadrage et sans cible interactive. */
export function CarnetAmbience({ scene, image }: { scene: string; image: string }) {
  const accents = SCENES[scene];
  if (!accents) return null;
  return (
    <div className="carnet-ambience" aria-hidden="true">
      {accents.map((accent, index) => {
        const width = accent.width ?? SIZE[accent.kind][0];
        const height = accent.height ?? SIZE[accent.kind][1];
        const style = {
          left: `${accent.x}%`,
          top: `${accent.y}%`,
          width: `${width}%`,
          height: `${height}%`,
          '--accent-delay': `${accent.delay ?? 0}s`,
          ...(accent.kind === 'fire' ? {
            backgroundImage: `url("${image}")`,
            backgroundSize: `${10000 / width}% ${10000 / height}%`,
            backgroundPosition: `${100 * (accent.x - width / 2) / (100 - width)}% ${100 * (accent.y - height / 2) / (100 - height)}%`,
          } : {}),
        } as CSSProperties;
        return (
          <span key={index} className={`carnet-accent carnet-accent-${accent.kind}`} style={style}>
            {accent.kind === 'butterfly' && <i className="carnet-butterfly-wings" />}
          </span>
        );
      })}
    </div>
  );
}
