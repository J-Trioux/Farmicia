'use client';
import { memo, useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { MapBackdrop, type SeasonId } from '@/components/farm/map-backdrop';
import { gameAudio } from '@/lib/audio/engine';
import { createPortal } from 'react-dom';
import { ANCHORS, BUILD_FOCUS, FOCUS, RING, WORLD_H, WORLD_W, ZONES, pct, px, rectPct, type AnchorId, type RectPx } from '@/lib/world';
import { nearestWalkable } from '@/lib/nav';
import { FEAST_DECOR_READY, feastDecorFor } from '@/lib/embellishments';
import { RESTORATIONS, restorationStage } from '@/lib/restorations';
import { DOMAIN_LAYERS } from '@/lib/domain-art';
// 0.19 : taille des objets à l’échelle de la carte (lib/echelle.ts).
import { objectSize } from '@/lib/echelle';
import { EMBELLISHMENTS, PROJECTS, TRAITS, UPGRADES, bulkNext, embellishmentStage, crop, gestureMs, level, stoveJobs, seasonFor, terroirForPlot, type ActionArgument, type BulkKind, type Game, type Plot, type TraitId, type ValleyState } from '@/lib/game';
import {
  farmContext,
  farmGuidance,
  mapSpotAlert,
  type MapSpot,
} from '@/lib/farm-ui';
import { plotStage } from '@/lib/farm-visuals';
import { AmbienceLayers, AmbientCanvas } from './ambience';
import { ambienceBurst } from '@/lib/ambience/engine';
import {
  ActionQueue,
  HOME,
  PLACES,
  approach,
  groundTarget,
  placeRoute,
  plotPosition,
  route,
  routeTimeline,
  zoneStates,
  ZONE_LEVELS,
  type FarmIntent,
  type PlaceId,
  type Point,
} from '@/lib/farm-controls';
import { clipDuration, rosalieClip } from '@/lib/rosalie-anim';
import { type ActionFeedback } from '@/lib/action-feedback';
import { ALLANT_BASE, ERRAND_MAX_FACTOR, allant, allantMaxSeconds, bulkElan, stepSeconds } from '@/lib/allant';
import { useGameClock, useReducedMotion } from '@/hooks/use-game-clock';
import { reduceMotionFor } from '@/lib/motion';
import { useRosalieRepos } from '@/components/farm/rosalie-repos';
import { UPGRADE_ICONS } from '@/lib/pixel-icons';
import { READABLE_ZOOM, useFarmCamera } from '@/hooks/use-farm-camera';
import { worldObstacles } from '@/lib/nav-obstacles';
import {
  CropSprite,
  PixelIcon,
  RosalieSprite,
  type RosalieAction,
} from './sprites';
import { Glyph } from '@/components/glyph';

type Result = { g: Game; message: string; feedback: ActionFeedback };
type Props = {
  game: Game;
  selectedCrop: string;
  selectedLineage: number;
  disabled?: boolean;
  feedback?: ActionFeedback;
  onAct: (index: number, seed: string, lineageId?: number) => Result;
  onOpen: (panel: string) => void;
  /** 0.9.9 : une parcelle du geste groupé, appliquée quand Rosalie y arrive. */
  /** 0.18 : le pas choisi par la carte (la parcelle la plus proche de Rosalie). */
  onBulkStep: (step: { index: number; id: BulkKind }) => Result | null;
  /** 0.9.9 : course de Rosalie (atelier, poulailler, verger), appliquée à l’arrivée. */
  onErrand: (errand: Errand) => Result | null;
  /** La page y dépose ses courses ; la carte les met dans la file de Rosalie. */
  errandRef: RefObject<((errand: Errand) => void) | null>;
};
/** 0.9.9 : une course de Rosalie, appliquée seulement quand elle arrive sur place. */
export type Errand = {
  key: number;
  action: 'craft' | 'collect' | 'hens' | 'orchard';
  argument?: ActionArgument;
  place: PlaceId;
  activity: 'cook' | 'eggs' | 'harvest';
};
type ActivityIntent = {
  activity: 'cook' | 'eggs' | 'celebrate';
  destination: Point;
};
/** 0.16 : marche libre vers un point cliqué sur la carte (pieds, en %). */
type MoveIntent = { move: Point };
/** 0.20 : bêcher une nouvelle parcelle ; fêter un passage de niveau. */
type DigIntent = { dig: number };
type CelebrateIntent = { levelUp: number };
type QueuedIntent = FarmIntent | ActivityIntent | MoveIntent | DigIntent | CelebrateIntent | { errand: Errand } | { bulk: true };
/** Trois façons de marcher : vers une parcelle, pour une course, ou librement (sans presser le pas). */
type WalkMode = 'plot' | 'errand' | 'free';
const GESTURE: Record<BulkKind, 'plant' | 'water' | 'harvest'> = { sow: 'plant', water: 'water', harvest: 'harvest' };
const BULK_OF = { plant: 'sow', water: 'water', harvest: 'harvest' } as const;
type Effect = {
  key: number;
  index: number;
  kind: string;
  item?: ActionFeedback['items'][number];
  /** Graines trouvées en récoltant (petite graine qui s’envole, sans texte). */
  seeds?: number;
  flight?: { x: number; y: number; dx: number; dy: number };
};
type StrokeMode = 'plant' | 'water' | 'harvest' | 'observe';
/** Action qu’un glissé répète : celle de la première parcelle touchée. */
function strokeMode(plot: Plot, now: number): StrokeMode {
  if (!plot) return 'plant';
  if (plot.end <= now) return 'harvest';
  return plot.watered ? 'observe' : 'water';
}
const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));
const toStyle = (p: Point): CSSProperties => ({
  left: `${p.x}%`,
  top: `${p.y}%`,
});
/** 0.12 : profondeur des sprites posés au sol (et de Rosalie) : leurs pieds. */
const depth = (p: Point) => Math.round((p.y / 100) * WORLD_H);
/** Rectangle d’un lieu du décor (lib/world.ts) en style CSS, variables comprises. */
function zoneStyle(r: RectPx): CSSProperties {
  const q = rectPct(r);
  return {
    left: `${q.x}%`,
    top: `${q.y}%`,
    width: `${q.w}%`,
    height: `${q.h}%`,
    '--zx': q.x,
    '--zy': q.y,
    '--zw': q.w,
    '--zh': q.h,
  } as CSSProperties;
}
/**
 * 0.32.10 — Ombre de contact : une ellipse douce sous le pied des objets posés
 * sur la carte, dessinée sous le sprite (second calque de fond). Elle remplace
 * l’ombre décalée (drop-shadow), qui détourait l’objet comme un autocollant.
 */
const CONTACT_SHADOW = 'radial-gradient(closest-side, rgb(38 30 14 / 42%), rgb(38 30 14 / 20%) 55%, rgb(38 30 14 / 0))';
/** Image d’un objet dessiné par Astra (public/assets/pixel/objets-1.0/), posée sur son ombre. */
const objectImage = (name: string): CSSProperties => ({ backgroundImage: `url(/assets/pixel/objets-1.0/${name}.png), ${CONTACT_SHADOW}` });
/** Largeur de l’ombre des embellissements (part de la case, objet de l’étape 3) ; la barque flotte. */
const EMBELLISH_SHADOW: Record<string, number> = { fontaine: 0.56, pigeonnier: 0.56, epouvantail: 0.26, ruches: 0.6, moulin: 0.62, barque: 0 };
/** Sprite posé par ses pieds sur un ancrage (taille en px de la grille). */
function anchorStyle(id: AnchorId, w: number, h: number): CSSProperties {
  const at = pct(ANCHORS[id]);
  return {
    left: `${at.x}%`,
    top: `${at.y}%`,
    width: `${(w / WORLD_W) * 100}%`,
    height: `${(h / WORLD_H) * 100}%`,
    zIndex: Math.round(ANCHORS[id].y),
  };
}

