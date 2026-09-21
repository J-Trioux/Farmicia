'use client';
import {
  CultureJournal,
  RecipeBook,
  FriendBook,
} from '@/components/progression';
import {
  BUILD,
  LEVEL_XP,
  growTime,
  marketEvent,
  marketBonus,
  itemName,
  itemIcon,
} from '@/lib/game';
import { useEffect, useRef, useState } from 'react';
import {
  Sprout,
  BookOpen,
  Settings,
  Volume2,
  VolumeX,
  Sun,
  Coins,
  ChevronRight,
  Check,
  Lock,
  Leaf,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import {
  CROPS,
  RECIPES,
  UPGRADES,
  MISSIONS,
  KEY,
  fresh,
  restore,
  level,
  crop,
  act,
  price,
  order,
  upgradeCost,
  duration,
  type ActionArgument,
  type Game,
} from '@/lib/game';
export default function Home() {
  const [g, setG] = useState<Game>(fresh);
  const state = useRef(g);
  const [loaded, setLoaded] = useState(false);
  const [now, setNow] = useState(0);
  const [selected, setSelected] = useState('radis');
  const [tab, setTab] = useState('village');
  const [modal, setModal] = useState('');
  const [reset, setReset] = useState(false);
  const [sound, setSound] = useState(false);
  const [notice, setNotice] = useState('');
  const [saveError, setSaveError] = useState(false);
  const [pop, setPop] = useState<number | null>(null);
  const audio = useRef<AudioContext | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function notify(text: string) {
    setNotice(text);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setNotice(''), 4500);
  }
  function save(next: Game) {
    state.current = next;
    setG(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
      setSaveError(false);
    } catch {
      setSaveError(true);
    }
  }
  useEffect(() => {
    const t = Date.now();
    let saved = fresh(t);
    try {
      saved = restore(localStorage.getItem(KEY));
    } catch {
      setSaveError(true);
    }
    state.current = saved;
    setG(saved);
    setNow(t);
    setLoaded(true);
    if (saved.plots.some((p) => p && p.end <= t))
      notify('Bon retour ! Vos récoltes vous attendent, bien à l’abri.');
    const i = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(i);
  }, []);
  function play() {
    if (!sound) return;
    try {
      audio.current ??= new AudioContext();
      void audio.current.resume();
      const osc = audio.current.createOscillator(),
        gain = audio.current.createGain();
      osc.connect(gain);
      gain.connect(audio.current.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(660, audio.current.currentTime);
      osc.frequency.exponentialRampToValueAtTime(
        990,
        audio.current.currentTime + 0.12,
      );
      gain.gain.setValueAtTime(0.06, audio.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        audio.current.currentTime + 0.3,
      );
      osc.start();
      osc.stop(audio.current.currentTime + 0.3);
    } catch {}
  }
  function dispatch(action: string, arg?: ActionArgument) {
    setNow(Date.now());
    const result = act(state.current, action, arg, Date.now());
    if (result.g !== state.current) {
      save(result.g);
      play();
      if (action === 'harvest' && typeof arg === 'number') {
        setPop(arg);
        setTimeout(() => setPop(null), 850);
      }
    }
    notify(result.message);
    return result;
  }
  function plotClick(index: number) {
    const p = state.current.plots[index];
    if (p && p.end <= Date.now()) dispatch('harvest', index);
    else if (p) dispatch('water', index);
    else dispatch('plant', { index, crop: selected });
  }
  useEffect(() => {
    if (!loaded) return;
    const context = (document as any).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = (tool: any) => {
      try {
        Promise.resolve(
          context.registerTool(tool, { signal: lifecycle.signal }),
        ).catch(() => {});
      } catch {}
    };
    register({
      name: 'read_garden',
      description:
        'Lire le niveau, les pièces, les graines et les parcelles du jardin.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute: () => ({
        level: level(state.current),
        coins: state.current.coins,
        seeds: state.current.seeds,
        plots: state.current.plots,
        stock: state.current.stock,
      }),
    });
    register({
      name: 'tend_garden',
      description:
        'Planter, arroser ou récolter une liste de parcelles du jardin. Les indices commencent à zéro.',
      inputSchema: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['plant', 'water', 'harvest'] },
          indices: {
            type: 'array',
            items: { type: 'integer', minimum: 0 },
            minItems: 1,
            maxItems: 18,
          },
          crop: { type: 'string', enum: CROPS.map((c) => c.id) },
        },
        required: ['action', 'indices'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false },
      execute: (input: any) => {
        if (
          !input ||
          !['plant', 'water', 'harvest'].includes(input.action) ||
          !Array.isArray(input.indices) ||
          !input.indices.length ||
          input.indices.length > 18 ||
          input.indices.some(
            (i: any) =>
              !Number.isInteger(i) || i < 0 || i >= state.current.plots.length,
          ) ||
          (input.action === 'plant' && !CROPS.some((c) => c.id === input.crop))
        )
          throw new Error('Action ou parcelles invalides.');
        const results = input.indices.map(
          (i: number) =>
            dispatch(
              input.action,
              input.action === 'plant' ? { index: i, crop: input.crop } : i,
            ).message,
        );
        return {
          results,
          coins: state.current.coins,
          stock: state.current.stock,
        };
      },
    });
    return () => lifecycle.abort();
  }, [loaded]);
  const lv = level(g),
    o = order(g),
    selectedCrop = crop(selected),
    ready = g.plots.filter((p) => p && p.end <= now).length,
    inventory = Object.values(g.stock).reduce((a, b) => a + b, 0),
    event = marketEvent(g, now),
    nextXP = LEVEL_XP[Math.min(lv, 9)],
    previousXP = LEVEL_XP[lv - 1],
    xpProgress =
      lv === 10 ? 100 : ((g.xp - previousXP) / (nextXP - previousXP)) * 100;
  const tutorial =
    g.harvests === 0
      ? g.plots.some(Boolean)
        ? 'Vos graines prennent vie. Touchez une pousse pour l’arroser et accélérer sa croissance.'
        : 'Bienvenue au jardin ! Sélectionnez une graine, puis touchez une parcelle pour la planter.'
      : g.sold === 0
        ? 'Votre première récolte ! Ouvrez le panier pour la vendre, ou gardez-la pour Lucie.'
        : g.plots.length === 6
          ? 'Un peu plus de place ? Votre première extension coûte seulement 35 pièces, dans Améliorer.'
          : 'Un jardin à votre rythme. Les plantes vous attendront toujours, même après une longue absence.';
  return (
    <main className="game-shell">
      <header className="topbar">
        <a className="brand" href="#jardin">
          <span className="brand-mark">
            <Sprout size={27} />
          </span>
          <span>
            <small>{BUILD}</small>
            <h1>
              Les Jardins de Rosalie<span>✿</span>
            </h1>
          </span>
        </a>
        <div className="resources">
          <div className="level-badge">
            <span className="level-number">{lv}</span>
            <div>
              <b>
                Jardinier{' '}
                {lv < 3 ? 'en herbe' : lv < 6 ? 'passionné' : 'accompli'}
              </b>
              <div className="xp-track">
                <i style={{ width: xpProgress + '%' }} />
              </div>
              <small>
                {lv === 10
                  ? 'Niveau maximum'
                  : `${g.xp - previousXP} / ${nextXP - previousXP} XP`}
              </small>
            </div>
          </div>
          <span className="coin-pill">
            <Coins size={21} />
            <b>{g.coins}</b>
            <small>pièces</small>
          </span>
          <button
            className="icon-button"
            aria-label={sound ? 'Couper le son' : 'Activer le son'}
            onClick={() => setSound(!sound)}
          >
            {sound ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
          <button
            className="icon-button"
            aria-label="Paramètres"
            onClick={() => setModal('settings')}
          >
            <Settings size={20} />
          </button>
        </div>
      </header>
      <section className="workspace">
        <div className="garden-column" id="jardin">
          <div className="garden-heading">
            <div>
              <p className="eyebrow">VOTRE PETIT COIN DE NATURE</p>
              <h2>
                Le jardin <span>de tous les possibles.</span>
              </h2>
            </div>
            <div className="weather">
              <Sun size={23} />
              <span>
                Douce journée<small>Tout pousse à son rythme</small>
              </span>
            </div>
          </div>
          <div className="farm-scene">
            <div className="scene-top">
              <span className="scene-label">
                <Leaf size={15} /> Le potager de Rosalie
              </span>
              <span className="scene-label">
                {g.plots.length} parcelles ·{' '}
                {ready ? `${ready} à récolter` : 'la vie prend racine'}
              </span>
            </div>
            <div className={'plots plots-' + g.plots.length}>
              {g.plots.map((p, index) => {
                const progress = p
                  ? Math.min(
                      1,
                      Math.max(0, (now - p.start) / (p.end - p.start)),
                    )
                  : 0;
                const ripe = !!p && progress >= 1;
                return (
                  <button
                    key={index}
                    className={`plot ${p ? 'occupied' : ''} ${ripe ? 'ripe' : ''} ${pop === index ? 'popped' : ''}`}
                    aria-label={
                      p
                        ? `${ripe ? 'Récolter' : p.watered ? 'Croissance de' : 'Arroser'} ${crop(p.crop).name}, parcelle ${index + 1}`
                        : `Planter ${selectedCrop.name}, parcelle ${index + 1}`
                    }
                    onClick={() => plotClick(index)}
                    disabled={!loaded}
                  >
                    <span className="soil-lines" />
                    {p ? (
                      <>
                        <span
                          className={
                            'plant stage-' +
                            (ripe ? 3 : progress > 0.55 ? 2 : 1)
                          }
                        >
                          {ripe
                            ? crop(p.crop).fruit
                            : progress > 0.55
                              ? crop(p.crop).icon
                              : '🌱'}
                        </span>
                        {ripe ? (
                          <span className="plot-caption harvest">
                            Récolter <Check size={12} />
                          </span>
                        ) : (
                          <span className="plot-caption">
                            {p.watered ? '💧 ' : ''}
                            {duration((p.end - now) / 1000)}
                          </span>
                        )}
                        {!ripe && (
                          <span className="grow-track">
                            <i style={{ width: progress * 100 + '%' }} />
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="empty-plus">+</span>
                        <span className="empty-text">Planter</span>
                      </>
                    )}
                    {pop === index && (
                      <span className="harvest-pop">+1 ✨</span>
                    )}
                  </button>
                );
              })}
              {g.plots.length < 18 && (
                <button
                  className="expand-plot"
                  onClick={() => {
                    setTab('upgrades');
                    document.getElementById('carnet')?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'nearest',
                    });
                  }}
                >
                  <span>+</span>
                  <small>Agrandir</small>
                  <b>{upgradeCost(g, 'expand')} ◉</b>
                </button>
              )}
            </div>
            <div className="farm-footer">
              <span>🌼 Ici, rien ne se fane en votre absence.</span>
              <div>
                {g.upgrades.includes('water') && (
                  <span title="Irrigation active">💧</span>
                )}
                {g.upgrades.includes('coop') && (
                  <button onClick={() => setModal('workshop')}>🐔</button>
                )}
              </div>
            </div>
          </div>
          <div className="seed-tray">
            <div className="tray-heading">
              <div>
                <Sprout size={19} />
                <b>À vos semis</b>
                <span>Choisissez, puis plantez.</span>
              </div>
              <button className="text-button" onClick={() => setModal('seeds')}>
                La graineterie <ChevronRight size={16} />
              </button>
            </div>
            <div className="seed-list">
              {CROPS.filter((c) => c.level <= lv).map((c) => (
                <button
                  key={c.id}
                  className={`seed ${selected === c.id ? 'selected' : ''}`}
                  onClick={() => {
                    setSelected(c.id);
                  }}
                  aria-pressed={selected === c.id}
                >
                  <span className="seed-icon">{c.icon}</span>
                  <span>
                    <b>{c.name}</b>
                    <small>{duration(c.time)}</small>
                  </span>
                  <span className="seed-count">{g.seeds[c.id] || 0}</span>
                </button>
              ))}
              {CROPS.find((c) => c.level > lv) && (
                <button
                  className="seed locked"
                  onClick={() => setModal('seeds')}
                >
                  <Lock size={16} />
                  <span>
                    <b>À découvrir</b>
                    <small>
                      Niveau {CROPS.find((c) => c.level > lv)?.level}
                    </small>
                  </span>
                </button>
              )}
            </div>
            <div className="tray-bottom">
              <span>
                {selectedCrop.tag} · vente {selectedCrop.price} ◉
              </span>
              <div>
                {g.upgrades.includes('tools') && (
                  <button
                    className="text-button"
                    disabled={!ready}
                    onClick={() =>
                      g.plots.forEach((p, i) => {
                        if (p && p.end <= Date.now()) dispatch('harvest', i);
                      })
                    }
                  >
                    Tout récolter
                  </button>
                )}
                {g.upgrades.includes('auto') && (
                  <button
                    className="text-button"
                    onClick={() =>
                      g.plots.forEach((p, i) => {
                        if (!p && (state.current.seeds[selected] || 0) > 0)
                          dispatch('plant', { index: i, crop: selected });
                      })
                    }
                  >
                    Tout planter
                  </button>
                )}
                <button
                  className="text-button"
                  disabled={g.coins < selectedCrop.cost}
                  onClick={() => dispatch('buy', selected)}
                >
                  + 1 graine · {selectedCrop.cost} ◉
                </button>
              </div>
            </div>
          </div>
          <div className="rosalie-tip">
            <span className="avatar">👩🏻‍🌾</span>
            <div>
              <b>Le petit conseil de Rosalie</b>
              <p>{tutorial}</p>
            </div>
          </div>
        </div>
        <aside className="notebook" id="carnet">
          <div className="notebook-title">
            <span>LE CARNET DU JARDIN</span>
            <BookOpen size={19} />
          </div>
          <Tabs value={tab} onValueChange={(v) => setTab(String(v))}>
            <TabsList className="notebook-tabs">
              <TabsTrigger value="village">Village</TabsTrigger>
              <TabsTrigger value="upgrades">Améliorer</TabsTrigger>
              <TabsTrigger value="goals">Objectifs</TabsTrigger>
            </TabsList>
            <TabsContent value="village">
              <div className="section-label">UN PANIER, UN SOURIRE</div>
              <div className="order-person">
                <span className="portrait">
                  {['👩🏻‍🍳', '👨🏻‍🌾', '👩🏽'][g.orders % 3]}
                </span>
                <div>
                  <h3>{o.person}</h3>
                  <p>« Votre jardin a du talent ! »</p>
                </div>
              </div>
              <div className="order-card">
                <div className="order-item">
                  <span>{itemIcon(o.crop)}</span>
                  <div>
                    <b>
                      {o.amount} × {itemName(o.crop)}
                    </b>
                    <small>Pour la prochaine visite</small>
                  </div>
                  <b
                    className={
                      (g.stock[o.crop] || 0) >= o.amount ? 'enough' : ''
                    }
                  >
                    {Math.min(g.stock[o.crop] || 0, o.amount)}/{o.amount}
                  </b>
                </div>
                <div className="order-reward">
                  <span>◉ {o.reward} pièces</span>
                  <span>✧ {o.xp} XP</span>
                </div>
                <button
                  className="primary"
                  disabled={(g.stock[o.crop] || 0) < o.amount}
                  onClick={() => dispatch('order')}
                >
                  Livrer la commande <ChevronRight size={17} />
                </button>
                <p className="fine-print">
                  Aucune limite de temps. On vous attend.
                </p>
              </div>
              <button
                className="destination market"
                onClick={() => setModal('basket')}
              >
                <span className="destination-icon">🧺</span>
                <span>
                  <b>Le panier du marché</b>
                  <small>
                    {inventory
                      ? `${inventory} produits à vendre`
                      : 'Vos récoltes trouveront preneur'}
                  </small>
                </span>
                <ChevronRight size={19} />
              </button>
              <button
                className="destination"
                onClick={() => setModal('workshop')}
              >
                <span className="destination-icon">🍯</span>
                <span>
                  <b>L’atelier gourmand</b>
                  <small>
                    {g.job
                      ? g.job.end <= now
                        ? 'Votre recette est prête !'
                        : 'Une recette mijote…'
                      : g.upgrades.includes('workshop')
                        ? 'De la terre à la tartine'
                        : 'À installer au niveau 3'}
                  </small>
                </span>
                <ChevronRight size={19} />
              </button>
              <button
                className="destination"
                onClick={() => setModal('friends')}
              >
                <span className="destination-icon">💌</span>
                <span>
                  <b>Les amis du village</b>
                  <small>Cadeaux, quêtes et talents d’amitié</small>
                </span>
                <ChevronRight size={19} />
              </button>
              <button
                className="destination"
                onClick={() => setModal('collection')}
              >
                <span className="destination-icon">🌿</span>
                <span>
                  <b>Maîtriser mes cultures</b>
                  <small>
                    Progression et spécialisations de chaque variété
                  </small>
                </span>
                <ChevronRight size={19} />
              </button>
              <div className="market-note">
                <Sun size={20} />
                <div>
                  <b>Le coup de cœur du marché</b>
                  <p>
                    {event.label} :{' '}
                    <strong>+{Math.round(event.bonus * 100)} %</strong> à la
                    vente
                  </p>
                  <small>
                    Change dans {duration((event.end - now) / 1000)}
                  </small>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="upgrades">
              <div className="section-label">FAITES GRANDIR VOS IDÉES</div>
              <div className="upgrade-list">
                {UPGRADES.map((u) => {
                  const owned =
                    u.id === 'expand'
                      ? g.plots.length >= 18
                      : g.upgrades.includes(u.id);
                  const cost = upgradeCost(g, u.id);
                  return (
                    <div className="upgrade" key={u.id}>
                      <span>{u.icon}</span>
                      <div>
                        <h3>{u.name}</h3>
                        <p>{u.desc}</p>
                        <button
                          className="small-button"
                          disabled={owned || lv < u.level || g.coins < cost}
                          onClick={() => dispatch('upgrade', u.id)}
                        >
                          {owned
                            ? '✓ Installé'
                            : lv < u.level
                              ? `Niveau ${u.level}`
                              : `Installer · ${cost} ◉`}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
            <TabsContent value="goals">
              <div className="section-label">LES PETITES VICTOIRES</div>
              {MISSIONS.map((m) => (
                <div className="mission" key={m.id}>
                  <div>
                    <h3>{m.title}</h3>
                    <span>
                      {Math.min(g[m.field], m.target)}/{m.target}
                    </span>
                  </div>
                  <p>{m.desc}</p>
                  <div className="mission-track">
                    <i
                      style={{
                        width:
                          Math.min(100, (g[m.field] / m.target) * 100) + '%',
                      }}
                    />
                  </div>
                  <button
                    className="text-button"
                    disabled={g.claimed.includes(m.id) || g[m.field] < m.target}
                    onClick={() => dispatch('mission', m.id)}
                  >
                    {g.claimed.includes(m.id)
                      ? '✓ Récompense reçue'
                      : `Recevoir ${m.reward} pièces + 15 XP`}
                  </button>
                </div>
              ))}
              <button
                className="destination"
                onClick={() => setModal('collection')}
              >
                <span>🌿</span>
                <span>
                  <b>L’herbier des récoltes</b>
                  <small>
                    {Object.keys(g.collection).length} / 12 découvertes
                  </small>
                </span>
                <ChevronRight size={18} />
              </button>
            </TabsContent>
          </Tabs>
          <div className="notebook-footer">
            <span className={'save-dot ' + (saveError ? 'error' : '')} />
            {saveError
              ? 'Sauvegarde indisponible : exportez dans Paramètres.'
              : loaded
                ? 'Votre jardin est sauvegardé ici'
                : 'Ouverture du jardin…'}
          </div>
        </aside>
      </section>
      <footer className="page-footer">
        <span>Un petit jardin. De grandes joies.</span>
        <span>Sans urgence, sans publicité, juste vous et la nature.</span>
      </footer>
      {notice && <output className="notification">{notice}</output>}
      <Dialog
        open={!!modal}
        onOpenChange={(open) => {
          if (!open) setModal('');
        }}
      >
        <DialogContent className="game-dialog" showCloseButton={false}>
          <div className="dialog-heading">
            <DialogTitle>
              {
                (
                  {
                    friends: 'Le carnet des amitiés',
                    seeds: 'La graineterie',
                    basket: 'Le panier du marché',
                    workshop: 'L’atelier gourmand',
                    settings: 'Votre jardin, vos envies',
                    collection: 'Racines · maîtrise des cultures',
                  } as Record<string, string>
                )[modal]
              }
            </DialogTitle>
            <button
              className="icon-button"
              aria-label="Fermer"
              onClick={() => setModal('')}
            >
              ✕
            </button>
          </div>
          <DialogDescription>
            {modal === 'friends'
              ? 'De petits cadeaux, une histoire à partager. Les quêtes personnelles ouvrent les talents du troisième cœur.'
              : modal === 'seeds'
                ? 'Une graine, mille possibilités. Achetez à l’unité et choisissez votre prochain semis.'
                : modal === 'basket'
                  ? 'Vendez vos produits ou gardez-en quelques-uns pour les commandes et les recettes.'
                  : modal === 'workshop'
                    ? 'Les bonnes choses prennent un peu de temps. Vos créations restent disponibles jusqu’à votre retour.'
                    : modal === 'collection'
                      ? 'Cultivez vos préférences : chaque variété progresse à son propre rythme.'
                      : 'La progression est enregistrée automatiquement dans ce navigateur.'}
          </DialogDescription>
          {modal === 'seeds' && (
            <>
              <div className="catalog">
                {CROPS.map((c) => (
                  <div
                    key={c.id}
                    className={
                      'crop-card ' + (c.level > lv ? 'unavailable' : '')
                    }
                  >
                    <span className="catalog-icon">{c.icon}</span>
                    <h3>{c.name}</h3>
                    <p>{c.tag}</p>
                    <small>
                      {duration(growTime(g, c.id))} · vente {c.price} ◉ · {c.xp}{' '}
                      XP
                    </small>
                    <button
                      className="small-button"
                      disabled={c.level > lv || g.coins < c.cost}
                      onClick={() => {
                        dispatch('buy', c.id);
                        setSelected(c.id);
                      }}
                    >
                      {c.level > lv
                        ? `🔒 Niveau ${c.level}`
                        : `Acheter · ${c.cost} ◉`}{' '}
                    </button>
                    <small>{g.seeds[c.id] || 0} graines en réserve</small>
                  </div>
                ))}
              </div>
              <button
                className="text-button"
                onClick={() => dispatch('rescue')}
              >
                À court de tout ? Demander 3 graines de secours à Rosalie
              </button>
            </>
          )}
          {modal === 'basket' && (
            <>
              {inventory === 0 ? (
                <div className="empty-state">
                  <span>🧺</span>
                  <h3>Le panier attend ses premières couleurs.</h3>
                  <p>Récoltez une plante mûre dans votre jardin.</p>
                </div>
              ) : (
                <div className="basket-list">
                  {Object.entries(g.stock)
                    .filter(([, n]) => n > 0)
                    .map(([id, n]) => {
                      const item = { name: itemName(id), icon: itemIcon(id) };
                      return (
                        <div className="basket-item" key={id}>
                          <span>{item.icon}</span>
                          <div>
                            <b>
                              {item.name} × {n}
                            </b>
                            <small>
                              {price(g, id, now)} pièces l’unité{' '}
                              {marketBonus(g, id, now)
                                ? `· coup de cœur +${Math.round(marketBonus(g, id, now) * 100)} %`
                                : ''}
                            </small>
                          </div>
                          <button
                            className="small-button"
                            onClick={() => dispatch('sell', id)}
                          >
                            Vendre · {n * price(g, id, now)} ◉
                          </button>
                        </div>
                      );
                    })}
                </div>
              )}
            </>
          )}
          {modal === 'workshop' && (
            <>
              {!g.upgrades.includes('workshop') ? (
                <div className="empty-state">
                  <span>🍯</span>
                  <h3>Un atelier pour vos recettes maison</h3>
                  <p>
                    Au niveau 3, installez l’atelier pour 180 pièces dans
                    Améliorer.
                  </p>
                  <button
                    className="primary"
                    onClick={() => {
                      setTab('upgrades');
                      setModal('');
                    }}
                  >
                    Voir les améliorations
                  </button>
                </div>
              ) : (
                <>
                  <div className="cooking-stats">
                    <div className="cooking-stats-head">
                      <b>Vos talents de cuisinier</b>
                      <span>Ils progressent à chaque plat</span>
                    </div>
                    <div className="stat-grid">
                      <span>
                        🧠 Maîtrise <b>{g.stats.mastery}</b>
                      </span>
                      <span>
                        🎯 Précision <b>{g.stats.precision}</b>
                      </span>
                      <span>
                        🎨 Créativité <b>{g.stats.creativity}</b>
                      </span>
                      <span>
                        🧺 Régularité <b>{g.stats.regularity}</b>
                      </span>
                      <span>
                        🍀 Chance <b>{g.stats.luck}</b>
                      </span>
                    </div>
                  </div>
                  <div className="job-status">
                    {g.job ? (
                      <>
                        <span>
                          🥣 {RECIPES.find((r) => r.id === g.job?.id)?.name}
                        </span>
                        <button
                          className="small-button"
                          disabled={g.job.end > now}
                          onClick={() => dispatch('collect')}
                        >
                          {g.job.end <= now
                            ? 'Récupérer'
                            : duration((g.job.end - now) / 1000)}
                        </button>
                      </>
                    ) : (
                      <span>
                        🍴 L’atelier est prêt pour une nouvelle recette.
                      </span>
                    )}
                  </div>
                  <RecipeBook g={g} dispatch={dispatch} />
                </>
              )}
              {g.upgrades.includes('coop') && (
                <div className="job-status">
                  <span>
                    🐔{' '}
                    {g.hens
                      ? 'Les poules préparent 4 œufs'
                      : '3 blés → 4 œufs · 2 min'}
                  </span>
                  <button
                    className="small-button"
                    disabled={
                      g.hens !== null ? g.hens > now : (g.stock.ble || 0) < 3
                    }
                    onClick={() => dispatch('hens')}
                  >
                    {g.hens
                      ? g.hens <= now
                        ? 'Ramasser les œufs'
                        : duration((g.hens - now) / 1000)
                      : 'Nourrir'}
                  </button>
                </div>
              )}
            </>
          )}
          {modal === 'collection' && (
            <CultureJournal g={g} dispatch={dispatch} />
          )}
          {modal === 'friends' && <FriendBook g={g} dispatch={dispatch} />}
          {modal === 'settings' && (
            <div className="settings-content">
              <p>
                Les récoltes et les recettes continuent pendant votre absence.
                Rien ne pourrit. Le marché change de préférence toutes les 5
                minutes, sans pénalité.
              </p>
              <button className="small-button" onClick={() => setSound(!sound)}>
                {sound ? 'Couper les sons' : 'Activer les sons'}{' '}
              </button>
              <button
                className="small-button"
                onClick={() => {
                  const blob = new Blob([JSON.stringify(state.current)], {
                    type: 'application/json',
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'mon-jardin-rosalie.json';
                  a.click();
                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                }}
              >
                Exporter ma sauvegarde
              </button>
              <label className="import-label">
                Importer une sauvegarde
                <input
                  type="file"
                  accept=".json"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const raw = await file.text();
                      const parsed = JSON.parse(raw);
                      if (parsed.version !== 1 || !Array.isArray(parsed.plots))
                        throw Error();
                      const restored = restore(raw);
                      save(restored);
                      notify('Votre jardin a été restauré.');
                      setModal('');
                    } catch {
                      notify('Cette sauvegarde n’est pas reconnue.');
                    }
                  }}
                />
              </label>
              <button className="danger-button" onClick={() => setReset(true)}>
                Recommencer une nouvelle partie
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <AlertDialog open={reset} onOpenChange={setReset}>
        <AlertDialogContent>
          <AlertDialogTitle>Recommencer votre jardin ?</AlertDialogTitle>
          <AlertDialogDescription>
            Les pièces, récoltes et améliorations de cette partie seront
            effacées. Vous pouvez d’abord exporter votre sauvegarde dans les
            paramètres.
          </AlertDialogDescription>
          <AlertDialogCancel>Garder mon jardin</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              save(fresh());
              setSelected('radis');
              setReset(false);
              setModal('');
              setTab('village');
              notify('Une nouvelle aventure commence !');
            }}
          >
            Oui, recommencer
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
