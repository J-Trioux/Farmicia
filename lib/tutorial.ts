/**
 * 0.10 — Tutoriel : Rosalie guide pas à pas.
 *
 * Chaque chapitre s’ouvre quand sa mécanique arrive dans la partie. Une étape
 * demande une action (semer, ouvrir le panier…) ou une simple lecture
 * (« Compris »). La progression est vérifiée sur l’état du jeu depuis le début
 * de l’étape (repère) et sur l’interface ouverte (fenêtre, page du carnet).
 * Logique pure, sans DOM : l’interface affiche l’étape et marque la cible.
 */
import { EMBELLISHMENTS, UNLOCKS, bulkChores, level, type Game } from './game.ts';

/** Ce que l’interface montre en ce moment. */
export type TutorialUi = { modal: string; tab: string };

/** Compteurs pris au début de l’étape. */
export type TutorialMark = {
  planted: number;
  watered: number;
  harvests: number;
  sold: number;
  seeds: number;
  plots: number;
  orders: number;
  crafted: number;
  upgrades: number;
  projects: number;
  bulkAt?: number;
  tripAt?: number;
  lineages?: number;
  cookingAt?: number;
  hensAt?: number;
  /** 0.11 : somme des étapes d’embellissement. */
  embellish?: number;
};

export type TutorialStep = {
  id: string;
  text: string;
  /** Éléments à mettre en évidence, par ordre de préférence (le premier visible gagne). */
  target?: string[];
  /** Étape franchie par l’action du joueur. */
  done?: (g: Game, mark: TutorialMark, ui: TutorialUi) => boolean;
  /** Étape de lecture : un bouton « Compris ». */
  read?: boolean;
};

export type TutorialChapter = {
  id: string;
  title: string;
  /** Résumé relu dans le Guide du carnet. */
  guide: string;
  /** Le chapitre peut commencer. */
  ready: (g: Game) => boolean;
  steps: TutorialStep[];
};

export type TutorialState = {
  /** Chapitres terminés ou passés. */
  done: string[];
  /** Conseils coupés depuis le Guide ou la bulle. */
  off?: boolean;
  chapter?: string;
  step?: number;
  mark?: TutorialMark;
  replay?: boolean;
};

// 0.24 : lien de la page dans la reliure du carnet, ou son chapitre s’il est replié.
const tab = (label: string) =>
  `.carnet-link[aria-label^="${label}"], .carnet-chapter-head[aria-expanded="false"][data-carnet-pages~="${label}"]`;
const NOTEBOOK = '.dock-notebook';
const plantedCount = (g: Game) => g.plots.filter(Boolean).length;
const wateredCount = (g: Game) => g.plots.filter((plot) => plot?.watered).length;
const seedCount = (g: Game) => Object.values(g.seeds).reduce((sum, n) => sum + (n || 0), 0);
const embellishCount = (g: Game) => Object.values(g.embellishments || {}).reduce((sum, n) => sum + (n || 0), 0);

export function tutorialMark(g: Game): TutorialMark {
  return {
    planted: plantedCount(g),
    watered: wateredCount(g),
    harvests: g.harvests,
    sold: g.sold,
    seeds: seedCount(g),
    plots: g.plots.length,
    orders: g.orders,
    crafted: g.crafted,
    upgrades: g.upgrades.length,
    projects: g.projects.done.length + (g.projects.active ? 1 : 0),
    bulkAt: g.bulkJob?.nextAt ?? 0,
    tripAt: g.valley.trip?.returnAt ?? 0,
    lineages: g.lineages.length,
    cookingAt: Math.max(0, g.job?.end ?? 0, ...g.stoves.map((job) => job?.end ?? 0)),
    hensAt: g.hens ?? 0,
    embellish: embellishCount(g),
  };
}

