import { ZONE_LEVELS } from './farm-controls.ts';
import { BUILD_FOCUS, FOCUS } from './world.ts';
import {
  CROPS,
  EXTENSION_LEVELS,
  PLOT_STEPS,
  MAX_LEVEL,
  UPGRADES,
  UPGRADE_REQUIRES,
  freeStove,
  readyDishes,
  stoveJobs,
  crop,
  duration,
  level,
  levelContent,
  maxPlots,
  growTimeBreakdown,
  GOALS,
  goalProgress,
  orderBoard,
  orderAvailable,
  EMBELLISHMENTS,
  embellishmentStage,
  QUESTS,
  fulfillment,
  planMenu,
  projectAvailable,
  projectStatus,
  PROJECTS,
  RECIPES,
  VILLAGERS,
  dishCourse,
  eatableDish,
  isFestivalDish,
  recipe,
  recipeLock,
  type ProjectStep,
  type VillageProject,
  OUTCOMES,
  QUALITIES,
  dishParts,
  itemLineageId,
  itemQualityRank,
  lineageById,
  price,
  stepTarget,
  upgradeCost,
  nextUpgradeLevel,
  seasonFor,
  TERROIRS,
  terroirForPlot,
  type Game,
} from './game.ts';

/** 0.9.1 : nombre de sachets affichés dans le dock (touches 1 à 5). */
export const DOCK_FAVORITES = 5;
const unlockedCropIds = (g: Game) =>
  CROPS.filter((c) => c.level <= level(g)).map((c) => c.id);
/**
 * Graines du dock : celles que le joueur a épinglées, sinon les cinq cultures
 * les plus cultivées (à égalité, les plus récentes), rangées par niveau.
 */
export function dockFavorites(g: Game): string[] {
  const unlocked = unlockedCropIds(g);
  const pinned = (g.favoriteSeeds || []).filter((id) => unlocked.includes(id));
  if (pinned.length) return pinned.slice(0, DOCK_FAVORITES);
  const levelOf = (id: string) => crop(id).level;
  return [...unlocked]
    .sort(
      (a, b) =>
        (g.collection[b] || 0) - (g.collection[a] || 0) || levelOf(b) - levelOf(a),
    )
    .slice(0, DOCK_FAVORITES)
    .sort((a, b) => levelOf(a) - levelOf(b) || unlocked.indexOf(a) - unlocked.indexOf(b));
}
/** Épingle ou retire une graine du dock ; il en reste toujours au moins une. */
export function toggleFavorite(g: Game, id: string): Game {
  const current = dockFavorites(g);
  if (!unlockedCropIds(g).includes(id)) return g;
  if (current.includes(id)) {
    if (current.length <= 1) return g;
    return { ...g, favoriteSeeds: current.filter((entry) => entry !== id) };
  }
  if (current.length >= DOCK_FAVORITES) return g;
  return { ...g, favoriteSeeds: [...current, id] };
}

