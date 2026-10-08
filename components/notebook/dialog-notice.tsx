'use client';
/** Extrait de app/page.tsx (0.11.1), à comportement identique. */


export function DialogNotice({ notice }: { notice?: string }) {
  return (
    <output
      className="dialog-notice"
      aria-live="polite"
      data-empty={!notice || undefined}
    >
      {/* 0.31 : remonté à chaque message, pour rejouer l’éclat d’étincelles. */}
      {notice && <span key={notice} className="dialog-notice-text">{notice}</span>}
    </output>
  );
}
