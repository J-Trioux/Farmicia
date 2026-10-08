'use client';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from 'react';
import { DISPLAY_WIDTH, WORLD_H, WORLD_W } from '@/lib/world';

/**
 * Caméra de la grande carte (0.12), sur ordinateur.
 *
 * Le zoom est relatif à DISPLAY_WIDTH : à 1 (« 100 % »), la carte fait 2 400 px
 * de large et Rosalie a la taille qu’elle avait sur l’ancienne carte : c’est la
 * vue de départ, centrée sur le cœur de la ferme. 0.13 : l’image est l’original
 * HD (1 536 × 1 024), lissée à l’agrandissement plutôt que pixelisée.
 * - Vue d’ensemble : toute la carte tient dans la fenêtre (échelle minimale).
 * - Zoom avant jusqu’à 200 %. Molette, boutons et touches + / − / 0 zooment
 *   autour du pointeur ; un glissé sur le décor déplace la vue.
 * Sous 901 px, la mise en page mobile garde sa largeur fixe en CSS.
 *
 * 0.16 — La caméra suit Rosalie, à 125 % : au départ, puis dès qu’on lui donne
 * un ordre (clic sur le sol, une parcelle, une course). Elle la garde dans le
 * tiers central de la vue, sans à-coup. Glisser la carte la libère : elle
 * reprend au prochain ordre ou avec « Recentrer sur Rosalie ». Un clic bref
 * sur le décor (sans glisser) est transmis à `onTap` : Rosalie y marche.
 *
 * 0.17.3 — Demande de l’auteur : la caméra à l’échelle 1:1 (100 %), et des
 * changements de vue doux. Zoom par boutons ou touches, recentrage, retour au
 * suivi et coups d’œil sur une nouveauté passent par `fly` : zoom et
 * position glissent ensemble (≈ 0,6 s, départ et arrivée en douceur). La molette
 * reste immédiate ; en mouvement réduit, tout est instantané.
 */
export const READABLE_ZOOM = 1;
/** 0.17.3 : zoom de suivi de Rosalie : l’échelle 1:1 (demande de l’auteur, 125 % en 0.16). */
export const FOLLOW_ZOOM = READABLE_ZOOM;
/** Durée d’un mouvement de caméra (ms). */
export const FLY_MS = 620;
/** Départ et arrivée en douceur. */
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
export const MAX_ZOOM = 2;
const STEP = 1.25;
const RATIO = WORLD_W / WORLD_H;
const DESKTOP = '(min-width: 901px)';
/** Au-delà de ce déplacement du pointeur (px), c’est un glissé et non un clic. */
const TAP_SLOP = 6;
/**
 * 0.32.11 — Caméra moins agressive (demande de l’auteur : « si Rosalie est sur
 * l’écran pas de redimensionnement, le décalement gêne quand on veut planter »).
 * Tant que Rosalie est dans le cadre utile de la vue (hors du bandeau du haut,
 * de la barre d’actions et d’une marge sur les bords), la caméra ne bouge pas :
 * ni zoom, ni recadrage. Elle ne glisse que pour l’empêcher de sortir du cadre.
 */
/** Marge des bords gauche et droit (fraction de la largeur de la vue, 40 px au moins). */
const EDGE_X = 0.06;
/** Marge sous le bandeau du haut et au-dessus de la barre d’actions (px). */
const EDGE_Y = 14;
/** Hauteur de Rosalie au-dessus de ses pieds (px de grille) : sa tête reste visible. */
const HEAD = 46;

/** Joue `apply(e)` à chaque image pendant `ms`, e allant de 0 à 1 en douceur. */
function tween(ms: number, apply: (e: number) => void, handle: { current: number }) {
  const start = performance.now();
  const step = (time: number) => {
    const t = Math.min(1, (time - start) / ms);
    apply(easeInOut(t));
    handle.current = t < 1 ? requestAnimationFrame(step) : 0;
  };
  handle.current = requestAnimationFrame(step);
}

type Size = { w: number; h: number };
type Point = { x: number; y: number };
const round = (value: number) => Math.round(value * 1000) / 1000;

