'use client';
/**
 * 0.10 — Rosalie guide pas à pas : bulle près de l’élément à utiliser,
 * élément mis en évidence, boutons « Compris », « Plus tard » et « Couper
 * les conseils ». Dans une fenêtre ouverte (carnet, panier…), la bulle se
 * place dans la fenêtre pour rester utilisable au clavier et à la souris.
 */
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { type Game } from '@/lib/game';
import { tutorialCurrent } from '@/lib/tutorial';
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
      // 0.32.9 : sur la carte, la bulle reste entre le bandeau du haut et la
      // barre d’actions (portables Windows à 125-150 % : 600 à 730 px utiles).
      const dock = dialog ? null : document.querySelector('.action-dock')?.getBoundingClientRect();
      const hud = dialog ? null : document.querySelector('.pixel-hud')?.getBoundingClientRect();
      const floor = dock && dock.top > box.top + box.height / 2 ? dock.top - box.top : box.height;
      const ceiling = hud && hud.bottom < box.top + box.height / 2 ? hud.bottom - box.top : 0;
      if (!target) {
        // Sans cible visible : en bas, au-dessus de la barre d’actions.
        placeIfChanged({
          left: Math.max(12, (box.width - width) / 2),
          top: Math.max(ceiling + 12, dock ? floor - height - 12 : box.height - height - 110),
          below: false,
        });
        return;
      }
      const rect = target.getBoundingClientRect();
      const x = rect.left - box.left + rect.width / 2 - width / 2;
      const roomBelow = floor - (rect.bottom - box.top);
      const roomAbove = rect.top - box.top - ceiling;
      const below = roomBelow > height + 24 || (roomAbove < height + 24 && roomBelow >= roomAbove);
      const y = below ? rect.bottom - box.top + 14 : rect.top - box.top - height - 14;
      const lo = ceiling + 12;
      const hi = floor - height - 12;
      const top = hi >= lo ? Math.min(Math.max(lo, y), hi) : Math.min(Math.max(12, y), box.height - height - 12);
      // Dans une fenêtre qui défile, la bulle suit le contenu.
      const scroll = dialog ? dialog.scrollTop : 0;
      placeIfChanged({
        left: Math.min(Math.max(12, x), box.width - width - 12),
        top: top + scroll,
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