export function canRescue(g: Game) {
  return (
    g.coins < 2 &&
    !Object.values(g.seeds).some((n) => n > 0) &&
    !g.plots.some(Boolean) &&
    !Object.values(g.stock).some((n) => n > 0) &&
    !stoveJobs(g).some(Boolean) &&
    !g.hens
  );
}
export function upgradePresentation(g: Game, id: string) {
  const cost = upgradeCost(g, id);
  const current = level(g);
  const tier = ['watering-can', 'tools', 'auto'].includes(id)
    ? Math.min(5, Math.max(0, g.upgradeTiers?.[id] ?? (g.upgrades.includes(id) ? 1 : 0)))
    : 0;
  const installed = id === 'expand' ? g.plots.length >= PLOT_STEPS[PLOT_STEPS.length - 1]
    : tier ? tier >= 5 : g.upgrades.includes(id);
  const required = id === 'expand' && g.plots.length >= maxPlots(g) && !installed
    ? EXTENSION_LEVELS[Math.max(0, PLOT_STEPS.findIndex((n) => g.plots.length < n) - 1)]
    : nextUpgradeLevel(g, id);
  // 0.9.9 : les fourneaux et la marmite demandent l’atelier (et le 2e fourneau avant le 3e).
  const needs = UPGRADE_REQUIRES[id] && !g.upgrades.includes(UPGRADE_REQUIRES[id])
    ? UPGRADES.find((u) => u.id === UPGRADE_REQUIRES[id])?.name : undefined;
  const state = installed ? 'installed'
    : needs ? 'requires'
    : current < required ? 'future'
    : g.coins < cost ? 'saving' : 'available';
  return { state, cost, required, tier, maxTier: tier ? 5 : 1, needs,
    missing: Math.max(0, cost - g.coins) } as const;
}
export function farmGuidance(g: Game, now: number) {
  const ready = g.plots.filter((plot) => plot && plot.end <= now).length;
  const stock = Object.values(g.stock).reduce((sum, amount) => sum + amount, 0);
  const seeds = CROPS.some(
    (item) => item.level <= level(g) && (g.seeds[item.id] || 0) > 0,
  );
  if (ready)
    return {
      kind: 'harvest',
      text: `${ready} récolte${ready > 1 ? 's sont prêtes' : ' est prête'} dans le potager.`,
      label: 'Voir le potager',
      panel: 'farm',
    };
  if (g.seedFinds.length)
    return { kind: 'lineage', text: `${g.seedFinds.length} graine${g.seedFinds.length > 1 ? 's' : ''} prometteuse${g.seedFinds.length > 1 ? 's' : ''} à sélectionner.`, label: 'Voir les lignées', panel: 'lineages' };
  if (!seeds)
    return stock
      ? {
          kind: 'seeds',
          text: `Plus de graines. Votre panier contient ${stock} produits : vendez-en pour acheter des graines.`,
          label: 'Ouvrir le panier',
          panel: 'basket',
        }
      : {
          kind: 'seeds',
          text: canRescue(g)
            ? 'Vous n’avez plus de graines : Rosalie peut vous dépanner.'
            : 'Vous n’avez plus de graines : passez à la graineterie pendant que la ferme travaille.',
          label: 'Voir la graineterie',
          panel: 'seeds',
        };
  if (g.orchard !== null && g.orchard <= now)
    return {
      kind: 'orchard',
      text: 'Le verger restauré a donné ses fruits : la cueillette vous attend.',
      label: 'Voir le verger',
      panel: 'projects',
    };
  if (readyDishes(g, now) > 0)
    return {
      kind: 'workshop',
      text: 'Une préparation est prête à l’atelier.',
      label: 'Ouvrir l’atelier',
      panel: 'recipes',
    };
  const status = projectStatus(g);
  if (
    status?.step.kind === 'deliver' &&
    planMenu(g.stock, status.step.lines).possible
  )
    return {
      kind: 'project',
      text: `${status.project.title} peut avancer : ${status.step.text.toLowerCase()}.`,
      label: 'Voir le projet',
      panel: 'projects',
    };
  const request = orderBoard(g).find((offer) => orderAvailable(g, offer.slot, now) && planMenu(g.stock, offer.lines).possible);
  if (request)
    return {
      kind: 'order',
      text: `${request.title} de ${request.person.split(',')[0]} : tout est prêt à livrer.`,
      label: 'Voir la commande',
      panel: 'orders',
    };
  if (!status && PROJECTS.some((project) => projectAvailable(g, project)))
    return {
      kind: 'project',
      text: 'Le village vous propose un grand projet : choisissez celui qui vous plaît.',
      label: 'Voir les projets',
      panel: 'projects',
    };
  const available = UPGRADES.find(
    (item) => upgradePresentation(g, item.id).state === 'available',
  );
  if (available)
    return {
      kind: 'upgrade',
      text: `Vous pouvez maintenant aménager : ${available.name}.`,
      label: 'Voir l’amélioration',
      panel: 'upgrades',
    };
  if (status)
    return {
      kind: 'project',
      text: `${status.project.title} · ${status.step.text}${status.target > 1 ? ` (${status.count}/${status.target})` : ''}. ${projectHint(g, status.step)}`,
      label: 'Voir le projet',
      panel: 'projects',
    };
  if (stock && g.coins < 10)
    return {
      kind: 'stock',
      text: `Votre panier contient ${stock} produit${stock > 1 ? 's' : ''} : vendez-en pour préparer les prochains semis.`,
      label: 'Ouvrir le panier',
      panel: 'basket',
    };
  const next = level(g) < MAX_LEVEL ? levelContent(level(g) + 1) : null;
  return {
    kind: 'level',
    // 0.17.2 : pas de spoil, la graine du prochain niveau garde son nom secret.
    text: next
      ? `Prochain niveau : ${next.crop ? 'une nouvelle graine' : next.system}.`
      : 'Votre ferme est accomplie. Le carnet garde toutes vos découvertes.',
    label: 'Ouvrir le carnet',
    panel: 'collection',
  };
}
export function farmContext(
  g: Game,
  target: string | null,
  selected: string,
  now: number,
) {
  if (target?.startsWith('plot:')) {
    const index = Number(target.slice(5));
    const plot = g.plots[index];
    // 0.9.5 : toutes les parcelles ont la même terre ; le terroir se lit ici.
    const terroir = TERROIRS.find((entry) => entry.id === terroirForPlot(index));
    const prefix = `Parcelle ${index + 1}${terroir ? ` (${terroir.short.toLowerCase()})` : ''} · `;
    if (!plot)
      return (
        prefix +
        `Terre préparée · ${(g.seeds[selected] || 0) > 0 ? `Cliquez pour semer : ${crop(selected).name}` : `Plus de graines de ${crop(selected).name.toLowerCase()} · ouvrez la graineterie`}`
      );
    return (
      prefix +
      `${crop(plot.crop).name} · ${plot.end <= now ? 'Récolte prête' : `${plot.watered ? 'Arrosée · ' : ''}Prête dans ${duration((plot.end - now) / 1000)}`}`
    );
  }
  switch (target) {
    case 'house':
      return 'Maison de Rosalie · Un refuge paisible, sans coucher obligatoire';
    case 'village':
      return 'Chemin du village · Commandes, marché et rencontres';
    case 'festival':
      return g.upgrades.includes('workshop')
        ? `Fête des Saveurs · ${g.festival?.entries ? `${g.festival.entries} présentation${g.festival.entries > 1 ? 's' : ''} · meilleur score ${g.festival.bestScore}` : 'Présentez un plat au jury du village'}`
        : 'Fête des Saveurs · L’atelier gourmand est nécessaire pour participer';
    case 'workshop':
      return g.upgrades.includes('workshop')
        ? `Atelier · ${readyDishes(g, now) ? 'Plat prêt' : freeStove(g) >= 0 ? 'Fourneau disponible' : 'Préparation en cours'}`
        : `Atelier · Disponible au niveau ${UPGRADES.find((u) => u.id === 'workshop')!.level} dans les améliorations`;
    case 'coop':
      return g.upgrades.includes('coop')
        ? `Poulailler · ${g.hens ? (g.hens <= now ? 'Œufs prêts' : 'Les poules préparent leurs œufs') : '3 blés donnent 4 œufs'}`
        : `Poulailler · Disponible au niveau ${UPGRADES.find((u) => u.id === 'coop')!.level} dans les améliorations`;
    case 'orchard':
      if (g.orchard !== null)
        return g.orchard <= now
          ? 'Verger restauré · Les fruits sont mûrs, cliquez pour cueillir'
          : `Verger restauré · Prochaine cueillette dans ${duration((g.orchard - now) / 1000)}`;
      return level(g) < ZONE_LEVELS.orchardCleaned
        ? `Verger abandonné · Nettoyage au niveau ${ZONE_LEVELS.orchardCleaned} · Décor évolutif`
        : level(g) < ZONE_LEVELS.orchardRestored
          ? `Verger nettoyé · Restauration au niveau ${ZONE_LEVELS.orchardRestored} · Décor évolutif`
          : level(g) < ZONE_LEVELS.orchardFruit
            ? `Verger restauré · Arbres en fruits au niveau ${ZONE_LEVELS.orchardFruit} · Décor évolutif`
            : 'Verger en fruits · La fête du verger peut le rendre productif';
    case 'greenhouse':
      return `Serre ornementale · ${level(g) >= ZONE_LEVELS.greenhouseBuilt ? 'Achevée · Sans production' : level(g) >= ZONE_LEVELS.greenhouseFoundation ? `Fondations · Achevée au niveau ${ZONE_LEVELS.greenhouseBuilt}` : `Fondations au niveau ${ZONE_LEVELS.greenhouseFoundation} · Sans production`}`;
  }
  const ready = g.plots.filter((plot) => plot && plot.end <= now).length;
  return `${g.plots.length} parcelles · ${ready ? `${ready} récolte${ready > 1 ? 's prêtes' : ' prête'}` : 'Aucune récolte ne se perd pendant votre absence.'}`;
}

