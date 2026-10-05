/**
 * 0.12 — La grande carte : géométrie du monde, relevée sur l’image retenue.
 *
 * Un seul repère pour tout le jeu : la grille de dessin de 1 200 × 800 pixels
 * logiques (x vers la droite, y vers le bas, origine en haut à gauche).
 * - Image : assets/carte-hd-originaux/carte-hd.png, 1 536 × 1 024, l’original
 *   HD de la carte retenue (même composition que la grille). Jamais redessinée.
 * - Jeu : les positions sont données en % de la carte (x / 12, y / 8), comme
 *   avant ; ce module est la seule source de ces valeurs.
 * - Écran : la caméra (use-farm-camera) exprime son zoom par rapport à
 *   DISPLAY_WIDTH (100 % = 2 400 px de large).
 *
 * Les coordonnées ont été relevées à la main sur carte-x1.png (grilles de
 * contrôle), pas recalculées depuis l’ancien plan : le manifeste de la livraison
 * ne donnait que des propositions visuelles. Positions de Rosalie = ses pieds.
 */
export const WORLD_W = 1200;
export const WORLD_H = 800;
/**
 * 0.13 : l’image HD d’origine (assets/carte-v100-grande/sources/carte-generee.png,
 * 1 536 × 1 024, toutes ses couleurs), copiée à l’octet près. La version de la
 * livraison réduite à 64 couleurs (carte.png) est archivée : même composition,
 * seulement réduite. 1 px de la grille = 1,28 px de cette image.
 */
/** 0.21.1 : les originaux sont rangés hors du site ; le jeu affiche leurs versions de saison (carte-hd/saisons). */
export const MAP_IMAGE = {
  src: 'assets/carte-hd-originaux/carte-hd.png',
  width: 1536,
  height: 1024,
} as const;
/**
 * 1.0 : carte HD (4 608 × 3 072) assemblée par scripts/integrer-assets-1.0.py
 * depuis les tuiles redessinées par Astra, calée sur la carte d’origine.
 */
export const MAP_IMAGE_HD = {
  src: 'assets/carte-hd-originaux/carte-hd-x3.png',
  width: 4608,
  height: 3072,
} as const;
/** Largeur affichée de la carte à 100 % de zoom : Rosalie y a sa taille d’avant. */
export const DISPLAY_WIDTH = 2400;

export type Px = { x: number; y: number };
export type RectPx = { x: number; y: number; w: number; h: number };
export type Pct = { x: number; y: number };
export type RectPct = { x: number; y: number; w: number; h: number };

const round = (v: number) => Math.round(v * 1000) / 1000;
/** Pixels de la grille → % de la carte. */
export const pct = (p: Px): Pct => ({ x: round((p.x / WORLD_W) * 100), y: round((p.y / WORLD_H) * 100) });
export const rectPct = (r: RectPx): RectPct => ({
  x: round((r.x / WORLD_W) * 100),
  y: round((r.y / WORLD_H) * 100),
  w: round((r.w / WORLD_W) * 100),
  h: round((r.h / WORLD_H) * 100),
});
/** % de la carte → pixels de la grille. */
export const px = (p: Pct): Px => ({ x: round((p.x / 100) * WORLD_W), y: round((p.y / 100) * WORLD_H) });

// ---------------------------------------------------------------------------
// Rosalie
// ---------------------------------------------------------------------------
/**
 * Taille de Rosalie sur la grille : la moitié de l’ancienne carte (37 × 45 px
 * pour une case de 80 × 96). Son élément est ancré à ses pieds (pivot 40, 88).
 */
export const ROSALIE = { width: 37.2, frame: [80, 96], pivot: [40, 88] } as const;
/** Point de départ : sur le chemin de pierre, devant l’entrée haute du potager. */
export const SPAWN: Px = { x: 440, y: 327.1 };

// ---------------------------------------------------------------------------
// Potager : le pré clos au centre de la carte
// ---------------------------------------------------------------------------
/** Pelouse intérieure de la clôture (le potager ne déborde jamais). */
export const POTAGER: RectPx = { x: 486, y: 298, w: 222, h: 120 };
/**
 * 20 parcelles (capacité), 4 colonnes, 5 rangées, ligne par ligne : l’index
 * d’une parcelle ne change jamais. La progression en ouvre 6 puis 3 par 3.
 */
