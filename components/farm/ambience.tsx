'use client';
import {
  memo,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from 'react';
import { AmbienceEngine } from '@/lib/ambience/engine';
import { LAMPS, MAP_H, MAP_W, WINDOWS } from '@/lib/ambience/emitters';
import {
  DAY_PHASES,
  PHASE_PREVIEW_HOUR,
  WEATHER,
  hourOf,
  lightingAt,
  weatherFor,
  type DayPhase,
} from '@/lib/farm-visuals';
import { useGameClock } from '@/hooks/use-game-clock';
import { seasonFor, type Game } from '@/lib/game';

type Preview = { phase?: DayPhase; weather?: string; fps: boolean };
const NO_PREVIEW: Preview = { fps: false };
let preview: Preview | null = null;
/**
 * Paramètres réservés au développement : ?phase=night, ?weather=pluie, ?fps.
 * Ignorés dans la version de production.
 */
function readPreview(): Preview {
  if (process.env.NODE_ENV === 'production') return NO_PREVIEW;
  if (preview) return preview;
  const params = new URLSearchParams(window.location.search);
  const phase = params.get('phase') as DayPhase | null;
  const weather = params.get('weather');
  preview = {
    phase: phase && DAY_PHASES.includes(phase) ? phase : undefined,
    weather: WEATHER.some((w) => w.id === weather) ? weather! : undefined,
    fps: params.has('fps'),
  };
  return preview;
}
const noop = () => () => {};
export function useAmbiencePreview() {
  return useSyncExternalStore(noop, readPreview, () => NO_PREVIEW);
}

/** Heure, phase, météo et lumière de la carte (avec l’aperçu de développement). */
export function useSky(game: Game) {
  const now = useGameClock();
  const dev = useAmbiencePreview();
  const ready = now > 0;
  const hour = dev.phase ? PHASE_PREVIEW_HOUR[dev.phase] : hourOf(now);
  const light = lightingAt(hour);
  const weather = dev.weather || weatherFor(game, now).id;
  return { ...light, weather, now, ready };
}

const pct = (value: number, total: number) => `${(value / total) * 100}%`;

/**
 * 0.21.2 — Brume : trois nappes, chacune dans sa propre boîte (avant : un
 * calque de toute la carte qui glissait, que Firefox redessinait en entier à
 * chaque image). Mêmes ellipses, mêmes couleurs, même dérive de 8 % de la
 * largeur de la carte (en % de la boîte : 8 / largeur). L’opacité 0,65 de
 * l’ancien calque est portée par chaque couleur (les nappes ne se recouvrent pas).
 */
const MIST = [
  { x: 50, y: 66, rx: 12, ry: 6, rgb: [224, 237, 226], a: 0.16, fade: 72 },
  { x: 17, y: 50, rx: 11, ry: 5, rgb: [225, 236, 226], a: 0.11, fade: 75 },
  { x: 81, y: 33, rx: 11, ry: 5, rgb: [226, 238, 228], a: 0.1, fade: 75 },
] as const;
const MIST_OPACITY = 0.65;

/**
 * Calques de lumière, sous les parcelles : voile de la phase,
 * ombres de nuages, halos des lampadaires et fenêtres chaudes.
 * Aucun ne capte les clics.
 */
export const AmbienceLayers = memo(function AmbienceLayers({
  game,
}: {
  game: Game;
}) {
  const sky = useSky(game);
  // Les transitions de 20 s ne s’appliquent qu’après la première vraie heure :
  // au chargement, la carte s’affiche directement à la bonne lumière.
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    if (!sky.ready || settled) return;
    const timer = setTimeout(() => setSettled(true), 100);
    return () => clearTimeout(timer);
  }, [sky.ready, settled]);
  if (!sky.ready) return null;
  return (
    <div
      className="ambience-layers"
      data-settled={settled || undefined}
      data-phase={sky.phase}
      data-weather={sky.weather}
      aria-hidden="true"
      style={
        {
          '--tint': sky.tint,
          '--tint-alpha': sky.tintAlpha,
          '--lamps': sky.lamps,
        } as CSSProperties
      }
    >
      {sky.weather === 'brume' && (
        <div className="mist">
          {MIST.map((m, i) => {
            return (
              <i
                key={i}
                style={
                  {
                    left: `${m.x - m.rx}%`,
                    top: `${m.y - m.ry}%`,
                    width: `${m.rx * 2}%`,
                    height: `${m.ry * 2}%`,
                    background: `radial-gradient(closest-side, rgb(${m.rgb.join(' ')} / ${+(m.a * MIST_OPACITY).toFixed(4)}), transparent ${m.fade}%)`,
                    '--drift': `${+((8 / (m.rx * 2)) * 100).toFixed(4)}%`,
                  } as CSSProperties
                }
              />
            );
          })}
        </div>
      )}
      {/* Fanions de la fête : deux portions de la carte qui flottent au vent. */}
      <span className="bunting bunting-left" />
      <span className="bunting bunting-right" />
      {/* 0.21 : de jour, la teinte est nulle : pas de calque du tout. */}
      {sky.tintAlpha > 0.004 && <div className="sky-tint" />}
      <div className="cloud-shadows">
        <i />
        <i />
      </div>
      {/* 0.21.2 : de jour, aucune lampe ; l’intensité est portée par chaque halo
          (plus de calque de toute la carte à demi transparent). */}
      {sky.lamps > 0 && (
        <div className="lights">
          {WINDOWS.map((w, i) => (
            <span
              key={`w${i}`}
              className="window-glow"
              style={{
                left: pct(w.x, MAP_W),
                top: pct(w.y, MAP_H),
                width: pct(w.w, MAP_W),
                height: pct(w.h, MAP_H),
              }}
            />
          ))}
          {LAMPS.map((lamp, i) => (
            <span
              key={lamp.id}
              className="lamp"
              style={{
                left: pct(lamp.x, MAP_W),
                top: pct(lamp.y, MAP_H),
                width: pct(lamp.r * 2, MAP_W),
                height: pct(lamp.r * 2, MAP_H),
              }}
            >
              <span className={`lamp-halo lamp-${lamp.id}`} style={{ '--flicker-delay': `${-i * 0.7}s` } as CSSProperties} />
            </span>
          ))}
        </div>
      )}
    </div>
  );
});