export type CameraOptions = {
  /** Position de Rosalie (pieds, en % de la carte), lue à chaque image. */
  target: RefObject<Point>;
  /** Clic bref sur le décor (coordonnées écran). */
  onTap: RefObject<((x: number, y: number) => void) | null>;
  /** Mouvement réduit : la caméra saute au lieu de glisser. */
  reduced: boolean;
};

export function useFarmCamera({ target, onTap, reduced }: CameraOptions) {
  const reducedRef = useRef(reduced);
  useEffect(() => {
    reducedRef.current = reduced;
  }, [reduced]);
  const scroller = useRef<HTMLDivElement>(null);
  // Taille « tout voir » : la plus grande carte 3:2 qui tient dans le cadre.
  const [fit, setFit] = useState<Size | null>(null);
  const [zoom, setZoom] = useState(READABLE_ZOOM);
  const [panning, setPanning] = useState(false);
  const zoomRef = useRef(zoom);
  const fitRef = useRef<Size | null>(null);
  // Point de la carte (en fraction) à garder sous un point de l’écran.
  const pending = useRef<{ rx: number; ry: number; ax: number; ay: number }>(
    null,
  );
  // 0.16 : la caméra suit Rosalie tant qu’on ne déplace pas la vue soi-même.
  const following = useRef(true);
  const dragging = useRef(false);
  // 0.17.3 : mouvement de caméra en cours (le suivi et la molette l’interrompent).
  const flight = useRef(0);
  const [frame, setFrame] = useState(0);

  const minZoom = useCallback(() => {
    const size = fitRef.current;
    return size ? round(size.w / DISPLAY_WIDTH) : READABLE_ZOOM;
  }, []);
  const clamp = useCallback(
    (value: number) => Math.min(MAX_ZOOM, Math.max(minZoom(), round(value))),
    [minZoom],
  );

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const media = window.matchMedia(DESKTOP);
    const update = () => {
      if (!media.matches) {
        fitRef.current = null;
        setFit(null);
        return;
      }
      const w = Math.floor(Math.min(el.clientWidth, el.clientHeight * RATIO));
      const next = { w, h: Math.floor(w / RATIO) };
      const previous = fitRef.current;
      if (previous && previous.w === next.w && previous.h === next.h) return;
      fitRef.current = next;
      if (!previous) {
        // Première mesure : 125 %, centré sur Rosalie.
        const start = clamp(FOLLOW_ZOOM);
        const p = target.current;
        zoomRef.current = start;
        setZoom(start);
        pending.current = {
          rx: p.x / 100,
          ry: p.y / 100,
          ax: el.clientWidth / 2,
          ay: el.clientHeight / 2,
        };
      } else if (zoomRef.current < minZoom()) {
        zoomRef.current = minZoom();
        setZoom(zoomRef.current);
      }
      setFit(next);
    };
    const observer = new ResizeObserver(update);
    observer.observe(el);
    media.addEventListener('change', update);
    return () => {
      observer.disconnect();
      media.removeEventListener('change', update);
    };
  }, [clamp, minZoom, target]);

  /** Position de Rosalie à l’écran (px, coordonnées de la fenêtre). */
  const targetOnScreen = useCallback(() => {
    const farm = scroller.current?.firstElementChild as HTMLElement | null;
    if (!farm) return undefined;
    const r = farm.getBoundingClientRect();
    return { x: r.left + (r.width * target.current.x) / 100, y: r.top + (r.height * target.current.y) / 100 };
  }, [target]);

  /**
   * Cadre utile de la vue (px, relatifs à la zone qui défile) : la carte
   * visible moins le bandeau du haut et la barre d’actions, qui la recouvrent,
   * et une marge sur les bords. Bandeau et barre sont remesurés deux fois par seconde.
   */
  const covers = useRef({ top: 0, bottom: 0, at: -Infinity });
  const viewBounds = useCallback(() => {
    const el = scroller.current;
    const farm = el?.firstElementChild as HTMLElement | null;
    if (!el || !farm) return null;
    const now = performance.now();
    if (now - covers.current.at > 500) {
      const box = el.getBoundingClientRect();
      const hud = document.querySelector('.pixel-hud')?.getBoundingClientRect();
      const dock = document.querySelector('.action-dock')?.getBoundingClientRect();
      covers.current = {
        top: hud && hud.height && hud.top < box.top + box.height / 2 ? Math.max(0, hud.bottom - box.top) : 0,
        bottom: dock && dock.height && dock.bottom > box.top + box.height / 2 ? Math.max(0, box.bottom - dock.top) : 0,
        at: now,
      };
    }
    const w = el.clientWidth;
    const h = el.clientHeight;
    const mx = Math.max(40, w * EDGE_X);
    const head = (HEAD / WORLD_W) * farm.offsetWidth;
    return {
      el,
      farm,
      left: mx,
      right: w - mx,
      top: Math.min(covers.current.top + head + EDGE_Y, h / 2),
      bottom: Math.max(h - covers.current.bottom - EDGE_Y, h / 2),
    };
  }, []);
  /** Ce point de la carte (en %) est-il dans le cadre utile de la vue ? */
  const sees = useCallback(
    (p: Point) => {
      const v = viewBounds();
      if (!v) return true;
      const x = (p.x / 100) * v.farm.offsetWidth - v.el.scrollLeft;
      const y = (p.y / 100) * v.farm.offsetHeight - v.el.scrollTop;
      return x >= v.left && x <= v.right && y >= v.top && y <= v.bottom;
    },
    [viewBounds],
  );

  const stopFlight = useCallback(() => {
    cancelAnimationFrame(flight.current);
    flight.current = 0;
  }, []);

  /**
   * Mouvement doux de la caméra : le zoom va vers `zoom`, et soit un point de
   * la carte (`center`, en %) glisse au centre de la vue, soit le point sous
   * `anchor` (écran) reste sous le pointeur.
   */
  const fly = useCallback(
    (to: { zoom?: number; center?: Point; anchor?: Point }, ms = FLY_MS) => {
      const el = scroller.current;
      const farm = el?.firstElementChild as HTMLElement | null;
      if (!el || !fitRef.current || !farm) return;
      stopFlight();
      const z0 = zoomRef.current;
      const z1 = clamp(to.zoom ?? z0);
      const box = el.getBoundingClientRect();
      const farmBox = farm.getBoundingClientRect();
      const ax = to.anchor && !to.center ? to.anchor.x - box.left : el.clientWidth / 2;
      const ay = to.anchor && !to.center ? to.anchor.y - box.top : el.clientHeight / 2;
      const r0 = {
        x: (ax + box.left - farmBox.left) / farmBox.width,
        y: (ay + box.top - farmBox.top) / farmBox.height,
      };
      const r1 = to.center ? { x: to.center.x / 100, y: to.center.y / 100 } : r0;
      const apply = (e: number) => {
        const z = round(z0 + (z1 - z0) * e);
        pending.current = { rx: r0.x + (r1.x - r0.x) * e, ry: r0.y + (r1.y - r0.y) * e, ax, ay };
        zoomRef.current = z;
        setZoom(z);
        setFrame((n) => n + 1);
      };
      if (reducedRef.current || ms <= 0) {
        apply(1);
        return;
      }
      tween(ms, apply, flight);
    },
    [clamp, stopFlight],
  );

  const zoomTo = useCallback(
    (value: number, anchor?: { x: number; y: number }, animate = true) => {
      const el = scroller.current;
      const farm = el?.firstElementChild as HTMLElement | null;
      const next = clamp(value);
      if (!el || !fitRef.current || !farm || (next === zoomRef.current && !flight.current)) return;
      // En suivi, le zoom se fait autour de Rosalie : elle ne sort pas de la vue.
      if (following.current) anchor = targetOnScreen() || anchor;
      if (animate) {
        fly({ zoom: next, anchor });
        return;
      }
      stopFlight();
      const box = el.getBoundingClientRect();
      const ax = anchor ? anchor.x - box.left : el.clientWidth / 2;
      const ay = anchor ? anchor.y - box.top : el.clientHeight / 2;
      const farmBox = farm.getBoundingClientRect();
      pending.current = {
        rx: (ax + box.left - farmBox.left) / farmBox.width,
        ry: (ay + box.top - farmBox.top) / farmBox.height,
        ax,
        ay,
      };
      zoomRef.current = next;
      setZoom(next);
    },
    [clamp, targetOnScreen, fly, stopFlight],
  );

  /**
   * Reprend le suivi de Rosalie. 0.32.11 : si elle est à l’écran, la vue ne
   * bouge pas (ni zoom ni recadrage) ; sinon la caméra la rejoint en douceur,
   * au zoom actuel. `recenter` (bouton « Recentrer sur Rosalie ») la remet au
   * centre, à l’échelle 1:1 au moins.
   */
  const follow = useCallback(
    (recenter = false) => {
      following.current = true;
      if (!fitRef.current || flight.current) return;
      if (recenter) fly({ zoom: zoomRef.current < FOLLOW_ZOOM - 0.001 ? FOLLOW_ZOOM : undefined, center: target.current });
      else if (!sees(target.current)) fly({ center: target.current });
    },
    [fly, sees, target],
  );
  const unfollow = useCallback(() => {
    following.current = false;
  }, []);

  // Suivi : à chaque image, 0.32.11 : la vue ne bouge que si Rosalie entre
  // dans la marge des bords (ou passe sous le bandeau ou la barre d’actions),
  // et juste assez pour l’y garder (d’un coup en mouvement réduit).
  useEffect(() => {
    let frame = 0;
    const tick = () => {
      frame = requestAnimationFrame(tick);
      if (!fitRef.current || !following.current || dragging.current || pending.current || flight.current) return;
      const v = viewBounds();
      if (!v) return;
      const { el, farm } = v;
      const x = (target.current.x / 100) * farm.offsetWidth - el.scrollLeft;
      const y = (target.current.y / 100) * farm.offsetHeight - el.scrollTop;
      const dx = x < v.left ? x - v.left : x > v.right ? x - v.right : 0;
      const dy = y < v.top ? y - v.top : y > v.bottom ? y - v.bottom : 0;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
      // Rattrapage doux : 12 % de l’écart par image.
      const k = reducedRef.current ? 1 : 0.12;
      el.scrollLeft += Math.abs(dx) < 2 ? dx : dx * k;
      el.scrollTop += Math.abs(dy) < 2 ? dy : dy * k;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, viewBounds]);

  useLayoutEffect(() => {
    const el = scroller.current;
    const anchor = pending.current;
    const farm = el?.firstElementChild as HTMLElement | null;
    if (!el || !anchor || !farm || !fit) return;
    pending.current = null;
    el.scrollLeft = anchor.rx * farm.offsetWidth - anchor.ax;
    el.scrollTop = anchor.ry * farm.offsetHeight - anchor.ay;
  }, [zoom, fit, frame]);

  // Molette et pincement du pavé tactile : zoom continu autour du pointeur.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    function wheel(event: WheelEvent) {
      if (!fitRef.current) return;
      event.preventDefault();
      const delta = event.deltaMode === 1 ? event.deltaY * 33 : event.deltaY;
      const factor = Math.exp(-delta * (event.ctrlKey ? 0.01 : 0.0018));
      zoomTo(zoomRef.current * factor, { x: event.clientX, y: event.clientY }, false);
    }
    el.addEventListener('wheel', wheel, { passive: false });
    return () => el.removeEventListener('wheel', wheel);
  }, [zoomTo]);

  // Glisser sur le décor (hors parcelles et lieux) pour déplacer la vue ;
  // 0.16 : un clic bref sur le décor fait marcher Rosalie.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    let press: { x: number; y: number; left: number; top: number; id: number } | null = null;
    function down(event: PointerEvent) {
      if (event.button !== 0) return;
      if ((event.target as Element).closest('button, a, input, select, [data-plot-index]'))
        return;
      press = {
        x: event.clientX,
        y: event.clientY,
        left: el!.scrollLeft,
        top: el!.scrollTop,
        id: event.pointerId,
      };
    }
    function move(event: PointerEvent) {
      if (!press) return;
      const moved = Math.hypot(event.clientX - press.x, event.clientY - press.y);
      if (!dragging.current) {
        const scrollable =
          el!.scrollWidth > el!.clientWidth + 1 || el!.scrollHeight > el!.clientHeight + 1;
        if (moved < TAP_SLOP || !fitRef.current || !scrollable) return;
        // Un glissé prend la main : le mouvement de caméra en cours s’arrête là.
        if (flight.current) {
          stopFlight();
          press.left = el!.scrollLeft + (event.clientX - press.x);
          press.top = el!.scrollTop + (event.clientY - press.y);
        }
        dragging.current = true;
        following.current = false;
        el!.setPointerCapture(press.id);
        setPanning(true);
      }
      el!.scrollLeft = press.left - (event.clientX - press.x);
      el!.scrollTop = press.top - (event.clientY - press.y);
    }
    function up(event: PointerEvent) {
      if (!press) return;
      const tap = !dragging.current && Math.hypot(event.clientX - press.x, event.clientY - press.y) < TAP_SLOP;
      press = null;
      if (dragging.current) {
        dragging.current = false;
        setPanning(false);
      }
      if (tap && event.type === 'pointerup') onTap.current?.(event.clientX, event.clientY);
    }
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
    };
  }, [onTap, stopFlight]);

  // Raccourcis : + / − / 0 (vue d’ensemble) / 1 (taille réelle), et les
  // flèches pour se déplacer ; ignorés dans un champ ou quand une fenêtre est ouverte.
  useEffect(() => {
    function key(event: KeyboardEvent) {
      if (!fitRef.current || event.metaKey || event.ctrlKey || event.altKey)
        return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [role="dialog"]')) return;
      if (document.querySelector('[role="dialog"]')) return;
      const el = scroller.current;
      if (event.key === '+' || event.key === '=')
        zoomTo(zoomRef.current * STEP);
      else if (event.key === '-' || event.key === '_')
        zoomTo(zoomRef.current / STEP);
      else if (event.key === '0') zoomTo(minZoom());
      else if (event.key === '1') zoomTo(READABLE_ZOOM);
      else if (
        el &&
        event.shiftKey &&
        ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)
      ) {
        const stepX = el.clientWidth / 3;
        const stepY = el.clientHeight / 3;
        following.current = false;
        el.scrollBy({
          left: event.key === 'ArrowLeft' ? -stepX : event.key === 'ArrowRight' ? stepX : 0,
          top: event.key === 'ArrowUp' ? -stepY : event.key === 'ArrowDown' ? stepY : 0,
          behavior: 'smooth',
        });
      } else return;
      event.preventDefault();
    }
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [zoomTo, minZoom]);

  const width = fit ? Math.round(DISPLAY_WIDTH * zoom) : 0;
  const style: CSSProperties | undefined = fit
    ? { width, height: Math.round(width / RATIO) }
    : undefined;
  const min = fit ? round(fit.w / DISPLAY_WIDTH) : READABLE_ZOOM;
  const camera = {
    desktop: !!fit,
    zoom,
    min,
    max: MAX_ZOOM,
    /** Échelle au-dessus de la vue d’ensemble : la carte dépasse du cadre. */
    zoomed: !!fit && zoom > min + 0.001,
    style,
    panning,
    zoomTo,
    zoomIn: () => zoomTo(zoomRef.current * STEP),
    zoomOut: () => zoomTo(zoomRef.current / STEP),
    overview: () => zoomTo(minZoom()),
    readable: () => zoomTo(READABLE_ZOOM),
    follow,
    unfollow,
    fly,
    /** 0.32.11 : ce point de la carte (en %) est-il dans le cadre utile de la vue ? */
    sees,
    /** 0.20 : la caméra suit-elle Rosalie (pour la remettre comme avant une mise en scène) ? */
    isFollowing: () => following.current,
    /** 0.20 : zoom actuel, sans attendre le rendu. */
    currentZoom: () => zoomRef.current,
  };
  return [scroller, camera] as const;
}