/** Conseil court orienté vers l’étape de projet en cours. */
/** Avancement réel de l’étape courante d’un projet, même s’il n’est pas actif. */
export function projectReadiness(g: Game, project: VillageProject) {
  const progress = g.projects.progress[project.id] || { step: 0, count: 0 };
  const index = Math.min(progress.step, project.steps.length - 1);
  const step = project.steps[index];
  const target = stepTarget(step);
  let count = Math.min(
    target,
    Math.max(progress.count, g.projects.evidence?.[project.id]?.[index] || 0),
  );
  let ratio = count / target;
  if (step.kind === 'fund') {
    count = Math.min(step.amount, g.coins);
    ratio = count / step.amount;
  }
  if (step.kind === 'deliver') {
    const plan = planMenu(g.stock, step.lines);
    count = plan.status.filter(Boolean).length;
    ratio = plan.possible ? 1 : count / step.lines.length;
  }
  // Une étape qui attend une culture ou l’atelier pas encore obtenus ne peut pas avancer.
  const blocked =
    (step.kind === 'harvest' && step.crop !== '*' && level(g) < crop(step.crop).level) ||
    (step.kind === 'harvest' && !!step.lineageOnly && !g.lineages.length && !g.seedFinds.length) ||
    (step.kind === 'cook' && !g.upgrades.includes('workshop'));
  // Départ possible avec ce que la ferme a déjà (graines, stock, lignées, atelier).
  const fit =
    step.kind === 'harvest'
      ? step.lineageOnly
        ? Math.min(1, g.lineages.length)
        : step.crop === '*' || (g.seeds[step.crop] || 0) + (g.stock[step.crop] || 0) > 0
          ? 1
          : 0.5
      : step.kind === 'cook'
        ? g.upgrades.includes('workshop') ? 1 : 0
        : step.kind === 'sell'
          ? Object.values(g.stock).some((n) => n > 0) ? 1 : 0.5
          : step.kind === 'fund'
            ? g.coins >= step.amount ? 1 : 0.5
            : 0.5;
  return {
    step,
    index,
    count,
    fit: blocked ? 0 : fit,
    target: step.kind === 'deliver' ? step.lines.length : step.kind === 'fund' ? step.amount : target,
    ratio: blocked ? 0 : ratio,
    blocked,
    /** Avancement du projet entier, de 0 à 1. */
    overall: (index + (blocked ? 0 : ratio)) / project.steps.length,
  };
}

