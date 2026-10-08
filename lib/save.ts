import { KEY, CROPS, START_PLOTS, restore, type Game } from './game.ts';
import {
  isSupportedSaveVersion,
  SAVE_RELEASE,
} from './save-schema.ts';

export { SAVE_VERSION } from './save-schema.ts';

let blocked = false;
export class SaveRecoveryError extends Error {
  raw: string;
  source: 'local' | 'import';
  constructor(raw: string, source: 'local' | 'import') {
    super('Votre sauvegarde n’a pas pu être lue. Elle est mise de côté, rien n’est perdu.');
    this.raw = raw;
    this.source = source;
  }
}
export function saveIsBlocked() { return blocked; }
export function protectUnreadableSave(raw: string, source: 'local' | 'import') {
  blocked = true;
  try {
    const prefix = `${KEY}-secours-${Date.now()}`;
    let key = prefix;
    let suffix = 0;
    while (window.localStorage.getItem(key) !== null) key = `${prefix}-${++suffix}`;
    window.localStorage.setItem(key, raw);
  } catch { /* Le texte reste en mémoire et la clé principale reste intacte. */ }
  return new SaveRecoveryError(raw, source);
}
export function loadGame(): Game {
  const raw = window.localStorage.getItem(KEY);
  try {
    const game = restore(raw);
    blocked = false;
    return game;
  } catch {
    throw protectUnreadableSave(raw || '', 'local');
  }
}
/** Seulement après une décision explicite, ou une relecture réussie. */
export function acceptRecoveredGame(game: Game) {
  window.localStorage.setItem(KEY, JSON.stringify(game));
  blocked = false;
}
export function exportRawSave(raw: string) {
  downloadSave(raw, 'farmicia-secours.json');
}

export function persistGame(game: Game) {
  if (blocked) throw new Error('La sauvegarde attend votre choix.');
  window.localStorage.setItem(KEY, JSON.stringify(game));
}

export function parseImportedGame(raw: string): Game {
  const parsed = JSON.parse(raw) as Partial<Game>;
  if (
    !parsed ||
    !isSupportedSaveVersion(parsed.version) ||
    !Array.isArray(parsed.plots) ||
    parsed.plots.length < START_PLOTS ||
    !Number.isFinite(parsed.coins) ||
    !Number.isFinite(parsed.xp) ||
    !parsed.seeds ||
    typeof parsed.seeds !== 'object' ||
    Array.isArray(parsed.seeds) ||
    !parsed.stock ||
    typeof parsed.stock !== 'object' ||
    Array.isArray(parsed.stock) ||
    !Array.isArray(parsed.upgrades) ||
    !Array.isArray(parsed.claimed) ||
    parsed.plots.some(
      (plot) =>
        plot !== null &&
        (!plot ||
          !CROPS.some((c) => c.id === plot.crop) ||
          !Number.isFinite(plot.start) ||
          !Number.isFinite(plot.end)),
    )
  ) {
    throw new Error('Sauvegarde non reconnue');
  }
  return restore(raw);
}

export function exportGame(game: Game) {
  downloadSave(JSON.stringify(game, null, 2), `farmicia-${SAVE_RELEASE}.json`);
}
function downloadSave(raw: string, filename: string) {
  const blob = new Blob([raw], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