export const TUTORIAL: TutorialChapter[] = [
  {
    id: 'premiers-pas',
    title: 'Premiers pas',
    guide: 'Semer, arroser, récolter, vendre, racheter des graines, puis agrandir le jardin. Rosalie va toujours à pied jusqu’à la parcelle.',
    ready: () => true,
    steps: [
      {
        id: 'semer',
        text: 'Bonjour, je suis Rosalie ! Cliquez sur une parcelle de terre : j’y vais à pied et j’y sème un radis.',
        target: ['.farm-plot.prepared', '.farm-beds'],
        done: (g, mark) => plantedCount(g) > mark.planted || g.harvests > mark.harvests,
      },
      {
        id: 'arroser',
        text: 'Cliquez encore sur la parcelle semée pour l’arroser. L’eau ne fait pas pousser plus vite, mais elle donne plus souvent de belles récoltes.',
        target: ['.farm-plot.planted:not(.watered):not(.ripe)', '.farm-beds'],
        done: (g, mark) => wateredCount(g) > mark.watered || g.harvests > mark.harvests,
      },
      {
        id: 'semer-plus',
        text: 'Un radis pousse en 30 secondes. En attendant, semez la seconde parcelle : vous pouvez aussi glisser d’une parcelle à l’autre d’un seul geste.',
        target: ['.farm-plot.prepared', '.farm-beds'],
        // 0.32.2 : le jardin n’a que deux parcelles au départ.
        done: (g, mark) => plantedCount(g) >= mark.planted + 1 || g.harvests > mark.harvests,
      },
      {
        id: 'recolter',
        text: 'Quand la plante est mûre, un panier apparaît sur la parcelle. Cliquez dessus : je vais la cueillir.',
        target: ['.farm-plot.ripe', '.farm-beds'],
        done: (g, mark) => g.harvests > mark.harvests,
      },
      {
        id: 'panier',
        text: 'Vos récoltes vont dans le panier. Ouvrez-le.',
        target: ['#basket-button'],
        done: (g, mark, ui) => ui.modal === 'basket' || g.sold > mark.sold,
      },
      {
        id: 'vendre',
        text: 'Vendez vos radis. Gardez-en quelques-uns si une commande du village en demande.',
        target: ['.basket-sell-all', '#basket-button'],
        done: (g, mark) => g.sold > mark.sold,
      },
      {
        id: 'graines',
        text: 'Avec ces pièces, rachetez des graines à la graineterie. Si le stock est vide au moment de semer, je peux aussi racheter la graine moi-même (réglage).',
        target: ['.seed-shop .buy-amounts button', '.buy-seeds', '.dock-shop'],
        done: (g, mark, ui) => seedCount(g) > mark.seeds || ui.modal === 'seeds',
      },
      {
        id: 'carnet',
        text: 'Le carnet rassemble tout le reste : commandes, améliorations, objectifs. Ouvrez-le.',
        target: [NOTEBOOK],
        done: (_g, _mark, ui) => ui.modal === 'notebook',
      },
      {
        id: 'agrandir',
        text: 'Dans « Améliorer », page « Bâtiments », « Un jardin plus grand » ajoute deux parcelles pour 25 pièces. Ce sera votre premier achat, dès que la bourse le permet.',
        target: ['[data-upgrade="expand"] .carnet-primary:not(:disabled)', '[data-carnet-item="expand"]', '[data-carnet-tab="buildings"]', tab('Améliorer'), NOTEBOOK],
        done: (g, mark) => g.plots.length > mark.plots,
        read: true,
      },
      {
        id: 'fin',
        text: 'Voilà l’essentiel ! Chaque nouveauté aura sa petite leçon, au moment où elle s’ouvre. Tout se relit dans le Guide du carnet.',
        read: true,
      },
    ],
  },
  {
    id: 'arrosoir',
    title: 'L’arrosoir de cuivre',
    guide: 'Avec l’arrosoir, le bouton « Arroser » envoie Rosalie arroser toutes les cultures en pousse, une parcelle après l’autre, à son rythme.',
    ready: (g) => g.upgrades.includes('watering-can') && g.plots.some((plot) => plot && !plot.watered),
    steps: [
      {
        id: 'arroser-tout',
        text: 'L’arrosoir est prêt ! « Arroser » m’envoie de parcelle en parcelle. J’y vais à pied : plus mon Allant grandit, plus je vais vite.',
        target: ['.bulk-actions button[aria-label="Arroser les parcelles"]', '.dock-bulk-toggle'],
        done: (g, mark) => wateredCount(g) > mark.watered || (bulkChores(g.bulkJob).includes('water') && !!g.bulkJob && g.bulkJob.nextAt !== (mark.bulkAt ?? g.bulkJob.nextAt)),
      },
    ],
  },
  {
    id: 'outils',
    title: 'Les outils de jardinier',
    guide: 'Avec les outils, « Récolter » envoie Rosalie cueillir toutes les plantes mûres. Chaque palier d’outil rend son geste plus vif, au clic comme en groupe.',
    ready: (g) => g.upgrades.includes('tools'),
    steps: [
      {
        id: 'recolter-tout',
        text: 'Mes outils sont rangés près du potager. Quand plusieurs plantes sont mûres, « Récolter » m’envoie toutes les cueillir, une par une.',
        target: ['.bulk-actions button[aria-label="Parcourir les récoltes"]', '.dock-bulk-toggle'],
        done: (g, mark) => g.harvests > mark.harvests || (bulkChores(g.bulkJob).includes('harvest') && !!g.bulkJob && g.bulkJob.nextAt !== (mark.bulkAt ?? g.bulkJob.nextAt)),
        read: true,
      },
      {
        id: 'rythme',
        text: 'Mon rythme dépend de deux choses : mon Allant pour marcher (il grandit avec les niveaux, les sentiers et l’habitude) et les paliers d’outils pour les gestes. Tout se voit dans « Améliorer ».',
        read: true,
      },
    ],
  },
  {
    id: 'village',
    title: 'Les commandes et les projets du village',
    guide: 'Les commandes paient mieux que le marché et font grandir l’amitié. Les projets du village ouvrent de nouveaux lieux, sans date limite.',
    ready: (g) => level(g) >= UNLOCKS.marketBasket,
    steps: [
      {
        id: 'commandes',
        text: 'Les voisins passent commande ! Une commande paie mieux que le marché. Ouvrez « Commandes » dans le carnet.',
        target: [tab('Commandes'), NOTEBOOK],
        done: (g, mark, ui) => (ui.modal === 'notebook' && ui.tab === 'orders') || g.orders > mark.orders,
      },
      {
        id: 'projets',
        text: 'Émile lance un projet : le marché du village. Choisissez-le dans « Projets » ; chaque étape avance à votre rythme.',
        target: [tab('Projets'), NOTEBOOK],
        done: (g, mark, ui) => (ui.modal === 'notebook' && ui.tab === 'projects') || tutorialMark(g).projects > mark.projects,
      },
    ],
  },
  {
    id: 'garde',
    title: 'Le semis de garde',
    guide: 'Avant une absence, le semis de garde pousse lentement et rend plusieurs récoltes d’un coup à votre retour.',
    ready: (g) => level(g) >= 5,
    steps: [
      {
        id: 'garde',
        text: 'Vous partez longtemps ? Choisissez un semis de garde près des graines : il pousse lentement et rend plusieurs récoltes d’un coup à votre retour.',
        target: ['.dock-garde-select'],
        read: true,
      },
    ],
  },
  {
    id: 'caravane',
    title: 'La caravane de la vallée',
    guide: 'La caravane emporte vos surplus vers les villages de la vallée. Plus la tournée est longue, plus elle rapporte.',
    ready: (g) => level(g) >= UNLOCKS.caravan,
    steps: [
      {
        id: 'vallee',
        text: 'La caravane attend devant le portail ! Chargez-y vos surplus pour les villages de la vallée : ouvrez « Vallée » dans le carnet.',
        target: [tab('Vallée'), '.valley-farm-caravan', NOTEBOOK],
        done: (g, mark, ui) => (ui.modal === 'notebook' && ui.tab === 'valley') || tutorialMark(g).tripAt !== (mark.tripAt ?? tutorialMark(g).tripAt),
      },
    ],
  },
  {
    id: 'lignees',
    title: 'Les graines prometteuses',
    guide: 'Une belle récolte peut révéler une graine prometteuse : choisissez son caractère et replantez la lignée.',
    ready: (g) => g.seedFinds.length > 0 || g.lineages.length > 0,
    steps: [
      {
        id: 'lignee',
        text: 'Une graine prometteuse ! Dans « Lignées », choisissez son caractère, puis replantez-la pour fonder votre propre variété.',
        target: [tab('Lignées'), NOTEBOOK],
        done: (g, mark, ui) => (ui.modal === 'notebook' && ui.tab === 'lineages') || g.lineages.length > (mark.lineages ?? g.lineages.length),
      },
    ],
  },
  {
    id: 'atelier',
    title: 'L’atelier de Rosalie',
    guide: 'L’atelier transforme les récoltes en plats plus précieux. Rosalie y va à pied pour lancer ou sortir une recette.',
    ready: (g) => g.upgrades.includes('workshop'),
    steps: [
      {
        id: 'atelier',
        text: 'L’atelier est installé ! Touchez-le sur la carte, ou ouvrez « Atelier » dans le carnet, pour entrer dans la cuisine.',
        target: [tab('Atelier'), NOTEBOOK],
        // 0.24 : la cuisine est la page Atelier du carnet.
        done: (g, mark, ui) => (ui.modal === 'notebook' && ui.tab === 'recipes') || g.crafted > mark.crafted,
      },
      {
        id: 'cuisiner',
        text: 'Touchez « Cuisiner » sur une recette prête : j’irai à l’atelier mettre le plat sur le feu. Je reviendrai le sortir quand il sera prêt.',
        target: ['.atelier-detail .atelier-cook:not(:disabled)', '.recipe-row[data-state="ready"]', '.atelier-cook', tab('Atelier'), NOTEBOOK],
        done: (g, mark) => g.crafted > mark.crafted || tutorialMark(g).cookingAt !== (mark.cookingAt ?? tutorialMark(g).cookingAt),
        read: true,
      },
    ],
  },
  {
    id: 'poulailler',
    title: 'Le petit poulailler',
    guide: 'Nourries de blé, les poules pondent des œufs, utiles aux recettes et aux commandes.',
    ready: (g) => g.upgrades.includes('coop'),
    steps: [
      {
        id: 'poules',
        text: 'Les poules sont arrivées ! Donnez-leur du blé depuis la cuisine : quelques minutes plus tard, j’irai ramasser les œufs.',
        target: ['.atelier-coop button', '[data-carnet-tab="coop"]', tab('Atelier'), NOTEBOOK],
        done: (g, mark) => (g.hens ?? 0) !== (mark.hensAt ?? g.hens ?? 0),
        read: true,
      },
    ],
  },
  {
    id: 'embellir',
    title: 'Embellir la ferme',
    guide: 'Six embellissements se construisent en trois étapes, dans la page Améliorer. Chacun se voit sur la carte et aide un peu un travail voisin ; plus tard, la fête du village accepte vos dons.',
    ready: (g) => level(g) >= Math.min(...EMBELLISHMENTS.map((entry) => entry.levels[0])),
    steps: [
      {
        id: 'volet',
        text: 'La ferme peut maintenant s’embellir ! Ouvrez le carnet à la section « Améliorer » : une page « Embellissements » s’y est ajoutée.',
        target: [tab('Améliorer'), NOTEBOOK],
        done: (g, mark, ui) => (ui.modal === 'notebook' && ui.tab === 'upgrades') || embellishCount(g) > (mark.embellish ?? embellishCount(g)),
      },
      {
        id: 'fontaine',
        text: 'Choisissez « Embellissements ». La fontaine de pierre est la première : une fois construite, chaque arrosage fait aussi gagner un peu de temps de pousse. Chaque embellissement a trois étapes.',
        target: ['[data-tutorial-embellish="fontaine"]', '[data-carnet-item="fontaine"]', '[data-carnet-tab="embellish"]', tab('Améliorer'), NOTEBOOK],
        done: (g, mark) => embellishCount(g) > (mark.embellish ?? embellishCount(g)),
        read: true,
      },
    ],
  },
];

