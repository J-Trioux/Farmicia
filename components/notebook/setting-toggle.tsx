'use client';
/** Extrait de app/page.tsx (0.11.1), à comportement identique. */


export function SettingToggle({
  label,
  description,
  active,
  onClick,
}: {
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button className="setting-toggle" onClick={onClick} aria-pressed={active}>
      <span>
        <b>{label}</b>
        <small>{description}</small>
      </span>
      <i>{active ? 'Oui' : 'Non'}</i>
    </button>
  );
}
