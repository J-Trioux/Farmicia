'use client';
/**
 * 0.27 — Page Guide du carnet (maquette 13-guide de ChatGPT).
 *
 * En tête, l’interrupteur des conseils de Rosalie ; à gauche les leçons
 * (paginées) avec leur statut (Vu, En cours, À voir, À découvrir) ; à droite
 * la leçon choisie : ce qu’elle apprend, ses étapes, et « Revoir cette leçon ».
 * Une leçon s’ouvre avec sa mécanique (pas de spoil) ; la progression des
 * leçons ne change pas (lib/tutorial).
 */
import { useState } from 'react';
import { CarnetPager } from '@/components/notebook/carnet';
import { CarnetIcon as PixelIcon } from '@/components/notebook/carnet-icon';
import { GARDE_STEPS, SEED_FIND_LEVEL, UNLOCKS, UPGRADES, type Game } from '@/lib/game';
import { TUTORIAL } from '@/lib/tutorial';

const PER_PAGE = 5;
const LESSON_ICONS: Record<string, string> = {
  'premiers-pas': 'sachet',
  arrosoir: 'arrosoir-cuivre',
  outils: 'outils',
  village: 'commande',
  garde: 'garde',
  caravane: 'valley',
  lignees: 'graine-doree',
  atelier: 'casserole',
  poulailler: 'poulailler',
  embellir: 'fontaine',
};
/** Intitulé court de chaque étape d’une leçon (identifiants de lib/tutorial.ts). */
const STEP_LABELS: Record<string, string> = {
  semer: 'Semer une graine',
  arroser: 'Arroser la parcelle',
  'semer-plus': 'Semer d’autres parcelles',
  recolter: 'Récolter à maturité',
  panier: 'Ouvrir le panier',
  vendre: 'Vendre une récolte',
  graines: 'Racheter des graines',
  carnet: 'Ouvrir le carnet',
  agrandir: 'Agrandir le jardin',
  fin: 'Et ensuite',
  'arroser-tout': 'Tout arroser',
  'recolter-tout': 'Tout récolter',
  rythme: 'Le rythme des gestes',
  commandes: 'Les commandes',
  projets: 'Les projets du village',
  garde: 'Le semis de garde',
  vallee: 'Préparer la caravane',
  lignee: 'Choisir un caractère',
  atelier: 'Entrer dans l’atelier',
  cuisiner: 'Cuisiner un plat',
  poules: 'Nourrir les poules',
  volet: 'La page Embellir',
  fontaine: 'Construire la fontaine',
};
const STATUS: Record<string, { label: string; tone: string }> = {
  active: { label: 'En cours', tone: 'info' },
  done: { label: 'Vu', tone: 'ok' },
  open: { label: 'À voir', tone: 'warn' },
  locked: { label: 'À découvrir', tone: 'muted' },
};

