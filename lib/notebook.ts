/**
 * Carnet progressif (0.9.1) : une page n’apparaît que lorsque son système
 * s’ouvre vraiment dans la partie. Logique pure, sans DOM.
 */
import {
  LINKS,
  PROJECTS,
  RECIPES,
  SEED_FIND_LEVEL,
  SKILL_PATHS,
  UNLOCKS,
  level,
  skillRank,
  valleyUnlocked,
  type Game,
} from './game.ts';

export type NotebookPageId =
  | 'projects'
  | 'orders'
  | 'festival'
  | 'valley'
  | 'friends'
  | 'upgrades'
  | 'mastery'
  | 'lineages'
  | 'skills'
  | 'recipes'
  | 'goals'
  | 'collection'
  | 'guide';

export type NotebookPage = {
  value: NotebookPageId;
  label: string;
  icon: string;
  tagline: string;
  chapter: string;
  /** Niveau où la page s’ouvre au plus tard (repli si l’état ne l’a pas ouverte avant). */
  level: number;
  /** Annonce affichée quand la page apparaît. */
  announce: string;
  /** Phrase courte quand on cherche la page avant son ouverture (lieu de la carte). */
  teaser: string;
};

const minLevel = (items: readonly { level: number }[]) =>
  Math.min(...items.map((item) => item.level));

/** Les quatre chapitres du carnet et leurs pages, dans l’ordre du dos. */
export const NOTEBOOK_CHAPTERS: {
  id: string;
  label: string;
  pages: Omit<NotebookPage, 'chapter'>[];
}[] = [
  {
    id: 'village',
    label: 'Le village',
    pages: [
      {
        value: 'projects',
        label: 'Projets',
        icon: 'quality',
        tagline: 'Le grand chantier du village, à votre rythme.',
        level: minLevel(PROJECTS),
        announce: 'Le village lance son premier projet',
        teaser: 'Les projets du village commencent au niveau ' + minLevel(PROJECTS) + '.',
      },
      {
        value: 'orders',
        label: 'Commandes',
        icon: 'basket',
        tagline: 'Ce que le village vous demande aujourd’hui.',
        level: 1,
        announce: 'Le village passe ses premières commandes',
        teaser: '',
      },
      {
        value: 'festival',
        label: 'Foires',
        icon: 'tarte',
        tagline: 'Présentez vos récoltes, puis vos meilleurs plats au jury.',
        level: SEED_FIND_LEVEL,
        announce: 'La première foire s’installe sur la place',
        teaser: `La place s’animera au niveau ${SEED_FIND_LEVEL}, pour la première foire.`,
      },
      {
        value: 'valley',
        label: 'Vallée',
        icon: 'valley',
        tagline: 'Composez la caravane et retrouvez ses échanges régionaux.',
        level: UNLOCKS.caravan,
        announce: 'La caravane arrive au village',
        teaser: `La caravane arrive au niveau ${UNLOCKS.caravan}.`,
      },
      {
        value: 'friends',
        label: 'Villageois',
        icon: 'infusion',
        tagline: 'Amitiés, cadeaux et quêtes des habitants.',
        level: minLevel(LINKS),
        announce: 'Les villageois viennent se présenter',
        teaser: `Les villageois se présentent au niveau ${minLevel(LINKS)}.`,
      },
    ],
  },
  {
    id: 'farm',
    label: 'La ferme',
    pages: [
      {
        value: 'upgrades',
        label: 'Améliorer',
        icon: 'tools',
        tagline: 'Aménagez la ferme et gagnez du temps.',
        level: 1,
        announce: 'Les premiers aménagements de la ferme',
        teaser: '',
      },
      {
        value: 'mastery',
        label: 'Maîtrise',
        icon: 'seeds',
        tagline: 'Chaque culture a ses secrets.',
        level: 1,
        announce: 'Chaque culture a ses secrets',
        teaser: '',
      },
      {
        value: 'lineages',
        label: 'Lignées',
        icon: 'lineage',
        tagline: 'Créez les variétés propres à votre ferme.',
        level: UNLOCKS.signatures,
        announce: 'Une graine prometteuse attend d’être sélectionnée',
        teaser: 'Récoltez encore : une graine prometteuse finira par apparaître.',
      },
      {
        value: 'skills',
        label: 'Savoir-faire',
        icon: 'savoirfaire',
        tagline: 'Culture, cuisine et commerce : les gestes de Rosalie.',
        level: SEED_FIND_LEVEL,
        announce: 'Rosalie peut choisir son premier savoir-faire',
        teaser: 'Découvrez trois cultures différentes pour choisir un savoir-faire.',
      },
    ],
  },
  {
    id: 'kitchen',
    label: 'La cuisine',
    pages: [
      {
        value: 'recipes',
        label: 'Atelier',
        icon: 'pain',
        tagline: 'Recettes, poulailler et talents de cuisinière.',
        level: minLevel(RECIPES),
        announce: 'L’atelier ouvre ses fourneaux',
        teaser: `L’atelier ouvre au niveau ${minLevel(RECIPES)}.`,
      },
    ],
  },
  {
    id: 'memories',
    label: 'Souvenirs',
    pages: [
      {
        value: 'goals',
        label: 'Objectifs',
        icon: 'coin',
        tagline: 'Petits défis et récompenses à réclamer.',
        level: 1,
        announce: 'Petits défis et récompenses',
        teaser: '',
      },
      {
        value: 'collection',
        label: 'Collection',
        icon: 'album',
        tagline: 'Vos plus belles récoltes et vos meilleurs plats.',
        level: 1,
        announce: 'Vos plus belles récoltes',
        teaser: '',
      },
      {
        value: 'guide',
        label: 'Guide',
        icon: 'guidebook',
        tagline: 'Les leçons de Rosalie, à revoir quand vous voulez.',
        level: 1,
        announce: 'Le guide de Rosalie',
        teaser: '',
      },
    ],
  },
];

