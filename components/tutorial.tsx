'use client';
/**
 * 0.10 — Rosalie guide pas à pas : bulle près de l’élément à utiliser,
 * élément mis en évidence, boutons « Compris », « Plus tard » et « Couper
 * les conseils ». Dans une fenêtre ouverte (carnet, panier…), la bulle se
 * place dans la fenêtre pour rester utilisable au clavier et à la souris.
 */
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { UPGRADES, UNLOCKS, SEED_FIND_LEVEL, GARDE_STEPS, type Game } from '@/lib/game';
import { TUTORIAL, tutorialCurrent } from '@/lib/tutorial';
import { framePosition } from '@/lib/rosalie-anim';
import { ROSALIE_ATLAS } from '@/lib/rosalie-clips';

const TARGET_ATTR = 'data-tutorial-target';

function visible(el: Element) {
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 && getComputedStyle(el).visibility !== 'hidden';
}

/** Premier élément visible de la liste, en préférant celui de la fenêtre ouverte. */
function findTarget(selectors: string[] | undefined, scope: Element | null) {
  for (const selector of selectors || []) {
    const inside = scope ? [...scope.querySelectorAll(selector)] : [];
    const found = [...inside, ...document.querySelectorAll(selector)].find(visible);
    if (found) return found;
  }
  return null;
}

type Place = { left: number; top: number; below: boolean };

export function TutorialCoach({
  game,
  dialogOpen,
  onRead,
  onLater,
  onOff,
}: {
  game: Game;
  dialogOpen: boolean;
  onRead: () => void;
  onLater: () => void;
  onOff: () => void;
}) {
  const current = tutorialCurrent(game);
  const bubble = useRef<HTMLElement>(null);
  const [host, setHost] = useState<Element | null>(null);
  const [place, setPlace] = useState<Place | null>(null);
  const key = current ? `${current.chapter.id}:${current.step.id}` : '';
  const targets = current?.step.target;

  useEffect(() => {
    if (!key) return;
    let marked: Element | null = null;
    let frame = 0;
    const placeIfChanged = (next: Place) => setPlace(previous => previous && previous.left === next.left && previous.top === next.top && previous.below === next.below ? previous : next);
    const observer = new ResizeObserver(() => update());
    let observedBubble: HTMLElement | null = null;
    const update = () => {
      if (bubble.current !== observedBubble) {
        if (observedBubble) observer.unobserve(observedBubble);
        observedBubble = bubble.current;
        if (observedBubble) observer.observe(observedBubble);
      }
      const dialog = dialogOpen ? document.querySelector('[role="dialog"][data-open]') : null;
      setHost((previous) => (previous === (dialog || document.body) ? previous : dialog || document.body));
      const target = findTarget(targets, dialog);
      if (target !== marked) {
        if (marked) observer.unobserve(marked);
        marked?.removeAttribute(TARGET_ATTR);
        target?.setAttribute(TARGET_ATTR, '');
        marked = target;
        if (marked) observer.observe(marked);
      }
      const box = (dialog || document.documentElement).getBoundingClientRect();
      const width = Math.min(360, box.width - 24);
      const height = bubble.current?.offsetHeight || 150;
      if (!target) {
        // Sans cible visible : en bas, au-dessus de la barre d’actions.
        placeIfChanged({ left: Math.max(12, (box.width - width) / 2), top: Math.max(12, box.height - height - 110), below: false });
        return;
      }
      const rect = target.getBoundingClientRect();
      const x = rect.left - box.left + rect.width / 2 - width / 2;
      const room = box.bottom - rect.bottom;
      const below = room > height + 24 || rect.top - box.top < height + 24;
      const y = below ? rect.bottom - box.top + 14 : rect.top - box.top - height - 14;
      // Dans une fenêtre qui défile, la bulle suit le contenu.
      const scroll = dialog ? dialog.scrollTop : 0;
      placeIfChanged({
        left: Math.min(Math.max(12, x), box.width - width - 12),
        top: Math.min(Math.max(12, y), box.height - height - 12) + scroll,
        below,
      });
    };
    const loop = () => {
      update();
      frame = window.setTimeout(loop, 2000) as unknown as number;
    };
    loop();
    window.addEventListener('resize', update);
    document.addEventListener('scroll', update, true);
    const mutation = new MutationObserver(update);
    mutation.observe(document.body, { childList: true, subtree: true });
    return () => {
      window.clearTimeout(frame);
      window.removeEventListener('resize', update);
      document.removeEventListener('scroll', update, true);
      observer.disconnect();
      mutation.disconnect();
      marked?.removeAttribute(TARGET_ATTR);
    };
  }, [key, targets, dialogOpen]);

  if (!current || !host || !place) return null;
  const { chapter, step, index, count } = current;
  const inDialog = host !== document.body;
  const style: CSSProperties = {
    position: inDialog ? 'absolute' : 'fixed',
    left: place.left,
    top: place.top,
  };
  return createPortal(
    <section
      ref={bubble}
      className="tutorial-coach"
      data-below={place.below || undefined}
      style={style}
      aria-label="Rosalie vous guide"
    >
      <span
        className="coach-face"
        aria-hidden="true"
        style={{ backgroundImage: `url(${ROSALIE_ATLAS})`, backgroundPosition: framePosition([0, 0]) }}
      />
      <div>
        <small className="coach-chapter">
          {chapter.title} · {index + 1}/{count}
        </small>
        <p aria-live="polite">{step.text}</p>
        <div className="coach-actions">
          {step.read && (
            <button type="button" className="coach-read" onClick={onRead}>
              {index + 1 === count ? 'Terminer' : 'Compris'}
            </button>
          )}
          <button type="button" className="coach-later" onClick={onLater}>
            Plus tard
          </button>
          <button type="button" className="coach-off" onClick={onOff}>
            Couper les conseils
          </button>
        </div>
      </div>
    </section>,
    host,
  );
}