export const tutorialChapter = (id: string | undefined) =>
  TUTORIAL.find((chapter) => chapter.id === id);

export function freshTutorial(): TutorialState {
  return { done: [] };
}

/** Anciennes parties : ce qui est déjà ouvert est considéré comme appris. */
export function settledTutorial(g: Game): TutorialState {
  return { done: TUTORIAL.filter((chapter) => chapter.ready(g)).map((chapter) => chapter.id) };
}

export function normalizeTutorial(raw: unknown): TutorialState | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const value = raw as Partial<TutorialState>;
  const done = Array.isArray(value.done)
    ? [...new Set(value.done.filter((id) => typeof id === 'string' && tutorialChapter(id)))]
    : [];
  const chapter = tutorialChapter(value.chapter);
  const step = Number.isInteger(value.step) && chapter && (value.step as number) >= 0 && (value.step as number) < chapter.steps.length
    ? value.step : undefined;
  const mark = value.mark && typeof value.mark === 'object'
    && Object.values(value.mark).every((n) => Number.isFinite(n)) ? value.mark as TutorialMark : undefined;
  return {
    done,
    ...(value.replay === true ? { replay: true } : {}),
    ...(value.off === true ? { off: true } : {}),
    ...(chapter && step !== undefined && !done.includes(chapter.id) ? { chapter: chapter.id, step, ...(mark ? { mark } : {}) } : {}),
  };
}