export const FarmMap = memo(function FarmMap({
  game,
  selectedCrop,
  selectedLineage,
  disabled,
  feedback,
  onAct,
  onOpen,
  onBulkStep,
  onErrand,
  errandRef,
}: Props) {
  const systemReduced = useReducedMotion();
  const reduced = reduceMotionFor(systemReduced, game.settings);
  // 0.9.7 : la marche image par image suit l’Allant (plus vive, pas plus rapides).
  const walkScale = stepSeconds(ALLANT_BASE) / stepSeconds(allant(game));
  const [position, setPosition] = useState<Point>(HOME);
  const [action, setAction] = useState<RosalieAction>('idle');
  // 0.9.9 : le geste se joue à la vitesse de l’outil (palier) ; 1 = durée des images.
  const [gestureSpeed, setGestureSpeed] = useState(1);
  const [queueSize, setQueueSize] = useState(0);
  const [effects, setEffects] = useState<Effect[]>([]);
  const [target, setTarget] = useState<number | null>(null);
  const [contextTarget, setContextTarget] = useState<string | null>(null);
  const [canExplore, setCanExplore] = useState(false);
  const [strokeCursor, setStrokeCursor] = useState<StrokeMode | ''>('');
  const queue = useRef<ActionQueue<QueuedIntent> | null>(null);
  const positionRef = useRef<Point>(HOME);
  const tapRef = useRef<((x: number, y: number) => void) | null>(null);
  const [scroller, camera] = useFarmCamera({ target: positionRef, onTap: tapRef, reduced });
  const { follow, unfollow, desktop, fly } = camera;
  // 0.20 : la caméra, lue depuis la file de Rosalie (mise en scène du niveau).
  const cameraRef = useRef(camera);
  useEffect(() => {
    cameraRef.current = camera;
  });
  // 0.16 : marche libre en cours (un nouveau clic l’interrompt) et repère du point visé.
  const moveSerial = useRef(0);
  const [marker, setMarker] = useState<{ at: Point; key: number } | null>(null);
  // 0.5.2 : parcelles tout juste creusées et aménagement tout juste posé.
  // 0.20 : Rosalie bêche chaque nouvelle parcelle ; d’ici là, elle reste en herbe.
  const [untilled, setUntilled] = useState<number[]>([]);
  const plotsBefore = useRef(game.plots.length);
  const [dug, setDug] = useState<Record<number, number>>({});
  // 0.20 : halo doré du passage de niveau.
  const [aura, setAura] = useState(0);
  const [built, setBuilt] = useState<{ id: string; key: number } | null>(null);
  const rosalieRef = useRef<HTMLDivElement>(null);
  const latest = useRef({ game, onAct, onBulkStep, onErrand, reduced, selectedCrop, selectedLineage });
  const bulkQueued = useRef(false);
  const generation = useRef(0);
  const stroke = useRef<{ mode: StrokeMode; visited: Set<number> } | null>(
    null,
  );
  useEffect(() => {
    latest.current = { game, onAct, onBulkStep, onErrand, reduced, selectedCrop, selectedLineage };
  }, [game, onAct, onBulkStep, onErrand, reduced, selectedCrop, selectedLineage]);
  const followRef = useRef(follow);
  useEffect(() => {
    followRef.current = follow;
    // Clic bref sur le décor : Rosalie y marche, en contournant tout obstacle.
    tapRef.current = (x, y) => {
      const farm = scroller.current?.firstElementChild as HTMLElement | null;
      const control = queue.current;
      if (!farm || !control || disabled) return;
      const box = farm.getBoundingClientRect();
      if (x < box.left || x > box.right || y < box.top || y > box.bottom) return;
      const at = groundTarget({ x: ((x - box.left) / box.width) * 100, y: ((y - box.top) / box.height) * 100 });
      const spot = pct(nearestWalkable(px(at), worldObstacles(latest.current.game)));
      moveSerial.current += 1;
      control.drop((item) => 'move' in item);
      follow();
      control.enqueue({ move: at });
      setMarker({ at: spot, key: moveSerial.current });
    };
    return () => {
      tapRef.current = null;
    };
  }, [follow, disabled, scroller]);
  useEffect(() => {
    if (!marker) return;
    const timer = setTimeout(() => setMarker((m) => (m?.key === marker.key ? null : m)), 900);
    return () => clearTimeout(timer);
  }, [marker]);
  useEffect(() => {
    // Glisser : chaque parcelle survolée qui attend la même action est ajoutée
    // à la file. elementFromPoint fonctionne aussi au doigt (capture implicite).
    function move(event: PointerEvent) {
      const current = stroke.current;
      if (!current) return;
      const target = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest<HTMLElement>('[data-plot-index]');
      if (!target) return;
      const index = Number(target.dataset.plotIndex);
      if (current.visited.has(index)) return;
      if (
        strokeMode(latest.current.game.plots[index], Date.now()) !==
        current.mode
      )
        return;
      current.visited.add(index);
      followRef.current();
      queue.current?.enqueue({ index, crop: latest.current.selectedCrop, lineageId: latest.current.selectedLineage || undefined });
    }
    function end() {
      stroke.current = null;
      setStrokeCursor('');
    }
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
    };
  }, []);
  useEffect(() => {
    const token = ++generation.current;
    function recenter(p: Point) {
      const el = scroller.current;
      if (el)
        el.scrollTo({
          left: (p.x / 100) * el.scrollWidth - el.clientWidth / 2,
          top: (p.y / 100) * el.scrollHeight - el.clientHeight / 2,
          behavior: 'auto',
        });
    }
    // Mobile : la caméra (ordinateur) centre elle-même la vue sur le cœur de la ferme.
    recenter(FOCUS.potager);
    /** 0.22 : le son vient du côté de l’écran où se trouve Rosalie. */
    function pan() {
      const r = rosalieRef.current?.getBoundingClientRect();
      return r ? Math.max(-0.7, Math.min(0.7, ((r.left + r.width / 2) / window.innerWidth - 0.5) * 1.4)) : 0;
    }
    /**
     * Marche continue (0.5.5) : position interpolée à vitesse constante et
     * écrite directement sur le nœud à chaque image, sans rendu React. Le
     * changement de direction seul passe par l’état ; poussière à chaque pas.
     */
    function walk(points: Point[], mode: WalkMode = 'plot', boost = 1) {
      const el = rosalieRef.current;
      // Allant (0.9.5) : la vitesse de marche progresse avec la ferme ;
      // 0.32.3 : `boost` = élan d’une tournée groupée.
      const speed = allant(latest.current.game, Date.now()) * boost;
      const step = stepSeconds(speed);
      // 0.16 : une marche libre va au pas de Rosalie, sans plafond de durée,
      // et s’arrête là où elle est si un autre clic la redirige.
      const serial = moveSerial.current;
      const interrupted = () => mode === 'free' && moveSerial.current !== serial;
      const timeline = routeTimeline(
        [positionRef.current, ...points],
        speed,
        mode === 'free' ? Infinity : allantMaxSeconds(speed) * (mode === 'errand' ? ERRAND_MAX_FACTOR : 1),
      );
      el?.style.setProperty('--walk-step', `${step}s`);
      const arrive = () => {
        const last = points.at(-1);
        if (last) {
          positionRef.current = last;
          setPosition(last);
          if (el) {
            el.style.left = `${last.x}%`;
            el.style.top = `${last.y}%`;
            el.style.zIndex = String(depth(last));
          }
        }
      };
      if (!el || timeline.duration < 0.02) {
        arrive();
        return Promise.resolve();
      }
      // 0.9.9 : onglet caché, pas d’images à dessiner : le trajet prend le même temps.
      if (document.hidden)
        return sleep(timeline.duration * 1000).then(() => {
          if (generation.current === token) arrive();
        });
      return new Promise<void>((resolve) => {
        const started = performance.now();
        let dir = '';
        let lastStep = -1;
        el.classList.add('walking');
        const frame = (time: number) => {
          if (generation.current !== token || interrupted()) {
            el.classList.remove('walking');
            if (interrupted()) setPosition(positionRef.current);
            resolve();
            return;
          }
          const t = (time - started) / 1000;
          const p = timeline.at(t);
          el.style.left = `${p.x}%`;
          el.style.top = `${p.y}%`;
          el.style.zIndex = String(depth(p));
          positionRef.current = { x: p.x, y: p.y };
          if (p.dir !== dir) {
            dir = p.dir;
            setAction(`walk-${p.dir}`);
          }
          const stepIndex = Math.floor(t / step);
          if (stepIndex !== lastStep) {
            lastStep = stepIndex;
            if (!latest.current.reduced) ambienceBurst('dust', p.x, p.y, 2);
            // 0.22 : un pas, un bruit de pas (quatre variantes, jamais deux fois le même).
            gameAudio.play(`pas-${(stepIndex % 4) + 1}`, { volume: 0.75 + Math.random() * 0.25, rate: 0.92 + Math.random() * 0.16, pan: pan() });
          }
          if (t < timeline.duration) requestAnimationFrame(frame);
          else {
            el.classList.remove('walking');
            // Tassement à l’arrivée.
            el.classList.remove('landing');
            void el.offsetWidth;
            el.classList.add('landing');
            setPosition(positionRef.current);
            resolve();
          }
        };
        requestAnimationFrame(frame);
      });
    }
    /** 0.16 : emprise au sol des objets posés, que Rosalie contourne. */
    const obstacles = () => worldObstacles(latest.current.game);
    /** 0.9.9 : geste joué à la vitesse de l’outil ; l’effet tombe au milieu du geste. */
    function startGesture(kind: 'plant' | 'water' | 'harvest') {
      const ms = gestureMs(latest.current.game, BULK_OF[kind]);
      const speed = clipDuration(rosalieClip(kind)) / ms;
      setGestureSpeed(speed);
      setAction(kind);
      // 0.22 : le bruitage tombe sur le moment fort du geste (milieu), à la vitesse de l’outil.
      const rate = Math.max(0.85, Math.min(1.35, speed));
      const peak = ms * 0.45 / 1000;
      if (kind === 'water') gameAudio.play('arroser', { rate, pan: pan(), delay: Math.max(0, peak - 0.25) });
      else if (kind === 'plant') gameAudio.play('semer', { rate, pan: pan(), delay: Math.max(0, peak - 0.45 / rate) });
      else gameAudio.play('recolter', { rate, pan: pan(), delay: Math.max(0, peak - 0.2 / rate) });
      return ms;
    }
    /** Retour visuel d’une action appliquée sur une parcelle (vol vers le panier, éclat). */
    async function showResult(result: Result, index: number, kind: string) {
      if (!result.feedback.changed) return;
      const item = result.feedback.items[0];
      const key = result.feedback.id;
      const bounds = scroller.current
        ?.querySelector('.pixel-farm')
        ?.getBoundingClientRect();
      const basket = document
        .getElementById('basket-button')
        ?.getBoundingClientRect();
      const p = plotPosition(index);
      const x = bounds ? bounds.left + (bounds.width * p.x) / 100 : 0;
      const y = bounds ? bounds.top + (bounds.height * p.y) / 100 : 0;
      const flight =
        bounds && basket && !latest.current.reduced
          ? {
              x,
              y,
              dx:
                Math.min(
                  window.innerWidth - 30,
                  basket.left + basket.width / 2,
                ) - x,
              dy: basket.top - y,
            }
          : undefined;
      setEffects((prev) => [
        ...prev.slice(-8),
        { key, index, kind, item, seeds: result.feedback.seeds, flight },
      ]);
      // 0.22 : la récolte tombe dans le panier ; une belle ou une exceptionnelle a sa petite musique.
      if (item?.quality === 'exceptionnelle') gameAudio.play('recolte-exceptionnelle', { duck: 1.5 });
      else if (item?.quality === 'belle') gameAudio.play('recolte-belle', { pan: pan() * 0.5 });
      else if (item) gameAudio.play('panier', { delay: flight ? 0.55 : 0.1, volume: 0.8 });
      setTimeout(() => {
        if (generation.current === token)
          setEffects((prev) => prev.filter((e) => e.key !== key));
      }, 1500);
      if (item?.quality === 'exceptionnelle') {
        setAction('celebrate');
        // Moment fort : ralenti de 150 ms, secousse de 2 px et gerbe d’éclats
        // d’or (coupés en mouvement réduit).
        if (!latest.current.reduced) {
          const farm =
            scroller.current?.querySelector<HTMLElement>('.pixel-farm');
          farm?.classList.remove('shake');
          void farm?.offsetWidth;
          farm?.classList.add('shake');
          setTimeout(() => farm?.classList.remove('shake'), 400);
          const spot = plotPosition(index);
          ambienceBurst('sparkle', spot.x, spot.y + 0.4, 10);
          await sleep(150);
        }
      }
    }
    /** 0.9.9 : une parcelle du geste groupé, exactement comme un clic. */
    async function bulkStep() {
      bulkQueued.current = false;
      // 0.18 : Rosalie va à la parcelle la plus proche d’elle, parmi toutes ses tâches.
      const step = bulkNext(latest.current.game, Date.now(), positionRef.current);
      if (!step) return;
      const { index } = step;
      const kind = GESTURE[step.kind];
      setTarget(index);
      await walk(route(positionRef.current, approach(index, kind), obstacles()), 'plot', bulkElan(latest.current.game, step.kind));
      if (generation.current !== token) return;
      const ms = startGesture(kind);
      await sleep(ms * 0.45);
      const wait = (latest.current.game.bulkJob?.nextAt ?? 0) - Date.now();
      if (wait > 0) await sleep(Math.min(wait, ms));
      if (generation.current !== token) return;
      const result = latest.current.onBulkStep({ index, id: step.kind });
      if (result) {
        latest.current = { ...latest.current, game: result.g };
        await showResult(result, index, kind);
      }
      await sleep(ms * 0.55);
      if (generation.current === token) {
        setAction('idle');
        setTarget(null);
      }
    }
    /** 0.9.9 : course de Rosalie ; l’action n’a lieu qu’à son arrivée. */
    async function runErrand(errand: Errand) {
      await walk(placeRoute(positionRef.current, PLACES[errand.place], obstacles()), 'errand');
      if (generation.current !== token) return;
      setGestureSpeed(1);
      setAction(errand.activity);
      // 0.22 : feu sous la marmite, plats sortis dans le panier, poules et œufs, fruits cueillis.
      gameAudio.play(errand.action === 'craft' ? 'cuisine-feu' : errand.action === 'collect' ? 'panier'
        : errand.activity === 'eggs' ? 'oeufs' : 'recolter', { pan: pan() });
      // 1.0 : cuisiner et ramasser les œufs ont leur animation (8 images de 100 ms).
      await sleep(latest.current.reduced ? 650 : Math.max(650, clipDuration(rosalieClip(errand.activity))));
      if (generation.current !== token) return;
      const result = latest.current.onErrand(errand);
      if (result) latest.current = { ...latest.current, game: result.g };
      const chef = result?.feedback.items.some((item) => item.quality === 'chef');
      if (chef) {
        setAction('celebrate');
        await sleep(500);
      }
      if (generation.current === token) setAction('idle');
    }
    /** 0.20 : Rosalie va bêcher une nouvelle parcelle, puis la terre apparaît. */
    async function dig(index: number) {
      setTarget(index);
      await walk(route(positionRef.current, approach(index, 'plant'), obstacles()));
      if (generation.current !== token) return;
      setGestureSpeed(1);
      setAction('hoe');
      gameAudio.play('becher', { pan: pan(), delay: 0.12 });
      const spot = plotPosition(index);
      await sleep(latest.current.reduced ? 250 : 520);
      if (generation.current !== token) return;
      if (!latest.current.reduced) ambienceBurst('dust', spot.x, spot.y + 1.1, 6);
      gameAudio.play('becher', { pan: pan(), rate: 0.94 });
      const key = Date.now();
      setUntilled((list) => list.filter((i) => i !== index));
      setDug((map) => ({ ...map, [index]: key }));
      setTimeout(() => setDug((map) => {
        if (map[index] !== key) return map;
        const next = { ...map };
        delete next[index];
        return next;
      }), 1400);
      await sleep(latest.current.reduced ? 150 : 480);
      if (generation.current !== token) return;
      setAction('idle');
      setTarget(null);
    }
    /**
     * 0.20 : passage de niveau. Zoom doux sur Rosalie, elle fête dans un halo
     * doré (« à la Super Saiyan »), puis la caméra revient comme avant ; la
     * fenêtre du niveau s’ouvre ensuite (événement rosalie:celebrated).
     */
    async function celebrate(levelReached: number) {
      const cam = cameraRef.current;
      const reducedNow = latest.current.reduced;
      const wasFollowing = cam.isFollowing();
      const above = () => ({ x: positionRef.current.x, y: positionRef.current.y - 2.6 });
      // 0.32.11 : plus de zoom sur elle (le décalage gênait l’action en cours) ;
      // la vue ne glisse vers elle que si elle n’est pas à l’écran.
      const glide = cam.desktop && !reducedNow && !cam.sees(positionRef.current);
      if (glide) {
        cam.unfollow();
        cam.fly({ center: above() }, CELEBRATE_ZOOM_MS);
      }
      setGestureSpeed(1);
      setAction('celebrate');
      setAura(levelReached);
      // 0.22 : la fanfare du niveau, la musique s’efface le temps du halo.
      gameAudio.play('niveau', { duck: 3 });
      await sleep(reducedNow ? 700 : CELEBRATE_MS);
      setAura(0);
      if (generation.current === token) setAction('idle');
      if (glide && wasFollowing) cam.follow();
      window.dispatchEvent(new CustomEvent('rosalie:celebrated', { detail: levelReached }));
    }
    async function execute(intent: QueuedIntent) {
      if (generation.current !== token) return;
      if ('levelUp' in intent) return celebrate(intent.levelUp);
      if ('dig' in intent) return dig(intent.dig);
      if ('bulk' in intent) return bulkStep();
      if ('errand' in intent) return runErrand(intent.errand);
      if ('move' in intent) {
        await walk(route(positionRef.current, intent.move, obstacles()), 'free');
        if (generation.current === token) setAction('idle');
        return;
      }
      if ('activity' in intent) {
        const to = intent.destination;
        await walk(placeRoute(positionRef.current, to, obstacles()), 'errand');
        if (generation.current !== token) return;
        setGestureSpeed(1);
        setAction(intent.activity);
        await sleep(latest.current.reduced ? 650 : Math.max(650, clipDuration(rosalieClip(intent.activity))));
        if (generation.current === token) setAction('idle');
        return;
      }
      // 0.9.9 : Rosalie marche toujours jusqu’à la parcelle, même en mouvement
      // réduit (elle glisse alors sans animation) : le temps de jeu est le même.
      const { index } = intent;
      const current = latest.current.game.plots[index];
      const kind = current
        ? current.end <= Date.now()
          ? 'harvest'
          : 'water'
        : 'plant';
      setTarget(index);
      await walk(route(positionRef.current, approach(index, kind), obstacles()));
      if (generation.current !== token) return;
      const ms = startGesture(kind);
      await sleep(ms * 0.45);
      if (generation.current !== token) return;
      const result = latest.current.onAct(index, intent.crop, intent.lineageId);
      latest.current = { ...latest.current, game: result.g };
      await showResult(result, index, kind);
      await sleep(ms * 0.55);
      if (generation.current === token) {
        setAction('idle');
        setTarget(null);
      }
    }
    const control: ActionQueue<QueuedIntent> = new ActionQueue<QueuedIntent>(async (intent) => {
      await execute(intent);
      // 0.9.9 : le geste groupé reprend dès que Rosalie n’a plus rien en attente.
      if (generation.current === token && !control.pending && !bulkQueued.current &&
        latest.current.game.bulkJob?.targets.length) {
        bulkQueued.current = true;
        control.enqueue({ bulk: true });
      }
    }, setQueueSize);
    // 0.20 : le jeu annonce un niveau ; Rosalie le fête juste après son geste en cours.
    const onLevel = (event: Event) => control.first({ levelUp: Number((event as CustomEvent<number>).detail) || 0 });
    window.addEventListener('rosalie:levelup', onLevel);
    errandRef.current = (errand) => {
      followRef.current();
      control.enqueue({ errand });
    };
    queue.current = control;
    return () => {
      generation.current = token + 1;
      window.removeEventListener('rosalie:levelup', onLevel);
      control.cancel();
      queue.current = null;
      errandRef.current = null;
      bulkQueued.current = false;
    };
  }, [scroller, errandRef]);
  // 0.9.9 : un geste groupé lancé (ou retrouvé au chargement) démarre quand Rosalie est libre.
  useEffect(() => {
    const control = queue.current;
    if (!game.bulkJob?.targets.length || !control || control.busy || bulkQueued.current) return;
    bulkQueued.current = true;
    control.enqueue({ bulk: true });
  }, [game.bulkJob]);
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const update = () =>
      setCanExplore(
        el.scrollWidth > el.clientWidth + 2 ||
          el.scrollHeight > el.clientHeight + 2,
      );
    const observer = new ResizeObserver(update);
    observer.observe(el);
    const world = el.firstElementChild;
    if (world) observer.observe(world);
    update();
    return () => observer.disconnect();
  }, [scroller]);
  useEffect(() => {
    if (!feedback?.building || !feedback.changed) return;
    const el = scroller.current;
    const point = BUILD_FOCUS[feedback.building] || FOCUS.potager;
    // 0.32.11 : construction déjà à l’écran : la vue ne bouge pas.
    if (desktop && cameraRef.current.sees(point)) return;
    unfollow();
    // 0.17.3 : la caméra glisse en douceur vers la construction.
    if (desktop) fly({ center: point });
    else
      el?.scrollTo({
        left: (point.x / 100) * el.scrollWidth - el.clientWidth / 2,
        top: (point.y / 100) * el.scrollHeight - el.clientHeight / 2,
        behavior: reduced ? 'auto' : 'smooth',
      });
  }, [feedback, reduced, scroller, unfollow, desktop, fly]);
  useEffect(() => {
    if (!feedback?.building || !feedback.changed) return;
    const key = feedback.id;
    // 0.32.11 : nombre de parcelles avant l’achat (lu avant sa mise à jour, plus bas).
    const before = plotsBefore.current;
    const timers: ReturnType<typeof setTimeout>[] = [];
    // Différé d’un tick : l’état suit l’achat sans rendu en cascade.
    timers.push(
      setTimeout(() => {
        if (feedback.building === 'expand') {
          // 0.20 : Rosalie va bêcher chaque nouvelle parcelle, l’une après l’autre ;
          // elles restent en herbe jusqu’à son passage. 0.32.11 : seulement les
          // parcelles ajoutées (deux depuis la 0.32.2), jamais une parcelle déjà semée.
          const count = latest.current.game.plots.length;
          const fresh = Array.from({ length: Math.max(0, count - before) }, (_, i) => before + i);
          setUntilled((list) => [...new Set([...list, ...fresh])]);
          followRef.current();
          queue.current?.first(...fresh.map((index) => ({ dig: index })));
        }
        setBuilt({ id: feedback.building!, key });
      }, 0),
    );
    timers.push(
      setTimeout(() => {
        setBuilt((b) => (b?.key === key ? null : b));
      }, 2700),
    );
    return () => timers.forEach(clearTimeout);
  }, [feedback]);
  // Après l’effet d’achat ci-dessus : il a lu l’ancien nombre de parcelles.
  useEffect(() => {
    plotsBefore.current = game.plots.length;
  }, [game.plots.length]);
  useEffect(() => {
    if (!feedback?.changed) return;
    // 0.9.9 : l’atelier, le poulailler, le verger et les gestes groupés passent
    // par la file de Rosalie (elle y va avant) ; seule la fête reste un détour après coup.
    if (feedback.action === 'festival') {
      queue.current?.enqueue({
        activity: 'celebrate',
        destination: PLACES.fete,
      });
    }
  }, [feedback]);
  // Après un passage de niveau, la caméra glisse vers la nouveauté.
  useEffect(() => {
    function focus(event: Event) {
      const point = (event as CustomEvent<Point>).detail;
      const el = scroller.current;
      const farm = el?.firstElementChild as HTMLElement | null;
      if (!el || !farm || !point) return;
      // 0.32.11 : nouveauté déjà à l’écran : la vue ne bouge pas ; sinon elle
      // glisse vers elle sans changer de zoom.
      if (desktop) {
        if (cameraRef.current.sees(point)) return;
        unfollow();
        fly({ center: point });
        return;
      }
      unfollow();
      requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          el.scrollTo({
            left: (point.x / 100) * el.scrollWidth - el.clientWidth / 2,
            top: (point.y / 100) * el.scrollHeight - el.clientHeight / 2,
            behavior: reduced ? 'auto' : 'smooth',
          }),
        ),
      );
    }
    window.addEventListener('rosalie:focus', focus);
    return () => window.removeEventListener('rosalie:focus', focus);
  }, [fly, desktop, reduced, scroller, unfollow]);
  // 0.22.1 : plus d’attitudes au hasard (images de marche figées, de profil ou de dos).
  // 0.23 : à leur place, de vraies petites animations de repos, face au joueur,
  // après 12 à 25 s de calme (components/farm/rosalie-repos.ts).
  useRosalieRepos({ action, setAction, game, reduced, disabled: !!disabled });
  const states = zoneStates(game, level(game));
  function center() {
    const el = scroller.current;
    // 0.17.3 : sur ordinateur, la caméra rejoint Rosalie en douceur (et reprend le suivi).
    // 0.32.11 : le bouton la recentre même si elle est déjà à l’écran.
    if (desktop) {
      follow(true);
      return;
    }
    follow();
    if (el)
      el.scrollTo({
        left: (position.x / 100) * el.scrollWidth - el.clientWidth / 2,
        top: (position.y / 100) * el.scrollHeight - el.clientHeight / 2,
        behavior: reduced ? 'auto' : 'smooth',
      });
  }
  const contextual = (name: string) => ({
    onPointerEnter: () => setContextTarget(name),
    onPointerLeave: () => setContextTarget(null),
    onFocus: () => setContextTarget(name),
    onBlur: () => setContextTarget(null),
  });
  return (
    <section
      id="farm-map"
      className={`farm-card ${reduced ? 'reduced-motion' : ''}`}
      data-season={seasonFor(game.season.index).id}
      aria-label="Ferme de Rosalie"
      tabIndex={-1}
    >
      <div className="camera-tools">
        {canExplore && !camera.desktop && <span>Explorez la ferme</span>}
        {camera.desktop && (
          <fieldset className="zoom-tools" aria-label="Zoom de la carte">
            <button
              onClick={camera.zoomOut}
              disabled={camera.zoom <= camera.min}
              aria-label="Dézoomer (touche −)"
              title="Dézoomer (−)"
            >
              <Glyph id="loupe-moins" />
            </button>
            <output aria-label="Niveau de zoom, 100 % = taille réelle de la carte">
              {Math.round(camera.zoom * 100)} %
            </output>
            <button
              onClick={camera.zoomIn}
              disabled={camera.zoom >= camera.max}
              aria-label="Zoomer (touche +)"
              title="Zoomer (+) · molette"
            >
              <Glyph id="loupe-plus" />
            </button>
            <button
              className="zoom-real"
              onClick={camera.readable}
              disabled={camera.zoom === READABLE_ZOOM}
              aria-label="Taille réelle, 100 % (touche 1)"
              title="Taille réelle (1)"
            >
              1:1
            </button>
            <button
              onClick={camera.overview}
              disabled={!camera.zoomed}
              aria-label="Vue d’ensemble de la carte (touche 0)"
              title="Vue d’ensemble (0) · Maj + flèches pour se déplacer"
            >
              <Glyph id="plein-ecran" />
            </button>
          </fieldset>
        )}
        {/* 0.17.3 : aussi en vue d’ensemble : la caméra revient à 1:1 sur Rosalie. */}
        <button onClick={center} aria-label="Recentrer sur Rosalie">
          <Glyph id="viseur" />
        </button>
      </div>
      <div
        ref={scroller}
        className={`farm-scroll ${camera.desktop ? 'camera-fit' : ''} ${camera.zoomed ? 'zoomed' : ''} ${camera.panning ? 'panning' : ''}`}
      >
        <div
          className="pixel-farm"
          style={camera.style}
          data-plots={game.plots.length}
          data-stroke={strokeCursor || undefined}
          data-season={seasonFor(game.season.index).id}
        >
          {/* 0.21 : teinte de la saison cuite dans les images (components/farm/map-backdrop.tsx). */}
          <MapBackdrop season={seasonFor(game.season.index).id as SeasonId} />
          <DomainLayers game={game} greenhouse={states.greenhouse} />
          <AmbienceLayers game={game} />
          <div className="farm-beds">
            {game.plots.map((plot, index) => (
              <FarmPlot
                key={index}
                plot={plot}
                index={index}
                selectedCrop={selectedCrop}
                lineageName={plot?.lineageId ? game.lineages.find((lineage) => lineage.id === plot.lineageId)?.name : undefined}
                lineageTrait={plot?.lineageId ? game.lineages.find((lineage) => lineage.id === plot.lineageId)?.traits[0] : undefined}
                disabled={disabled}
                active={target === index}
                dugDelay={dug[index] ? 0 : undefined}
                untilled={untilled.includes(index)}
                onContext={() => setContextTarget(`plot:${index}`)}
                onContextEnd={() => setContextTarget(null)}
                onStart={() => {
                  const mode = strokeMode(plot, Date.now());
                  stroke.current =
                    mode === 'observe'
                      ? null
                      : { mode, visited: new Set([index]) };
                  if (mode !== 'observe') setStrokeCursor(mode);
                  follow();
                  queue.current?.enqueue({ index, crop: selectedCrop, lineageId: selectedLineage || undefined });
                }}
                onClick={() => {
                  follow();
                  queue.current?.enqueue({ index, crop: selectedCrop, lineageId: selectedLineage || undefined });
                }}
              />
            ))}
          </div>
          {/* 0.12 : sprites posés au sol et Rosalie, triés par la hauteur de leurs pieds. */}
          <div className="depth-layer">
            <EmbellishLayer game={game} />
            {game.terroirBuilds.includes('soleil') && <button className="living-place place-compost" style={{ ...anchorStyle('compost', ...objectSize('compost')), ...objectImage('compost') }} onClick={() => onOpen('lineages')} aria-label="Compost du potager : voir les terroirs" title="Compost du potager" />}
            {game.terroirBuilds.includes('humide') && <button className="living-place place-rigoles" style={{ ...anchorStyle('rigoles', ...objectSize('rigoles')), ...objectImage('rigoles') }} onClick={() => onOpen('lineages')} aria-label="Rigoles de pierre : voir les terroirs" title="Rigoles de pierre" />}
            {game.terroirBuilds.includes('abrite') && <button className="living-place place-haie" style={{ ...anchorStyle('haie', ...objectSize('haie')), ...objectImage('haie') }} onClick={() => onOpen('lineages')} aria-label="Haie protectrice : voir les terroirs" title="Haie protectrice" />}
            {game.projects.done.includes('pepiniere-voisins') && <button className="living-place place-pepiniere" style={{ ...anchorStyle('pepiniere', ...objectSize('pepiniere')), ...objectImage('pepiniere') }} onClick={() => onOpen('lineages')} aria-label="Pépinière du village : voir les lignées" title="Pépinière du village" />}
            {game.projects.done.includes('halle-terroirs') && <button className="living-place place-halle" style={{ ...anchorStyle('halle', ...objectSize('halle-varietes')), ...objectImage('halle-varietes') }} onClick={() => onOpen('orders')} aria-label="Halle des variétés : voir les commandes" title="Halle des variétés" />}
            {level(game) >= 3 && <ValleyFarmCaravan valley={game.valley} onOpen={onOpen} />}
            {game.valley.projectDone && <button className="valley-relay" style={{ ...anchorStyle('relais', ...objectSize('relais-vallee')), ...objectImage('relais-vallee') }} onClick={() => onOpen('valley')} aria-label="Relais de la vallée construit, ouvrir la caravane" title="Relais de la vallée" />}
            {/* 0.13 : lieux de l’anneau à restaurer (ruines peintes, sans planche pour l’instant). */}
          {RESTORATIONS.map((entry) => {
            const stage = restorationStage(game, entry.id);
            const state = stage >= 3 ? 'restauré' : stage ? `étape ${stage}/3` : `en friche · niveau ${entry.levels[0]}`;
            return (
              <button
                key={entry.id}
                className={`world-zone ring-zone ring-${entry.id} stage-${stage}`}
                style={zoneStyle(RING[entry.id])}
                onClick={() => onOpen('restore')}
                aria-label={`${entry.name}, ${state} : voir les restaurations`}
              >
                <span className="zone-label">
                  {entry.name} · {state}
                </span>
                <span className="map-pin" aria-hidden="true">
                  <i>{stage >= 3 ? '✓' : '⚒'}</i>
                </span>
              </button>
            );
          })}
          {game.upgrades.includes('water') && (
              <div
                className={`irrigation-system ${built?.id === 'water' ? 'just-built' : ''}`}
                style={{ ...anchorStyle('irrigation', ...objectSize('colonne-arrosage')), ...objectImage('colonne-arrosage') }}
              >
              </div>
            )}
            {game.upgrades.includes('tools') && (
              <span
                aria-hidden="true"
                className={`world-object world-bench ${built?.id === 'tools' ? 'just-built' : ''}`}
                style={{ ...anchorStyle('etabli', ...objectSize('etabli')), ...objectImage('etabli') }}
              />
            )}
            {game.upgrades.includes('auto') && (
              <span
                aria-hidden="true"
                className={`world-object world-seeder ${built?.id === 'auto' ? 'just-built' : ''}`}
                style={{ ...anchorStyle('semoir', ...objectSize('semoir')), ...objectImage('semoir') }}
              />
            )}
          {marker && <span key={marker.key} className="move-marker" aria-hidden="true" style={toStyle(marker.at)} />}
          {/* oxlint-disable jsx-a11y/prefer-tag-over-role -- Image composée de sprites animés, sans élément img unique. */}
          <div
            ref={rosalieRef}
            className={`rosalie-player action-${action}${aura ? ' level-aura' : ''}`}
            role="img"
            style={{ ...toStyle(position), zIndex: depth(position) }}
            aria-label={`Rosalie${queueSize ? `, ${queueSize} actions en attente` : ''}`}
          >
            {aura > 0 && <RosalieAura reduced={reduced} />}
            <RosalieSprite action={action} reduced={reduced} walkScale={walkScale} gestureScale={gestureSpeed} repeat={action === 'hoe' || (action === 'celebrate' && aura > 0)} />
            {queueSize > 0 && <span className="queue-badge">{queueSize}</span>}
          </div>
          {/* oxlint-enable jsx-a11y/prefer-tag-over-role */}
          </div>
          <span className="sr-only" aria-live="polite">{queueSize ? `${queueSize} actions en attente pour Rosalie.` : 'Aucune action en attente.'}</span>
          {effects.map((effect) => (
            <ActionEffect key={effect.key} effect={effect} />
          ))}
          <button
            className="map-hotspot house-hotspot"
            style={zoneStyle(ZONES.mas)}
            onClick={() => onOpen('home')}
            aria-label="Maison de Rosalie"
            {...contextual('house')}
          >
            <MapPin game={game} spot="house" glyph="⌂" />
            <span>Maison de Rosalie</span>
          </button>
          <button
            className="map-hotspot market-hotspot"
            style={zoneStyle(ZONES.portail)}
            onClick={() => onOpen('orders')}
            aria-label="Sortie vers le village et commandes"
            {...contextual('village')}
          >
            <MapPin game={game} spot="village" glyph="➜" />
            <span>Vers le village · commandes</span>
          </button>
          <button
            className="map-hotspot festival-hotspot"
            style={zoneStyle(ZONES.place)}
            onClick={() => onOpen('festival')}
            aria-label="Place de la Fête des Saveurs"
            {...contextual('festival')}
          >
            <MapPin game={game} spot="festival" glyph="★" />
            <span>La Fête des Saveurs</span>
          </button>
          {game.projects.done.length > 0 && (
            <ul
              className="village-pennants"
              style={{ left: `${rectPct(ZONES.place).x}%`, top: `${rectPct(ZONES.place).y - 3}%` }}
              aria-label="Réalisations du village"
            >
              {PROJECTS.filter((project) =>
                game.projects.done.includes(project.id),
              ).map((project) => (
                <li key={project.id} title={project.outro}>
                  ★ {project.rewardName}
                </li>
              ))}
            </ul>
          )}
          <button
            className={`world-zone orchard-zone state-${game.orchard !== null ? 'productive' : states.orchard}`}
            style={zoneStyle(ZONES.verger)}
            onClick={() =>
              onOpen(game.orchard !== null ? 'projects' : 'collection')
            }
            aria-label={
              game.orchard !== null
                ? 'Verger restauré, cueillette et projets'
                : `Verger ${states.orchard === 'abandoned' ? 'abandonné' : states.orchard === 'cleaned' ? 'nettoyé' : states.orchard === 'restored' ? 'restauré' : 'en fruits'}, décor et collection`
            }
            {...contextual('orchard')}
          >
            {/* 0.14 : plus de brume sur les lieux pas encore débloqués (un autre système viendra). */}
            <span className="zone-label">
              {game.orchard !== null
                ? 'Le verger restauré'
                : 'Le verger · décor évolutif'}
            </span>
            <MapPin
              game={game}
              spot="orchard"
              icon={game.orchard !== null ? 'fraise' : undefined}
              glyph="✿"
            />
          </button>
          <button
            className={`world-zone workshop-zone state-${states.workshop} ${built?.id === 'workshop' ? 'just-built' : ''}`}
            style={zoneStyle(ZONES.atelier)}
            onClick={() =>
              onOpen(states.workshop === 'built' ? 'recipes' : 'upgrades')
            }
            aria-label={
              states.workshop === 'built'
                ? 'Entrer dans l’atelier'
                : 'Aménager l’atelier'
            }
            {...contextual('workshop')}
          >
            <span className="zone-label">
              {states.workshop === 'built'
                ? 'Atelier gourmand'
                : `Atelier · niveau ${UPGRADES.find((u) => u.id === 'workshop')!.level}`}
            </span>
            {states.workshop === 'built' && stoveJobs(game).some(Boolean) && (
              <span className="cooking-steam" />
            )}
            <MapPin
              game={game}
              spot="workshop"
              icon={states.workshop === 'built' ? 'pain' : undefined}
              glyph="+"
            />
          </button>
          <button
            className={`world-zone coop-zone state-${states.coop} ${built?.id === 'coop' ? 'just-built' : ''}`}
            style={zoneStyle(ZONES.poulailler)}
            onClick={() =>
              onOpen(states.coop === 'built' ? 'recipes' : 'upgrades')
            }
            aria-label={
              states.coop === 'built'
                ? 'Poulailler, nourrir ou ramasser les œufs'
                : 'Aménager le poulailler'
            }
            {...contextual('coop')}
          >
            <span className="zone-label">
              {states.coop === 'built'
                ? 'Le poulailler'
                : `Poulailler · niveau ${UPGRADES.find((u) => u.id === 'coop')!.level}`}
            </span>
            <MapPin
              game={game}
              spot="coop"
              icon={states.coop === 'built' ? 'oeuf' : undefined}
              glyph="+"
            />
          </button>
          <div
            className={`world-zone greenhouse-zone state-${states.greenhouse}`}
            style={zoneStyle(ZONES.serre)}
            aria-label={`Serre ${states.greenhouse === 'built' ? 'achevée' : states.greenhouse === 'foundation' ? 'en construction' : 'en friche'}, décoration sans production`}
            {...contextual('greenhouse')}
          >
            <span className="zone-label">Serre ornementale · niveau {ZONE_LEVELS.greenhouseBuilt}</span>
          </div>
          <div className="pond-ripple ripple-one" />
          <div className="pond-ripple ripple-two" />
          <AmbientCanvas game={game} reduced={reduced} />
          {built && (
            <BuildBurst
              key={built.key}
              id={built.id}
              at={
                built.id === 'expand'
                  ? plotPosition(Math.max(0, game.plots.length - 2))
                  : built.id === 'watering-can'
                    ? { x: position.x, y: position.y - 5.5 }
                    : BUILD_FOCUS[built.id] || FOCUS.potager
              }
            />
          )}
        </div>
      </div>
      <FarmContextStatus
        game={game}
        target={contextTarget}
        selectedCrop={selectedCrop}
        onOpen={onOpen}
      />
    </section>
  );
});