export const PLOT = {
  columns: 4,
  capacity: 20,
  left: 498,
  top: 308,
  w: 44,
  h: 17,
  dx: 51,
  dy: 21.25,
} as const;
export function plotRect(index: number): RectPx {
  return {
    x: PLOT.left + (index % PLOT.columns) * PLOT.dx,
    y: PLOT.top + Math.floor(index / PLOT.columns) * PLOT.dy,
    w: PLOT.w,
    h: PLOT.h,
  };
}
/**
 * Geste : Rosalie se tient à gauche de la parcelle, tournée vers la droite
 * (les trois gestes des sprites sont tournés vers la droite), les pieds sur le
 * bord de la terre. Allée : entre deux rangées, juste sous la parcelle.
 */
export const GESTURE_SIDE = 17.4;
export const GESTURE_FEET = 10;
export const LANE_FEET = 19.1;
/** Couloirs verticaux : à gauche, entre les colonnes et à droite. */
export const AISLES_PX = [492, 545.5, 596.5, 647.5, 701.5] as const;
/** Ouvertures de la clôture, côté gauche, alignées sur les allées des rangées 1 et 3. */
export const POTAGER_DOORS = [
  { row: 0, outside: { x: 472, y: PLOT.top + LANE_FEET } },
  { row: 2, outside: { x: 472, y: PLOT.top + 2 * PLOT.dy + LANE_FEET } },
] as const;

// ---------------------------------------------------------------------------
// Chemins marchables (pieds de Rosalie). Aucune arête ne traverse un bâtiment,
// une clôture, un arbre ou l’eau ; la rivière n’est franchie que par les ponts.
// ---------------------------------------------------------------------------
export const NODES = {
  'potager-haut': { x: 472, y: 327.1 },
  'potager-bas': { x: 472, y: 369.6 },
  'pierre-haut': { x: 440, y: 327.1 },
  'pierre-bas': { x: 440, y: 369.6 },
  'pierre-cour': { x: 424, y: 268 },
  cour: { x: 414, y: 234 },
  'cour-est': { x: 486, y: 230 },
  passage: { x: 492, y: 205 },
  'place-ouest': { x: 545, y: 211 },
  'place-sud': { x: 612, y: 218 },
  fete: { x: 658, y: 207 },
  'place-centre': { x: 700, y: 180 },
  'place-nord-est': { x: 750, y: 182 },
  'place-sud-est': { x: 752, y: 212 },
  'place-est': { x: 790, y: 214 },
  halte: { x: 792, y: 250 },
  verger: { x: 850, y: 206 },
  route: { x: 872, y: 162 },
  portail: { x: 966, y: 128 },
  'sud-ouest': { x: 442, y: 447 },
  'sud-est': { x: 722, y: 446 },
  atelier: { x: 752, y: 432 },
  poulailler: { x: 772, y: 472 },
} as const satisfies Record<string, Px>;
export type NodeId = keyof typeof NODES;
export const EDGES: readonly (readonly [NodeId, NodeId])[] = [
  ['potager-haut', 'pierre-haut'],
  ['potager-bas', 'pierre-bas'],
  ['pierre-haut', 'pierre-bas'],
  ['pierre-haut', 'pierre-cour'],
  ['pierre-cour', 'cour'],
  ['cour', 'cour-est'],
  ['cour-est', 'passage'],
  ['passage', 'place-ouest'],
  ['place-ouest', 'place-sud'],
  ['place-sud', 'fete'],
  ['fete', 'place-centre'],
  ['place-centre', 'place-nord-est'],
  ['place-nord-est', 'place-sud-est'],
  ['place-sud-est', 'place-est'],
  ['place-est', 'halte'],
  ['halte', 'verger'],
  ['verger', 'route'],
  ['route', 'portail'],
  ['pierre-bas', 'sud-ouest'],
  ['sud-ouest', 'sud-est'],
  ['sud-est', 'atelier'],
  ['atelier', 'poulailler'],
];
/**
 * Obstacles peints que le réseau ne traverse jamais (contrôlés par les tests) :
 * bâtiments, eau, clôture du potager hors de ses portes, rivière.
 */
