'use client';
/**
 * 0.24 — Sommaire du carnet (maquette 00-sommaire de ChatGPT).
 *
 * Une rangée par chapitre ouvert : le chapitre à gauche, ses pages ouvertes
 * à droite, sur une même grille de cinq colonnes pour que les icônes
 * s’alignent d’une rangée à l’autre. La rangée Cuisine dit en plus l’état
 * des fourneaux. En bas, le projet en cours du village et son étape.
 * Rien n’est montré d’une page pas encore ouverte (pas de spoil).
 */
import { CHAPTER_ART } from '@/components/notebook/carnet';
import { CarnetIcon as PixelIcon } from '@/components/notebook/carnet-icon';
import { useGameClock } from '@/hooks/use-game-clock';
import { NOTEBOOK_CHAPTERS, type NotebookPage } from '@/lib/notebook';
import { projectStatus, readyDishes, stoveJobs, type Game } from '@/lib/game';
import { Glyph } from '@/components/glyph';

export function SummaryPage({
  game,
  now: snapshotNow,
  pages,
  badges,
  onPage,
}: {
  game: Game;
  now: number;
  pages: NotebookPage[];
  badges: Partial<Record<string, number>>;
  onPage: (id: string) => void;
}) {
  const now = useGameClock() || snapshotNow;
  const status = pages.some((page) => page.value === 'projects') ? projectStatus(game) : null;
  const jobs = stoveJobs(game);
  const ready = readyDishes(game, now);
  const free = jobs.filter((job) => !job).length;
  const kitchen = !game.upgrades.includes('workshop')
    ? null
    : ready
      ? `${ready > 1 ? `${ready} plats prêts` : 'Un plat prêt'} à sortir`
      : free
        ? free === jobs.length
          ? jobs.length > 1 ? 'Fourneaux libres' : 'Le fourneau est libre'
          : `${free > 1 ? `${free} fourneaux libres` : 'Un fourneau libre'}`
        : 'Tout est sur le feu';
  return (
    <div className="carnet-summary">
      {NOTEBOOK_CHAPTERS.map((chapter) => {
        const list = chapter.pages.filter((entry) => pages.some((open) => open.value === entry.value));
        if (!list.length) return null;
        const art = CHAPTER_ART[chapter.id];
        return (
          <section key={chapter.id} className="summary-row" aria-labelledby={`summary-${chapter.id}`}>
            <h4 className="summary-chapter" id={`summary-${chapter.id}`}>
              <PixelIcon id={art.icon} />
              <span>{art.label}</span>
            </h4>
            <ul className="summary-links">
              {list.map((page) => {
                const count = badges[page.value] || 0;
                return (
                  <li key={page.value}>
                    <button type="button" className="summary-link" onClick={() => onPage(page.value)}>
                      <PixelIcon id={page.icon} />
                      <span>{page.label}</span>
                      {count > 0 && <b className="carnet-count" aria-label={`${count} à faire`}>{count}</b>}
                    </button>
                  </li>
                );
              })}
              {chapter.id === 'kitchen' && kitchen && (
                <li className="summary-status" data-ready={ready > 0 || undefined}>
                  <PixelIcon id={ready ? 'cloche' : 'braises'} />
                  <span>{kitchen}</span>
                </li>
              )}
            </ul>
          </section>
        );
      })}
      {status && (
        <section className="summary-project" aria-labelledby="summary-project">
          <PixelIcon id="projet-village" />
          <div>
            <h4 id="summary-project">{status.project.title}</h4>
            <p>
              {status.step.text}
              {status.target > 1 && (
                <>
                  {' · '}
                  {status.count}
                  {' '}/{' '}
                  {status.target}
                </>
              )}
            </p>
          </div>
          <button type="button" className="carnet-primary" onClick={() => onPage('projects')}>
            Voir le projet
            <Glyph id="chevron-droite" />
          </button>
        </section>
      )}
    </div>
  );
}
