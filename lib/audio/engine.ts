/**
 * 0.22 — Le son des Jardins de Rosalie.
 *
 * Un seul AudioContext, trois bus réglables :
 * - musique : le thème de la saison (scripts/musique/composer.py), en deux
 *   arrangements joués ensemble, calés au même endroit du morceau ; le jour et
 *   le soir se fondent l’un dans l’autre sans jamais couper la mélodie ;
 * - effets : les bruitages des gestes et de l’interface (bruitages.py) ;
 * - ambiance : oiseaux le jour, grillons la nuit, pluie (sous le curseur des effets).
 *
 * Les navigateurs n’autorisent le son qu’après un geste du joueur : tout
 * démarre au premier clic ou à la première touche. L’onglet caché suspend le son.
 */

export type AudioPrefs = { on: boolean; music: number; sfx: number };
export type Mood = 'jour' | 'soir';
export type Scene = { season: string; mood: Mood; ambience: string | null; hens: boolean };
export type PlayOptions = { volume?: number; rate?: number; pan?: number; delay?: number; duck?: number };

type MusicEntry = { jour: { file: string }; soir: { file: string }; loop: number };
type SoundEntry = { volume: number; seconds: number; loop: boolean };
type Loaded = { buffer: AudioBuffer; offset: number };
type MusicPlayer = { season: string; group: GainNode; moods: Record<Mood, GainNode>; sources: AudioBufferSourceNode[] };

// Chemins écrits en entier : la publication GitHub Pages les préfixe à la construction.
const MUSIC_DIR = '/assets/audio/musique/';
const SOUND_DIR = '/assets/audio/sons/';
const PREFS_KEY = 'rosalie-audio';
/** Premier lancement : son activé, volume doux (choix de l’auteur, 0.22). */
export const DEFAULT_PREFS: AudioPrefs = { on: true, music: 0.55, sfx: 0.6 };
const SEASON_FADE = 3;
const MOOD_FADE = 4;

const clamp01 = (v: number) => Math.min(1, Math.max(0, Number.isFinite(v) ? v : 0));
/** Curseur → gain : courbe perceptive (le milieu du curseur sonne à mi-volume). */
const loudness = (v: number) => clamp01(v) ** 2;

function readPrefs(): AudioPrefs {
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<AudioPrefs>;
      return { on: p.on !== false, music: clamp01(p.music ?? DEFAULT_PREFS.music), sfx: clamp01(p.sfx ?? DEFAULT_PREFS.sfx) };
    }
    // Ancien réglage « Sons doux » (avant 0.22) : un « non » explicite est respecté.
    if (window.localStorage.getItem('rosalie-sound') === 'false') return { ...DEFAULT_PREFS, on: false };
  } catch {
    /* Stockage indisponible : réglages par défaut pour la session. */
  }
  return { ...DEFAULT_PREFS };
}

/** Premier échantillon non nul : les décodeurs MP3 ajoutent un court silence au début. */
function leadingSilence(buffer: AudioBuffer, threshold: number) {
  const data = buffer.getChannelData(0);
  const limit = Math.min(data.length, Math.round(buffer.sampleRate * 0.2));
  for (let i = 0; i < limit; i++) if (Math.abs(data[i]) > threshold) return i / buffer.sampleRate;
  return 0;
}

class GameAudio {
  private prefs: AudioPrefs = { ...DEFAULT_PREFS };
  private prefsRead = false;
  private listeners = new Set<() => void>();
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private musicBus!: GainNode;
  private duckBus!: GainNode;
  private sfxBus!: GainNode;
  private ambienceBus!: GainNode;
  private buffers = new Map<string, Promise<Loaded | null>>();
  private musicManifest: Promise<Record<string, MusicEntry>> | null = null;
  private soundManifest: Promise<Record<string, SoundEntry>> | null = null;
  private sounds: Record<string, SoundEntry> = {};
  private scene: Scene | null = null;
  private music: MusicPlayer | null = null;
  private ambience: { name: string; gain: GainNode; source: AudioBufferSourceNode } | null = null;
  private lastPlayed = new Map<string, number>();
  private henTimer = 0;
  private unlocked = false;