/** Le Guide du carnet : relire un chapitre, couper ou rallumer les conseils. */
export function GuidePanel({
  game,
  onReplay,
  onToggle,
}: {
  game: Game;
  onReplay: (id: string) => void;
  onToggle: (off: boolean) => void;
}) {
  const state = game.tutorial || { done: [] };
  const off = !!state.off;
  return (
    <div className="guide-book">
      <header>
        <h3>Le guide de Rosalie</h3>
        <p>
          Chaque mécanique a sa petite leçon, qui s’ouvre au moment où elle arrive dans la partie.
          Vous pouvez la revoir ici à tout moment.
        </p>
        <button type="button" className="guide-toggle" aria-pressed={!off} onClick={() => onToggle(!off)}>
          {off ? 'Rallumer les conseils de Rosalie' : 'Couper les conseils de Rosalie'}
        </button>
      </header>
      <ol className="guide-chapters">
        {TUTORIAL.map((chapter) => {
          const done = state.done.includes(chapter.id);
          const active = state.chapter === chapter.id;
          const open = done || active || chapter.ready(game);
          const upgrade = { arrosoir: 'watering-can', outils: 'tools', atelier: 'workshop', poulailler: 'coop' }[chapter.id];
          const required = upgrade ? UPGRADES.find(u => u.id === upgrade)?.level : ({ village: UNLOCKS.marketBasket, caravane: UNLOCKS.caravan, lignees: SEED_FIND_LEVEL, garde: GARDE_STEPS[0].level } as Record<string, number>)[chapter.id];
          return (
            <li key={chapter.id} data-state={active ? 'active' : done ? 'done' : open ? 'open' : 'locked'}>
              <div>
                <b>{chapter.title}</b>
                <small>{active ? 'En cours' : done ? 'Vu' : open ? 'À voir' : `À partir du niveau ${required || 1}${upgrade ? ', après installation' : chapter.id === 'lignees' ? ', après découverte d’une graine' : ''}`}</small>
                <p>{open ? chapter.guide : 'Cette leçon s’ouvrira avec sa mécanique.'}</p>
              </div>
              {open && (
                <button type="button" onClick={() => onReplay(chapter.id)} disabled={active && !off}>
                  {active && !off ? 'En cours' : done ? 'Revoir' : 'Commencer'}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