const FarmPlot = memo(function FarmPlot({
  plot,
  index,
  selectedCrop,
  lineageName,
  lineageTrait,
  disabled,
  active,
  dugDelay,
  untilled,
  onContext,
  onContextEnd,
  onClick,
  onStart,
}: {
  plot: Plot;
  index: number;
  selectedCrop: string;
  lineageName?: string;
  lineageTrait?: TraitId;
  disabled?: boolean;
  active: boolean;
  dugDelay?: number;
  /** 0.20 : parcelle achetée, pas encore bêchée par Rosalie. */
  untilled?: boolean;
  onContext: () => void;
  onContextEnd: () => void;
  onClick: () => void;
  onStart: () => void;
}) {
  const now = useGameClock();
  const stage = plotStage(plot, now);
  const ripe = !!plot && now >= plot.end;
  const progress = plot
    ? Math.max(
        0,
        Math.min(100, ((now - plot.start) / (plot.end - plot.start)) * 100),
      )
    : 0;
  // Gestes (0.5.5) : pousse qui jaillit au semis, rebond et feuilles à chaque
  // changement de stade. On compare au dernier état vu (début et stade).
  const start = plot?.start ?? null;
  const [seen, setSeen] = useState({ start, stage });
  const [pulse, setPulse] = useState({ kind: '', n: 0 });
  if (seen.start !== start || seen.stage !== stage) {
    const planted = seen.start === null && start !== null;
    const grew = seen.start === start && start !== null && stage > seen.stage;
    setSeen({ start, stage });
    if (planted || grew)
      setPulse({ kind: planted ? 'sprout' : 'grow', n: pulse.n + 1 });
  }
  useEffect(() => {
    if (pulse.kind !== 'grow') return;
    const p = plotPosition(index);
    ambienceBurst('sprout', p.x, p.y + 1.1, 3);
  }, [pulse, index]);
  const label = plot
    ? `${ripe ? 'Récolter' : plot.watered ? 'Observer' : 'Arroser'} ${crop(plot.crop).name}${lineageName ? `, lignée ${lineageName}` : ''}${plot.garde ? `, semis de garde de ${plot.garde} récoltes` : ''}, parcelle ${index + 1}${ripe ? ', prête' : `, ${Math.floor(progress)} % de croissance`}`
    : `Planter ${crop(selectedCrop).name}, parcelle ${index + 1}`;
  return (
    <div
      className={`bed ${dugDelay !== undefined ? 'just-dug' : ''} ${untilled ? 'untilled' : ''}`}
      data-plot-index={index}
      style={
        {
          ...toStyle(plotPosition(index)),
          '--dig-delay': dugDelay !== undefined ? `${dugDelay}ms` : undefined,
        } as CSSProperties
      }
      onPointerEnter={onContext}
      onPointerLeave={onContextEnd}
      onFocus={onContext}
      onBlur={onContextEnd}
    >
      <button
        className={`farm-plot ${plot ? 'planted' : 'prepared'} ${plot?.garde ? 'garde-crop' : ''} ${lineageName ? 'lineage-crop' : ''} ${plot?.watered ? 'watered' : ''} ${ripe ? 'ripe' : ''} ${active ? 'targeted' : ''}`}
        data-stage={plot ? stage : 'empty'}
        data-mode={strokeMode(plot, now)}
        aria-label={untilled ? `Parcelle ${index + 1}, Rosalie va la bêcher` : label}
        disabled={disabled || untilled}
        onPointerDown={(event) => {
          if (event.pointerType === 'mouse' && event.button !== 0) return;
          onContext();
          onStart();
        }}
        onClick={(event) => {
          // Souris et doigt passent par onPointerDown ; le clavier (detail 0) ici.
          if (event.detail !== 0) return;
          onContext();
          onClick();
        }}
      >
        <span className={`soil-tile terroir-ground terroir-${terroirForPlot(index)}`} aria-hidden="true" />
        {plot && (
          <span className="crop-sway">
            <span
              key={pulse.n}
              className={`crop-pop ${pulse.kind ? `pop-${pulse.kind}` : ''}`}
            >
              <CropSprite
                crop={plot.crop}
                stage={stage}
                lineage={!!lineageName}
                drip={plot.watered && !ripe ? +((index * 0.83) % 6).toFixed(2) : undefined}
              />
            </span>
          </span>
        )}
        {plot?.garde && <span className="garde-mark" aria-hidden="true">×{plot.garde}</span>}
        {plot && lineageTrait && <span className="lineage-mark" style={{ '--trait-position': `${TRAITS.findIndex((entry) => entry.id === lineageTrait) * 25}%` } as CSSProperties} aria-hidden="true" />}
        {plot && (
          <span
            className={`plot-ring ${ripe ? 'ripe' : plot.watered ? 'watered' : 'thirsty'}`}
            style={{ '--p': ripe ? 100 : progress } as CSSProperties}
            aria-hidden="true"
          >
            <PixelIcon
              id={ripe ? 'faucille' : plot.watered ? plot.crop : 'arrosoir'}
            />
          </span>
        )}
      </button>
    </div>
  );
});
/**
 * 0.32.6 : planches d’effets (fx-hd, 6 images de 128 px) posées dans la boîte de la
 * parcelle (45 × 17,6 px de carte, origine au coin haut gauche de la parcelle).
 * `land` = point d’impact dans l’image (éclaboussure, graines au sol, cœur de la
 * terre), mesuré sur la planche ; il est posé au centre de la plante (22,5 ; 8,5).
 * `size` = côté de l’image en px de carte.
 * 0.32.8 : effets ramenés à l’échelle de la plante (eau 24 px, graines 28 px,
 * terre 20 px, au lieu de 38 à 51). Pour qu’ils partent quand même du bec de
 * l’arrosoir ou de la main de Rosalie, l’image part de `from` (décalage en px de
 * carte) et tombe à sa place pendant le premier tiers du geste ; elle apparaît
 * en fondu au lieu de surgir d’un coup.
 */
