/**
 * 0.29 — Glyphes d’interface en pixels (scripts/preparer-glyphes.py).
 *
 * Masques monochromes 16 × 16 : le glyphe prend la couleur du texte
 * (currentColor), à taille réelle pour garder des pixels nets. Décoratif par
 * défaut ; avec `label`, un texte lu par les lecteurs d’écran l’accompagne.
 */
import type { CSSProperties } from 'react';

export const GLYPHS = [
  'coche', 'croix', 'chevron-droite', 'chevron-gauche', 'chevron-bas', 'chevron-haut',
  'fleche-droite', 'fleche-gauche', 'plus', 'moins', 'loupe-plus', 'loupe-moins', 'plein-ecran', 'viseur',
] as const;
export type GlyphId = (typeof GLYPHS)[number];

export function Glyph({ id, label, className }: { id: GlyphId; label?: string; className?: string }) {
  const style = { '--glyph': `url('/assets/pixel/glyphes-2.1/${id}.svg')` } as CSSProperties;
  return (
    <>
      <span className={className ? `glyph ${className}` : 'glyph'} data-glyph={id} style={style} aria-hidden="true" />
      {label && <span className="sr-only">{label}</span>}
    </>
  );
}