/** Phrase de conseil fondée sur l’état de la partie. */
function readinessReason(g: Game, project: VillageProject) {
  const r = projectReadiness(g, project);
  if (r.step.kind === 'deliver' && r.ratio === 1)
    return `Tout est déjà dans le panier : ${lowerFirst(r.step.text)}.`;
  if (r.step.kind === 'fund')
    return r.ratio === 1
      ? `Votre bourse suffit pour la dernière étape : ${lowerFirst(r.step.text)}.`
      : `Dernière étape : il manque ${r.target - r.count} pièces pour participer aux frais.`;
  if (r.index > 0 && r.ratio === 0)
    return `Étape ${r.index + 1} sur ${project.steps.length} déjà atteinte. ${projectHint(g, r.step)}`;
  if (r.ratio > 0)
    return r.step.kind === 'deliver'
      ? `${r.count} ligne${r.count > 1 ? 's' : ''} sur ${r.target} déjà prête${r.count > 1 ? 's' : ''} : ${lowerFirst(r.step.text)}.`
      : `Déjà ${r.count} sur ${r.target}${r.step.kind === 'sell' ? ' pièces' : ''} : ${lowerFirst(r.step.text)}.`;
  return projectHint(g, r.step);
}
const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);

/**
 * 0.9.1 : trois projets à la fois. Celui en cours (ou repris), celui que
 * l’état de la ferme fait le plus avancer, et un projet d’un autre style.
 */