const PLANT_CENTRE = { x: 22.5, y: 8.5 };
function gestureSprite(id: string, size: number, land: [number, number], duration: number, delay = 0, from: [number, number] = [0, 0], at = PLANT_CENTRE) {
  return {
    id,
    style: {
      '--fx-left': (at.x - land[0] * size).toFixed(2),
      '--fx-top': (at.y - land[1] * size).toFixed(2),
      '--fx-size': size.toFixed(2),
      '--fx-dx': from[0].toFixed(2),
      '--fx-dy': from[1].toFixed(2),
      '--fx-duration': `${duration}ms`,
      '--fx-delay': `${delay}ms`,
    } as CSSProperties,
  };
}
/**
 * 0.32.8 : l’eau sort de la pomme de l’arrosoir. Bout du bec mesuré dans le jeu,
 * pendant le versement (images 4 à 6 de l’animation « arroser ») : 14,7 px à
 * droite et 9,2 px au-dessus du point où se tient Rosalie (px de carte).
 * La planche d’eau (20 px) est posée pour que sa première goutte (29 %, 31 % de
 * l’image) parte de là, puis glisse jusqu’à ce que l’éclaboussure (66 %, 84 %)
 * tombe au pied de la plante (1,5 px sous son centre).
 */
const SPOUT = { x: 14.7, y: -9.2 };
const WATER_SIZE = 20;
const WATER_LAND: [number, number] = [0.66, 0.84];
const WATER_FIRST_DROP: [number, number] = [0.29, 0.31];
function waterSprite(index: number) {
  const stand = approach(index, 'water');
  const plot = plotPosition(index);
  // Bec, relatif au centre de la plante (x : milieu de la parcelle ; y : haut + 8,5 px).
  const spout = {
    x: (stand.x - plot.x) * 12 + SPOUT.x,
    y: (stand.y - plot.y) * 8 + SPOUT.y - PLANT_CENTRE.y,
  };
  const at = { x: PLANT_CENTRE.x, y: PLANT_CENTRE.y + 1.5 };
  // Première goutte si l’image restait à sa place d’arrivée.
  const first = {
    x: at.x - PLANT_CENTRE.x - (WATER_LAND[0] - WATER_FIRST_DROP[0]) * WATER_SIZE,
    y: at.y - PLANT_CENTRE.y - (WATER_LAND[1] - WATER_FIRST_DROP[1]) * WATER_SIZE,
  };
  return gestureSprite('water', WATER_SIZE, WATER_LAND, 420, 0, [spout.x - first.x, spout.y - first.y], at);
}
/* Graines : départ de la main qui sème, vers (2,1 ; −19) depuis le centre de la plante. */
const PLANT_SPRITES = [
  gestureSprite('seeds', 28, [0.56, 0.78], 380, 0, [3.5, -8.6]),
  gestureSprite('soil', 20, [0.5, 0.68], 360, 160),
];
/** 0.32.9 : éclats de récolte (planche de Rosalie) sur le feuillage d’une plante mûre. */
const HARVEST_SPRITES = [
  gestureSprite('harvest', 26, [0.5, 0.55], 420, 0, [0, 0], { x: PLANT_CENTRE.x, y: 2 }),
  gestureSprite('harvest-2', 20, [0.5, 0.55], 420, 160, [0, 0], { x: PLANT_CENTRE.x + 5, y: 5 }),
];
/** Étoiles de qualité : position (px de carte, centre au-dessus de la plante), taille, délai. */
const star = (x: number, y: number, size: number, delay: number) =>
  ({ '--star-x': x, '--star-y': y, '--star-size': size, '--star-delay': `${delay}ms` }) as CSSProperties;
