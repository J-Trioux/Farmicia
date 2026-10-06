'use client';

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Settings, Sprout, Volume2, VolumeX } from 'lucide-react';
import { CultureJournal, SkillsPanel, FriendBook } from '@/components/progression';
import { FarmMap, type Errand } from '@/components/farm/farm-map';
import { GuidePanel, TutorialCoach } from '@/components/tutorial';
import { tutorialAdvance, tutorialRead, tutorialReplay, tutorialSetOff, tutorialSkipChapter } from '@/lib/tutorial';
import { BuffChips, ProjectsPanel } from '@/components/projects';
import { GrowTimeTip } from '@/components/grow-time-tip';
import { CoinCounter, XpBar } from '@/components/hud';
import { LevelUpScene } from '@/components/level-up';
import { FestivalTab } from '@/components/festival/festival-tab';
import { LineagesPanel } from '@/components/lineages';
import { ValleyPanel } from '@/components/valley';
import { GameConfirmDialog, type AskConfirm, type PendingConfirm } from '@/components/game-confirm';
import { PixelIcon, VillagerPortrait } from '@/components/farm/sprites';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { BUILD, CROPS, LEVEL_XP, MAX_LEVEL, GOALS, goalProgress, PROJECTS, RECIPES, readyDishes, upgradeTier, gestureMs, bulkChores, act, crop, duration, gardeOptions, fresh, growTime, level, type ActionArgument, type Game, type VillageProject } from '@/lib/game';
import { actionFeedback, plainMessage, type ActionFeedback } from '@/lib/action-feedback';
import { weatherFor } from '@/lib/farm-visuals';
import { useReducedMotion } from '@/hooks/use-game-clock';
import { reduceMotionFor } from '@/lib/motion';
import { absenceSummary, awayLabel, canRescue, DOCK_FAVORITES, dockFavorites, toggleFavorite, notebookBadges, inSeason, seasonChip } from '@/lib/farm-ui';
import { exportGame, loadGame, parseImportedGame, persistGame, SaveRecoveryError, protectUnreadableSave, acceptRecoveredGame, saveIsBlocked } from '@/lib/save';
import { SaveRecoveryDialog } from '@/components/save-recovery';
import { NOTEBOOK_CHAPTERS, PAGE_KEYS, markPageSeen, newPages, notebookPage, pageKeysHint, revealedPages, settleNotebook, type NotebookPage } from '@/lib/notebook';
import { OrdersPanel } from '@/components/notebook/orders-panel';
import { GardeSelect } from '@/components/notebook/seed-card';
import { SeedShop, ShopPurse } from '@/components/seed-shop';
import { BasketList } from '@/components/notebook/basket-list';
import { DialogNotice } from '@/components/notebook/dialog-notice';
import { UpgradesPanel } from '@/components/notebook/upgrades-panel';
import { GoalsPanel } from '@/components/notebook/goals-panel';
import { WorkshopPanel } from '@/components/notebook/workshop-panel';
import { KitchenDialog } from '@/components/kitchen';
import { useLevelCheer } from '@/hooks/use-level-cheer';
import { CollectionPanel } from '@/components/notebook/collection-panel';
import { SettingToggle } from '@/components/notebook/setting-toggle';
import { AudioSettings } from '@/components/audio-settings';
import { GameAudio, useAudioPrefs } from '@/components/game-audio';
import { gameAudio } from '@/lib/audio/engine';
import { cueFor } from '@/lib/audio/cues';

