/**
 * 0.32.11 — Icônes nettes.
 *
 * Les icônes sont du pixel art : grille de 32 px dans les planches HD des
 * icônes 3.0 et 3.1 (cases de 512 px, ×16 exact), 64 px pour les anciennes
 * recettes (v040/icons.png). Affichées en « pixelated » à une échelle non
 * entière (41,6 pixels écran pour une grille de 32, par exemple), certaines
 * colonnes de pixels doublent et d’autres non : l’icône paraît écrasée,
 * « compressée ».
 *
 * Règle, mesurée sur la taille réelle de l’icône à l’écran (pixels physiques) :
 * - près d’un multiple entier de la grille (à 22 % près), l’icône est dessinée
 *   à ce multiple exact, centrée dans sa boîte, en pixels francs ;
 * - sinon, elle est lissée (rendu « auto ») à la taille de sa boîte : pixels
 *   réguliers, contours doux, rien d’écrasé.
 * Dans les deux cas, l’icône reste carrée, même si sa boîte ne l’est pas.
 */
export type IconSnap = { mode: 'net' | 'doux'; draw: number };

/** Écart toléré à un multiple entier de la grille pour dessiner en pixels francs. */
export const SNAP_TOLERANCE = 0.22;

/** Grille d’art (pixels de l’image par icône à l’échelle 1) d’une planche connue. */
export function iconArtSize(image: string): number | null {
  if (/\/icones-3\.\d+\//.test(image)) return 32;
  if (/\/v040\/icons\.png/.test(image)) return 64;
  return null;
}

/**
 * Taille de dessin d’une icône (px CSS) : `box` = plus petit côté de sa boîte
 * (px CSS), `dpr` = pixels physiques par px CSS, `art` = grille de la planche.
 */
export function snapIcon(box: number, dpr: number, art: number, tolerance = SNAP_TOLERANCE): IconSnap {
  const k = (box * dpr) / art;
  const whole = Math.round(k);
  if (whole >= 1 && Math.abs(k - whole) <= tolerance) return { mode: 'net', draw: (whole * art) / dpr };
  return { mode: 'doux', draw: box };
}