const QUALITY_STARS: Record<string, CSSProperties[]> = {
  belle: [star(0, -10, 9, 120)],
  exceptionnelle: [star(0, -12, 11, 120), star(-9, -6, 6, 260), star(9, -7, 6, 360)],
};
function ActionEffect({ effect }: { effect: Effect }) {
  const { index, kind, item } = effect;
  return (
    <div
      className={`field-effect effect-${kind} quality-${item?.quality || 'ordinaire'}`}
      style={toStyle(plotPosition(index))}
      aria-hidden="true"
    >
      {kind === 'water' || kind === 'plant' ? (
        // 0.32.6 : les planches d’effets de Rosalie (eau, graines, terre), posées pour
        // que l’eau éclabousse et que les graines tombent pile sur la plante.
        (kind === 'water' ? [waterSprite(index)] : PLANT_SPRITES).map((fx) => <span key={fx.id} className={`gesture-sprite fx-${fx.id}`} style={fx.style} />)
      ) : (
        <>
          {effect.flight &&
            createPortal(
              <span
                className="harvest-flight"
                style={
                  {
                    left: effect.flight.x,
                    top: effect.flight.y,
                    '--flight-x': `${effect.flight.dx}px`,
                    '--flight-y': `${effect.flight.dy}px`,
                  } as CSSProperties
                }
              >
                <span className="harvest-arc">
                  <PixelIcon id={item?.id || 'basket'} />
                </span>
              </span>,
              document.body,
            )}
          {/* 0.32.9 : plus de halo rond. La récolte se lit en pixel art : les
              éclats de récolte de Rosalie sur la plante (deux fois pour une
              récolte double), puis la qualité en étoiles, aux couleurs du
              panier : une étoile bleue pour une belle récolte, trois étoiles
              d’or pour une exceptionnelle. Rien de plus pour l’ordinaire. */}
          {HARVEST_SPRITES.slice(0, (item?.amount ?? 1) > 1 ? 2 : 1).map((fx) => (
            <span key={fx.id} className="gesture-sprite fx-harvest" style={fx.style} />
          ))}
          {(QUALITY_STARS[item?.quality || ''] || []).map((style, i) => (
            <span key={i} className={`quality-star star-${item?.quality}`} style={style} />
          ))}
          {(effect.seeds ?? 0) > 0 && (
            <span className="harvest-seed">
              <PixelIcon id="seeds" />
            </span>
          )}
        </>
      )}
    </div>
  );
}
const BUILD_CAPTIONS: Record<string, string> = {
  // 0.20 : Rosalie va les bêcher une à une.
  expand: 'Deux nouvelles parcelles',
  water: 'Irrigation douce installée',
  tools: 'Outils rangés sur l’établi',
  workshop: 'L’atelier ouvre ses portes',
  coop: 'Les poules s’installent',
  auto: 'Le semoir est prêt',
  'watering-can': 'Arrosoir de cuivre en main',
};
const SPARKS = Array.from({ length: 10 }, (_, i) => {
  const angle = (i / 10) * Math.PI * 2;
  const reach = i % 2 ? 38 : 58;
  return {
    '--i': i,
    '--dx': `${Math.round(Math.cos(angle) * reach)}px`,
    '--dy': `${Math.round(Math.sin(angle) * reach * 0.7)}px`,
  } as CSSProperties;
});
/** Retour d’un aménagement : éclats, poussière et légende parchemin. */
function BuildBurst({ id, at }: { id: string; at: Point }) {
  const name = BUILD_CAPTIONS[id] ?? 'Aménagement terminé';
  return (
    <div className="build-burst" style={toStyle(at)} aria-hidden="true">
      {SPARKS.map((style, i) => (
        <i key={i} style={style} />
      ))}
      <b>
        {UPGRADE_ICONS[id] && <PixelIcon id={UPGRADE_ICONS[id]} />}
        {name}
      </b>
    </div>
  );
}
/** 0.18 : le ruban du conseil reste 8 s, et un même conseil ne revient pas avant 10 min. */
const RIBBON_MS = 8000;
const RIBBON_REPEAT_MS = 10 * 60_000;
/** Conseils qui ne changent que par un nombre (récoltes prêtes, panier, graines) : une seule annonce. */
const COUNTED_HINTS = new Set(['harvest', 'stock', 'seeds', 'lineage']);
function FarmContextStatus({
  game,
  target,
  selectedCrop,
  onOpen,
}: {
  game: Game;
  target: string | null;
  selectedCrop: string;
  onOpen: (panel: string) => void;
}) {
  const now = useGameClock();
  const guidance = farmGuidance(game, now);
  // 0.18 : le ruban annonce une nouveauté puis s’efface (demande de l’auteur :
  // « ça affiche une fois la nouveauté et ça dégage »). Les nombres qui bougent
  // (3 puis 4 récoltes prêtes) ne comptent pas comme une nouveauté, et un même
  // conseil ne revient pas avant 10 minutes. Le survol le garde ouvert.
  const key = COUNTED_HINTS.has(guidance.kind) ? guidance.kind : `${guidance.kind}:${guidance.text.replace(/\d[\d\s\u202f.,]*/g, '#')}`;
  const seen = useRef(new Map<string, number>());
  const [announced, setAnnounced] = useState<string | null>(null);
  const [hover, setHover] = useState(false);
  useEffect(() => {
    const last = seen.current.get(key);
    if (last !== undefined && Date.now() - last < RIBBON_REPEAT_MS) return;
    seen.current.set(key, Date.now());
    const show = setTimeout(() => setAnnounced(key), 0);
    return () => clearTimeout(show);
  }, [key]);
  useEffect(() => {
    if (!announced || hover) return;
    const hide = setTimeout(() => setAnnounced(null), RIBBON_MS);
    return () => clearTimeout(hide);
  }, [announced, hover]);
  const hidden = !target && announced !== key;
  return (
    <div
      className="farm-status"
      data-hidden={hidden || undefined}
      inert={hidden}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
    >
      <output aria-live="polite">
        {/* 0.17 : le texte glisse en place quand le conseil change. */}
        <span className="status-text" key={target ? `context-${target}` : guidance.text}>
          {target ? farmContext(game, target, selectedCrop, now) : guidance.text}
        </span>
      </output>
      {!target && guidance.panel !== 'farm' && (
        <button
          className="farm-status-action"
          onClick={() => onOpen(guidance.panel)}
        >
          {guidance.label}
        </button>
      )}
    </div>
  );
}