const ERRAND_PLACE: Record<Errand['action'], [Errand['place'], Errand['activity']]> = {
  craft: ['atelier', 'cook'],
  collect: ['atelier', 'cook'],
  hens: ['poulailler', 'eggs'],
  orchard: ['verger', 'harvest'],
};
const ERRAND_NOTICE: Record<Errand['action'], string> = {
  craft: 'Rosalie part à l’atelier mettre la recette sur le feu.',
  collect: 'Rosalie part à l’atelier sortir les plats.',
  hens: 'Rosalie part au poulailler.',
  orchard: 'Rosalie part cueillir au verger.',
};

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
  const [notebookTab, setNotebookTab] = useState('projects');
  // 0.13 : un lieu de l’anneau ouvre « Améliorer » sur « Restaurer le domaine ».
  const [upgradeFocus, setUpgradeFocus] = useState(0);
  const [notices, setNotices] = useState<{ id: number; text: string }[]>([]);
  const noticeId = useRef(0);
  const [drawer, setDrawer] = useState<'' | 'seeds' | 'actions' | 'all'>('');
  const [absence, setAbsence] = useState<ReturnType<typeof absenceSummary>>();
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
  const [cheerFor, announceLevel] = useLevelCheer(modal === '' && !projectDone && !absence);
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
        if (summary.worthShowing) setAbsence(summary);
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
      if (action !== 'bulkTick' || !result.g.bulkJob) notify(result.message);
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
    notify(ERRAND_NOTICE[action]);
    return undefined;
  }, [dispatch, notify]);
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
      // 0.17.5 : l’atelier s’ouvre dans sa propre fenêtre.
      if (panel === 'recipes') {
        const seen = markPageSeen(gameRef.current, panel);
        if (seen !== gameRef.current) save(seen);
        setModal('kitchen');
        return;
      }
      showPage(panel);
      setModal('notebook');
    },
    [notify, showPage, save],
  );
  /** Ouvre le carnet sur une nouvelle page, sinon sur la dernière lue si elle existe. */
  const openNotebook = useCallback(() => {
    setUpgradeFocus((n) => -Math.abs(n));
    const g = gameRef.current;
    const open = revealedPages(g);
    const unseen = newPages(g)[0];
    showPage(
      unseen?.value ||
        (open.some((page) => page.value === notebookTab)
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
        document
          .querySelector<HTMLElement>(
            '.book-dialog [data-slot="tabs-trigger"][data-active]',
          )
          ?.focus(),
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
  const weather = weatherFor(game, now);
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
      { action: 'harvest', icon: 'tools', label: 'Récolter', full: 'Parcourir les récoltes', count: ready },
    game.upgrades.includes('watering-can') &&
      { action: 'water', icon: 'water', label: 'Arroser', full: 'Arroser les parcelles' },
    game.upgrades.includes('auto') &&
      { action: 'sow', icon: 'seeds', label: 'Semer', full: 'Semer les parcelles libres' },
  ].filter(Boolean) as {
    action: 'harvest' | 'water' | 'sow'; icon: string; label: string;
    full: string; count?: number;
  }[];
  const pages = useMemo(() => revealedPages(game), [game]);
  const activeNotebookChapter = NOTEBOOK_CHAPTERS.find((chapter) =>
    chapter.pages.some((page) => page.value === notebookTab),
  ) || NOTEBOOK_CHAPTERS[0];
  const unseenPages = newPages(game);
  // Seules les pages visibles comptent dans les pastilles du carnet.
  const badges = useMemo(() => {
    const all = notebookBadges(game, now).badges;
    const visible: typeof all = {};
    for (const page of pages) visible[page.value] = all[page.value];
    const total = Object.values(visible).reduce((sum, n) => sum + (n || 0), 0);
    return { badges: visible, total };
  }, [game, now, pages]);
  const [dismissedAnnounce, setDismissedAnnounce] = useState<string[]>([]);
  const announce = unseenPages.find(
    (page) => !dismissedAnnounce.includes(page.value),
  );
  const dialogOpen =
    modal !== '' || !!levelUp || !!projectDone || !!absence || resetOpen || recoveryOpen;
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
  const coachHidden = !loaded || !!recovery || !!levelUp || !!projectDone || !!absence || resetOpen || modal === 'settings' || modal === 'home';
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
            <h1>Les Jardins de Rosalie</h1>
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
        {/* 0.17 : les outils du coin haut droit (ciel, saison, bonus, son, réglages). */}
        <div className="hud-tools">
        <div
          className="hud-weather"
          data-tip={weather.label}
          aria-label={weather.label}
        >
          <PixelIcon id={weather.pixel} />
          <small>{weather.label}</small>
        </div>
        <div className="hud-weather hud-season" data-season={season.id}
          data-tip={season.title} aria-label={season.title}>
          <PixelIcon id={season.icon} />
          <small>{season.short}</small>
        </div>
        <BuffChips g={game} now={now} />
        <button
          className="hud-button"
          onClick={toggleSound}
          aria-label={sound ? 'Couper le son' : 'Activer le son'}
          data-tip={sound ? 'Couper le son' : 'Activer le son'}
        >
          {sound ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
        <button
          className="hud-button"
          onClick={() => setModal('settings')}
          aria-label="Paramètres"
          data-tip="Réglages"
        >
          <Settings size={20} />
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
      {game.trackedGoals.length > 0 && <div className="farm-goal-ribbon" aria-label="Objectifs suivis">
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
              <PixelIcon id="tools" />
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
            <PixelIcon id="basket" />
            <span>Panier</span>
            {inventory > 0 && <b key={inventory}>{inventory}</b>}
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
            <BookOpen size={21} />
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
        {feedback?.changed && !dialogOpen && (
          <div
            key={`feedback-${feedback.id}`}
            className="resource-feedback"
            aria-hidden="true"
          >
            {feedback.coins !== 0 && (
              <span
                className={`coin-gain ${feedback.coins < 0 ? 'coin-spent' : ''}`}
              >
                <PixelIcon id="coin" />
                {feedback.coins > 0 ? '+' : '−'}
                {Math.abs(feedback.coins)}
              </span>
            )}
            {feedback.xp > 0 && (
              <span className="xp-gain">
                <i aria-hidden="true">★</i>+{feedback.xp} XP
              </span>
            )}
            {feedback.items.slice(0, 3).map((item) => (
              <span
                key={item.id}
                className={`stock-gain quality-${item.quality}`}
              >
                <PixelIcon id={item.id} />
                <b>+{item.amount}</b> {item.name.replace(' · Ordinaire', '')}
              </span>
            ))}
            {feedback.items.length > 3 && (
              <span className="more-gain">
                +{feedback.items.length - 3} autre
                {feedback.items.length - 3 > 1 ? 's' : ''}
              </span>
            )}
          </div>
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

      <Dialog
        open={modal === 'notebook'}
        onOpenChange={(open) => !open && setModal('')}
      >
        <DialogContent className="notebook-dialog book-dialog">
          <Tabs
            className="notebook-tabs"
            orientation="vertical"
            value={notebookTab}
            onValueChange={(value) => showPage(String(value))}
          >
            <nav
              className="book-spine"
              aria-label="Pages du carnet"
              data-pages={pages.length}
            >
              <header className="book-cover">
                <PixelIcon id="seeds" />
                <div>
                  <DialogTitle>Le carnet</DialogTitle>
                  <DialogDescription>de la ferme de Rosalie</DialogDescription>
                </div>
              </header>
              <fieldset className="book-chapter-picker">
                <legend className="sr-only">Chapitres du carnet</legend>
                {NOTEBOOK_CHAPTERS.map((chapter) => {
                  const visible = chapter.pages.filter((page) =>
                    pages.some((open) => open.value === page.value),
                  );
                  if (!visible.length) return null;
                  const todo = visible.reduce(
                    (sum, page) => sum + (badges.badges[page.value] || 0),
                    0,
                  );
                  const isActive = activeNotebookChapter.id === chapter.id;
                  const chapterIcon = {
                    village: 'basket', farm: 'seeds', kitchen: 'pain', memories: 'album',
                  }[chapter.id] || 'seeds';
                  return (
                    <button
                      key={chapter.id}
                      type="button"
                      className="book-chapter-choice"
                      aria-pressed={isActive}
                      onClick={() => showPage(visible[0].value)}
                    >
                      <PixelIcon id={chapterIcon} />
                      <span>{chapter.label}</span>
                      {todo > 0 && <b aria-label={`${todo} à faire`}>{todo}</b>}
                    </button>
                  );
                })}
              </fieldset>
              <div className="book-section-label">
                <span>Pages du chapitre</span>
                <small>{activeNotebookChapter.pages.filter((page) => pages.some((open) => open.value === page.value)).length}</small>
              </div>
              <TabsList className="notebook-tab-list">
                {NOTEBOOK_CHAPTERS.filter((chapter) => chapter.id === activeNotebookChapter.id).map((chapter) => {
                  const visible = chapter.pages.filter((page) =>
                    pages.some((open) => open.value === page.value),
                  );
                  return (
                    <Fragment key={chapter.id}>
                      {visible.map(({ value, label, icon }) => {
                        const count = badges.badges[value];
                        const isNew = unseenPages.some(
                          (page) => page.value === value,
                        );
                        const key =
                          PAGE_KEYS[pages.findIndex((p) => p.value === value)];
                        return (
                          <TabsTrigger
                            key={value}
                            value={value}
                            data-new={isNew || undefined}
                            aria-label={[
                              label,
                              isNew && 'nouvelle page',
                              count && `${count} à faire`,
                            ]
                              .filter(Boolean)
                              .join(', ')}
                            aria-keyshortcuts={key?.toUpperCase()}
                            title={key ? `${label} · touche ${key.toUpperCase()}` : label}
                          >
                            <PixelIcon id={icon} />
                            <span className="book-tab-label">{label}</span>
                            {isNew && (
                              <em className="book-tab-new" aria-hidden="true">
                                Nouveau
                              </em>
                            )}
                            {!!count && (
                              <b className="todo-badge" aria-hidden="true">
                                {count}
                              </b>
                            )}
                          </TabsTrigger>
                        );
                      })}
                    </Fragment>
                  );
                })}
              </TabsList>
              <footer
                className="book-hints"
                aria-hidden="true"
                title="Touches des pages, flèches pour feuilleter, Échap pour fermer"
              >
                {pageKeysHint(pages.length).map((hint, index) => (
                  <Fragment key={hint}>
                    {index > 0 && ' '}
                    <kbd>{hint}</kbd>
                  </Fragment>
                ))}{' '}
                · <kbd>↑</kbd>
                <kbd>↓</kbd> · <kbd>Échap</kbd>
              </footer>
            </nav>
            <section className="book-page">
              {(() => {
                const page =
                  pages.find((p) => p.value === notebookTab) || pages[0];
                return (
                  <header className="book-page-head" key={page.value}>
                    <small>{page.chapter}</small>
                    <h3>{page.label}</h3>
                    <p>{page.tagline}</p>
                  </header>
                );
              })()}
              <DialogNotice notice={notice?.text} />
              <TabsContent value="projects">
                <ProjectsPanel g={game} now={now} dispatch={errandDispatch} askConfirm={askConfirm} />
              </TabsContent>
              <TabsContent value="festival">
                <FestivalTab game={game} dispatch={dispatch} />
              </TabsContent>
              <TabsContent value="valley">
                <ValleyPanel game={game} now={now} dispatch={dispatch} />
              </TabsContent>
              <TabsContent value="orders">
                <OrdersPanel game={game} now={now} dispatch={dispatch} askConfirm={askConfirm} />
              </TabsContent>
              <TabsContent value="upgrades">
                <UpgradesPanel key={Math.abs(upgradeFocus)} game={game} dispatch={dispatch} focusRestore={upgradeFocus > 0} />
              </TabsContent>
              <TabsContent value="goals">
                <GoalsPanel game={game} dispatch={dispatch} />
              </TabsContent>
              <TabsContent value="lineages">
                <LineagesPanel game={game} dispatch={dispatch} />
              </TabsContent>
              <TabsContent value="mastery">
                <CultureJournal g={game} dispatch={dispatch} now={now} />
              </TabsContent>
              <TabsContent value="skills">
                <SkillsPanel g={game} dispatch={dispatch} />
              </TabsContent>
              <TabsContent value="recipes">
                <WorkshopPanel game={game} now={now} errands={errands} onEnter={() => setModal('kitchen')} />
              </TabsContent>
              <TabsContent value="friends">
                <FriendBook g={game} dispatch={dispatch} askConfirm={askConfirm} />
              </TabsContent>
              <TabsContent value="collection">
                <CollectionPanel game={game} />
              </TabsContent>
              <TabsContent value="guide">
                <GuidePanel
                  game={game}
                  onReplay={(id) => {
                    save(tutorialReplay(gameRef.current, id));
                    setModal('');
                  }}
                  onToggle={(off) => save(tutorialSetOff(gameRef.current, off))}
                />
              </TabsContent>
            </section>
          </Tabs>
        </DialogContent>
      </Dialog>

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

      <KitchenDialog open={modal === 'kitchen'} onClose={() => setModal('')} game={game} now={now}
        dispatch={errandDispatch} askConfirm={askConfirm} errands={errands} notice={notice?.text} />

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

      <Dialog
        open={!!absence}
        onOpenChange={(open) => !open && setAbsence(undefined)}
      >
        <DialogContent className="paper-dialog absence-dialog">
          <DialogTitle>Pendant votre absence</DialogTitle>
          <DialogDescription>
            {absence
              ? `Absence : ${awayLabel(absence.away)}. La ferme a continué de pousser sans vous.`
              : ''}
          </DialogDescription>
          <div className="dialog-scroll">
            <ul className="absence-list">
              {absence &&
                Object.entries(absence.crops).map(([id, count]) => (
                  <li key={id}>
                    <PixelIcon id={id} />
                    <span>
                      {crop(id).name} · {count} parcelle{count > 1 ? 's' : ''} à
                      récolter
                    </span>
                  </li>
                ))}
              {absence?.eggs && (
                <li>
                  <PixelIcon id="oeuf" />
                  <span>4 œufs frais au poulailler</span>
                </li>
              )}
              {absence?.orchard && (
                <li>
                  <PixelIcon id="fruitTree" />
                  <span>Le verger a donné ses fruits</span>
                </li>
              )}
              {absence?.dish && (
                <li>
                  <PixelIcon id={absence.dish} />
                  <span>
                    {RECIPES.find((r) => r.id === absence.dish)?.name} est prêt
                    à l’atelier
                  </span>
                </li>
              )}
            </ul>
            {absence && absence.ripe > 0 && !absence.canHarvest && (
              <p className="absence-hint">
                Les cultures se cueillent sur la carte : glissez sur les
                parcelles, ou installez les outils de jardinier pour lancer
                une cueillette progressive.
              </p>
            )}
          </div>
          <div className="absence-actions">
            {absence?.collectable && (
              <button
                className="primary-button"
                onClick={() => {
                  setAbsence(undefined);
                  collectOnFoot();
                }}
              >
                {absence.ripe > 0 && absence.canHarvest ? 'Envoyer Rosalie tout récupérer et cueillir' : 'Envoyer Rosalie tout récupérer'}
              </button>
            )}
            <button
              className="secondary-button"
              onClick={() => setAbsence(undefined)}
            >
              Retour à la ferme
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!projectDone}
        onOpenChange={(open) => !open && setProjectDone(undefined)}
      >
        <DialogContent className="level-dialog" showCloseButton={false}>
          <span className="level-spark">★</span>
          <DialogTitle>{projectDone?.title}</DialogTitle>
          <DialogDescription>{projectDone?.outro}</DialogDescription>
          <div className="reward-card">
            <PixelIcon id="quality" />
            <div>
              <b>{projectDone?.rewardName}</b>
              <p>{projectDone?.rewardDesc}</p>
            </div>
          </div>
          <div className="reward-card">
            <PixelIcon id="coin" />
            <div>
              <b>
                +{projectDone?.coins} pièces · +{projectDone?.xp} XP
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