export function projectPicks(g: Game) {
  const available = PROJECTS.filter(
    (p) => p.id !== g.projects.active && projectAvailable(g, p),
  );
  const current =
    PROJECTS.find((p) => p.id === g.projects.active) ||
    // Aucun projet actif : le plus avancé des projets mis en pause reste « en cours ».
    available
      .filter((p) => g.projects.progress[p.id])
      .sort((a, b) => projectReadiness(g, b).overall - projectReadiness(g, a).overall)[0] ||
    null;
  const rest = available.filter((p) => p.id !== current?.id);
  const ranked = [...rest].sort(
    (a, b) =>
      projectReadiness(g, b).overall - projectReadiness(g, a).overall ||
      projectReadiness(g, b).fit - projectReadiness(g, a).fit ||
      a.level - b.level,
  );
  const advised = ranked.find((p) => !projectReadiness(g, p).blocked) || ranked[0];
  const taken = [current, advised].filter(Boolean) as VillageProject[];
  const explorePool = rest.filter((p) => p.id !== advised?.id);
  // Un autre hôte et un autre style d’étapes, de préférence le plus récent.
  const novelty = (p: VillageProject) =>
    (taken.some((t) => t.host === p.host) ? 0 : 2) +
    (taken.some((t) => t.steps[0].kind === p.steps[0].kind) ? 0 : 1) +
    (g.projects.progress[p.id] ? 0 : 1) +
    (projectReadiness(g, p).blocked ? -3 : 0);
  const explore = [...explorePool].sort(
    (a, b) => novelty(b) - novelty(a) || b.level - a.level,
  )[0];
  // Rien en cours : la troisième place revient au deuxième projet le plus avancé.
  const nearby = current
    ? undefined
    : ranked.find((p) => p !== advised && p !== explore && !projectReadiness(g, p).blocked);
  const shown = [current, advised, explore, nearby].filter(Boolean) as VillageProject[];
  return {
    current,
    advised: advised && { project: advised, reason: readinessReason(g, advised) },
    nearby: nearby && { project: nearby, reason: readinessReason(g, nearby) },
    explore: explore && {
      project: explore,
      reason: `Un autre chantier, avec ${VILLAGERS.find((v) => v.id === explore.host)?.name || 'le village'} : ${lowerFirst(explore.style)}.`,
    },
    /** Projets disponibles qui ne sont pas parmi les trois montrés. */
    others: available.filter((p) => !shown.includes(p)),
    locked: PROJECTS.filter(
      (p) => p.id !== g.projects.active && !g.projects.done.includes(p.id) && !projectAvailable(g, p),
    ),
  };
}

