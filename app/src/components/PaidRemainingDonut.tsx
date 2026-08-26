import { formatMoney } from '../lib/format';

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function PaidRemainingDonut({
  totalInvoice,
  totalPaid,
  totalRemaining,
}: {
  totalInvoice: number;
  totalPaid: number;
  totalRemaining: number;
}) {
  const paidFraction = totalInvoice > 0 ? totalPaid / totalInvoice : 0;
  const ringAll = totalInvoice > 0 ? `${CIRCUMFERENCE} ${CIRCUMFERENCE}` : `0 ${CIRCUMFERENCE}`;
  const ringPaid = `${CIRCUMFERENCE * paidFraction} ${CIRCUMFERENCE}`;

  return (
    <div className="fk-card" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ fontFamily: 'Tajawal, sans-serif', fontWeight: 400, fontSize: 21, margin: '0 0 4px' }}>المدفوع مقابل المتبقي</h3>
      <div style={{ fontSize: 12.5, color: 'var(--fk-text-muted)', marginBottom: 12 }}>
        من إجمالي {formatMoney(totalInvoice)} ريال
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 26, flexWrap: 'wrap', flex: 1 }}>
        <svg viewBox="0 0 120 120" style={{ width: 158, height: 158, transform: 'rotate(-90deg)' }}>
          <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="var(--fk-border-faint)" strokeWidth="12" />
          <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="var(--fk-purple)" strokeWidth="12" strokeDasharray={ringAll} />
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            stroke="var(--fk-green)"
            strokeWidth="12"
            strokeDasharray={ringPaid}
            strokeLinecap="butt"
          />
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ fontSize: 12.5, color: 'var(--fk-text-muted)', marginBottom: 4 }}>المدفوع</div>
            <div style={{ fontFamily: 'Tajawal, sans-serif', fontSize: 26, fontVariantNumeric: 'tabular-nums' }}>{formatMoney(totalPaid)}</div>
          </div>
          <div>
            <div style={{ fontSize: 12.5, color: 'var(--fk-text-muted)', marginBottom: 4 }}>المتبقي</div>
            <div style={{ fontFamily: 'Tajawal, sans-serif', fontSize: 26, color: 'var(--fk-purple-dark)', fontVariantNumeric: 'tabular-nums' }}>
              {formatMoney(totalRemaining)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
