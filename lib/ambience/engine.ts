/**
 * Moteur d’ambiance (0.5.5) : une seule boucle requestAnimationFrame qui
 * dessine particules, papillons et poules sur un <canvas> posé sur la carte.
 *
 * - Le canevas ne couvre que la partie visible de la carte (il suit le zoom
 *   et le défilement de la caméra) : sa taille reste celle de l’écran.
 * - La boucle s’arrête quand l’onglet est caché, quand la carte sort de
 *   l’écran, et quand les animations sont réduites (une image fixe est alors
 *   dessinée : poules posées, lucioles immobiles).
 * - Au plus MAX_PARTICLES particules, sans allocation pendant l’animation.
 */
import {
  MAP_H,
  MAP_W,
  ParticlePool,
  ZONES,
  ambientEmitters,
  butterflyCount,
  henCount,
  type AmbienceContext,
  type Emitter,
  type Particle,
  type ParticleKind,
  type Rect,
} from './emitters.ts';

type Actor = {
  x: number;
  y: number;
  tx: number;
  ty: number;
  wait: number;
  phase: number;
  flip: boolean;
  cell: number;
  area: Rect;
  hue: number;
  speed: number;
};
/** Chaque papillon a son territoire, sa couleur et sa vitesse. */
const BUTTERFLY_AREAS: Rect[] = [
  ZONES.meadow,
  { x: 300, y: 280, w: 130, h: 120 },
  { x: 880, y: 180, w: 190, h: 160 },
  { x: 470, y: 450, w: 260, h: 40 },
  ZONES.garden,
  { x: 520, y: 100, w: 280, h: 120 },
];
const BUTTERFLY_HUES = [0, 150, 260, 40, 300, 110];

/**
 * 1.0 : poules et papillons dessinés par Astra (objets-1.0/animaux.png, cases de
 * 128 px) : 0 poule blanche, 1 elle picore, 2 poule rousse, 3 elle picore, 4 papillon.
 */
const ATLAS = '/assets/pixel/objets-1.0/animaux.png';
const CELL = 128;
const SPRITE_PX = 96;
const COLORS = {
  rain: '#d6eefb',
  splash: '#e8f7ff',
  firefly: '#f4ff9c',
  fireflyGlow: 'rgba(214, 255, 120, 0.22)',
  bee: '#3a2a12',
  beeStripe: '#f6c955',
  leaf: ['#7ea541', '#b5872f', '#9cc15a'],
  autumnLeaf: ['#c8642a', '#e0a93b', '#9c3f22'],
  snow: '#f7fbff',
  petal: ['#f4b8c8', '#fff1f4', '#e98aa6'],
  smoke: '#e5ddcc',
  dust: '#c9a77a',
  sprout: '#7fbf4a',
  sparkle: '#ffe38a',
} as const;

const registry: { engine: AmbienceEngine | null } = { engine: null };
/** Effets ponctuels (poussière, feuilles, éclats) sur le moteur actif. */
export function ambienceBurst(
  kind: ParticleKind,
  xPercent: number,
  yPercent: number,
  count = 6,
) {
  registry.engine?.burst(
    kind,
    (xPercent / 100) * MAP_W,
    (yPercent / 100) * MAP_H,
    count,
  );
}

/** 0.21.2 — Mode allégé automatique : seuil, durée et délai après le départ. */
const LITE_FPS = 28;
const LITE_SECONDS = 5;
const LITE_GRACE_MS = 10_000;