export function projectHint(g: Game, step: ProjectStep) {
  switch (step.kind) {
    case 'harvest':
      return step.lineageOnly
        ? 'Plantez une variété de votre album puis récoltez-la.'
        : step.crop === '*'
        ? 'Arrosez vos cultures : la qualité en profite.'
        : level(g) < crop(step.crop).level
          ? `${crop(step.crop).name} arrive au niveau ${crop(step.crop).level}.`
          : `Semez des ${crop(step.crop).name.toLowerCase()}s${step.minQuality ? ' et arrosez-les' : ''}.`;
    case 'cook':
      return step.signatureOnly
        ? 'Choisissez un ingrédient issu d’une lignée à l’atelier.'
        : step.recipe === '*'
        ? 'De beaux ingrédients améliorent les chances de l’atelier.'
        : `Préparez « ${recipe(step.recipe)?.name} » à l’atelier.`;
    case 'sell':
      return 'Chaque vente au panier compte.';
    case 'festival':
      return 'Présentez votre meilleur plat sur la place de la fête.';
    case 'deliver':
      return 'Rassemblez les produits demandés dans le panier.';
    case 'signatureOrder':
      return 'Livrez une commande marquée « Spécialité du village ».';
    case 'fund':
      return 'Réunissez les pièces demandées, puis participez depuis la page Projets.';
    case 'fair':
      return `Présentez un ou deux produits à la foire dans le carnet et visez ${step.minScore}/100.`;
  }
}
/** Destinations possibles d’un produit du panier, pour aider à décider avant de vendre. */
export function itemUses(g: Game, id: string) {
  const uses: string[] = [];
  const [base, quality] = id.split('|');
  const status = projectStatus(g);
  if (status?.step.kind === 'deliver') {
    const plan = planMenu(g.stock, status.step.lines);
    if (plan.used[id]) uses.push('Projet');
  } else if (
    status?.step.kind === 'cook' &&
    status.step.recipe !== '*' &&
    recipe(status.step.recipe)?.needs[base]
  )
    uses.push('Projet');
  if (orderBoard(g).some((offer) => planMenu(g.stock, offer.lines).used[id])) uses.push('Commande');
  if (crop(base)) {
    if (
      RECIPES.some((r) => r.needs[base] && !recipeLock(g, r)) &&
      g.upgrades.includes('workshop')
    )
      uses.push(quality ? 'Recette (meilleures chances)' : 'Recette');
    if (quality === 'exceptionnelle') uses.push('Semence');
  } else if (isFestivalDish(id)) {
    const effect = eatableDish(id);
    if (effect) uses.push(`Déguster : ${effect.name}`);
    if (dishCourse(id)) uses.push('Menu');
    uses.push('Fête');
  }
  const parent = isFestivalDish(id) ? recipe(base)?.parent || base : base;
  const fans = VILLAGERS.filter(
    (v) =>
      (g.relations[v.id] || 0) < 5 &&
      (v.likes.includes(base) || v.likes.includes(parent)),
  );
  if (fans.length) uses.push(`Cadeau ♥ ${fans.map((v) => v.name).join(', ')}`);
  else if (quality && quality !== 'rustique' && quality !== 'ordinaire')
    uses.push('Beau cadeau');
  return uses;
}
export type NotebookTab =
  | 'projects'
  | 'orders'
  | 'upgrades'
  | 'goals'
  | 'mastery'
  | 'lineages'
  | 'skills'
  | 'recipes'
  | 'festival'
  | 'valley'
  | 'friends'
  | 'collection'
  | 'guide';
/** Nombre de choses à faire par onglet du carnet (0 = rien). */
export function notebookBadges(g: Game, now: number) {
  const status = projectStatus(g);
  const badges: Partial<Record<NotebookTab, number>> = {
    projects:
      (status?.step.kind === 'deliver' &&
      planMenu(g.stock, status.step.lines).possible
        ? 1
        : 0) +
      (status?.step.kind === 'fund' && g.coins >= status.step.amount ? 1 : 0) +
      (!status && PROJECTS.some((project) => projectAvailable(g, project))
        ? 1
        : 0) +
      (g.orchard !== null && g.orchard <= now ? 1 : 0),
    orders: orderBoard(g).filter((offer) => orderAvailable(g, offer.slot, now) && planMenu(g.stock, offer.lines).possible).length,
    lineages: g.seedFinds.length,
    valley: g.valley.trip && g.valley.trip.returnAt <= now ? 1 : 0,
    upgrades: UPGRADES.filter(
      (item) => upgradePresentation(g, item.id).state === 'available',
    ).length + EMBELLISHMENTS.filter((entry) => {
      // 0.11 : un embellissement constructible compte aussi.
      const stage = embellishmentStage(g, entry.id);
      return stage < 3 && level(g) >= entry.levels[stage as 0 | 1 | 2] && g.coins >= entry.costs[stage as 0 | 1 | 2];
    }).length,
    goals: GOALS.filter((goal) => !g.claimed.includes(goal.id) && goalProgress(g, goal) >= goal.target).length,
    recipes:
      (readyDishes(g, now) > 0 ? 1 : 0) +
      (g.hens !== null && g.hens <= now ? 1 : 0) +
      (g.talentPoints > 0 ? 1 : 0),
    friends: QUESTS.filter(
      (q) =>
        !g.quests.includes(q.id) &&
        (g.relations[q.id] || 0) >= 2 &&
        fulfillment(g.stock, q.item, q.amount).possible,
    ).length,
  };
  const total = Object.values(badges).reduce((sum, n) => sum + (n || 0), 0);
  return { badges, total };
}
export const ABSENCE_MIN_MS = 60_000;
/** Ce qui est prêt au retour du joueur. */
export function absenceSummary(g: Game, now: number) {
  const crops: Record<string, number> = {};
  g.plots.forEach((plot) => {
    if (plot && plot.end <= now) crops[plot.crop] = (crops[plot.crop] || 0) + 1;
  });
  const ripe = Object.values(crops).reduce((sum, n) => sum + n, 0);
  const eggs = g.upgrades.includes('coop') && g.hens !== null && g.hens <= now;
  const orchard = g.orchard !== null && g.orchard <= now;
  const dish = stoveJobs(g).find((job) => job && job.end <= now)?.id ?? null;
  const canHarvest = g.upgrades.includes('tools');
  const collectable = (canHarvest && ripe > 0) || eggs || orchard || !!dish;
  return {
    away: Math.max(0, now - g.saved),
    crops,
    ripe,
    eggs,
    orchard,
    dish,
    canHarvest,
    collectable,
    worthShowing:
      now - g.saved >= ABSENCE_MIN_MS &&
      (ripe > 0 || eggs || orchard || !!dish),
  };
}
/** Durée d’absence lisible : « 2 h 14 min », « 3 j 4 h ». */
export function awayLabel(ms: number) {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${Math.max(1, minutes)} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24)
    return `${hours} h${minutes % 60 ? ` ${minutes % 60} min` : ''}`;
  const days = Math.floor(hours / 24);
  return `${days} j${hours % 24 ? ` ${hours % 24} h` : ''}`;
}
/** Lignes de l’info-bulle du temps de pousse (base, modificateurs, total). */
export function growTimeTooltip(g: Game, id: string, now?: number) {
  const detail = growTimeBreakdown(g, id, now);
  return [
    `Base : ${duration(detail.base)}`,
    ...detail.factors.map((factor) => {
      const percent = Math.round((factor.multiplier - 1) * 100);
      return `${factor.label} : ${percent > 0 ? '+' : '−'}${Math.abs(percent)} %`;
    }),
    detail.factors.length
      ? `Total : ${duration(detail.total)}`
      : 'Aucun modificateur actif',
  ];
}
export type MapSpot =
  | 'house'
  | 'village'
  | 'festival'
  | 'orchard'
  | 'workshop'
  | 'coop';
