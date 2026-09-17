import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useInvoices } from '../hooks/useInvoices';
import { formatMoney } from '../lib/format';

export function InvoicesSummaryCard() {
  const { invoices, loading } = useInvoices();

  const { count, totalNet } = useMemo(
    () => ({
      count: invoices.length,
      totalNet: invoices.reduce((sum, i) => sum + Number(i.net_total), 0),
    }),
    [invoices]
  );

  if (loading) return null;

  return (
    <div className="fk-card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
        <h3 style={{ fontFamily: 'Tajawal, sans-serif', fontWeight: 400, fontSize: 21, margin: 0 }}>الفواتير</h3>
        <Link to="/invoices" className="fk-btn-link" style={{ color: 'var(--fk-purple-dark)', borderBottom: '1px solid var(--fk-purple)' }}>
          عرض الكل
        </Link>
      </div>
      <div style={{ display: 'flex', gap: 24 }}>
        <div>
          <div style={{ fontFamily: 'Tajawal, sans-serif', fontSize: 30, fontVariantNumeric: 'tabular-nums' }}>{count}</div>
          <div style={{ fontSize: 12, color: 'var(--fk-text-muted)', marginTop: 4 }}>إجمالي عدد الفواتير</div>
        </div>
        <div>
          <div style={{ fontFamily: 'Tajawal, sans-serif', fontSize: 30, fontVariantNumeric: 'tabular-nums' }}>{formatMoney(totalNet)}</div>
          <div style={{ fontSize: 12, color: 'var(--fk-text-muted)', marginTop: 4 }}>إجمالي صافي الفواتير (ريال)</div>
        </div>
      </div>
    </div>
  );
}