export const BLOCKED: readonly (RectPx & { id: string })[] = [
  { id: 'mas', x: 300, y: 96, w: 172, h: 104 },
  { id: 'puits', x: 326, y: 222, w: 42, h: 44 },
  { id: 'atelier', x: 742, y: 366, w: 94, h: 60 },
  { id: 'poulailler', x: 778, y: 438, w: 62, h: 40 },
  { id: 'etang', x: 480, y: 490, w: 240, h: 70 },
  { id: 'riviere', x: 160, y: 0, w: 140, h: 800 },
  { id: 'lavoir', x: 240, y: 336, w: 60, h: 64 },
  { id: 'cypres-est', x: 718, y: 216, w: 8, h: 70 },
];
/** Plus court chemin sur le réseau (Dijkstra, quelques nœuds). */
export function pathBetween(from: NodeId, to: NodeId): NodeId[] {
  const dist = new Map<NodeId, number>([[from, 0]]);
  const prev = new Map<NodeId, NodeId>();
  const open = new Set<NodeId>(Object.keys(NODES) as NodeId[]);
  while (open.size) {
    let current: NodeId | null = null;
    for (const n of open)
      if (dist.has(n) && (current === null || dist.get(n)! < dist.get(current)!)) current = n;
    if (current === null || current === to) break;
    open.delete(current);
    for (const [a, b] of EDGES) {
      const next = a === current ? b : b === current ? a : null;
      if (!next || !open.has(next)) continue;
      const d = dist.get(current)! + Math.hypot(NODES[a].x - NODES[b].x, NODES[a].y - NODES[b].y);
      if (d < (dist.get(next) ?? Infinity)) {
        dist.set(next, d);
        prev.set(next, current);
      }
    }
  }
  const path: NodeId[] = [to];
  while (path[0] !== from) {
    const p = prev.get(path[0]);
    if (!p) return [];
    path.unshift(p);
  }
  return path;
}

// ---------------------------------------------------------------------------
// Lieux du jeu (rectangles sur le décor peint)
// ---------------------------------------------------------------------------
export const ZONES = {
  /** A — mas de Rosalie (la maison). */
  mas: { x: 300, y: 96, w: 172, h: 124 },
  /** D — place de la Fête des Saveurs (étals, mosaïque, mât). */
  place: { x: 532, y: 104, w: 276, h: 124 },
  /** E — portail et route du village (commandes). */
  portail: { x: 922, y: 66, w: 90, h: 64 },
  /** F — verger clos. */
  verger: { x: 872, y: 170, w: 190, h: 180 },
  /** I — atelier (bâtiment peint : grisé tant qu’il n’est pas aménagé). */
  atelier: { x: 732, y: 360, w: 104, h: 68 },
  /** J — poulailler et sa cour. */
  poulailler: { x: 774, y: 428, w: 104, h: 72 },
  /** H — lot de la serre (friche plate) : la serre est un sprite. */
  serre: { x: 296, y: 398, w: 76, h: 76 },
  /** K — étang. */
  etang: { x: 470, y: 470, w: 256, h: 96 },
  /** G — champ de lavande près du mas. */
  lavande: { x: 312, y: 300, w: 96, h: 66 },
} as const satisfies Record<string, RectPx>;
export type ZoneId = keyof typeof ZONES;

/** Emplacements des sprites posés par le jeu (milieu du bas du sprite). */
export const ANCHORS = {
  // Embellissements (cases de 64 px, 96 px pour le pigeonnier et le moulin ;
  // 0.19 : agrandies à l’échelle de la carte, lib/echelle.ts).
  // Fontaine : au carrefour du mas, de la place et du potager.
  fontaine: { x: 492, y: 272 },
  // Pigeonnier : dans le pré entre la place et le potager, entre l’arche et les tables.
  pigeonnier: { x: 584, y: 288 },
  // Épouvantail : au coin du potager, face aux semis.
  epouvantail: { x: 684, y: 288 },
  // Ruches : contre le champ de lavande.
  ruches: { x: 365, y: 404 },
  // 0.19 : barque amarrée au ponton, plus au milieu de l’étang.
  barque: { x: 540, y: 500 },
  // 0.19 : moulin sur le plateau d’herbe au-dessus des champs, dégagé pour ses ailes.
  moulin: { x: 330, y: 588 },
  // 0.14.2 : chaque aménagement près de ce qu’il sert.
  // Pépinière du village : à côté de la serre, sur l’herbe avant le sentier de pierre.
  pepiniere: { x: 398, y: 468 },
  // Compost : dans la bande d’herbe du potager, entre ses deux portes ouest.
  compost: { x: 460, y: 360 },
  // Rigoles et haie : entre la clôture sud du potager et le chemin de l’étang.
  rigoles: { x: 604, y: 443 },
  haie: { x: 548, y: 440 },
  // Halle des variétés : à droite du portail, où partent les commandes du village.
  halle: { x: 1050, y: 150 },
  // Vallée : caravane garée sur la terre battue, à gauche du portail, relais à côté.
  // 0.19 : garée contre le mur, hors de la route du portail.
  caravane: { x: 888, y: 140 },
  relais: { x: 832, y: 150 },
  // Améliorations visibles : colonne sur la clôture nord, établi à la porte
  // haute du potager, semoir garé sous la clôture sud.
  irrigation: { x: 626, y: 296 },
  etabli: { x: 466, y: 318 },
  semoir: { x: 674, y: 445 },
} as const satisfies Record<string, Px>;
export type AnchorId = keyof typeof ANCHORS;