/** Court signal « quelque chose à faire » affiché sur un lieu de la carte. */
export function mapSpotAlert(g: Game, spot: MapSpot, now: number) {
  switch (spot) {
    case 'village':
      return orderBoard(g).some((offer) => orderAvailable(g, offer.slot, now) && planMenu(g.stock, offer.lines).possible) ? 'Commande prête' : '';
    case 'festival': {
      const status = projectStatus(g);
      return status?.step.kind === 'festival' && g.upgrades.includes('workshop')
        ? 'Projet'
        : '';
    }
    case 'orchard':
      return g.orchard !== null && g.orchard <= now ? 'Fruits mûrs' : '';
    case 'workshop':
      return readyDishes(g, now) > 0 ? 'Plat prêt' : '';
    case 'coop':
      return g.upgrades.includes('coop') && g.hens !== null && g.hens <= now
        ? 'Œufs prêts'
        : '';
    default:
      return '';
  }
}
/**
 * Où la caméra glisse après un passage de niveau : le bâtiment ou le lieu
 * débloqué, sinon le potager (nouvelle culture).
 */
export function levelFocus(value: number) {
  const places = BUILD_FOCUS;
  const upgrade = UPGRADES.find((u) => u.level === value && places[u.id]);
  if (upgrade) return { ...places[upgrade.id], label: upgrade.name };
  const project = PROJECTS.find((p) => p.level === value);
  if (project) return { ...FOCUS.place, label: 'la place de la fête' };
  return { ...FOCUS.potager, label: 'le potager' };
}

/* ---------- 0.9.1 : panier groupé par culture ---------- */
export type BasketFilter = 'all' | 'crops' | 'dishes' | 'useful';
export type BasketEntry = {
  key: string;
  amount: number;
  unit: number;
  /** Rang de qualité (0 = ordinaire ou rustique). */
  rank: number;
  quality: string;
  lineage: string | null;
  reserved: number;
  uses: string[];
};
export type BasketQuality = {
  rank: number;
  label: string;
  amount: number;
  value: number;
  entries: BasketEntry[];
};
export type BasketGroup = {
  id: string;
  name: string;
  dish: boolean;
  amount: number;
  value: number;
  reserved: number;
  /** Utilisations réunies de toutes les variantes (Projet, Commande…). */
  uses: string[];
  qualities: BasketQuality[];
};

