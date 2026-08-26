import type { MonthBucket } from '../lib/dashboard';
import { formatMoney } from '../lib/format';

export function MonthlyInvoiceChart({ months }: { months: MonthBucket[] }) {
  return (
    <div className="fk-card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
        <h3 style={{ fontFamily: 'Tajawal, sans-serif', fontWeight: 400, fontSize: 21, margin: 0 }}>قيمة الفواتير شهرياً</h3>
        <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--fk-text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, background: 'var(--fk-green)', borderRadius: 2 }} />
            مدفوع
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, background: 'var(--fk-purple)', borderRadius: 2 }} />
            متبقي
          </span>
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 'clamp(8px,2vw,20px)',
          height: 196,
          paddingTop: 22,
          borderBottom: '1px solid var(--fk-border)',
        }}
      >
        {months.map((m) => (
          <div
            key={m.key}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', height: '100%', gap: 8 }}
          >
            <div style={{ fontSize: 11, color: 'var(--fk-text-muted)', fontVariantNumeric: 'tabular-nums' }}>
              {m.invoice > 0 ? formatMoney(m.invoice) : ''}
            </div>
            <div
              style={{
                width: '100%',
                maxWidth: 44,
                height: `${Math.max(m.barPct, m.invoice > 0 ? 3 : 0)}%`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                borderRadius: '3px 3px 0 0',
                overflow: 'hidden',
              }}
            >
              <div style={{ height: `${m.remainPct}%`, background: 'var(--fk-purple)' }} />
              <div style={{ height: `${m.paidPct}%`, background: 'var(--fk-green)' }} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 'clamp(8px,2vw,20px)', marginTop: 10 }}>
        {months.map((m) => (
          <div key={m.key} style={{ flex: 1, textAlign: 'center', fontSize: 12, color: 'var(--fk-text-muted)' }}>
            {m.label}
          </div>
        ))}
      </div>
    </div>
  );
}