/** Canevas des particules et des petits animaux, piloté par AmbienceEngine. */
export const AmbientCanvas = memo(function AmbientCanvas({
  game,
  reduced,
}: {
  game: Game;
  reduced: boolean;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<AmbienceEngine | null>(null);
  const sky = useSky(game);
  const dev = useAmbiencePreview();
  const [fps, setFps] = useState('');
  const coop = game.upgrades.includes('coop');
  const season = seasonFor(game.season.index).id;
  useEffect(() => {
    const el = canvas.current;
    const farm = el?.parentElement;
    const scroller = farm?.parentElement;
    if (!el || !farm || !scroller) return;
    const instance = new AmbienceEngine(el, farm, scroller);
    engine.current = instance;
    return () => {
      instance.destroy();
      engine.current = null;
    };
  }, []);
  useEffect(() => {
    if (!sky.ready) return;
    engine.current?.setContext(
      { phase: sky.phase, weather: sky.weather, coop, season },
      game.created,
    );
  }, [sky.ready, sky.phase, sky.weather, coop, season, game.created]);
  useEffect(() => {
    engine.current?.setReduced(reduced);
  }, [reduced]);
  useEffect(() => {
    if (!dev.fps) return;
    const timer = setInterval(() => {
      const e = engine.current;
      setFps(e ? `${e.fps} img/s · ${e.cost} ms · ${e.particles} part.` : '');
    }, 500);
    return () => clearInterval(timer);
  }, [dev.fps]);
  return (
    <>
      <canvas ref={canvas} className="ambient-canvas" aria-hidden="true" />
      {dev.fps && <output className="fps-meter">{fps}</output>}
    </>
  );
});