const upperFirst = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
function basketGroupName(base: string) {
  if (crop(base)) return crop(base).name;
  if (base === 'oeuf') return 'Œufs';
  return recipe(base)?.name || base;
}

/**
 * Une ligne par culture ou par recette, ses qualités et ses lignées en
 * dessous. Le filtre s’applique aux variantes, le tri aux groupes.
 */
export function groupBasket(
  g: Game,
  now: number,
  filter: BasketFilter = 'all',
  sort: 'value' | 'name' = 'value',
  reservedByKey: Record<string, number> = {},
): BasketGroup[] {
  const groups = new Map<string, BasketGroup>();
  for (const [key, amount] of Object.entries(g.stock)) {
    if (!(amount > 0)) continue;
    const base = key.split('|')[0];
    const dish = isFestivalDish(key);
    const uses = itemUses(g, key);
    if (filter === 'crops' && dish) continue;
    if (filter === 'dishes' && !dish) continue;
    if (filter === 'useful' && !uses.includes('Projet') && !uses.includes('Commande')) continue;
    const rank = itemQualityRank(key);
    const isCrop = !!crop(base);
    const quality = isCrop
      ? QUALITIES[rank]?.name || 'Ordinaire'
      : dish
        ? upperFirst(OUTCOMES.find((o) => o.id === dishParts(key).qualityId)?.name.replace(/^Plat /, '') || '')
        : '';
    const lineageId = isCrop ? itemLineageId(key) : dish ? dishParts(key).lineageId : undefined;
    const lineage = lineageId
      ? lineageById(g, lineageId)?.name || (isCrop ? `Lignée n°${lineageId}` : 'Spécialité de ferme')
      : null;
    const unit = price(g, key, now);
    const entry: BasketEntry = {
      key, amount, unit, rank, quality, lineage,
      reserved: reservedByKey[key] || 0, uses,
    };
    const group = groups.get(base) || {
      id: base, name: basketGroupName(base), dish,
      amount: 0, value: 0, reserved: 0, uses: [], qualities: [],
    };
    group.amount += amount;
    group.value += amount * unit;
    group.reserved += entry.reserved;
    for (const use of uses) if (!group.uses.includes(use)) group.uses.push(use);
    let tier = group.qualities.find((q) => q.rank === rank);
    if (!tier) {
      tier = { rank, label: quality, amount: 0, value: 0, entries: [] };
      group.qualities.push(tier);
    }
    tier.amount += amount;
    tier.value += amount * unit;
    tier.entries.push(entry);
    groups.set(base, group);
  }
  const list = [...groups.values()];
  for (const group of list) {
    group.qualities.sort((a, b) => a.rank - b.rank);
    for (const tier of group.qualities)
      tier.entries.sort((a, b) => Number(!!a.lineage) - Number(!!b.lineage) || (a.lineage || '').localeCompare(b.lineage || '', 'fr'));
  }
  return list.sort((a, b) =>
    sort === 'value'
      ? b.value - a.value || a.name.localeCompare(b.name, 'fr')
      : a.name.localeCompare(b.name, 'fr'),
  );
}

/** 0.9.5 — Saisons visibles : nom court, cultures de saison et bonus, pour le HUD et les graines. */
export const SEASON_SHORT: Record<string, string> = { printemps: 'Printemps', ete: 'Été', automne: 'Automne', hiver: 'Hiver' };
export const SEASON_SALE_BONUS = 8;
export function seasonChip(g: Game) {
  const season = seasonFor(g.season.index);
  const names = season.crops.map((id) => crop(id)?.name || id);
  const list = names.length > 1 ? names.slice(0, -1).join(', ') + ' et ' + names.at(-1) : names.join('');
  return {
    id: season.id,
    icon: 'season-' + season.id,
    short: SEASON_SHORT[season.id] || season.name,
    crops: season.crops,
    title: `${season.label} — de saison : ${list} (+${SEASON_SALE_BONUS} % à la vente).`,
  };
}
export const inSeason = (g: Game, id: string) =>
  (seasonFor(g.season.index).crops as readonly string[]).includes(id.split('|')[0]);