  // ---------------------------------------------------------------- réglages
  getPrefs = () => {
    if (!this.prefsRead && typeof window !== 'undefined') {
      this.prefs = readPrefs();
      this.prefsRead = true;
    }
    return this.prefs;
  };

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  setPrefs(change: Partial<AudioPrefs>) {
    this.prefs = { ...this.getPrefs(), ...change };
    this.prefs.music = clamp01(this.prefs.music);
    this.prefs.sfx = clamp01(this.prefs.sfx);
    try {
      window.localStorage.setItem(PREFS_KEY, JSON.stringify(this.prefs));
    } catch {
      /* La préférence vaut pour la session. */
    }
    this.applyVolumes();
    if (this.prefs.on) this.unlock();
    for (const l of this.listeners) l();
  }

  // ---------------------------------------------------------------- démarrage
  /** À appeler une fois côté client : le son démarre au premier geste du joueur. */
  install() {
    if (typeof window === 'undefined') return () => {};
    if (process.env.NODE_ENV !== 'production') (window as unknown as { __rosalieAudio?: GameAudio }).__rosalieAudio = this;
    const go = () => this.unlock();
    const opts = { capture: true, passive: true } as const;
    window.addEventListener('pointerdown', go, opts);
    window.addEventListener('keydown', go, opts);
    const visibility = () => {
      if (!this.ctx) return;
      if (document.hidden) void this.ctx.suspend();
      else if (this.getPrefs().on) void this.ctx.resume();
    };
    document.addEventListener('visibilitychange', visibility);
    return () => {
      window.removeEventListener('pointerdown', go, opts);
      window.removeEventListener('keydown', go, opts);
      document.removeEventListener('visibilitychange', visibility);
    };
  }

  private unlock() {
    if (!this.getPrefs().on) return;
    if (!this.ctx) {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      try {
        this.ctx = new Ctx({ latencyHint: 'interactive' });
      } catch {
        return;
      }
      const c = this.ctx;
      this.master = c.createGain();
      this.master.connect(c.destination);
      this.musicBus = c.createGain();
      this.duckBus = c.createGain();
      this.duckBus.connect(this.musicBus).connect(this.master);
      this.sfxBus = c.createGain();
      this.sfxBus.connect(this.master);
      this.ambienceBus = c.createGain();
      this.ambienceBus.connect(this.master);
      this.applyVolumes(true);
    }
    if (this.ctx.state !== 'running' && !document.hidden) void this.ctx.resume();
    if (!this.unlocked) {
      this.unlocked = true;
      void this.loadSoundManifest();
      if (this.scene) this.applyScene(this.scene);
    }
  }

  private applyVolumes(instant = false) {
    if (!this.ctx) return;
    const p = this.getPrefs();
    const t = this.ctx.currentTime;
    const set = (g: GainNode, v: number) => (instant ? g.gain.setValueAtTime(v, t) : g.gain.setTargetAtTime(v, t, 0.08));
    set(this.master, p.on ? 1 : 0);
    set(this.musicBus, loudness(p.music));
    set(this.sfxBus, loudness(p.sfx));
    set(this.ambienceBus, loudness(p.sfx) * 0.6);
    if (!p.on) setTimeout(() => this.ctx && !this.getPrefs().on && void this.ctx.suspend(), 300);
  }

  // ---------------------------------------------------------------- chargement
  private load(url: string, threshold: number): Promise<Loaded | null> {
    let known = this.buffers.get(url);
    if (!known) {
      known = fetch(url)
        .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
        .then((data) => this.ctx!.decodeAudioData(data))
        .then((buffer) => ({ buffer, offset: leadingSilence(buffer, threshold) }))
        .catch(() => {
          this.buffers.delete(url);
          return null;
        });
      this.buffers.set(url, known);
    }
    return known;
  }

