'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Sprout } from 'lucide-react';
import { FarmMap, type Errand } from '@/components/farm/farm-map';
import { TutorialCoach } from '@/components/tutorial';
import { tutorialAdvance, tutorialRead, tutorialReplay, tutorialSetOff, tutorialSkipChapter } from '@/lib/tutorial';
import { BuffChips } from '@/components/projects';
import { GrowTimeTip } from '@/components/grow-time-tip';
import { CoinCounter, XpBar } from '@/components/hud';
import { LevelUpScene } from '@/components/level-up';
import { LineagesPanel } from '@/components/lineages';
import { ValleyPanel } from '@/components/valley';
import { GameConfirmDialog, type AskConfirm, type PendingConfirm } from '@/components/game-confirm';
import { PixelIcon, VillagerPortrait } from '@/components/farm/sprites';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { BUILD, CROPS, LEVEL_XP, MAX_LEVEL, GOALS, goalProgress, PROJECTS, projectReward, readyDishes, upgradeTier, gestureMs, bulkChores, act, crop, duration, gardeOptions, fresh, growTime, level, type ActionArgument, type Game, type VillageProject } from '@/lib/game';
import { actionFeedback, plainMessage, type ActionFeedback } from '@/lib/action-feedback';
import { useReducedMotion } from '@/hooks/use-game-clock';
import { reduceMotionFor } from '@/lib/motion';
import { absenceSummary, canRescue, DOCK_FAVORITES, dockFavorites, toggleFavorite, notebookBadges, inSeason, seasonChip } from '@/lib/farm-ui';
import { exportGame, loadGame, parseImportedGame, persistGame, SaveRecoveryError, protectUnreadableSave, acceptRecoveredGame, saveIsBlocked } from '@/lib/save';
import { SaveRecoveryDialog } from '@/components/save-recovery';
import { PAGE_KEYS, markPageSeen, newPages, notebookPage, revealedPages, settleNotebook, type NotebookPage } from '@/lib/notebook';
import { OrdersPanel } from '@/components/notebook/orders-panel';
import { GardeSelect } from '@/components/notebook/seed-card';
import { SeedShop, ShopPurse } from '@/components/seed-shop';
import { BasketList } from '@/components/notebook/basket-list';
import { DialogNotice } from '@/components/notebook/dialog-notice';
import { UpgradesPanel } from '@/components/notebook/upgrades-panel';
import { GoalsPanel } from '@/components/notebook/goals-panel';
import { AtelierPage } from '@/components/notebook/atelier-page';
import { CarnetDialog, SUMMARY } from '@/components/notebook/carnet';
import { SummaryPage } from '@/components/notebook/summary-page';
import { GuidePage } from '@/components/notebook/guide-page';
import { MasteryPage } from '@/components/notebook/mastery-page';
import { SkillsPage } from '@/components/notebook/skills-page';
import { ProjectsPage } from '@/components/notebook/projects-page';
import { FairsPage } from '@/components/notebook/fairs-page';
import { FriendsPage } from '@/components/notebook/friends-page';
import { useLevelCheer } from '@/hooks/use-level-cheer';
import { CollectionPanel } from '@/components/notebook/collection-panel';
import { SettingToggle } from '@/components/notebook/setting-toggle';
import { AudioSettings } from '@/components/audio-settings';
import { GameAudio, useAudioPrefs } from '@/components/game-audio';
import { gameAudio } from '@/lib/audio/engine';
import { cueFor } from '@/lib/audio/cues';
import { Gazette, clockLabel, type AbsenceInfo } from '@/components/gazette';
import { askNotificationPermission, useReadyNotifications } from '@/components/ready-notifications';
import { dailyLabel } from '@/lib/daily';
import { WEATHER_EFFECTS, weatherEnds, weatherFor } from '@/lib/weather';

const ERRAND_PLACE: Record<Errand['action'], [Errand['place'], Errand['activity']]> = {
  craft: ['atelier', 'cook'],
  collect: ['atelier', 'cook'],
  hens: ['poulailler', 'eggs'],
  orchard: ['verger', 'harvest'],
};
/**
 * 0.28.1 : gestes dont la réussite se voit sur la carte (halo, Rosalie qui
 * avance, compteurs du haut) : ils ne laissent plus de message.
 */
const ROUTINE_GESTURES = new Set(['plant', 'water', 'harvest', 'bulkStart', 'bulkTick']);
/**
 * Moments forts d’un message de récolte : nouvelle maîtrise, étape ou projet
 * terminé, graine prometteuse. Le reste (« +1 Radis · +2 XP ») est déjà dit
 * par le halo autour de la plante et par le compteur du haut.
 */
function routineHighlights(message: string) {
  // Une tournée de semis qui s’arrête faute de graines mérite d’être dite.
  if (message.startsWith('Plus de graines')) return message;
  const parts = message.split(/\s·\s|\s(?=✨)/);
  const crop = (parts[0] || '').replace(/^\+\d+\s*/, '').trim();
  return parts
    .slice(1)
    .filter((part) => /Maîtrise \d|étape \d+\/\d+ terminée|accompli|prometteuse/.test(part))
    .map((part) => (part.startsWith('Maîtrise') && crop ? `${crop} : ${part.toLowerCase()}` : part))
    .join(' · ');
}

