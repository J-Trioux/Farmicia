/** Une jauge animée qui représente uniquement la progression réelle du jeu. */
export function CarnetProgress({ value, max, label, valueText, className = '' }: {
  value: number;
  max: number;
  label: string;
  valueText?: string;
  className?: string;
}) {
  const limit = Number.isFinite(max) && max > 0 ? max : 1;
  const current = Number.isFinite(value) ? Math.max(0, Math.min(limit, value)) : 0;
  const percent = current / limit * 100;
  return (
    <span
      className={`carnet-gauge carnet-progress ${className}`}
      data-complete={percent === 100 || undefined}
    >
      <progress className="sr-only" value={current} max={limit} aria-label={label} aria-valuetext={valueText} />
      <i aria-hidden="true" style={{ width: `${percent}%` }} />
    </span>
  );
}
