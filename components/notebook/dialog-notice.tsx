'use client';
/** Extrait de app/page.tsx (0.11.1), à comportement identique. */


export function DialogNotice({ notice }: { notice?: string }) {
  return (
    <output
      className="dialog-notice"
      aria-live="polite"
      data-empty={!notice || undefined}
    >
      {notice}
    </output>
  );
}