export default function Home() {
  const [game, setGame] = useState<Game>(() => fresh(0));
  const gameRef = useRef(game);
  const [loaded, setLoaded] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const [feedback, setFeedback] = useState<ActionFeedback>();
  const feedbackId = useRef(0);
  const [now, setNow] = useState(0);
  const [selectedCrop, setSelectedCrop] = useState('radis');
  const [selectedLineage, setSelectedLineage] = useState(0);
  // 0.9.5 : semis de garde choisi (heures, 0 = semis normal).
  const [gardeChoice, setGardeChoice] = useState(0);
  const gardeRef = useRef(0);
  const [modal, setModal] = useState('');
  const [notebookTab, setNotebookTab] = useState<string>(SUMMARY);
  // 0.13 : un lieu de l’anneau ouvre « Améliorer » sur « Restaurer le domaine ».
  const [upgradeFocus, setUpgradeFocus] = useState(0);
  const [notices, setNotices] = useState<{ id: number; text: string }[]>([]);
  const noticeId = useRef(0);
  const [drawer, setDrawer] = useState<'' | 'seeds' | 'actions' | 'all'>('');
  // 0.33.0 : la gazette (ciel, demandes du jour, absence) remplace la fenêtre d’absence.
  const [gazette, setGazette] = useState<{ absence?: AbsenceInfo }>();
  // 0.22 : son et musique (lib/audio/engine.ts), réglés dans les paramètres.
  const audioPrefs = useAudioPrefs();
  const toggleSound = () => gameAudio.setPrefs({ on: !audioPrefs.on });
  const sound = audioPrefs.on;
  const [resetOpen, setResetOpen] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm>(null);
  const askConfirm: AskConfirm = useCallback((choice, onConfirm) => setPendingConfirm({ choice, onConfirm }), []);
  const [saveError, setSaveError] = useState(false);
  const [recovery, setRecovery] = useState<SaveRecoveryError | null>(null);
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [levelUps, setLevelUps] = useState<{
    level: number;
    crop: string | null;
    system: string;
  }[]>([]);
  const levelUp = levelUps[0];
  const [projectDone, setProjectDone] = useState<VillageProject>();
  // 0.20 : Rosalie fête le niveau sur la carte avant sa fenêtre.
  const [cheerFor, announceLevel] = useLevelCheer(modal === '' && !projectDone && !gazette);
  const seedDialogTitle = useRef<HTMLHeadingElement>(null);

  // File de messages : un message à la fois, au plus deux en attente.
  const notify = useCallback((message: string) => {
    const text = plainMessage(message);
    if (!text) return;
    setNotices((queue) => {
      if (queue.at(-1)?.text === text) return queue;
      const next = [...queue, { id: ++noticeId.current, text }];
      return next.length > 3 ? [next[0], ...next.slice(-2)] : next;
    });
  }, []);
  const notice = notices[0];
  // Hors fenêtre, les touches 1 à 5 choisissent une graine du dock (0.9.1).
  const favorites = dockFavorites(game);
  const seedKeys = useRef(favorites);
  useEffect(() => {
    seedKeys.current = favorites;
  });
  useEffect(() => {
    function key(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select')) return;
      if (document.querySelector('[role="dialog"]')) return;
      if (!/^[1-5]$/.test(event.key)) return;
      const choice = seedKeys.current[Number(event.key) - 1];
      if (!choice) return;
      event.preventDefault();
      setSelectedCrop(choice);
      setSelectedLineage(0);
    }
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(
      () => setNotices((queue) => queue.slice(1)),
      notices.length > 1 ? 2600 : 4500,
    );
    return () => clearTimeout(timer);
  }, [notice, notices.length]);
  const save = useCallback((nextGame: Game) => {
    if (saveIsBlocked()) return;
    // Carnet progressif : fixe les pages déjà connues d’une nouvelle partie.
    const next = settleNotebook(nextGame);
    gameRef.current = next;
    setGame(next);
    try {
      persistGame(next);
      setSaveError(false);
    } catch {
      setSaveError(true);
    }
  }, []);
  const finishRecovery = (next: Game) => {
    try {
      acceptRecoveredGame(next);
      save(next);
      setRecovery(null);
      setRecoveryOpen(false);
      setModal('');
      setEpoch((value) => value + 1);
      return true;
    } catch {
      notify('La copie reste protégée. Le stockage est indisponible.');
      return false;
    }
  };
  const retryRecovery = () => {
    if (!recovery) return;
    try {
      finishRecovery(recovery.source === 'local' ? loadGame() : parseImportedGame(recovery.raw));
    } catch (error) {
      if (error instanceof SaveRecoveryError) setRecovery(error);
      notify('La sauvegarde reste illisible. Vous pouvez télécharger sa copie.');
    }
  };
  useEffect(() => {
    const kickoff = setTimeout(() => {
      const time = Date.now();
      try {
        const restored = settleNotebook(loadGame());
        gameRef.current = restored;
        setGame(restored);
        // La graine choisie au départ est la première du dock.
        setSelectedCrop(dockFavorites(restored)[0]);
        const summary = absenceSummary(restored, time);
        // 0.33.0 : la gazette s’ouvre au premier passage du jour (dès le niveau 2,
        // après les premiers pas) ou après une longue absence.
        if (summary.worthShowing || (!restored.daily?.read && level(restored) >= 2))
          setGazette({ absence: summary.worthShowing ? summary : undefined });
      } catch (error) {
        if (error instanceof SaveRecoveryError) {
          setRecovery(error);
          setRecoveryOpen(true);
        } else setSaveError(true);
      }
      setNow(time);
      setLoaded(true);
    }, 0);
    return () => {
      clearTimeout(kickoff);
    };
  }, []);
  // Le conteneur ne change qu’à une échéance de jeu, jamais à chaque seconde.
  useEffect(() => {
    if (!loaded) return;
    const time = Date.now();
    const deadlines = [
      ...game.plots.map(p => p?.end), game.hens, game.orchard,
      ...[game.job, ...game.stoves].map(job => job?.end), game.valley.trip?.returnAt,
      ...Object.values(game.buffs),
      game.created + (Math.floor((time - game.created) / 1200000) + 1) * 1200000,
    ].filter((end): end is number => typeof end === 'number' && end > time);
    if (!deadlines.length) return;
    const timer = setTimeout(() => setNow(Date.now()), Math.min(2147483647, Math.min(...deadlines) - time + 20));
    return () => clearTimeout(timer);
  }, [game, loaded, now]);
  const dispatch = useCallback(
    (action: string, argument?: ActionArgument) => {
      if (saveIsBlocked()) return { g: gameRef.current, message: 'La sauvegarde attend votre choix.', feedback: actionFeedback(gameRef.current, gameRef.current, action, ++feedbackId.current) };
      const time = Date.now();
      setNow(time);
      const before = gameRef.current;
      const result = act(before, action, argument, time);
      const feedback = actionFeedback(
        gameRef.current,
        result.g,
        action,
        ++feedbackId.current,
        action === 'upgrade' && typeof argument === 'string'
          ? argument
          : undefined,
      );
      if (feedback.changed) setFeedback(feedback);
      if (result.g !== gameRef.current) {
        save(result.g);
        const cue = cueFor(action, before, result.g, result.message);
        if (cue) gameAudio.play(cue.name, { duck: cue.duck });
        // 0.33.0 : une demande du jour faite se fête d’un message et d’un bruit de pièces.
        const completed = result.g.daily?.day === before.daily?.day
          ? result.g.daily?.requests.filter((request, index) => request.done && !before.daily?.requests[index]?.done) ?? []
          : [];
        for (const request of completed) {
          notify(`Demande du jour faite : ${dailyLabel(request, (id) => crop(id).name)} · +${request.coins} pièces · +${request.xp} XP`);
          gameAudio.play('pieces', { delay: 0.2 });
        }
      }
      if (result.levelUps?.length) {
        // 0.20 : Rosalie fête le niveau, sauf si une fenêtre de niveau est déjà ouverte.
        setLevelUps(previous => {
          if (!previous.length) announceLevel(result.levelUps!.map((entry) => entry.level));
          return [...previous, ...result.levelUps!];
        });
      }
      const finished = result.g.projects.done.find(
        (id) => !before.projects.done.includes(id),
      );
      if (finished) {
        setModal('');
        setProjectDone(PROJECTS.find((project) => project.id === finished));
      }
      if (action === 'upgrade' && feedback.changed) setModal('');
      // 0.28.1 : un geste de routine réussi (semer, arroser, récolter) se lit
      // sur la carte ; seuls ses moments forts restent en message.
      if (action === 'bulkTick' && result.g.bulkJob) return { ...result, feedback };
      notify(
        result.g !== before && ROUTINE_GESTURES.has(action)
          ? routineHighlights(result.message)
          : result.message,
      );
      return { ...result, feedback };
    },
    [save, notify, announceLevel],
  );
  // 0.9.9 : les gestes groupés et les courses avancent au pas de Rosalie, sur la carte.
  const errandRef = useRef<((errand: Errand) => void) | null>(null);
  const errandKey = useRef(0);
  const [errands, setErrands] = useState<Errand[]>([]);
  const sendRosalie = useCallback((action: Errand['action'], argument?: ActionArgument) => {
    const [place, activity] = ERRAND_PLACE[action];
    if (!errandRef.current) return dispatch(action, argument);
    const errand: Errand = { key: ++errandKey.current, action, argument, place, activity };
    setErrands((list) => [...list, errand]);
    errandRef.current(errand);
    return undefined;
  }, [dispatch]);
  const runErrand = useCallback((errand: Errand) => {
    setErrands((list) => list.filter((entry) => entry.key !== errand.key));
    return dispatch(errand.action, errand.argument);
  }, [dispatch]);
  const bulkStep = useCallback((step: { index: number; id: string }) => dispatch('bulkTick', step), [dispatch]);
  /** 0.9.9 : « Tout récupérer » à pied : poulailler, verger, atelier, puis la cueillette. */
  const collectOnFoot = useCallback(() => {
    const g = gameRef.current;
    const time = Date.now();
    if (g.upgrades.includes('coop') && g.hens !== null && g.hens <= time) sendRosalie('hens');
    if (g.orchard !== null && g.orchard <= time) sendRosalie('orchard');
    if (readyDishes(g, time) > 0) sendRosalie('collect');
    if (g.upgrades.includes('tools') && !bulkChores(g.bulkJob).includes('harvest') && g.plots.some((plot) => plot && plot.end <= time))
      dispatch('bulkStart', { id: 'harvest' });
  }, [dispatch, sendRosalie]);
  /** 0.33.0 : fermer la gazette ; elle ne se rouvre plus d’elle-même aujourd’hui. */
  const closeGazette = useCallback(() => {
    setGazette(undefined);
    if (gameRef.current.daily && !gameRef.current.daily.read) dispatch('dailyRead');
  }, [dispatch]);
  // 0.33.0 : quand le ciel tourne à la pluie (ou à la neige), il arrose le potager.
  const sky = weatherFor(game, now || game.created);
  useEffect(() => {
    if (!loaded || (sky.pixel !== 'pluie' && sky.pixel !== 'neige')) return;
    const time = Date.now();
    if (gameRef.current.plots.some((plot) => plot && !plot.watered && plot.end > time && !(plot.garde && plot.garde > 0))) dispatch('rain');
  }, [loaded, sky.pixel, dispatch]);
  // 0.33.0 : notifications du navigateur, si le joueur les a activées.
  useReadyNotifications(game, loaded && game.settings.notifyReady);
  /** Ce que les panneaux déclenchent : l’atelier, le poulailler et le verger passent par Rosalie. */
  const errandDispatch = useCallback((action: string, argument?: ActionArgument) =>
    action in ERRAND_PLACE
      ? sendRosalie(action as Errand['action'], argument)
      : dispatch(action, argument), [dispatch, sendRosalie]);
  const performPlotAction = useCallback(
    (index: number, seed: string, lineageId?: number) => {
      const plot = gameRef.current.plots[index];
      if (plot && plot.end <= Date.now()) return dispatch('harvest', index);
      if (plot) return dispatch('water', index);
      const garde = lineageId ? 0 : gardeRef.current;
      return dispatch('plant', { index, crop: seed, lineageId, garde: garde || undefined });
    },
    [dispatch],
  );
  // Affiche une page du carnet et retire sa pastille « nouvelle ».
  const showPage = useCallback(
    (id: string) => {
      setNotebookTab(id);
      const seen = markPageSeen(gameRef.current, id);
      if (seen !== gameRef.current) save(seen);
    },
    [save],
  );
  const openPanel = useCallback(
    (requested: string) => {
      const panel = requested === 'restore' ? 'upgrades' : requested;
      setUpgradeFocus((n) => (requested === 'restore' ? Math.abs(n) + 1 : -Math.abs(n)));
      if (['home', 'seeds', 'basket', 'settings'].includes(panel)) {
        setModal(panel);
        return;
      }
      const page = notebookPage(panel);
      const open = revealedPages(gameRef.current);
      if (page && !open.some((entry) => entry.value === page.value)) {
        // Page pas encore ouverte : un mot d’annonce, pas de panneau vide.
        notify(page.teaser);
        return;
      }
      showPage(panel);
      setModal('notebook');
    },
    [notify, showPage],
  );
  /** Ouvre le carnet sur une nouvelle page, sinon sur la dernière lue si elle existe. */
  const openNotebook = useCallback(() => {
    setUpgradeFocus((n) => -Math.abs(n));
    const g = gameRef.current;
    const open = revealedPages(g);
    const unseen = newPages(g)[0];
    showPage(
      unseen?.value ||
        (notebookTab === SUMMARY || open.some((page) => page.value === notebookTab)
          ? notebookTab
          : open[0].value),
    );
    setModal('notebook');
  }, [notebookTab, showPage]);
  // Tiroir de toutes les graines : Échap ou un clic ailleurs le referment.
  useEffect(() => {
    if (drawer !== 'all') return;
    // Le clavier entre dans le tiroir, sur la graine choisie.
    const frame = requestAnimationFrame(() =>
      document
        .querySelector<HTMLElement>('.seed-all li button.selected, .seed-all li button')
        ?.focus(),
    );
    function key(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      setDrawer('');
      document.querySelector<HTMLElement>('.seed-all-toggle')?.focus();
    }
    function pointer(event: PointerEvent) {
      const target = event.target as HTMLElement | null;
      if (!target?.closest('.seed-all, .seed-all-toggle')) setDrawer('');
    }
    window.addEventListener('keydown', key);
    window.addEventListener('pointerdown', pointer);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('keydown', key);
      window.removeEventListener('pointerdown', pointer);
    };
  }, [drawer]);
  // Carnet : 1 à 9 puis A, Z, E ouvrent directement une page visible.
  const pagesRef = useRef<NotebookPage[]>([]);
  useEffect(() => {
    pagesRef.current = revealedPages(game);
  });
  useEffect(() => {
    if (modal !== 'notebook') return;
    function key(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select')) return;
      const index = PAGE_KEYS.indexOf(event.key.toLowerCase());
      const page = index >= 0 ? pagesRef.current[index] : undefined;
      if (!page) return;
      event.preventDefault();
      showPage(page.value);
      // Le focus suit la page choisie (sinon l’anneau reste sur l’ancienne).
      requestAnimationFrame(() =>
        document.querySelector<HTMLElement>(`.carnet-spine [data-carnet-target="${page.value}"]`)?.focus(),
      );
    }
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [modal, showPage]);

  const unlockedCount = CROPS.filter((item) => item.level <= level(game)).length;
  const currentLevel = level(game),
    selected = crop(selectedCrop),
    nextXP = LEVEL_XP[Math.min(currentLevel, MAX_LEVEL - 1)],
    previousXP = LEVEL_XP[currentLevel - 1];
  const xpProgress =
    currentLevel === MAX_LEVEL
      ? 100
      : ((game.xp - previousXP) / (nextXP - previousXP)) * 100;
  const season = seasonChip(game);
  const ready = game.plots.filter((plot) => plot && plot.end <= now).length;
  const inventory = Object.values(game.stock).reduce(
    (sum, value) => sum + value,
    0,
  );
  const selectedSeedCount = selectedLineage ? (game.lineages.find((lineage) => lineage.id === selectedLineage && lineage.crop === selected.id)?.seeds ?? game.seeds[selected.id] ?? 0) : game.seeds[selected.id] || 0;
  const gardeHours = gardeOptions(game);
  const garde = selectedLineage || !gardeHours.includes(gardeChoice) ? 0 : gardeChoice;
  useEffect(() => {
    gardeRef.current = garde;
  }, [garde]);
  // 0.18 : récolter, semer et arroser se cumulent ; chaque bouton allume ou éteint sa tâche.
  const chores = bulkChores(game.bulkJob);
  const bulkActions = [
    game.upgrades.includes('tools') && (ready > 0 || chores.includes('harvest')) &&
      { action: 'harvest', icon: 'action-recolter', label: 'Récolter', full: 'Parcourir les récoltes', count: ready },
    game.upgrades.includes('watering-can') &&
      { action: 'water', icon: 'action-arroser', label: 'Arroser', full: 'Arroser les parcelles' },
    game.upgrades.includes('auto') &&
      { action: 'sow', icon: 'action-semer', label: 'Semer', full: 'Semer les parcelles libres' },
  ].filter(Boolean) as {
    action: 'harvest' | 'water' | 'sow'; icon: string; label: string;
    full: string; count?: number;
  }[];
  const pages = useMemo(() => revealedPages(game), [game]);
  const unseenPages = newPages(game);
  // Seules les pages visibles comptent dans les pastilles du carnet.
  const badges = useMemo(() => {
    const all = notebookBadges(game, now).badges;
    const visible: typeof all = {};
    for (const page of pages) visible[page.value] = all[page.value];
    // 0.32.1 : la pastille du dock ne compte que ce qui est prêt (commande, plat,
    // quête, caravane…). Objectifs et améliorations gardent leur pastille dans le carnet.
    const total = Object.entries(visible).reduce(
      (sum, [tab, n]) => (tab === 'goals' || tab === 'upgrades' ? sum : sum + (n || 0)),
      0,
    );
    return { badges: visible, total };
  }, [game, now, pages]);
  const [dismissedAnnounce, setDismissedAnnounce] = useState<string[]>([]);
  const announce = unseenPages.find(
    (page) => !dismissedAnnounce.includes(page.value),
  );
  const dialogOpen =
    modal !== '' || !!levelUp || !!projectDone || !!gazette || resetOpen || recoveryOpen;
  // 0.10 : le tutoriel avance avec la partie et avec ce que l’interface montre.
  useEffect(() => {
    if (!loaded) return;
    // Différé d’un tick : l’étape suit l’action sans rendu en cascade.
    const timer = setTimeout(() => {
      const current = gameRef.current;
      const next = tutorialAdvance(current, { modal, tab: notebookTab });
      if (next !== current) save(next);
    }, 0);
    return () => clearTimeout(timer);
  }, [loaded, game, modal, notebookTab, save]);
  const coachHidden = !loaded || !!recovery || !!levelUp || !!projectDone || !!gazette || resetOpen || modal === 'settings' || modal === 'home';
  // 0.21 : carte couverte par une fenêtre (fond flouté) : ses décors animés se mettent en pause.
  useEffect(() => { document.documentElement.toggleAttribute('data-map-covered', dialogOpen); }, [dialogOpen]);
  const [wasDialogOpen, setWasDialogOpen] = useState(dialogOpen);
  if (wasDialogOpen !== dialogOpen) {
    // Les messages déjà lus dans une fenêtre ne réapparaissent pas à sa fermeture.
    setWasDialogOpen(dialogOpen);
    if (!dialogOpen) setNotices([]);
  }

  const systemReduced = useReducedMotion();
  const reduceMotion = reduceMotionFor(systemReduced, game.settings);
  useEffect(() => {
    // Sur <html> : couvre aussi les fenêtres, rendues hors de <main>.
    document.documentElement.toggleAttribute('data-reduce-motion', reduceMotion);
    document.documentElement.toggleAttribute('data-motion-full', game.settings.forceAnimations && !game.settings.reduceMotion);
  }, [reduceMotion, game.settings.forceAnimations, game.settings.reduceMotion]);

  return (
    <main className={`farm-game ${reduceMotion ? 'reduce-motion' : ''}`} data-game-ready={loaded || undefined}>
      <header className="pixel-hud">
        <div className="hud-brand" title={BUILD}>
          <span className="hud-sprout">
            <Sprout size={22} />
          </span>
          <div>
            <h1>Farmicia</h1>
            <small>{BUILD}</small>
          </div>
        </div>
        {announce && !dialogOpen && (
          <aside className="page-announce" aria-label="Nouvelle page du carnet">
            <PixelIcon id={announce.icon} />
            <div>
              <small>Nouvelle page du carnet · {announce.label}</small>
              <b>{announce.announce}</b>
            </div>
            <button
              onClick={() => {
                showPage(announce.value);
                setModal('notebook');
              }}
            >
              Ouvrir
            </button>
            <button
              className="page-announce-close"
              aria-label="Masquer l’annonce"
              onClick={() =>
                setDismissedAnnounce((list) => [...list, announce.value])
              }
            >
              ×
            </button>
          </aside>
        )}
        {/* 0.17 : la plaque du coin haut gauche (niveau et bourse). */}
        <div className="hud-plaque">
        <XpBar
          live={loaded}
          level={currentLevel}
          progress={xpProgress}
          label={
            currentLevel === MAX_LEVEL
              ? 'Maître'
              : `${(game.xp - previousXP).toLocaleString('fr-FR')}/${(nextXP - previousXP).toLocaleString('fr-FR')} XP`
          }
        />
        <CoinCounter coins={game.coins} reduced={reduceMotion} live={loaded} paused={dialogOpen} />
        </div>
        {/* 0.17 : les outils du coin haut droit (bonus, son, réglages). */}
        <div className="hud-tools">
        {/* 0.28.1 : la saison n’est plus une icône ici (carnet, graineterie).
            0.33.0 : le ciel revient, il a maintenant un effet de jeu ; un
            clic ouvre la gazette. Puis les effets de plats actifs. */}
        {loaded && (
          <button
            className="hud-button hud-sky"
            onClick={() => setGazette({})}
            aria-label={`${sky.label} : ${WEATHER_EFFECTS[sky.pixel]} Jusqu’à ${clockLabel(weatherEnds(game, now))}. Ouvrir la gazette.`}
            data-tip={`${sky.label} · ${WEATHER_EFFECTS[sky.pixel]}`}
          >
            <PixelIcon id={sky.pixel} />
          </button>
        )}
        <BuffChips g={game} now={now} />
        <button
          className="hud-button"
          onClick={toggleSound}
          aria-label={sound ? 'Couper le son' : 'Activer le son'}
          data-tip={sound ? 'Couper le son' : 'Activer le son'}
        >
          <PixelIcon id={sound ? 'son' : 'son-coupe'} />
        </button>
        <button
          className="hud-button"
          onClick={() => setModal('settings')}
          aria-label="Paramètres"
          data-tip="Réglages"
        >
          <PixelIcon id="engrenage" />
        </button>
        </div>
      </header>

      <FarmMap
        game={game}
        key={epoch}
        feedback={feedback}
        selectedCrop={selectedCrop}
        selectedLineage={game.lineages.some((lineage) => lineage.id === selectedLineage && lineage.crop === selectedCrop) ? selectedLineage : 0}
        disabled={!loaded}
        onAct={performPlotAction}
        onOpen={openPanel}
        onBulkStep={bulkStep}
        onErrand={runErrand}
        errandRef={errandRef}
      />
      {(game.trackedGoals.length > 0 || (game.daily && currentLevel >= 2)) && <div className="farm-goal-ribbon" aria-label="Objectifs suivis">
        {/* 0.33.0 : les demandes du jour, en tête ; un clic ouvre la gazette. */}
        {game.daily && currentLevel >= 2 && (() => {
          const total = game.daily.requests.length;
          const done = game.daily.requests.filter((request) => request.done).length;
          return <button className="daily-pill" data-done={done === total || undefined} onClick={() => setGazette({})}
            aria-label={`Demandes du jour : ${done} sur ${total}. Ouvrir la gazette.`}>
            <PixelIcon id="lettre" /><span>Demandes du jour</span><b>{done === total ? 'Toutes faites' : `${done}/${total}`}</b>
          </button>;
        })()}
        {game.trackedGoals.map((id) => {
          const goal = GOALS.find((entry) => entry.id === id);
          if (!goal || game.claimed.includes(id)) return null;
          const value = goalProgress(game, goal);
          return <button key={id} onClick={() => openPanel('goals')}
            aria-label={goal.title + ' : ' + Math.min(value, goal.target) + ' sur ' + goal.target}>
            <span>{goal.title}</span><b>{value >= goal.target ? 'À réclamer' : Math.min(value, goal.target) + '/' + goal.target}</b>
          </button>;
        })}
      </div>}
      <nav
        className={`action-dock ${drawer ? `drawer-${drawer}` : ''}`}
        aria-label="Actions de ferme"
      >
        <div
          className="seed-strip"
          id="seed-drawer"
          aria-label="Graines disponibles"
        >
          {[
            ...favorites.map((id) => crop(id)),
            ...CROPS.filter(
              (item) => item.level <= currentLevel && !favorites.includes(item.id),
            ),
          ].map((item) => {
            const slot = favorites.indexOf(item.id);
            return (
              <button
                key={item.id}
                className={selectedCrop === item.id ? 'selected' : ''}
                data-extra={slot < 0 || undefined}
                onClick={() => {
                  setSelectedCrop(item.id);
                  setSelectedLineage(0);
                  setDrawer('');
                }}
                aria-pressed={selectedCrop === item.id}
                aria-keyshortcuts={slot >= 0 ? String(slot + 1) : undefined}
                aria-label={`${item.name}, ${game.seeds[item.id] || 0} graines${inSeason(game, item.id) ? ', de saison' : ''}`}
                title={(slot >= 0 ? `${item.name} · touche ${slot + 1}` : item.name) + (inSeason(game, item.id) ? ' · de saison (+8 % à la vente)' : '')}
                data-season={inSeason(game, item.id) || undefined}
              >
                {slot >= 0 && (
                  <kbd className="seed-key" aria-hidden="true">
                    {slot + 1}
                  </kbd>
                )}
                <PixelIcon id={item.id} />
                <b>{game.seeds[item.id] || 0}</b>
                <small>{item.name}</small>
              </button>
            );
          })}
          {unlockedCount > favorites.length && (
            <button
              className="seed-all-toggle"
              aria-expanded={drawer === 'all'}
              aria-controls="seed-all"
              aria-label={`Toutes les graines, ${unlockedCount} cultures`}
              title="Toutes les graines et le choix du dock"
              onClick={() => setDrawer(drawer === 'all' ? '' : 'all')}
            >
              <span aria-hidden="true">{drawer === 'all' ? '▾' : '▴'}</span>
              <small>Toutes</small>
              <b>{unlockedCount}</b>
            </button>
          )}
          {gardeHours.length > 0 && !selectedLineage && (
            <GardeSelect className="garde-mobile" game={game} cropId={selectedCrop}
              hours={gardeHours} value={garde} onChange={setGardeChoice} now={now} />
          )}
          <button
            className={`buy-seeds ${selectedSeedCount === 0 ? 'needs-seeds' : ''}`}
            onClick={() => {
              setDrawer('');
              setModal('seeds');
            }}
            aria-label="Ouvrir la graineterie"
          >
            <PixelIcon id="seeds" />
            <b>+</b>
            <small>Graines</small>
          </button>
        </div>
        {drawer === 'all' && (
          <section
            className="seed-all"
            id="seed-all"
            aria-label="Toutes les graines"
          >
            <header>
              <b>Toutes les graines</b>
              <small>
                ★ épingle une graine dans le dock · {favorites.length}/
                {DOCK_FAVORITES} · touches 1 à {favorites.length}
              </small>
            </header>
            <ul>
              {CROPS.filter((item) => item.level <= currentLevel).map((item) => {
                const pinned = favorites.includes(item.id);
                return (
                  <li key={item.id} data-pinned={pinned || undefined}>
                    <button
                      className={selectedCrop === item.id ? 'selected' : ''}
                      aria-pressed={selectedCrop === item.id}
                      data-season={inSeason(game, item.id) || undefined}
                      title={inSeason(game, item.id) ? `${item.name} · de saison (+8 % à la vente)` : undefined}
                      onClick={() => {
                        setSelectedCrop(item.id);
                        setSelectedLineage(0);
                        setDrawer('');
                      }}
                    >
                      <PixelIcon id={item.id} />
                      <span>
                        <b>{item.name}</b>
                        <small>
                          {game.seeds[item.id] || 0} graine
                          {(game.seeds[item.id] || 0) > 1 ? 's' : ''}
                          {inSeason(game, item.id) && <span className="sr-only">, de saison</span>}
                        </small>
                      </span>
                    </button>
                    <button
                      className="seed-pin"
                      aria-pressed={pinned}
                      disabled={
                        pinned
                          ? favorites.length <= 1
                          : favorites.length >= DOCK_FAVORITES
                      }
                      aria-label={
                        pinned
                          ? `Retirer ${item.name} du dock`
                          : `Épingler ${item.name} dans le dock`
                      }
                      title={
                        !pinned && favorites.length >= DOCK_FAVORITES
                          ? `${DOCK_FAVORITES} graines au plus : retirez-en une d’abord`
                          : undefined
                      }
                      onClick={() => save(toggleFavorite(gameRef.current, item.id))}
                    >
                      {pinned ? '★' : '☆'}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
        <div
          className={`selected-action ${selectedSeedCount === 0 ? 'empty-stock' : ''}`}
        >
          <PixelIcon id={selected.id} />
          <div>
            <small className="selected-kicker">Culture choisie</small>
            <b>{selected.name}</b>
            <small className="selected-meta">
              <GrowTimeTip game={game} cropId={selected.id} now={now}>
                {duration(growTime(game, selected.id, now))}
              </GrowTimeTip>{' '}
              <span className="selected-price" aria-label={`récolte ${selected.price} pièces`}>
                <span className="selected-price-text">· récolte </span>{selected.price} ◉
              </span>
            </small>
          </div>
          {game.lineages.some((lineage) => lineage.crop === selectedCrop) && <label className="dock-lineage-select"><span className="dock-label">Variété</span>
            <select value={selectedLineage} onChange={(event) => setSelectedLineage(Number(event.target.value))}>
              <option value={0}>Graine classique · {game.seeds[selectedCrop] || 0}</option>
              {game.lineages.filter((lineage) => lineage.crop === selectedCrop).map((lineage) => <option key={lineage.id} value={lineage.id}>{lineage.name} · {lineage.seeds}</option>)}
            </select>
          </label>}
          {gardeHours.length > 0 && !selectedLineage && (
            <GardeSelect game={game} cropId={selectedCrop} hours={gardeHours}
              value={garde} onChange={setGardeChoice} now={now} />
          )}
          <span className="seed-stock">
            {selectedSeedCount > 0 ? `× ${selectedSeedCount}` : 'Stock épuisé'}
          </span>
        </div>
        <div className="dock-actions">
          <button
            className={`dock-seed-toggle ${selectedSeedCount === 0 ? 'needs-seeds' : ''}`}
            aria-expanded={drawer === 'seeds'}
            aria-controls="seed-drawer"
            aria-label={`Culture choisie : ${selected.name}, ${selectedSeedCount} graines. Changer de graine`}
            onClick={() => setDrawer(drawer === 'seeds' ? '' : 'seeds')}
          >
            <PixelIcon id={selected.id} />
            <b>{selectedSeedCount}</b>
            <span>{selected.name}</span>
          </button>
          <button
            className="dock-shop"
            onClick={() => {
              setDrawer('');
              setModal('seeds');
            }}
            aria-label="Ouvrir la graineterie"
          >
            <PixelIcon id="seeds" />
            <span>Graines</span>
          </button>
          {bulkActions.length > 0 && (
            <button
              className="dock-bulk-toggle"
              aria-expanded={drawer === 'actions'}
              aria-controls="bulk-drawer"
              onClick={() => setDrawer(drawer === 'actions' ? '' : 'actions')}
            >
              <span>Actions</span>
              {ready > 0 && game.upgrades.includes('tools') && <b>{ready}</b>}
            </button>
          )}
          {game.bulkJob && (
            <output className="bulk-job-status" aria-live="polite"
              title={`Palier ${upgradeTier(game, game.bulkJob.kind === 'water' ? 'watering-can'
                : game.bulkJob.kind === 'harvest' ? 'tools' : 'auto')}/5 · geste ${(gestureMs(game, game.bulkJob.kind) / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} s`}>
              <span>{chores.map((kind) => ({ water: 'Arrosage', harvest: 'Récolte', sow: 'Semis' })[kind]).join(' + ')}
                {' · '}{game.bulkJob.completed}/{game.bulkJob.total}
              </span>
              <progress value={game.bulkJob.completed} max={game.bulkJob.total} />
              <button onClick={() => dispatch('bulkCancel')} aria-label="Arrêter le geste en cours">Arrêter</button>
            </output>
          )}
          <div className="bulk-actions" id="bulk-drawer">
            {bulkActions.map((bulk) => (
              <button
                key={bulk.action}
                aria-label={bulk.full}
                title={bulk.full}
                aria-pressed={chores.includes(bulk.action)}
                onClick={() => {
                  // 0.18 : le tiroir reste ouvert pour cumuler les tâches ; un second clic arrête celle-ci.
                  if (chores.includes(bulk.action)) return dispatch('bulkCancel', { id: bulk.action });
                  dispatch('bulkStart', {
                    id: bulk.action,
                    crop: bulk.action === 'sow' ? selectedCrop : undefined,
                    lineageId: bulk.action === 'sow' ? selectedLineage || undefined : undefined,
                    garde: bulk.action === 'sow' && garde ? garde : undefined,
                  });
                }}
              >
                <PixelIcon id={bulk.icon} />
                <span>{bulk.label}</span>
                {!!bulk.count && <b key={bulk.count}>{bulk.count}</b>}
              </button>
            ))}
          </div>
          <button
            id="basket-button"
            onClick={() => {
              setDrawer('');
              setModal('basket');
            }}
            aria-label={`Panier, ${inventory} produits`}
          >
            <PixelIcon id="action-panier" />
            <span>Panier</span>
          </button>
          <button
            className="dock-notebook"
            data-new={unseenPages.length > 0 || undefined}
            onClick={() => {
              setDrawer('');
              openNotebook();
            }}
            aria-label={`Ouvrir le carnet${badges.total ? `, ${badges.total} chose${badges.total > 1 ? 's' : ''} à faire` : ''}${unseenPages.length ? `, ${unseenPages.length} nouvelle${unseenPages.length > 1 ? 's' : ''} page${unseenPages.length > 1 ? 's' : ''}` : ''}`}
          >
            <PixelIcon id="action-carnet" />
            <span>Carnet</span>
            {badges.total > 0 && <b key={badges.total} className="todo-badge">{badges.total}</b>}
          </button>
        </div>
      </nav>

      {loaded && <GameAudio game={game} dialogOpen={dialogOpen} />}
      <div className="notification-slot" hidden={dialogOpen}>
        {notice && !dialogOpen && (
          <output key={`notice-${notice.id}`} className="toast-notice">
            {notice.text}
          </output>
        )}
      </div>
      {recovery && <output className="save-warning"><button onClick={() => setRecoveryOpen(true)}>Récupérer la sauvegarde protégée</button></output>}
      <SaveRecoveryDialog issue={recovery} open={recoveryOpen} onOpenChange={setRecoveryOpen} onRetry={retryRecovery} onNew={() => finishRecovery(fresh(Date.now()))} />
      {saveError && (
        <div className="save-warning" role="alert">
          La sauvegarde locale est indisponible. Exportez votre partie avant de
          quitter.
        </div>
      )}

      <CarnetDialog
        open={modal === 'notebook'}
        onClose={() => setModal('')}
        tab={notebookTab}
        onPage={showPage}
        pages={pages}
        badges={badges.badges}
        unseen={unseenPages}
        notice={notice?.text}
        aside={notebookTab === SUMMARY && (
          <span className="carnet-season" title={season.title}>
            <PixelIcon id={season.icon} />
            {season.short}
          </span>
        )}
      >
        {notebookTab === SUMMARY ? (
          <SummaryPage game={game} now={now} pages={pages} badges={badges.badges} onPage={showPage} />
        ) : (
          ({
              projects: () => <ProjectsPage game={game} now={now} dispatch={errandDispatch} askConfirm={askConfirm} />,
              festival: () => <FairsPage game={game} dispatch={dispatch} />,
              valley: () => <ValleyPanel game={game} now={now} dispatch={dispatch} />,
              orders: () => <OrdersPanel game={game} now={now} dispatch={dispatch} askConfirm={askConfirm} />,
              upgrades: () => <UpgradesPanel key={Math.abs(upgradeFocus)} game={game} dispatch={dispatch} focusRestore={upgradeFocus > 0} />,
              goals: () => <GoalsPanel game={game} dispatch={dispatch} />,
              lineages: () => <LineagesPanel game={game} dispatch={dispatch} />,
              mastery: () => <MasteryPage game={game} dispatch={dispatch} now={now} />,
              skills: () => <SkillsPage game={game} dispatch={dispatch} />,
              recipes: () => <AtelierPage game={game} now={now} dispatch={errandDispatch} askConfirm={askConfirm} errands={errands} reduced={reduceMotion} />,
              friends: () => <FriendsPage game={game} dispatch={dispatch} askConfirm={askConfirm} />,
              collection: () => <CollectionPanel game={game} />,
              guide: () => (
                <GuidePage
                  game={game}
                  onReplay={(id) => {
                    save(tutorialReplay(gameRef.current, id));
                    setModal('');
                  }}
                  onToggle={(off) => save(tutorialSetOff(gameRef.current, off))}
                />
              ),
            } as Record<string, (() => ReactNode) | undefined>)[notebookTab]?.()
        )}
      </CarnetDialog>

      <Dialog
        open={modal === 'seeds'}
        onOpenChange={(open) => !open && setModal('')}
      >
        <DialogContent className="paper-dialog shop-dialog" initialFocus={seedDialogTitle}>
          <header className="shop-sign">
            <span className="shop-awning" aria-hidden="true" />
            <div className="shop-title">
              <DialogTitle ref={seedDialogTitle} tabIndex={-1}>
                La graineterie
              </DialogTitle>
              <DialogDescription>
                Un sachet, une quantité : c’est acheté.
              </DialogDescription>
            </div>
            <ShopPurse coins={game.coins} reduced={reduceMotion} />
          </header>
          <DialogNotice notice={notice?.text} />
          <div className="dialog-scroll">
            {canRescue(game) && (
              <section className="seed-rescue available">
                <div>
                  <b>Le coup de pouce de Rosalie</b>
                  <p>Votre ferme est à l’arrêt : Rosalie vous offre 3 graines de radis.</p>
                </div>
                <button onClick={() => dispatch('rescue')}>
                  Recevoir 3 graines de radis
                </button>
              </section>
            )}
            <SeedShop
              key={String(modal === 'seeds')}
              game={game}
              now={now}
              initialCrop={selectedCrop}
              reduced={reduceMotion}
              dispatch={dispatch}
              onBought={(id) => { setSelectedCrop(id); setSelectedLineage(0); }}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={modal === 'basket'}
        onOpenChange={(open) => !open && setModal('')}
      >
        <DialogContent className="paper-dialog shop-dialog basket-dialog">
          <header className="shop-sign">
            <span className="shop-awning" aria-hidden="true" />
            <div className="shop-title">
              <DialogTitle>Le panier de Rosalie</DialogTitle>
              <DialogDescription>
                Vendez, ou gardez pour un projet, une commande, une recette ou un cadeau.
              </DialogDescription>
            </div>
            <ShopPurse coins={game.coins} reduced={reduceMotion} />
          </header>
          <DialogNotice notice={notice?.text} />
          <div className="dialog-scroll">
            {inventory === 0 ? (
              <div className="empty-state">
                <PixelIcon id="basket" />
                <p>Le panier attend sa première récolte.</p>
              </div>
            ) : (
              <BasketList game={game} now={now} dispatch={dispatch} askConfirm={askConfirm} />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={modal === 'settings'}
        onOpenChange={(open) => !open && setModal('')}
      >
        <DialogContent className="paper-dialog">
          <DialogTitle>Réglages de la ferme</DialogTitle>
          <DialogDescription>
            Adaptez le rythme sans perdre les retours utiles.
          </DialogDescription>
          <p className="settings-version">Version {BUILD}</p>
          <DialogNotice notice={notice?.text} />
          <div className="dialog-scroll">
            <div className="settings-list">
              {systemReduced && <output className="settings-motion-status">
                {game.settings.forceAnimations && !game.settings.reduceMotion
                  ? 'Ce navigateur demande moins de mouvement, mais les animations du jeu sont rétablies ici.'
                  : 'Ce navigateur demande moins de mouvement. Activez « Forcer les animations sur cet appareil » pour retrouver les effets.'}
              </output>}
              <SettingToggle
                label="Racheter la graine au semis"
                description="Si le stock est vide, la graine est achetée au moment de planter, quand la bourse le permet."
                active={game.settings.autoBuySeeds}
                onClick={() =>
                  dispatch('setting', {
                    setting: 'autoBuySeeds',
                    value: !game.settings.autoBuySeeds,
                  })
                }
              />
              <SettingToggle
                label="Me prévenir quand c’est prêt"
                description="Quand l’onglet du jeu est en arrière-plan : une notification du navigateur pour les récoltes prêtes, les œufs, un plat cuit ou le retour de la caravane."
                active={game.settings.notifyReady}
                onClick={async () => {
                  if (game.settings.notifyReady) {
                    dispatch('setting', { setting: 'notifyReady', value: false });
                    return;
                  }
                  if (await askNotificationPermission()) dispatch('setting', { setting: 'notifyReady', value: true });
                  else notify('Le navigateur bloque les notifications de ce site : autorisez-les dans ses réglages, puis réessayez.');
                }}
              />
              <SettingToggle
                label="Réduire les animations"
                description="Supprime les effets décoratifs et l’animation des pas. Rosalie se déplace toujours au même rythme."
                active={game.settings.reduceMotion}
                onClick={() =>
                  dispatch('setting', {
                    setting: 'reduceMotion',
                    value: !game.settings.reduceMotion,
                  })
                }
              />
              <SettingToggle
                label="Forcer les animations sur cet appareil"
                description="Si Windows ou le navigateur réduit les mouvements, ce choix rétablit les animations du jeu. Le réglage « Réduire les animations » garde la priorité."
                active={game.settings.forceAnimations}
                onClick={() => dispatch('setting', {
                  setting: 'forceAnimations',
                  value: !game.settings.forceAnimations,
                })}
              />
              <AudioSettings />
            </div>
            <div className="save-actions">
              <button onClick={() => exportGame(gameRef.current)}>
                Exporter la sauvegarde
              </button>
              <label>
                Importer une sauvegarde
                <input
                  type="file"
                  accept=".json"
                  onChange={async (event) => {
                    const input = event.currentTarget;
                    const file = input.files?.[0];
                    if (!file) return;
                    let raw = '';
                    try {
                      raw = await file.text();
                      const imported = parseImportedGame(raw);
                      if (saveIsBlocked()) {
                        if (!finishRecovery(imported)) return;
                      } else save(imported);
                      setEpoch((v) => v + 1);
                      setFeedback(undefined);
                      notify('Votre ferme a été restaurée et migrée.');
                      setModal('');
                    } catch {
                      setRecovery(protectUnreadableSave(raw, 'import'));
                      setRecoveryOpen(true);
                      setModal('');
                    } finally { input.value = ''; }
                  }}
                />
              </label>
              <button
                className="danger-button"
                onClick={() => setResetOpen(true)}
              >
                Recommencer la partie
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={modal === 'home'}
        onOpenChange={(open) => !open && setModal('')}
      >
        <DialogContent className="paper-dialog home-dialog">
          <DialogTitle>La maison de Rosalie</DialogTitle>
          <DialogDescription>
            Un refuge paisible. Aucun coucher n’est obligatoire.
          </DialogDescription>
          <DialogNotice notice={notice?.text} />
          <div className="dialog-scroll">
            <div className="home-scene">
              <VillagerPortrait index={0} />
              <div>
                <b>Votre ferme vous attend toujours.</b>
                <p>
                  Les cultures et préparations continuent pendant votre absence.
                  Rien ne fane et aucune journée de connexion n’est imposée.
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <LevelUpScene info={cheerFor ? undefined : levelUp} onClose={() => setLevelUps(previous => previous.slice(1))} />
      {!coachHidden && (
        <TutorialCoach
          game={game}
          dialogOpen={modal !== ''}
          onRead={() => save(tutorialRead(gameRef.current))}
          onLater={() => save(tutorialSkipChapter(gameRef.current))}
          onOff={() => {
            save(tutorialSetOff(gameRef.current, true));
            notify('Conseils coupés. Ils se rallument dans le Guide du carnet.');
          }}
        />
      )}

      <Gazette
        game={game}
        now={now || game.saved}
        open={!!gazette}
        absence={gazette?.absence}
        onCollect={() => {
          closeGazette();
          collectOnFoot();
        }}
        onClose={closeGazette}
      />

      <Dialog
        open={!!projectDone}
        onOpenChange={(open) => !open && setProjectDone(undefined)}
      >
        <DialogContent className="level-dialog" showCloseButton={false}>
          <span className="level-spark">★</span>
          <DialogTitle>{projectDone?.title}</DialogTitle>
          <DialogDescription>{projectDone?.outro}</DialogDescription>
          <div className="reward-card">
            <PixelIcon id="projet-village" />
            <div>
              <b>{projectDone?.rewardName}</b>
              <p>{projectDone?.rewardDesc}</p>
            </div>
          </div>
          <div className="reward-card">
            <PixelIcon id="coin" />
            <div>
              <b>
                +{projectDone ? projectReward(projectDone).coins : 0} pièces · +{projectDone ? projectReward(projectDone).xp : 0} XP
              </b>
              <p>Un nouveau grand projet vous attend dans le carnet.</p>
            </div>
          </div>
          <button
            className="primary-button"
            onClick={() => {
              setProjectDone(undefined);
              openPanel('projects');
            }}
          >
            Choisir le prochain projet
          </button>
        </DialogContent>
      </Dialog>

      <GameConfirmDialog pending={pendingConfirm} onClose={() => setPendingConfirm(null)} />
      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Recommencer votre ferme ?</AlertDialogTitle>
          <AlertDialogDescription>
            Les pièces, cultures, relations et améliorations de cette partie
            seront effacées. Vous pouvez d’abord exporter votre sauvegarde.
          </AlertDialogDescription>
          <AlertDialogCancel>Garder ma ferme</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              const next = fresh();
              if (saveIsBlocked()) {
                if (!finishRecovery(next)) return;
              } else save(next);
              setSelectedCrop('radis');
              setSelectedLineage(0);
              setEpoch((v) => v + 1);
              setFeedback(undefined);
              setResetOpen(false);
              setModal('');
              notify('Une nouvelle ferme commence.');
            }}
          >
            Oui, recommencer
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