/** Repère toujours visible d’un lieu cliquable ; s’illumine quand il y a à faire. */
function MapPin({
  game,
  spot,
  glyph,
  icon,
}: {
  game: Game;
  spot: MapSpot;
  glyph: string;
  icon?: string;
}) {
  const now = useGameClock();
  const alert = mapSpotAlert(game, spot, now);
  return (
    <span
      className="map-pin"
      data-alert={alert ? '' : undefined}
      aria-hidden="true"
    >
      {icon ? <PixelIcon id={icon} /> : <i>{glyph}</i>}
      {alert && <em>{alert}</em>}
    </span>
  );
}

/** 0.20 : durée de la fête d’un niveau, et du zoom qui l’accompagne (aller, puis retour). */
const CELEBRATE_MS = 2600;
const CELEBRATE_ZOOM_MS = 900;
/**
 * 0.20 : halo doré du passage de niveau, « à la Super Saiyan » : lueur qui
 * respire, flammes qui montent autour d’elle, éclairs et étincelles, onde au
 * départ. En mouvement réduit : la lueur seule, immobile.
 */
function RosalieAura({ reduced }: { reduced: boolean }) {
  return (
    <span className="rosalie-aura" aria-hidden="true">
      <span className="aura-glow" />
      {!reduced && (
        <>
          <span className="aura-ring" />
          <span className="aura-flames">
            {Array.from({ length: 9 }, (_, i) => (
              <i key={i} style={{ '--i': i } as CSSProperties} />
            ))}
          </span>
          <span className="aura-bolts">
            <i />
            <i />
          </span>
          <span className="aura-sparks">
            {Array.from({ length: 10 }, (_, i) => (
              <i key={i} style={{ '--i': i } as CSSProperties} />
            ))}
          </span>
        </>
      )}
    </span>
  );
}