export class AmbienceEngine {
  private ctx2d: CanvasRenderingContext2D | null;
  private pool = new ParticlePool();
  private emitters: Emitter[] = [];
  private debt = new Map<Emitter, number>();
  private butterflies: Actor[] = [];
  private hens: Actor[] = [];
  /** Sprites prédécoupés (et teintés pour les papillons) : dessin sans filtre. */
  private sprites = new Map<string, HTMLCanvasElement>();
  private frame = 0;
  private last = 0;
  private running = false;
  private hidden = false;
  private offscreen = false;
  /** 0.21 : une fenêtre couvre la carte (fond flouté) : rien à animer dessous. */
  private covered = false;
  private reduced = false;
  private view: Rect = { x: 0, y: 0, w: 0, h: 0 };
  private scale = 1;
  private gust = 0;
  private season = '';
  private cleanup: (() => void)[] = [];
  fps = 0;
  /** Coût moyen (ms) de mise à jour et de dessin par image, sur la dernière seconde. */
  cost = 0;
  private costSum = 0;
  private fpsFrames = 0;
  private fpsSince = 0;
  /**
   * 0.21.2 — Filet de sécurité : secondes consécutives sous LITE_FPS, la carte
   * visible et animée depuis au moins LITE_GRACE_MS (le chargement ne compte pas).
   */
  private slowSeconds = 0;
  private runningSince = 0;
  /**
   * 0.21 : zone dessinée à l’image précédente (px du canevas). On n’efface que
   * celle-ci, et rien du tout quand il n’y a rien à dessiner : Firefox ne
   * renvoie alors plus tout le canevas plein écran à chaque image.
   */
  private dirty: Rect | null = { x: 0, y: 0, w: Infinity, h: Infinity };

