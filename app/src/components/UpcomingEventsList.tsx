import { Link } from 'react-router-dom';
import type { Client } from '../types';
import { daysUntil, formatDate, formatMoney } from '../lib/format';

export function UpcomingEventsList({ upcoming }: { upcoming: Client[] }) {
  const shown = upcoming.slice(0, 4);

  return (
    <div className="fk-card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
        <h3 style={{ fontFamily: 'Tajawal, sans-serif', fontWeight: 400, fontSize: 21, margin: 0 }}>المناسبات القادمة</h3>
        <Link to="/clients" className="fk-btn-link" style={{ color: 'var(--fk-purple-dark)', borderBottom: '1px solid var(--fk-purple)' }}>
          عرض الكل
        </Link>
      </div>

      {shown.length === 0 && <div style={{ padding: '26px 0', fontSize: 14, color: 'var(--fk-text-faint)' }}>لا توجد مناسبات قادمة مسجلة.</div>}

      {shown.map((e) => {
        const days = daysUntil(e.event_date);
        return (
          <div
            key={e.id}
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '15px 0',
              borderBottom: '1px solid var(--fk-border-faint)',
            }}
          >
            <div>
              <div style={{ fontSize: 15, marginBottom: 5 }}>{e.client_name}</div>
              <div style={{ fontSize: 12.5, color: 'var(--fk-text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                {formatDate(e.event_date)} {days !== null ? `· بعد ${days} يوم` : ''}
              </div>
            </div>
            <div style={{ textAlign: 'end' }}>
              <div style={{ fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>{formatMoney(e.invoice_value)}</div>
              <div style={{ fontSize: 12.5, color: 'var(--fk-purple-dark)', fontVariantNumeric: 'tabular-nums' }}>
                متبقي {formatMoney(e.remaining_amount)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