export const NOTEBOOK_PAGES: NotebookPage[] = NOTEBOOK_CHAPTERS.flatMap(
  (chapter) => chapter.pages.map((page) => ({ ...page, chapter: chapter.label })),
);

export const notebookPage = (id: string) =>
  NOTEBOOK_PAGES.find((page) => page.value === id);

/**
 * La page est-elle ouverte ? D’abord l’état réel de la partie (un système déjà
 * utilisé reste visible), puis le niveau de repli.
 */
export function pageOpen(g: Game, id: NotebookPageId): boolean {
  const page = notebookPage(id);
  if (!page) return false;
  if (level(g) >= page.level) return true;
  switch (id) {
    case 'projects':
      return (
        !!g.projects.active ||
        g.projects.done.length > 0 ||
        Object.keys(g.projects.progress).length > 0
      );
    case 'friends':
      // 0.9.2 : deux cœurs, pour que la page n’arrive pas dès la première commande.
      return Object.values(g.relations).some((hearts) => hearts >= 2);
    case 'skills':
      return (
        Object.keys(g.skillChoices).length > 0 ||
        SKILL_PATHS.some((path) => skillRank(g, path.id) >= 2)
      );
    case 'festival':
      return g.festivalAwards.length > 0 || g.season.fairs.length > 0;
    case 'valley':
      return valleyUnlocked(g) || !!g.valley.trip;
    case 'recipes':
      return g.upgrades.includes('workshop') || g.crafted > 0;
    case 'lineages':
      return g.lineages.length > 0 || g.seedFinds.length > 0;
    default:
      return false;
  }
}

/** Pages visibles, dans l’ordre du dos du carnet. */
export function revealedPages(g: Game): NotebookPage[] {
  return NOTEBOOK_PAGES.filter((page) => pageOpen(g, page.value));
}

/** Pages visibles pas encore consultées (marquées « nouvelle »). */
export function newPages(g: Game): NotebookPage[] {
  if (!g.seenPages) return [];
  return revealedPages(g).filter((page) => !g.seenPages!.includes(page.value));
}

/**
 * À appeler au chargement : une sauvegarde qui ne connaît pas encore le carnet
 * progressif considère toutes ses pages ouvertes comme déjà lues, pour ne pas
 * couvrir le carnet de pastilles « nouvelle ».
 */
export function settleNotebook(g: Game): Game {
  if (g.seenPages) return g;
  return { ...g, seenPages: revealedPages(g).map((page) => page.value) };
}

export function markPageSeen(g: Game, id: string): Game {
  const seen = g.seenPages || revealedPages(g).map((page) => page.value);
  if (seen.includes(id) || !notebookPage(id)) return g;
  return { ...g, seenPages: [...seen, id] };
}

/** Touches des pages : 1 à 9, puis A, Z et E (clavier AZERTY, rangée du haut). */
export const PAGE_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'z', 'e', 'r'];

/** Indication du pied de page, exacte pour le nombre de pages visibles. */
export function pageKeysHint(count: number): string[] {
  const keys = PAGE_KEYS.slice(0, count).map((key) => key.toUpperCase());
  if (keys.length <= 1) return keys;
  const digits = keys.filter((key) => /\d/.test(key));
  const letters = keys.filter((key) => !/\d/.test(key));
  return [
    digits.length > 1 ? `${digits[0]}–${digits.at(-1)}` : digits[0],
    ...letters,
  ];
}
