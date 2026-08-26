import type { MonthBucket } from '../lib/dashboard';

export function MonthlyEventsChart({ months }: { months: MonthBucket[] }) {
  return (
    <div className="fk-card" style={{ padding: 24 }}>
      <h3 style={{ fontFamily: 'Tajawal, sans-serif', fontWeight: 400, fontSize: 21, margin: '0 0 18px' }}>عدد المناسبات شهرياً</h3>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'clamp(6px,1.6vw,16px)', height: 150, borderBottom: '1px solid var(--fk-border)' }}>
        {months.map((m) => (
          <div key={m.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: 8, height: '100%' }}>
            <div style={{ fontSize: 12, color: 'var(--fk-text)', fontVariantNumeric: 'tabular-nums' }}>{m.count || ''}</div>
            <div
              style={{
                width: '100%',
                maxWidth: 38,
                height: `${Math.max(m.countPct, m.count > 0 ? 4 : 0)}%`,
                background: 'rgba(31,55,51,.12)',
                borderTop: '2px solid var(--fk-green)',
              }}
            />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 'clamp(6px,1.6vw,16px)', marginTop: 10 }}>
        {months.map((m) => (
          <div key={m.key} style={{ flex: 1, textAlign: 'center', fontSize: 12, color: 'var(--fk-text-muted)' }}>
            {m.label}
          </div>
        ))}
      </div>
    </div>
  );
}