  private loadSoundManifest() {
    this.soundManifest ??= fetch(`${SOUND_DIR}manifeste.json`)
      .then((r) => r.json() as Promise<Record<string, SoundEntry>>)
      .then((m) => {
        this.sounds = m;
        // Les bruitages sont petits (moins d’un Mo en tout) : préchargés d’un coup.
        for (const name of Object.keys(m)) if (!m[name].loop) void this.load(`${SOUND_DIR}${name}.mp3`, 1e-4);
        return m;
      })
      .catch(() => ({}));
    return this.soundManifest;
  }

  // ---------------------------------------------------------------- scène
  /** Saison, moment de la journée, ambiance : la musique et les bruits de fond suivent. */
  setScene(scene: Scene) {
    const same = this.scene && JSON.stringify(this.scene) === JSON.stringify(scene);
    this.scene = scene;
    if (!same && this.unlocked) this.applyScene(scene);
  }

  private applyScene(scene: Scene) {
    void this.startMusic(scene.season, scene.mood);
    this.setMood(scene.mood);
    void this.setAmbience(scene.ambience);
    this.setHens(scene.hens);
  }

  private async startMusic(season: string, mood: Mood) {
    if (!this.ctx || this.music?.season === season) return;
    this.musicManifest ??= fetch(`${MUSIC_DIR}manifeste.json`)
      .then((r) => r.json() as Promise<Record<string, MusicEntry>>)
      .catch(() => ({}));
    const entry = (await this.musicManifest)[season];
    if (!entry) return;
    const [day, night] = await Promise.all([
      this.load(`${MUSIC_DIR}${entry.jour.file}`, 1e-6),
      this.load(`${MUSIC_DIR}${entry.soir.file}`, 1e-6),
    ]);
    // Une autre saison a été demandée pendant le chargement.
    if (!day || !night || !this.ctx || this.scene?.season !== season || this.music?.season === season) return;
    const c = this.ctx;
    const old = this.music;
    const group = c.createGain();
    group.gain.setValueAtTime(0, c.currentTime);
    group.gain.linearRampToValueAtTime(1, c.currentTime + (old ? SEASON_FADE : 1.5));
    group.connect(this.duckBus);
    const start = c.currentTime + 0.12;
    const moods = {} as Record<Mood, GainNode>;
    const sources: AudioBufferSourceNode[] = [];
    for (const [m, loaded] of [['jour', day], ['soir', night]] as const) {
      const g = c.createGain();
      g.gain.setValueAtTime(m === (this.scene?.mood ?? mood) ? 1 : 0, c.currentTime);
      g.connect(group);
      const src = c.createBufferSource();
      src.buffer = loaded.buffer;
      src.loop = true;
      src.loopStart = loaded.offset;
      src.loopEnd = loaded.offset + entry.loop;
      src.connect(g);
      // Les deux arrangements partent du même temps du morceau : ils restent calés.
      src.start(start, loaded.offset);
      moods[m] = g;
      sources.push(src);
    }
    this.music = { season, group, moods, sources };
    if (old) {
      old.group.gain.cancelScheduledValues(c.currentTime);
      old.group.gain.setValueAtTime(old.group.gain.value, c.currentTime);
      old.group.gain.linearRampToValueAtTime(0, c.currentTime + SEASON_FADE);
      for (const s of old.sources) s.stop(c.currentTime + SEASON_FADE + 0.1);
      setTimeout(() => old.group.disconnect(), (SEASON_FADE + 0.5) * 1000);
      // Les morceaux d’une saison passée ne restent pas en mémoire (≈ 70 Mo décodés).
      for (const url of this.buffers.keys())
        if (url.startsWith(`${MUSIC_DIR}${old.season}-`)) this.buffers.delete(url);
    }
  }

  private setMood(mood: Mood) {
    if (!this.ctx || !this.music) return;
    const t = this.ctx.currentTime;
    for (const m of ['jour', 'soir'] as const) {
      const g = this.music.moods[m].gain;
      g.cancelScheduledValues(t);
      g.setValueAtTime(g.value, t);
      g.linearRampToValueAtTime(m === mood ? 1 : 0, t + MOOD_FADE);
    }
  }