/** Étape à montrer, ou null. */
export function tutorialCurrent(g: Game) {
  const state = g.tutorial;
  if (!state || state.off) return null;
  const chapter = tutorialChapter(state.chapter);
  if (!chapter || state.step === undefined) return null;
  const step = chapter.steps[state.step];
  const blocked = state.replay && (
    (chapter.id === 'arrosoir' && g.plots.every((plot) => !plot || plot.watered)) ||
    (chapter.id === 'caravane' && !!g.valley.trip) ||
    (chapter.id === 'lignees' && !g.seedFinds.length) ||
    (chapter.id === 'premiers-pas' && ['semer', 'semer-plus'].includes(step?.id) && g.plots.every(Boolean))
  );
  return step ? { chapter, step: blocked ? { ...step, read: true } : step, index: state.step, count: chapter.steps.length } : null;
}

/**
 * Fait avancer le tutoriel : ouvre le prochain chapitre prêt, franchit les
 * étapes accomplies. Renvoie la même partie si rien ne change.
 */
export function tutorialAdvance(g: Game, ui: TutorialUi): Game {
  const state = g.tutorial;
  if (!state || state.off) return g;
  let next: TutorialState = state;
  for (let guard = 0; guard < 20; guard++) {
    const chapter = tutorialChapter(next.chapter);
    if (!chapter || next.step === undefined) {
      const ready = TUTORIAL.find((entry) => !next.done.includes(entry.id) && entry.ready(g));
      if (!ready) break;
      next = { ...next, chapter: ready.id, step: 0, mark: tutorialMark(g) };
      continue;
    }
    const step = chapter.steps[next.step];
    if (!step?.done || !step.done(g, next.mark || tutorialMark(g), ui)) break;
    next = stepForward(next, chapter, g);
  }
  return next === state ? g : { ...g, tutorial: next };
}

