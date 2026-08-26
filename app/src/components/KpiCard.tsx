export function KpiCard({
  label,
  value,
  hint,
  highlight,
  valueColor,
}: {
  label: string;
  value: string;
  hint?: string;
  highlight?: boolean;
  valueColor?: string;
}) {
  return (
    <div
      className="fk-card"
      style={{
        padding: 20,
        borderColor: highlight ? 'var(--fk-purple)' : undefined,
      }}
    >
      <div style={{ fontSize: 12.5, color: 'var(--fk-text-muted)', marginBottom: 12 }}>{label}</div>
      <div
        style={{
          fontFamily: 'Tajawal, sans-serif',
          fontSize: 34,
          fontVariantNumeric: 'tabular-nums',
          color: valueColor ?? 'var(--fk-text)',
        }}
      >
        {value}
      </div>
      {hint && <div style={{ fontSize: 11.5, color: 'var(--fk-text-faint)', marginTop: 6 }}>{hint}</div>}
    </div>
  );
}
