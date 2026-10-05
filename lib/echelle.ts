/**
 * 0.19 — L’échelle des objets posés sur la carte.
 *
 * Demande de l’auteur : « les sprites des améliorations parfaitement à
 * l’échelle de la carte et de ses environnements, avec un placement plus
 * réaliste ». Mesures prises sur la carte HD (grille de 1 200 × 800) :
 *
 * - Rosalie mesure 38 px de haut (1,65 m) : 23 px par mètre pour les
 *   personnages, les meubles et les petits objets (chaises de la terrasse :
 *   20 px ; réverbère de la place : 72 px).
 * - Les bâtiments peints sont ramassés, comme dans tous les jeux vus de
 *   trois quarts : une porte du mas ou de l’atelier fait 25 à 30 px. Les
 *   constructions qui ont une porte (pigeonnier, moulin) suivent cette échelle.
 *
 * Chaque objet a une hauteur visible cible (px de grille, pieds compris) ; sa
 * largeur suit les proportions du dessin. Les sprites sont en haute
 * définition : l’agrandissement reste net, sans perte.
 */
import { OBJECT_SIZE } from './domain-art.ts';

/** Hauteur visible de Rosalie (px de grille) : la mesure de référence. */
export const ROSALIE_HEIGHT = 38;
/** Personnages, meubles et petits objets : pixels de grille par mètre. */
export const PX_PER_METRE = 23;
/** Porte d’un bâtiment peint (mas, atelier) : la mesure des constructions. */
export const DOOR_HEIGHT = 27;

/**
 * Objets dessinés par Astra (objets-1.0) : hauteur visible cible, en px de
 * grille, et la raison de cette taille.
 */
export const OBJECT_HEIGHT: Record<string, number> = {
  // Chariot bâché : 2,4 m jusqu’au haut de la bâche.
  'caravane-repos': 56,
  'caravane-retour': 56,
  // Abri de relais, comme le puits couvert du mas (45 px) avec son banc.
  'relais-vallee': 50,
  // Halle : un peu plus haute que les étals de la place (45 px).
  'halle-varietes': 62,
  // Tables de semis : 1,5 m avec les plants.
  pepiniere: 36,
  // Bacs à compost : 1 m, 1,2 m avec la fourche.
  compost: 28,
  // Rigoles de pierre : basses, 20 px avec leurs herbes.
  rigoles: 20,
  // Haie taillée : 75 cm.
  haie: 17,
  // Établi : 90 cm de plateau, 1,4 m avec la caisse à outils.
  etabli: 33,
  // Semoir : roues de 1,1 m.
  semoir: 34,
  // Colonne d’arrosage : 1,3 m.
  'colonne-arrosage': 30,
};

/** Taille affichée d’un objet (px de grille), proportions du dessin gardées. */
export function objectSize(name: string): [number, number] {
  const [w, h] = OBJECT_SIZE[name] ?? [20, 20];
  const target = OBJECT_HEIGHT[name] ?? h;
  return [(w * target) / h, target];
}