  private async setAmbience(name: string | null) {
    if (!this.ctx || this.ambience?.name === name) return;
    const c = this.ctx;
    const old = this.ambience;
    this.ambience = null;
    if (old) {
      old.gain.gain.setTargetAtTime(0, c.currentTime, 0.8);
      old.source.stop(c.currentTime + 4);
    }
    if (!name) return;
    await this.loadSoundManifest();
    const loaded = await this.load(`${SOUND_DIR}${name}.mp3`, 1e-5);
    if (!loaded || this.scene?.ambience !== name || this.ambience) return;
    const gain = c.createGain();
    gain.gain.setValueAtTime(0, c.currentTime);
    gain.gain.setTargetAtTime(this.sounds[name]?.volume ?? 0.5, c.currentTime, 1.2);
    gain.connect(this.ambienceBus);
    const source = c.createBufferSource();
    source.buffer = loaded.buffer;
    source.loop = true;
    source.loopStart = loaded.offset;
    source.loopEnd = loaded.offset + (this.sounds[name]?.seconds ?? loaded.buffer.duration);
    source.connect(gain);
    source.start(c.currentTime + 0.05, loaded.offset);
    this.ambience = { name, gain, source };
  }

  /** Poulailler construit : une poule glousse de temps en temps, au loin. */
  private setHens(on: boolean) {
    clearTimeout(this.henTimer);
    if (!on) return;
    const next = () => {
      this.henTimer = window.setTimeout(() => {
        if (!document.hidden) this.play('poule', { volume: 0.35, pan: 0.5, rate: 0.95 + Math.random() * 0.12 });
        next();
      }, 35_000 + Math.random() * 50_000);
    };
    next();
  }

  // ---------------------------------------------------------------- effets
  /** Joue un bruitage. `duck` baisse la musique pendant ce temps (petites fanfares). */
  play(name: string, options: PlayOptions = {}) {
    const p = this.getPrefs();
    if (!p.on || p.sfx <= 0) return;
    this.unlock();
    const c = this.ctx;
    if (!c) return;
    const now = performance.now();
    // Un même son déclenché deux fois en 40 ms ne s’entend qu’une fois.
    if (now - (this.lastPlayed.get(name) ?? 0) < 40) return;
    this.lastPlayed.set(name, now);
    void this.load(`${SOUND_DIR}${name}.mp3`, 1e-4).then((loaded) => {
      if (!loaded || !this.ctx) return;
      const t = Math.max(c.currentTime, c.currentTime + (options.delay ?? 0));
      const src = c.createBufferSource();
      src.buffer = loaded.buffer;
      src.playbackRate.value = options.rate ?? 1;
      const gain = c.createGain();
      gain.gain.value = (this.sounds[name]?.volume ?? 0.6) * (options.volume ?? 1);
      let out: AudioNode = gain;
      if (options.pan && c.createStereoPanner) {
        const panner = c.createStereoPanner();
        panner.pan.value = Math.max(-1, Math.min(1, options.pan));
        gain.connect(panner);
        out = panner;
      }
      src.connect(gain);
      out.connect(this.sfxBus);
      src.start(t, loaded.offset);
      if (options.duck) this.duck(options.duck, t);
    });
  }

  /** État lisible, pour les tests de développement (window.__rosalieAudio). */
  debug() {
    return {
      state: this.ctx?.state ?? 'none',
      season: this.music?.season ?? null,
      moods: this.music ? { jour: this.music.moods.jour.gain.value, soir: this.music.moods.soir.gain.value } : null,
      ambience: this.ambience?.name ?? null,
      loaded: this.buffers.size,
      played: [...this.lastPlayed.keys()],
      prefs: this.getPrefs(),
    };
  }

  private duck(seconds: number, at: number) {
    if (!this.ctx) return;
    const g = this.duckBus.gain;
    g.cancelScheduledValues(at);
    g.setTargetAtTime(0.3, at, 0.08);
    g.setTargetAtTime(1, at + seconds, 0.6);
  }
}

/** Le son du jeu (un seul pour toute la page). */
export const gameAudio = new GameAudio();

