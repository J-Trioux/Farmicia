'use client';
/**
 * 0.24 — Le carnet de Rosalie, nouvelle reliure (maquettes de ChatGPT,
 * assets/carnet-complet-2026-10-06/, uniformisées).
 *
 * Une seule structure pour toutes les pages :
 *   - à gauche, la reliure : titre (qui mène au sommaire), quatre chapitres
 *     dépliants (un seul ouvert à la fois, celui de la page lue par défaut),
 *     puis deux raccourcis calculés depuis la partie (commandes prêtes,
 *     récompenses à réclamer) ;
 *   - à droite, la page : icône dans son médaillon, titre, sous-titre, zone de
 *     statut, puis le contenu. Les bandeaux, onglets et pagination des pages
 *     viennent des composants communs de ce fichier, aux mêmes mesures partout.
 *
 * Les règles d’ouverture des pages (lib/notebook.ts) ne changent pas : un
 * chapitre ou une page pas encore ouverts n’apparaissent pas.
 */
import { useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { DialogNotice } from '@/components/notebook/dialog-notice';
import { CarnetIcon as PixelIcon } from '@/components/notebook/carnet-icon';
import { CarnetAssets } from '@/components/notebook/carnet-assets';
import { NOTEBOOK_CHAPTERS, PAGE_KEYS, type NotebookPage } from '@/lib/notebook';
import { CARNET_ART } from '@/lib/carnet-art';
import { CarnetAmbience } from '@/components/notebook/carnet-ambience';
import { SpineRosalie } from '@/components/notebook/spine-rosalie';
import { Glyph } from '@/components/glyph';

/** La page d’accueil du carnet (hors des chapitres). */
export const SUMMARY = 'sommaire';

export const CHAPTER_ART: Record<string, { icon: string; label: string }> = {
  village: { icon: 'chap-village', label: 'Village' },
  farm: { icon: 'chap-ferme', label: 'Ferme' },
  kitchen: { icon: 'chap-cuisine', label: 'Cuisine' },
  memories: { icon: 'chap-souvenirs', label: 'Souvenirs' },
};

const plural = (n: number, one: string, many: string) => (n > 1 ? many : one);

export function CarnetDialog({
  open,
  onClose,
  tab,
  onPage,
  pages,
  badges,
  unseen,
  notice,
  aside,
  children,
}: {
  open: boolean;
  onClose: () => void;
  /** Page affichée (identifiant de lib/notebook.ts, ou SUMMARY). */
  tab: string;
  onPage: (id: string) => void;
  /** Pages ouvertes dans la partie, dans l’ordre du dos. */
  pages: NotebookPage[];
  badges: Partial<Record<string, number>>;
  unseen: NotebookPage[];
  notice?: string;
  /** Petit encart à droite du titre (saison et jour sur le sommaire). */
  aside?: ReactNode;
  children: ReactNode;
}) {
  const page = pages.find((entry) => entry.value === tab);
  const chapterOf = (id: string) => NOTEBOOK_CHAPTERS.find((chapter) => chapter.pages.some((entry) => entry.value === id))?.id;
  const current = page ? chapterOf(page.value) : undefined;
  // Un seul chapitre ouvert : celui de la page lue, sauf si le joueur en ouvre un autre.
  const [unfolded, setUnfolded] = useState<{ for: string; id: string | null } | null>(null);
  const openChapter = unfolded && unfolded.for === tab ? unfolded.id : current ?? null;
  const visible = <T extends { value: string }>(chapterPages: T[]) =>
    chapterPages.filter((entry) => pages.some((open) => open.value === entry.value));
  const go = (id: string) => {
    setUnfolded(null);
    onPage(id);
  };
  const orders = pages.some((entry) => entry.value === 'orders') ? badges.orders || 0 : null;
  const rewards = pages.some((entry) => entry.value === 'goals') ? badges.goals || 0 : null;

  // ↑ et ↓ feuillettent les pages ouvertes depuis la reliure.
  function arrows(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    const order = [SUMMARY, ...pages.map((entry) => entry.value)];
    const index = Math.max(0, order.indexOf(tab));
    const next = order[(index + (event.key === 'ArrowDown' ? 1 : order.length - 1)) % order.length];
    go(next);
    requestAnimationFrame(() =>
      document.querySelector<HTMLElement>(`.carnet-spine [data-carnet-target="${next}"]`)?.focus(),
    );
  }

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent
        className="carnet-dialog max-w-none gap-0 rounded-none bg-transparent p-0 ring-0 sm:max-w-none"
        showCloseButton={false}
      >
        <CarnetAssets><div className="carnet">
          <nav className="carnet-spine" aria-label="Chapitres du carnet">
            <button
              type="button"
              className="carnet-cover"
              data-carnet-target={SUMMARY}
              aria-current={tab === SUMMARY ? 'page' : undefined}
              aria-label="Sommaire du carnet"
              onKeyDown={arrows}
              onClick={() => go(SUMMARY)}
            >
              <span className="carnet-cover-art" aria-hidden="true">
                <PixelIcon id="guidebook" />
              </span>
              <span className="carnet-cover-title" aria-hidden="true">
                <b>Carnet</b>
              </span>
            </button>
            <DialogTitle className="sr-only">Carnet</DialogTitle>
            <DialogDescription className="sr-only">
              Chapitres à gauche, page à droite. Flèches haut et bas pour feuilleter, Échap pour fermer.
            </DialogDescription>
            <ul className="carnet-chapters">
              {NOTEBOOK_CHAPTERS.map((chapter) => {
                const list = visible(chapter.pages);
                if (!list.length) return null;
                const art = CHAPTER_ART[chapter.id];
                const isOpen = openChapter === chapter.id;
                const todo = list.reduce((sum, entry) => sum + (badges[entry.value] || 0), 0);
                const fresh = list.some((entry) => unseen.some((page) => page.value === entry.value));
                return (
                  <li key={chapter.id} className="carnet-chapter" data-open={isOpen || undefined} data-current={current === chapter.id || undefined}>
                    <button
                      type="button"
                      className="carnet-chapter-head"
                      aria-expanded={isOpen}
                      aria-controls={`carnet-${chapter.id}`}
                      data-carnet-pages={list.map((entry) => entry.label).join(' ')}
                      onClick={() => setUnfolded({ for: tab, id: isOpen ? null : chapter.id })}
                    >
                      <PixelIcon id={art.icon} />
                      <span className="carnet-chapter-label">{art.label}</span>
                      {todo > 0 && !isOpen && <b className="carnet-count" aria-label={`${todo} à faire`}>{todo}</b>}
                      {fresh && !isOpen && <em className="carnet-new-dot" aria-label="nouvelle page" />}
                      <Glyph id="chevron-bas" className="carnet-chevron" />
                    </button>
                    <div className="carnet-pages-wrap" id={`carnet-${chapter.id}`} inert={!isOpen}>
                      <ul className="carnet-pages">
                        {list.map(({ value, label, icon }) => {
                          const count = badges[value] || 0;
                          const isNew = unseen.some((entry) => entry.value === value);
                          const key = PAGE_KEYS[pages.findIndex((entry) => entry.value === value)];
                          return (
                            <li key={value}>
                              <button
                                type="button"
                                className="carnet-link"
                                data-carnet-target={value}
                                data-new={isNew || undefined}
                                aria-current={tab === value ? 'page' : undefined}
                                aria-label={[label, isNew && 'nouvelle page', count && `${count} à faire`].filter(Boolean).join(', ')}
                                aria-keyshortcuts={key?.toUpperCase()}
                                title={key ? `${label} · touche ${key.toUpperCase()}` : label}
                                onKeyDown={arrows}
                                onClick={() => go(value)}
                              >
                                <PixelIcon id={icon} />
                                <span className="carnet-link-label">{label}</span>
                                {isNew && <em className="carnet-new" aria-hidden="true">Nouveau</em>}
                                {count > 0 && <b className="carnet-count" aria-hidden="true">{count}</b>}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </li>
                );
              })}
            </ul>
            <SpineRosalie />
            <div className="carnet-shortcuts">
              {orders !== null && (
                <button
                  type="button"
                  className="carnet-shortcut"
                  data-ready={orders > 0 || undefined}
                  aria-label={orders ? `${orders} ${plural(orders, 'commande prête', 'commandes prêtes')}` : 'Aucune commande prête'}
                  onClick={() => go('orders')}
                >
                  <PixelIcon id="commande" />
                  <span className="carnet-shortcut-long">{orders ? `${orders} ${plural(orders, 'commande prête', 'commandes prêtes')}` : 'Aucune commande'}</span>
                  <span className="carnet-shortcut-short" aria-hidden="true">{orders}</span>
                  <Glyph id="chevron-droite" />
                </button>
              )}
              {rewards !== null && (
                <button
                  type="button"
                  className="carnet-shortcut"
                  data-ready={rewards > 0 || undefined}
                  aria-label={rewards ? `${rewards} ${plural(rewards, 'récompense', 'récompenses')} à réclamer` : 'Aucune récompense à réclamer'}
                  onClick={() => go('goals')}
                >
                  <PixelIcon id="planchette" />
                  <span className="carnet-shortcut-long">{rewards ? `${rewards} ${plural(rewards, 'récompense', 'récompenses')}` : 'Aucune récompense'}</span>
                  <span className="carnet-shortcut-short" aria-hidden="true">{rewards}</span>
                  <Glyph id="chevron-droite" />
                </button>
              )}
            </div>
          </nav>
          <section className="carnet-page" aria-labelledby="carnet-page-title">
            <header className="carnet-head" key={tab}>
              <div className="carnet-heading">
                <span className="carnet-medal" aria-hidden="true">
                  <PixelIcon id={page?.icon || 'guidebook'} />
                </span>
                <div className="carnet-head-text">
                  <h3 id="carnet-page-title">{page?.label || 'Sommaire'}</h3>
                  <p>{page?.tagline || 'Chaque chose a sa page.'}</p>
                </div>
              </div>
              <span className="carnet-heading-magic" aria-hidden="true">
                <i className="carnet-effect carnet-effect-sparkle" />
                <i className="carnet-effect carnet-effect-feather" />
              </span>
              {aside && <div className="carnet-head-aside">{aside}</div>}
            </header>
            <DialogNotice notice={notice} />
            <div className="carnet-body" key={`body-${tab}`} data-page={tab}>
              {children}
            </div>
          </section>
          <DialogClose className="carnet-close" aria-label="Fermer le carnet">
            <Glyph id="croix" />
          </DialogClose>
        </div></CarnetAssets>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Bandeau illustré d’une page : même hauteur et même cadre partout.
 * L’image remplit le cadre (comme object-fit: cover) ; `focusY` choisit la
 * ligne gardée au centre. Les illustrations originales ne contiennent aucun
 * texte : `panel` porte les informations du jeu sur la gauche, à la largeur
 * `panelWidth` (en % du cadre). `variant` adapte le décor à la voie affichée.
 * `children` se posent sur le cadre (fourneaux, destinations…).
 */
export function CarnetBanner({
  id,
  variant,
  focusY = 50,
  panel,
  panelWidth = 40,
  children,
}: {
  id: string;
  variant?: string;
  focusY?: number;
  panel?: ReactNode;
  panelWidth?: number;
  children?: ReactNode;
}) {
  const scene = variant ? `${id}-${variant}` : id;
  const art = CARNET_ART[scene] || CARNET_ART[id];
  const { width: w, height: h } = art;
  const style = { '--ratio': w / h, '--fy': `${focusY}%`, '--panel': `${panelWidth}%` } as CSSProperties;
  return (
    <figure className="carnet-banner" data-banner={id} style={style}>
      <div className="carnet-banner-art">
        {/* eslint-disable-next-line @next/next/no-img-element -- illustration fixe, sans redimensionnement serveur */}
        <img src={art.src} alt="" width={w} height={h} draggable={false} />
        <CarnetAmbience key={scene} scene={scene} image={art.src} />
      </div>
      {panel && <div className="carnet-banner-panel">{panel}</div>}
      {children}
    </figure>
  );
}

/** Récompenses en puces : pièces, XP et le reste, toujours dans cet ordre. */
export function CarnetRewards({ coins, xp, extra = [] }: { coins?: number; xp?: number; extra?: { icon: string; label: string }[] }) {
  return (
    <ul className="carnet-rewards">
      {coins !== undefined && (
        <li>
          <PixelIcon id="piece" />
          <span>
            <b>{coins.toLocaleString('fr-FR')}</b> pièces
          </span>
        </li>
      )}
      {xp !== undefined && (
        <li>
          <PixelIcon id="etoile" />
          <span>
            <b>{xp.toLocaleString('fr-FR')}</b> XP
          </span>
        </li>
      )}
      {extra.map((entry) => (
        <li key={entry.label}>
          <PixelIcon id={entry.icon} />
          <span>{entry.label}</span>
        </li>
      ))}
    </ul>
  );
}

/** Cœurs d’amitié (sur 5), lus « 3 cœurs sur 5 ». */
export function CarnetHearts({ value }: { value: number }) {
  const n = Math.max(0, Math.min(5, Math.floor(value)));
  return (
    <span className="carnet-hearts">
      <span className="sr-only">{`${n} cœur${n > 1 ? 's' : ''} sur 5`}</span>
      {[0, 1, 2, 3, 4].map((i) => (
        <i key={i} aria-hidden="true" data-on={i < n || undefined} style={{ '--heart-delay': `${i * 70}ms` } as CSSProperties} />
      ))}
    </span>
  );
}

/** Ligne de progression en segments (étapes, jauges de note). */
export function CarnetSegments({ value, max, segments = 5, label }: { value: number; max: number; segments?: number; label?: string }) {
  const filled = max > 0 ? Math.max(0, Math.min(1, value / max)) * segments : 0;
  return (
    <span className="carnet-segments">
      <progress className="sr-only" aria-label={label || 'Progression'} value={Math.max(0, Math.min(max, value))} max={max > 0 ? max : 1} />
      {Array.from({ length: segments }, (_, i) => (
        <i key={i} aria-hidden="true" data-filled={filled > i || undefined}>
          <em style={{ width: `${Math.max(0, Math.min(1, filled - i)) * 100}%`, '--bar-delay': `${i * 65}ms` } as CSSProperties} />
        </i>
      ))}
    </span>
  );
}

/** Onglets d’une page (catégories) : même dessin sur toutes les pages. */
export function CarnetTabs<T extends string>({
  label,
  value,
  onChange,
  items,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  /** `short` : libellé des écrans de 1 400 px et moins (le libellé complet reste lu). */
  items: { id: T; label: string; short?: string; icon?: string; count?: number; hidden?: boolean; disabled?: boolean }[];
}) {
  // Une seule catégorie : pas d’onglet (rien à choisir).
  if (items.filter((item) => !item.hidden).length < 2) return null;
  return (
    <fieldset className="carnet-tabs">
      <legend className="sr-only">{label}</legend>
      {items.filter((item) => !item.hidden).map((item) => (
        <button
          key={item.id}
          type="button"
          className="carnet-tab"
          data-carnet-tab={item.id}
          aria-pressed={value === item.id}
          aria-label={item.short ? item.label : undefined}
          disabled={item.disabled}
          onClick={() => onChange(item.id)}
        >
          {item.icon && <PixelIcon id={item.icon} />}
          {item.short ? (
            <>
              <span className="carnet-tab-long">{item.label}</span>
              <span className="carnet-tab-short" aria-hidden="true">{item.short}</span>
            </>
          ) : (
            <span>{item.label}</span>
          )}
          {!!item.count && <b className="carnet-count">{item.count}</b>}
        </button>
      ))}
    </fieldset>
  );
}

/** Pagination d’une liste : ◀ 1 / 3 ▶, toujours au même endroit sous la liste. */
export function CarnetPager({ page, pages, onPage, label }: { page: number; pages: number; onPage: (page: number) => void; label: string }) {
  if (pages <= 1) return <div className="carnet-pager" aria-hidden="true" />;
  return (
    <nav className="carnet-pager" aria-label={label}>
      <button type="button" disabled={page <= 0} onClick={() => onPage(page - 1)} aria-label="Page précédente">
        <Glyph id="chevron-gauche" />
      </button>
      <output aria-live="polite">
        {page + 1}
        {' / '}
        {pages}
      </output>
      <button type="button" disabled={page >= pages - 1} onClick={() => onPage(page + 1)} aria-label="Page suivante">
        <Glyph id="chevron-droite" />
      </button>
    </nav>
  );
}
