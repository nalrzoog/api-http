import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { FullPageSpinner } from '../components/FullPageSpinner';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { useInvoices } from '../hooks/useInvoices';
import { fetchInvoiceItems } from '../services/invoiceService';
import { formatDate, formatMoney } from '../lib/format';
import { invoiceStatusColor } from '../lib/invoiceFormat';
import type { Invoice } from '../types/invoice';

export function InvoicesPage() {
  const navigate = useNavigate();
  const { invoices, loading, error, removeInvoice } = useInvoices();
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleExport(invoice: Invoice, mode: 'download' | 'print') {
    if (busyId) return;
    setActionError(null);
    setBusyId(invoice.id);
    try {
      const items = await fetchInvoiceItems(invoice.id);
      const { exportInvoicePdf, printInvoicePdf } = await import('../lib/exportInvoicePdf');
      if (mode === 'download') await exportInvoicePdf(invoice, items);
      else await printInvoicePdf(invoice, items);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'تعذر إنشاء ملف PDF، حاول مرة أخرى');
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <FullPageSpinner />;

  return (
    <AppShell>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ fontSize: 12, letterSpacing: '.2em', color: 'var(--fk-purple-dark)', marginBottom: 10 }}>السجلات المالية</div>
          <h1 style={{ fontFamily: 'Tajawal, sans-serif', fontWeight: 400, fontSize: 'clamp(28px,3.2vw,40px)', margin: 0 }}>الفواتير</h1>
        </div>
        <button className="fk-btn-primary" style={{ padding: '12px 20px', fontSize: 14.5 }} onClick={() => navigate('/invoices/new')}>
          + إصدار فاتورة
        </button>
      </div>
      <div style={{ height: 1, background: 'var(--fk-border)', margin: '22px 0 26px' }} />

      {error && <div style={{ marginBottom: 16, fontSize: 13.5, color: 'var(--fk-purple-dark)' }}>{error}</div>}
      {actionError && <div style={{ marginBottom: 16, fontSize: 13.5, color: 'var(--fk-purple-dark)' }}>{actionError}</div>}

      {invoices.length === 0 ? (
        <div className="fk-card" style={{ padding: '48px 18px', textAlign: 'center', fontSize: 14, color: 'var(--fk-text-faint)' }}>
          لا توجد فواتير بعد.
        </div>
      ) : (
        <div className="fk-card" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 960 }}>
            <thead>
              <tr style={{ background: '#FAF9F7', borderBottom: '1px solid var(--fk-border)' }}>
                <th style={th}>رقم الفاتورة</th>
                <th style={th}>العميل</th>
                <th style={th}>تاريخ الفاتورة</th>
                <th style={th}>تاريخ التوريد</th>
                <th style={th}>الموقع</th>
                <th style={{ ...th, textAlign: 'end' }}>الإجمالي</th>
                <th style={{ ...th, textAlign: 'end' }}>الخصم</th>
                <th style={{ ...th, textAlign: 'end' }}>الصافي</th>
                <th style={{ ...th, textAlign: 'end' }}>الحالة</th>
                <th style={{ ...th, textAlign: 'end' }}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} style={{ borderBottom: '1px solid var(--fk-border-faint)' }}>
                  <td style={{ ...td, fontVariantNumeric: 'tabular-nums' }}>{inv.invoice_number}</td>
                  <td style={td}>{inv.customer_name}</td>
                  <td style={{ ...td, fontVariantNumeric: 'tabular-nums', color: 'var(--fk-text-label)' }}>{formatDate(inv.invoice_date)}</td>
                  <td style={{ ...td, fontVariantNumeric: 'tabular-nums', color: 'var(--fk-text-label)' }}>{formatDate(inv.delivery_date)}</td>
                  <td style={td}>{inv.location || '—'}</td>
                  <td style={{ ...td, textAlign: 'end', fontVariantNumeric: 'tabular-nums' }}>{formatMoney(inv.subtotal)}</td>
                  <td style={{ ...td, textAlign: 'end', fontVariantNumeric: 'tabular-nums' }}>{formatMoney(inv.discount)}</td>
                  <td style={{ ...td, textAlign: 'end', fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>{formatMoney(inv.net_total)}</td>
                  <td style={{ ...td, textAlign: 'end', color: invoiceStatusColor(inv.status), fontSize: 12.5 }}>{inv.status}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'end' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      <Link to={`/invoices/${inv.id}`} className="fk-btn-secondary" style={{ padding: '6px 10px', fontSize: 12 }}>
                        عرض
                      </Link>
                      <Link to={`/invoices/${inv.id}`} className="fk-btn-secondary" style={{ padding: '6px 10px', fontSize: 12 }}>
                        تعديل
                      </Link>
                      <button className="fk-btn-secondary" style={{ padding: '6px 10px', fontSize: 12 }} disabled={busyId === inv.id} onClick={() => handleExport(inv, 'download')}>
                        تحميل PDF
                      </button>
                      <button className="fk-btn-secondary" style={{ padding: '6px 10px', fontSize: 12 }} disabled={busyId === inv.id} onClick={() => handleExport(inv, 'print')}>
                        طباعة
                      </button>
                      <button
                        className="fk-btn-secondary"
                        style={{ padding: '6px 10px', fontSize: 12, color: 'var(--fk-purple-dark)' }}
                        onClick={() => setDeleteTarget(inv)}
                      >
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          message={`سيتم حذف الفاتورة رقم «${deleteTarget.invoice_number}» نهائياً. هل تريد المتابعة؟`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={async () => {
            await removeInvoice(deleteTarget.id);
            setDeleteTarget(null);
          }}
        />
      )}
    </AppShell>
  );
}

const th: React.CSSProperties = { textAlign: 'start', padding: '12px 14px', fontSize: 12, fontWeight: 400, color: 'var(--fk-text-label)' };
const td: React.CSSProperties = { padding: '12px 14px', fontSize: 13.5 };