/*
 * 0.32.3 : la bulle « ! » au-dessus de Rosalie est retirée. Elle redisait ce
 * que montrent déjà le panier sur la parcelle mûre et le bouton Récolter du dock.
 */

function ValleyFarmCaravan({ valley, onOpen }: { valley: ValleyState; onOpen: (panel: string) => void }) {
  const now = useGameClock();
  const ready = !!valley.trip && valley.trip.returnAt <= now;
  return <button className={`valley-farm-caravan ${valley.trip ? 'travelling' : ''} ${ready ? 'ready' : ''}`} style={anchorStyle('caravane', ...objectSize(ready ? 'caravane-retour' : 'caravane-repos'))} onClick={() => onOpen('valley')} aria-label={valley.trip ? 'Caravane de la vallée : suivre le trajet ou récupérer la récompense' : 'Préparer la caravane de la vallée'} title="Caravane de la vallée"><span className="valley-caravan-sprite" style={objectImage(ready ? 'caravane-retour' : 'caravane-repos')} /><span className="valley-caravan-label">{ready ? 'Retour !' : valley.trip ? 'En route' : 'Caravane'}</span></button>;
}

/**
 * 0.11 — Embellissements posés sur la carte (décor, sans clic : le carnet les
 * présente). Pieds de l’objet à la position donnée. 0.12 : planches HD tirées
 * des générations originales, cases de 64 px (96 px pour les grands) sur la
 * grille de 1 200 × 800, triées avec Rosalie par la hauteur de leurs pieds.
 * Ailes, eau et abeilles s’arrêtent en mouvement réduit.
 */