  constructor(
    private canvas: HTMLCanvasElement,
    private farm: HTMLElement,
    private scroller: HTMLElement,
  ) {
    this.ctx2d = canvas.getContext('2d');
    registry.engine = this;
    if (typeof Image !== 'undefined') {
      const image = new Image();
      image.src = ATLAS;
      image.onload = () => {
        this.prepareSprites(image);
        if (this.reduced) this.drawStatic();
      };
    }
    const onVisibility = () => {
      this.hidden = document.visibilityState === 'hidden';
      this.sync();
    };
    const onScroll = () => {
      this.measure();
      if (!this.running) this.drawStatic();
    };
    document.addEventListener('visibilitychange', onVisibility);
    scroller.addEventListener('scroll', onScroll, { passive: true });
    const resize = new ResizeObserver(onScroll);
    resize.observe(farm);
    resize.observe(scroller);
    const watchCover = () => {
      this.covered = document.documentElement.hasAttribute('data-map-covered');
      this.sync();
    };
    const cover = new MutationObserver(watchCover);
    cover.observe(document.documentElement, { attributes: true, attributeFilter: ['data-map-covered'] });
    this.cleanup.push(() => cover.disconnect());
    const visible = new IntersectionObserver(([entry]) => {
      this.offscreen = !entry.isIntersecting;
      this.sync();
    });
    visible.observe(farm);
    this.cleanup.push(
      () => document.removeEventListener('visibilitychange', onVisibility),
      () => scroller.removeEventListener('scroll', onScroll),
      () => resize.disconnect(),
      () => visible.disconnect(),
    );
    this.measure();
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.frame);
    this.cleanup.forEach((fn) => fn());
    if (registry.engine === this) registry.engine = null;
  }

  get particles() {
    return this.pool.active;
  }

  /** Change de scène : heure, météo, poulailler. */
  setContext(context: AmbienceContext, seed: number) {
    this.season = context.season || '';
    this.emitters = ambientEmitters(context);
    this.debt.clear();
    this.butterflies = resize(
      this.butterflies,
      butterflyCount(context, seed),
      (i) => ({
        ...spawnActor(BUTTERFLY_AREAS[i % BUTTERFLY_AREAS.length], 4, i),
        hue: BUTTERFLY_HUES[(i + Math.abs(seed)) % BUTTERFLY_HUES.length],
        speed: 16 + ((i * 7) % 12),
      }),
    );
    this.hens = resize(this.hens, henCount(context), (i) =>
      spawnActor(ZONES.coopYard, 2 * (i % 2), i),
    );
    // Les particules d’une autre scène (pluie, lucioles) s’éteignent vite.
    for (let i = 0; i < this.pool.active; i++) {
      const p = this.pool.items[i];
      if (!this.emitters.some((e) => e.kind === p.kind))
        p.life = Math.min(p.life, p.age + 0.4);
    }
    if (!this.running) this.drawStatic();
  }

  setReduced(reduced: boolean) {
    this.reduced = reduced;
    this.sync();
  }

  burst(kind: ParticleKind, x: number, y: number, count: number) {
    if (this.reduced) return;
    for (let i = 0; i < count; i++) {
      const p = this.pool.spawn(kind);
      if (!p) return;
      const a = (i / count) * Math.PI * 2 + Math.random() * 0.6;
      const speed = kind === 'sparkle' ? 38 : kind === 'dust' ? 10 : 22;
      p.x = x + (Math.random() - 0.5) * 3;
      p.y = y;
      p.vx = Math.cos(a) * speed;
      p.vy =
        kind === 'dust'
          ? -4 - Math.random() * 5
          : kind === 'sprout'
            ? -30 - Math.random() * 16
            : Math.sin(a) * speed;
      p.life = kind === 'dust' ? 0.45 : kind === 'sparkle' ? 0.8 : 0.9;
      p.size = kind === 'dust' ? 1.5 : 1;
      p.seed = Math.random();
    }
    this.sync();
  }

  private sync() {
    const shouldRun = !this.hidden && !this.offscreen && !this.reduced && !this.covered;
    if (shouldRun && !this.running) {
      this.running = true;
      this.last = performance.now();
      this.runningSince = this.last;
      this.slowSeconds = 0;
      this.fpsSince = this.last;
      this.fpsFrames = 0;
      this.costSum = 0;
      this.frame = requestAnimationFrame(this.tick);
    } else if (!shouldRun && this.running) {
      this.running = false;
      cancelAnimationFrame(this.frame);
      if (this.reduced) {
        this.pool.clear();
        this.drawStatic();
      }
    }
  }

  private measure() {
    const farm = this.farm.getBoundingClientRect();
    const box = this.scroller.getBoundingClientRect();
    const left = Math.max(farm.left, box.left);
    const top = Math.max(farm.top, box.top);
    const right = Math.min(farm.right, box.right);
    const bottom = Math.min(farm.bottom, box.bottom);
    this.scale = farm.width / MAP_W || 1;
    this.view = {
      x: left - farm.left,
      y: top - farm.top,
      w: Math.max(0, Math.round(right - left)),
      h: Math.max(0, Math.round(bottom - top)),
    };
    const c = this.canvas;
    c.style.left = `${this.view.x}px`;
    c.style.top = `${this.view.y}px`;
    c.style.width = `${this.view.w}px`;
    c.style.height = `${this.view.h}px`;
    if (c.width !== this.view.w || c.height !== this.view.h) {
      c.width = this.view.w;
      c.height = this.view.h;
      this.dirty = null;
      if (this.ctx2d) this.ctx2d.imageSmoothingEnabled = false;
    }
  }

  private tick = (time: number) => {
    if (!this.running) return;
    const dt = Math.min(0.05, (time - this.last) / 1000);
    this.last = time;
    this.fpsFrames++;
    if (time - this.fpsSince >= 1000) {
      this.fps = Math.round((this.fpsFrames * 1000) / (time - this.fpsSince));
      this.watchSpeed(time);
      this.cost = Math.round((this.costSum / this.fpsFrames) * 100) / 100;
      this.fpsFrames = 0;
      this.costSum = 0;
      this.fpsSince = time;
    }
    const started = performance.now();
    this.update(dt);
    this.draw(time / 1000);
    this.costSum += performance.now() - started;
    this.frame = requestAnimationFrame(this.tick);
  };

  /**
   * 0.21.2 — Si le navigateur ne tient pas LITE_FPS images par seconde pendant
   * LITE_SECONDS secondes (Firefox sans accélération graphique, par exemple),
   * les décors animés de la carte se figent (app/ambience.css, [data-map-lite]) :
   * Rosalie, les animaux et les particules continuent. Jamais avec le réglage
   * « Forcer les animations sur cet appareil ». Une fois pour la session.
   */
  private watchSpeed(time: number) {
    const root = document.documentElement;
    if (root.hasAttribute('data-map-lite') || root.hasAttribute('data-motion-full')) return;
    if (time - this.runningSince < LITE_GRACE_MS) return;
    this.slowSeconds = this.fps < LITE_FPS ? this.slowSeconds + 1 : 0;
    if (this.slowSeconds < LITE_SECONDS) return;
    root.setAttribute('data-map-lite', '');
    console.info(`Les jardins de Rosalie : ${this.fps} images par seconde, décors animés de la carte mis en pause.`);
  }

  /** Partie visible de la carte, en pixels natifs. */
  private visibleNative(): Rect {
    const s = this.scale;
    return {
      x: this.view.x / s,
      y: this.view.y / s,
      w: this.view.w / s,
      h: this.view.h / s,
    };
  }

  private update(dt: number) {
    const seen = this.visibleNative();
    this.gust = Math.max(0, this.gust - dt);
    if (Math.random() < dt / 9) this.gust = 2.2;
    for (const e of this.emitters) {
      // Aucune particule dans une zone hors écran.
      const area = e.kind === 'rain' || e.kind === 'snow' ? seen : e.area;
      if (!overlaps(area, seen)) continue;
      let rate = e.rate;
      if (e.kind === 'leaf')
        rate = this.gust > 0 ? 6 : this.season === 'automne' ? e.rate : 0;
      const owed = (this.debt.get(e) || 0) + rate * dt;
      let n = Math.floor(owed);
      this.debt.set(e, owed - n);
      while (n-- > 0 && this.pool.count(e.kind) < e.max) {
        const p = this.pool.spawn(e.kind);
        if (!p) break;
        initParticle(p, e.kind, area);
      }
    }
    const pool = this.pool;
    for (let i = pool.active - 1; i >= 0; i--) {
      const p = pool.items[i];
      p.age += dt;
      stepParticle(p, dt, this.gust);
      if (p.age >= p.life) {
        const land = p.kind === 'rain';
        const { x, y } = p;
        pool.kill(i);
        if (land && Math.random() < 0.5) {
          const s = pool.spawn('splash');
          if (s) {
            s.x = x;
            s.y = y;
            s.vx = 0;
            s.vy = 0;
            s.life = 0.28;
            s.size = 1;
            s.seed = 0;
          }
        }
      }
    }
    for (const b of this.butterflies) stepActor(b, dt, b.speed, 0.4);
    for (const h of this.hens) stepActor(h, dt, h.speed, 2.2);
  }

  private draw(t: number) {
    const g = this.ctx2d;
    if (!g) return;
    const s = this.scale;
    const ox = this.view.x,
      oy = this.view.y;
    const px = (x: number) => Math.round(x * s - ox);
    const py = (y: number) => Math.round(y * s - oy);
    const unit = Math.max(1, Math.round(s));
    // 0.21 : ce qui sera dessiné cette image (marge large : fumée, lucioles, sprites).
    const W = this.canvas.width,
      H = this.canvas.height;
    let x0 = Infinity,
      y0 = Infinity,
      x1 = -Infinity,
      y1 = -Infinity;
    const reach = (x: number, y: number, r: number) => {
      const X = px(x),
        Y = py(y);
      if (X + r < 0 || Y + r < 0 || X - r > W || Y - r > H) return;
      x0 = Math.min(x0, X - r);
      y0 = Math.min(y0, Y - r);
      x1 = Math.max(x1, X + r);
      y1 = Math.max(y1, Y + r);
    };
    for (const h of this.hens) reach(h.x, h.y, Math.ceil(13 * s) + 2);
    for (const b of this.butterflies) reach(b.x, b.y, Math.ceil(8 * s) + 2);
    for (let i = 0; i < this.pool.active; i++) {
      const p = this.pool.items[i];
      reach(p.x, p.y, unit * 8 + Math.ceil((p.size + p.age * 2.2) * s) + 4);
    }
    const now: Rect | null = x1 > x0 ? { x: Math.floor(x0), y: Math.floor(y0), w: Math.ceil(x1 - x0), h: Math.ceil(y1 - y0) } : null;
    // Rien avant, rien maintenant : le canevas ne change pas.
    if (!now && !this.dirty) return;
    if (this.dirty) g.clearRect(this.dirty.x, this.dirty.y, this.dirty.w, this.dirty.h);
    this.dirty = now;
    if (!now) return;
    // 0.19 : poules à l’échelle de Rosalie (38 px) : 40 cm, soit 11 px.
    for (const h of this.hens) this.drawActor(h, px, py, 11, t, true);
    const pool = this.pool;
    for (let i = 0; i < pool.active; i++) {
      const p = pool.items[i];
      const fade = 1 - p.age / p.life;
      switch (p.kind) {
        case 'rain':
          g.globalAlpha = 0.7;
          g.fillStyle = COLORS.rain;
          g.fillRect(
            px(p.x),
            py(p.y),
            Math.max(1, Math.round(unit * 0.6)),
            unit * 4,
          );
          break;
        case 'splash': {
          // Deux gouttelettes qui s’écartent au point d’impact.
          g.globalAlpha = 0.8 * fade;
          g.fillStyle = COLORS.splash;
          const spread = Math.round((1 + p.age * 14) * s);
          const lift = Math.round(Math.sin((p.age / p.life) * Math.PI) * 2 * s);
          g.fillRect(px(p.x) - spread, py(p.y) - lift, unit, unit);
          g.fillRect(px(p.x) + spread, py(p.y) - lift, unit, unit);
          break;
        }
        case 'firefly': {
          const blink = 0.5 + 0.5 * Math.sin(t * 3 + p.seed * 12);
          const life = Math.min(1, p.age * 2, fade * 2);
          g.globalAlpha = 0.9 * blink * life;
          g.fillStyle = COLORS.fireflyGlow;
          g.fillRect(
            px(p.x) - unit * 3,
            py(p.y) - unit * 3,
            unit * 7,
            unit * 7,
          );
          g.fillRect(px(p.x) - unit, py(p.y) - unit, unit * 3, unit * 3);
          g.fillStyle = COLORS.firefly;
          g.fillRect(px(p.x), py(p.y), unit, unit);
          break;
        }
        case 'bee':
          g.globalAlpha = Math.min(1, fade * 3);
          g.fillStyle = COLORS.beeStripe;
          g.fillRect(px(p.x), py(p.y), unit, unit);
          g.fillStyle = COLORS.bee;
          g.fillRect(px(p.x) + unit, py(p.y), Math.max(1, unit >> 1), unit);
          break;
        case 'leaf': {
          g.globalAlpha = Math.min(1, fade * 2);
          g.fillStyle = (this.season === 'automne' ? COLORS.autumnLeaf : COLORS.leaf)[Math.floor(p.seed * 3) % 3];
          const flat = Math.sin(t * 8 + p.seed * 9) > 0;
          g.fillRect(
            px(p.x),
            py(p.y),
            unit * (flat ? 2 : 1),
            unit * (flat ? 1 : 2),
          );
          break;
        }
        case 'smoke': {
          const size = Math.round((p.size + p.age * 2.2) * s);
          g.globalAlpha = 0.45 * fade;
          g.fillStyle = COLORS.smoke;
          g.fillRect(px(p.x) - size / 2, py(p.y) - size / 2, size, size);
          break;
        }
        case 'dust':
          g.globalAlpha = 0.7 * fade;
          g.fillStyle = COLORS.dust;
          g.fillRect(px(p.x), py(p.y), unit, unit);
          break;
        case 'sprout':
          g.globalAlpha = fade;
          g.fillStyle = COLORS.sprout;
          g.fillRect(px(p.x), py(p.y), unit * 2, unit);
          break;
        case 'sparkle':
          g.globalAlpha = fade;
          g.fillStyle = COLORS.sparkle;
          g.fillRect(px(p.x), py(p.y), unit, unit);
          break;
        case 'snow':
          g.globalAlpha = 0.85 * Math.min(1, fade * 3, p.age * 3);
          g.fillStyle = COLORS.snow;
          g.fillRect(px(p.x), py(p.y), unit * p.size, unit * p.size);
          break;
        case 'petal': {
          g.globalAlpha = Math.min(1, fade * 2);
          g.fillStyle = COLORS.petal[Math.floor(p.seed * 3) % 3];
          const flat = Math.sin(t * 6 + p.seed * 9) > 0;
          g.fillRect(px(p.x), py(p.y), unit * (flat ? 2 : 1), unit);
          break;
        }
      }
    }
    g.globalAlpha = 1;
    // 0.19 : papillons à l’échelle de Rosalie (38 px) : 6 px, ailes ouvertes.
    for (const b of this.butterflies) this.drawActor(b, px, py, 6, t, false);
  }

  private drawActor(
    a: Actor,
    px: (x: number) => number,
    py: (y: number) => number,
    size: number,
    t: number,
    ground: boolean,
  ) {
    const g = this.ctx2d;
    if (!g) return;
    const w = Math.round(size * this.scale);
    let sw = w;
    let bob = 0;
    if (!ground) {
      // Battement d’ailes : largeur qui varie.
      sw = Math.max(
        2,
        Math.round(w * (0.35 + 0.65 * Math.abs(Math.sin(t * 9 + a.phase)))),
      );
    } else if (a.wait > 0) {
      // Picore : la poule baisse la tête (image « picore » de la planche).
      bob = Math.sin(t * 10 + a.phase) > 0.6 ? 1 : 0;
    }
    const x = px(a.x) - sw / 2;
    const y = py(a.y) - w;
    const sprite = this.sprites.get(`${a.cell + bob}:${a.hue}`);
    if (!sprite) return;
    g.save();
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = 'high';
    if (a.flip) {
      g.translate(x + sw, y);
      g.scale(-1, 1);
      g.drawImage(sprite, 0, 0, sw, w);
    } else {
      g.drawImage(sprite, x, y, sw, w);
    }
    g.restore();
  }

  private prepareSprites(image: HTMLImageElement) {
    const cut = (cell: number, hue: number) => {
      const c = document.createElement('canvas');
      c.width = c.height = SPRITE_PX;
      const g = c.getContext('2d');
      if (!g) return;
      // Réduction d’un original HD : lissage de qualité, pas de plus proche voisin.
      g.imageSmoothingEnabled = true;
      g.imageSmoothingQuality = 'high';
      if (hue) g.filter = `hue-rotate(${hue}deg)`;
      g.drawImage(
        image,
        (cell % 4) * CELL,
        Math.floor(cell / 4) * CELL,
        CELL,
        CELL,
        0,
        0,
        SPRITE_PX,
        SPRITE_PX,
      );
      this.sprites.set(`${cell}:${hue}`, c);
    };
    for (const cell of [0, 1, 2, 3]) cut(cell, 0);
    for (const hue of BUTTERFLY_HUES) cut(4, hue);
  }

  /** Image fixe (mouvement réduit ou boucle arrêtée) : acteurs posés. */
  private drawStatic() {
    this.measure();
    if (!this.running) this.draw(0);
  }
}