/** Cadrage de départ de la caméra : le cœur de la ferme. */
export const CORE: RectPx = { x: 290, y: 90, w: 600, h: 420 };

// ---------------------------------------------------------------------------
// 0.13 — Lieux de l’anneau (lib/restorations.ts) : zones cliquables posées sur
// les ruines peintes. Pas encore de planches restaurées : le décor reste tel quel.
// ---------------------------------------------------------------------------
export const RING = {
  bois: { x: 40, y: 60, w: 160, h: 150 },
  lavoir: { x: 238, y: 334, w: 60, h: 62 },
  champs: { x: 372, y: 612, w: 350, h: 170 },
  grange: { x: 730, y: 598, w: 175, h: 110 },
  chai: { x: 1066, y: 210, w: 112, h: 92 },
  vignes: { x: 1064, y: 306, w: 136, h: 170 },
} as const satisfies Record<string, RectPx>;
/** Réserves du plan (coteau nord, pré sud-est, rive ouest) : sans usage. */
export const RESERVED = [
  { id: 'coteau-nord', footprint: { x: 444, y: 8, w: 300, h: 72 } },
  { id: 'pre-sud-est', footprint: { x: 1008, y: 656, w: 156, h: 120 } },
  { id: 'rive-ouest', footprint: { x: 24, y: 464, w: 120, h: 280 } },
] as const;

// ---------------------------------------------------------------------------
// Ambiance : relevés sur l’image (px de la grille)
// ---------------------------------------------------------------------------
export const AMBIENCE = {
  chimneys: [
    { x: 342, y: 112 },
    { x: 461, y: 94 },
  ],
  lamps: [
    { id: 'house', x: 521, y: 148, r: 18 },
    { id: 'grange', x: 867, y: 574, r: 18 },
    { id: 'festival', x: 660, y: 104, r: 16 },
  ],
  windows: [
    { x: 396, y: 148, w: 11, h: 16 },
    { x: 443, y: 142, w: 12, h: 17 },
    { x: 397, y: 176, w: 12, h: 16 },
    { x: 443, y: 170, w: 12, h: 17 },
  ],
  pond: { x: 480, y: 490, w: 240, h: 72 },
  lavender: { x: 312, y: 300, w: 96, h: 66 },
  coopYard: { x: 800, y: 480, w: 70, h: 18 },
  garden: POTAGER,
  meadow: { x: 440, y: 236, w: 290, h: 200 },
} as const;

// ---------------------------------------------------------------------------
// Points où la caméra glisse (passage de niveau, aménagement) — en %.
// ---------------------------------------------------------------------------
const centre = (r: RectPx): Px => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });
export const FOCUS = {
  potager: pct(centre(POTAGER)),
  place: pct(centre(ZONES.place)),
  atelier: pct(centre(ZONES.atelier)),
  poulailler: pct(centre(ZONES.poulailler)),
  verger: pct(centre(ZONES.verger)),
  serre: pct(centre(ZONES.serre)),
  etabli: pct(ANCHORS.etabli),
  irrigation: pct(ANCHORS.irrigation),
  semoir: pct(ANCHORS.semoir),
} as const;
/** Aménagement acheté → point de la carte qui le montre. */
export const BUILD_FOCUS: Record<string, Pct> = {
  expand: FOCUS.potager,
  'watering-can': FOCUS.potager,
  tools: FOCUS.etabli,
  water: FOCUS.irrigation,
  auto: FOCUS.semoir,
  workshop: FOCUS.atelier,
  coop: FOCUS.poulailler,
  stove2: FOCUS.atelier,
  stove3: FOCUS.atelier,
  marmite: FOCUS.atelier,
  paths: FOCUS.potager,
};