function EmbellishLayer({ game }: { game: Game }) {
  const built = EMBELLISHMENTS.flatMap((entry) => {
    const stage = embellishmentStage(game, entry.id);
    return stage ? [{ entry, stage }] : [];
  });
  // 0.15 : décors de la fête (objets seuls d’Astra), au palier de dons de chacun.
  const feast = FEAST_DECOR_READY ? feastDecorFor(game.donations || 0) : [];
  if (!built.length && !feast.length) return null;
  return (
    <>
      {feast.map((decor) => (
        <span
          key={decor.id}
          aria-hidden="true"
          className={`feast-decor feast-${decor.id}`}
          style={{
            left: `${(decor.foot.x / WORLD_W) * 100}%`,
            top: `${(decor.foot.y / WORLD_H) * 100}%`,
            width: `${(decor.size[0] / WORLD_W) * 100}%`,
            height: `${(decor.size[1] / WORLD_H) * 100}%`,
            zIndex: depth(pct(decor.foot)),
            backgroundImage: `url(/assets/pixel/fete-1.0/${decor.id}.png)`,
            backgroundSize: `${decor.frames * 100}% 100%`,
          }}
        />
      ))}
      {built.map(({ entry, stage }) => (
        <span
          key={entry.id}
          aria-hidden="true"
          className={`embellish-map embellish-${entry.id} stage-${stage}`}
          data-cell={entry.cell}
          style={{
            left: `${entry.at.x}%`,
            top: `${entry.at.y}%`,
            zIndex: depth(entry.at),
            // 0.19 : case agrandie à l’échelle de la carte (lib/echelle.ts).
            width: `${((64 * entry.scale) / WORLD_W) * 100}%`,
            height: `${(((entry.cell === 192 ? 96 : 64) * entry.scale) / WORLD_H) * 100}%`,
            // 0.32.10 : ombre de contact sous le pied (case : pieds à 93,75 %).
            ...(EMBELLISH_SHADOW[entry.id]
              ? {
                  backgroundImage: `url(/assets/pixel/embellissements-hd/${entry.id}.png), ${CONTACT_SHADOW}`,
                  backgroundPosition: `${(stage - 1) * 50}% 0, 50% 98.6%`,
                  backgroundSize: `300% 100%, ${EMBELLISH_SHADOW[entry.id] * 100}% 8%`,
                }
              : {
                  backgroundImage: `url(/assets/pixel/embellissements-hd/${entry.id}.png)`,
                  backgroundPosition: `${(stage - 1) * 50}% 0`,
                }),
          }}
        >
          {entry.id === 'moulin' && stage >= 2 && <span className="embellish-anim moulin-wings" />}
          {entry.id === 'fontaine' && stage === 3 && <span className="embellish-anim fontaine-water" />}
          {entry.id === 'ruches' && <span className="embellish-anim ruches-bees" />}
        </span>
      ))}
    </>
  );
}

/**
 * 1.0 — Lieux de l’anneau restaurés et serre : calques peints par Astra sur la
 * carte HD (lib/domain-art.ts). Sous la teinte du ciel, sans clic : les lieux
 * gardent leur zone cliquable.
 */
function DomainLayers({ game, greenhouse }: { game: Game; greenhouse: 'wild' | 'foundation' | 'built' }) {
  const shown = DOMAIN_LAYERS.filter((layer) =>
    layer.place === 'serre'
      ? (greenhouse === 'foundation' && layer.stage === 1) || (greenhouse === 'built' && layer.stage === 2)
      : layer.stage === restorationStage(game, layer.place as (typeof RESTORATIONS)[number]['id']));
  if (!shown.length) return null;
  return (
    <div className="domain-layers" aria-hidden="true">
      {shown.map((layer) => (
        // eslint-disable-next-line @next/next/no-img-element -- calques posés au pixel près sur la carte
        <img
          key={layer.id}
          src={layer.src}
          alt=""
          decoding="async"
          draggable={false}
          style={{
            left: `${(layer.x / WORLD_W) * 100}%`,
            top: `${(layer.y / WORLD_H) * 100}%`,
            width: `${(layer.w / WORLD_W) * 100}%`,
            height: `${(layer.h / WORLD_H) * 100}%`,
          }}
        />
      ))}
    </div>
  );
}