function stepForward(state: TutorialState, chapter: TutorialChapter, g: Game): TutorialState {
  const step = (state.step ?? 0) + 1;
  if (step >= chapter.steps.length) {
    const { chapter: _chapter, step: _step, mark: _mark, replay: _replay, ...rest } = state;
    return { ...rest, done: [...state.done, chapter.id] };
  }
  return { ...state, step, mark: tutorialMark(g) };
}

/** « Compris » : étape suivante. */
export function tutorialRead(g: Game): Game {
  const state = g.tutorial;
  const chapter = tutorialChapter(state?.chapter);
  if (!state || !chapter || state.step === undefined) return g;
  return { ...g, tutorial: stepForward(state, chapter, g) };
}

/** « Plus tard » : le chapitre en cours est rangé (relisible dans le Guide). */
export function tutorialSkipChapter(g: Game): Game {
  const state = g.tutorial;
  const chapter = tutorialChapter(state?.chapter);
  if (!state || !chapter) return g;
  const { chapter: _chapter, step: _step, mark: _mark, replay: _replay, ...rest } = state;
  return { ...g, tutorial: { ...rest, done: [...state.done, chapter.id] } };
}

/** Coupe ou rallume les conseils de Rosalie. */
export function tutorialSetOff(g: Game, off: boolean): Game {
  const state = g.tutorial || freshTutorial();
  const { off: _off, ...rest } = state;
  return { ...g, tutorial: off ? { ...rest, off: true } : rest };
}

/** Revoir un chapitre depuis le Guide. */
export function tutorialReplay(g: Game, id: string): Game {
  const chapter = tutorialChapter(id);
  if (!chapter) return g;
  const state = g.tutorial || freshTutorial();
  const { off: _off, ...rest } = state;
  return {
    ...g,
    tutorial: { ...rest, replay: true, done: state.done.filter((entry) => entry !== id), chapter: id, step: 0, mark: tutorialMark(g) },
  };
}