export function GuidePage({ game, onReplay, onToggle }: { game: Game; onReplay: (id: string) => void; onToggle: (off: boolean) => void }) {
  const state = game.tutorial || { done: [] };
  const off = !!state.off;
  const lessons = TUTORIAL.map((chapter) => {
    const done = state.done.includes(chapter.id);
    const active = state.chapter === chapter.id;
    const open = done || active || chapter.ready(game);
    const upgrade = ({ arrosoir: 'watering-can', outils: 'tools', atelier: 'workshop', poulailler: 'coop' } as Record<string, string>)[chapter.id];
    const required = upgrade
      ? UPGRADES.find((u) => u.id === upgrade)?.level
      : ({ village: UNLOCKS.marketBasket, caravane: UNLOCKS.caravan, lignees: SEED_FIND_LEVEL, garde: GARDE_STEPS[0].level } as Record<string, number>)[chapter.id];
    const status = active ? 'active' : done ? 'done' : open ? 'open' : 'locked';
    const when = `À partir du niveau ${required || 1}${upgrade ? ', après installation' : chapter.id === 'lignees' ? ', après découverte d’une graine' : ''}`;
    return { chapter, status, open, active, done, when };
  });
  const firstOpen = lessons.find((l) => l.status === 'active') || lessons.find((l) => l.status === 'open') || lessons[0];
  const [chosen, setChosen] = useState(firstOpen.chapter.id);
  const [pageIndex, setPageIndex] = useState(() => Math.floor(lessons.indexOf(firstOpen) / PER_PAGE));
  const pages = Math.max(1, Math.ceil(lessons.length / PER_PAGE));
  const page = Math.min(pageIndex, pages - 1);
  const selected = lessons.find((l) => l.chapter.id === chosen) || lessons[0];
  const { chapter } = selected;

  return (
    <div className="carnet-stack guide-page">
      <div className="carnet-band guide-switch">
        <PixelIcon id="guidebook" />
        <span className="carnet-band-text">
          <b>Conseils de Rosalie</b>
          <small>{off ? 'Coupés : Rosalie ne montre plus le prochain geste.' : 'Rosalie montre le prochain geste, au moment où une mécanique arrive.'}</small>
        </span>
        <button type="button" className="carnet-switch guide-toggle" role="switch" aria-checked={!off} onClick={() => onToggle(!off)}>
          <i aria-hidden="true" />
          {off ? 'Coupés' : 'Activés'}
        </button>
      </div>
      <div className="carnet-split">
        <div className="carnet-list-column">
          <ul className="carnet-list" aria-label="Leçons">
            {lessons.slice(page * PER_PAGE, (page + 1) * PER_PAGE).map((lesson) => (
              <li key={lesson.chapter.id}>
                <button type="button" className="carnet-row" data-state={lesson.status === 'locked' ? 'mystery' : undefined} aria-pressed={chosen === lesson.chapter.id} onClick={() => setChosen(lesson.chapter.id)}>
                  <span className="carnet-row-art" aria-hidden="true">
                    <PixelIcon id={LESSON_ICONS[lesson.chapter.id] || 'guidebook'} />
                  </span>
                  <span className="carnet-row-label">
                    <b>{lesson.open ? lesson.chapter.title : 'Leçon à découvrir'}</b>
                    {!lesson.open && <small>{lesson.when}</small>}
                  </span>
                  <span className="carnet-chip" data-tone={STATUS[lesson.status].tone}>
                    {lesson.status === 'locked' && <PixelIcon id="cadenas" className="inline-icon" />}
                    {STATUS[lesson.status].label}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <CarnetPager page={page} pages={pages} label="Pages des leçons" onPage={setPageIndex} />
        </div>
        <article className="carnet-detail" aria-labelledby="guide-lesson">
          <header className="carnet-detail-head">
            <span className="carnet-detail-art" aria-hidden="true">
              <PixelIcon id={LESSON_ICONS[chapter.id] || 'guidebook'} />
            </span>
            <div>
              <h4 id="guide-lesson">{selected.open ? chapter.title : 'Leçon à découvrir'}</h4>
              <p className="carnet-detail-sub">
                {STATUS[selected.status].label}
                {selected.open ? ` · ${chapter.steps.length} étape${chapter.steps.length > 1 ? 's' : ''}` : ''}
              </p>
            </div>
          </header>
          {selected.open ? (
            <>
              <p className="carnet-text">{chapter.guide}</p>
              <ol className="guide-steps">
                {chapter.steps.map((step, index) => (
                  <li key={step.id}>
                    <b>{index + 1}</b>
                    <span>{STEP_LABELS[step.id] || step.id}</span>
                  </li>
                ))}
              </ol>
              <div className="carnet-detail-actions">
                <button type="button" className="carnet-primary" onClick={() => onReplay(chapter.id)} disabled={selected.active && !off}>
                  <PixelIcon id="guidebook" />
                  {selected.active && !off ? 'Leçon en cours' : selected.done ? 'Revoir cette leçon' : 'Commencer cette leçon'}
                </button>
              </div>
            </>
          ) : (
            <p className="carnet-text">Cette leçon s’ouvrira avec sa mécanique. {selected.when}.</p>
          )}
          <p className="carnet-note carnet-center">Les nouvelles leçons arrivent avec vos découvertes.</p>
        </article>
      </div>
    </div>
  );
}