function resize(list: Actor[], count: number, make: (i: number) => Actor) {
  if (list.length === count) return list;
  if (list.length > count) return list.slice(0, count);
  return [
    ...list,
    ...Array.from({ length: count - list.length }, (_, i) =>
      make(list.length + i),
    ),
  ];
}

function spawnActor(area: Rect, cell: number, i: number): Actor {
  const x = area.x + ((i * 0.37 + 0.15) % 1) * area.w;
  const y = area.y + ((i * 0.61 + 0.3) % 1) * area.h;
  return {
    x,
    y,
    tx: x,
    ty: y,
    wait: 0.5 + i * 0.7,
    phase: i * 1.7,
    flip: i % 2 === 1,
    cell,
    area,
    hue: 0,
    speed: 7,
  };
}

function stepActor(a: Actor, dt: number, speed: number, pause: number) {
  const area = a.area;
  if (a.wait > 0) {
    a.wait -= dt;
    if (a.wait <= 0) {
      a.tx = area.x + Math.random() * area.w;
      a.ty = area.y + Math.random() * area.h;
    }
    return;
  }
  const dx = a.tx - a.x,
    dy = a.ty - a.y;
  const d = Math.hypot(dx, dy);
  if (d < 1) {
    a.wait = pause * (0.5 + Math.random());
    return;
  }
  const step = Math.min(d, speed * dt);
  a.x += (dx / d) * step;
  a.y += (dy / d) * step;
  if (Math.abs(dx) > 0.5) a.flip = dx > 0;
}

function overlaps(a: Rect, b: Rect) {
  return (
    a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
  );
}

function initParticle(p: Particle, kind: ParticleKind, area: Rect) {
  p.seed = Math.random();
  p.x = area.x + Math.random() * area.w;
  p.y = area.y + Math.random() * area.h;
  p.size = 1;
  switch (kind) {
    case 'rain':
      p.y = area.y - 8;
      p.vx = -26;
      p.vy = 230 + Math.random() * 40;
      // Tombe jusqu’à une hauteur au hasard dans la vue : éclaboussure au sol.
      p.life = (Math.random() * area.h + 8) / p.vy;
      break;
    case 'firefly':
      p.vx = (Math.random() - 0.5) * 6;
      p.vy = (Math.random() - 0.5) * 4;
      p.life = 4 + Math.random() * 4;
      break;
    case 'bee':
      p.vx = (Math.random() - 0.5) * 18;
      p.vy = (Math.random() - 0.5) * 10;
      p.life = 3 + Math.random() * 3;
      break;
    case 'leaf':
      p.x = area.x - 4;
      p.vx = 45 + Math.random() * 30;
      p.vy = 4 + Math.random() * 6;
      p.life = (area.w + 8) / p.vx;
      break;
    case 'snow':
      p.y = area.y - 4;
      p.vx = -4 + Math.random() * 6;
      p.vy = 16 + Math.random() * 14;
      p.size = Math.random() < 0.5 ? 2 : 1;
      p.life = (Math.random() * area.h + 4) / p.vy;
      break;
    case 'petal':
      p.x = area.x - 4;
      p.vx = 22 + Math.random() * 16;
      p.vy = 3 + Math.random() * 4;
      p.life = (area.w + 8) / p.vx;
      break;
    case 'smoke':
      p.vx = 2 + Math.random() * 2;
      p.vy = -7 - Math.random() * 3;
      p.size = 2;
      p.life = 2.6 + Math.random();
      break;
    default:
      p.vx = 0;
      p.vy = 0;
      p.life = 1;
  }
}

function stepParticle(p: Particle, dt: number, gust: number) {
  switch (p.kind) {
    case 'firefly':
      p.vx += Math.sin(p.age * 1.7 + p.seed * 20) * 5 * dt;
      p.vy += Math.cos(p.age * 1.3 + p.seed * 11) * 4 * dt;
      break;
    case 'bee':
      p.vx += (Math.random() - 0.5) * 120 * dt;
      p.vy += (Math.random() - 0.5) * 80 * dt;
      p.vx *= 0.96;
      p.vy *= 0.96;
      break;
    case 'leaf':
    case 'petal':
      p.vy = Math.sin(p.age * 4 + p.seed * 8) * 10;
      break;
    case 'snow':
      p.vx = Math.sin(p.age * 2 + p.seed * 10) * 6 + (gust > 0 ? 10 : 0);
      break;
    case 'smoke':
      p.vx += (gust > 0 ? 8 : 1) * dt;
      break;
    case 'sprout':
    case 'sparkle':
      p.vy += 60 * dt;
      break;
  }
  p.x += p.vx * dt;
  p.y += p.vy * dt;
}
