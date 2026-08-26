import { useMemo, useState } from 'react';
import { AppShell } from '../components/AppShell';
import { ClientModal } from '../components/ClientModal';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { FullPageSpinner } from '../components/FullPageSpinner';
import { useClients } from '../hooks/useClients';
import { formatDate, formatMoney } from '../lib/format';
import type { Client } from '../types';

type SortKey = 'client_name' | 'event_date' | 'invoice_value' | 'remaining_amount';
type SortDir = 'asc' | 'desc';

function statusColor(status: Client['payment_status']) {
  if (status === 'مدفوع') return 'var(--fk-green)';
  if (status === 'مدفوع جزئياً') return 'var(--fk-purple-dark)';
  return '#B23A3A';
}

export function ClientsPage() {
  const { clients, loading, error, addClient, editClient, removeClient } = useClients();
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('event_date');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [modalTarget, setModalTarget] = useState<Client | 'new' | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  function arrow(key: SortKey) {
    if (sortKey !== key) return '';
    return sortDir === 'asc' ? '↑' : '↓';
  }

  const rows = useMemo(() => {
    const q = query.trim();
    const filtered = q
      ? clients.filter((c) => c.client_name.includes(q) || (c.event_date ?? '').includes(q) || (c.phone ?? '').includes(q))
      : clients;

    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'client_name') cmp = a.client_name.localeCompare(b.client_name, 'ar');
      else if (sortKey === 'event_date') cmp = (a.event_date ?? '').localeCompare(b.event_date ?? '');
      else if (sortKey === 'invoice_value') cmp = a.invoice_value - b.invoice_value;
      else cmp = a.remaining_amount - b.remaining_amount;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [clients, query, sortKey, sortDir]);

  const totals = useMemo(
    () => ({
      invoice: rows.reduce((s, r) => s + r.invoice_value, 0),
      paid: rows.reduce((s, r) => s + r.paid_amount, 0),
      remaining: rows.reduce((s, r) => s + r.remaining_amount, 0),
    }),
    [rows]
  );

  if (loading) return <FullPageSpinner />;

  return (
    <AppShell>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ fontSize: 12, letterSpacing: '.2em', color: 'var(--fk-purple-dark)', marginBottom: 10 }}>السجلات</div>
          <h1 style={{ fontFamily: 'Tajawal, sans-serif', fontWeight: 400, fontSize: 'clamp(28px,3.2vw,40px)', margin: 0 }}>العملاء والمناسبات</h1>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <input
            className="fk-input"
            style={{ minWidth: 236, padding: '12px 14px' }}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="بحث باسم العميل، الجوال أو التاريخ"
          />
          <button className="fk-btn-primary" style={{ padding: '12px 20px', fontSize: 14.5 }} onClick={() => setModalTarget('new')}>
            إضافة عميل
          </button>
        </div>
      </div>
      <div style={{ height: 1, background: 'var(--fk-border)', margin: '22px 0 26px' }} />

      {error && <div style={{ marginBottom: 16, fontSize: 13.5, color: 'var(--fk-purple-dark)' }}>{error}</div>}

      <div className="fk-card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 820 }}>
          <thead>
            <tr style={{ background: '#FAF9F7', borderBottom: '1px solid var(--fk-border)' }}>
              <Th onClick={() => toggleSort('client_name')}>اسم العميل {arrow('client_name')}</Th>
              <Th onClick={() => toggleSort('event_date')}>موعد الحفلة {arrow('event_date')}</Th>
              <th style={thStyle}>نوع المناسبة</th>
              <Th align="end" onClick={() => toggleSort('invoice_value')}>قيمة الفاتورة {arrow('invoice_value')}</Th>
              <th style={{ ...thStyle, textAlign: 'end' }}>المدفوع</th>
              <Th align="end" onClick={() => toggleSort('remaining_amount')}>المتبقي {arrow('remaining_amount')}</Th>
              <th style={{ ...thStyle, textAlign: 'end' }}>حالة الدفع</th>
              <th style={{ ...thStyle, textAlign: 'end' }}>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} style={{ borderBottom: '1px solid var(--fk-border-faint)' }}>
                <td style={tdStyle}>{r.client_name}</td>
                <td style={{ ...tdStyle, color: 'var(--fk-text-label)', fontVariantNumeric: 'tabular-nums' }}>{formatDate(r.event_date)}</td>
                <td style={tdStyle}>{r.event_type}</td>
                <td style={{ ...tdStyle, textAlign: 'end', fontVariantNumeric: 'tabular-nums' }}>{formatMoney(r.invoice_value)}</td>
                <td style={{ ...tdStyle, textAlign: 'end', fontVariantNumeric: 'tabular-nums' }}>{formatMoney(r.paid_amount)}</td>
                <td style={{ ...tdStyle, textAlign: 'end', fontVariantNumeric: 'tabular-nums', color: 'var(--fk-purple-dark)' }}>{formatMoney(r.remaining_amount)}</td>
                <td style={{ ...tdStyle, textAlign: 'end', color: statusColor(r.payment_status), fontSize: 13 }}>{r.payment_status}</td>
                <td style={{ padding: '12px 18px', textAlign: 'end' }}>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button className="fk-btn-secondary" style={{ padding: '7px 14px', fontSize: 13 }} onClick={() => setModalTarget(r)}>
                      تعديل
                    </button>
                    <button
                      className="fk-btn-secondary"
                      style={{ padding: '7px 14px', fontSize: 13, color: 'var(--fk-purple-dark)' }}
                      onClick={() => setDeleteTarget(r)}
                    >
                      حذف
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: '#FAF9F7', borderTop: '1px solid var(--fk-border)' }}>
              <td style={{ padding: '16px 18px', fontSize: 13, color: 'var(--fk-text-label)' }}>الإجماليات</td>
              <td style={{ padding: '16px 18px', fontSize: 13, color: 'var(--fk-text-muted)' }}>{rows.length} سجل</td>
              <td></td>
              <td style={{ padding: '16px 18px', textAlign: 'end', fontSize: 14.5, fontVariantNumeric: 'tabular-nums' }}>{formatMoney(totals.invoice)}</td>
              <td style={{ padding: '16px 18px', textAlign: 'end', fontSize: 14.5, fontVariantNumeric: 'tabular-nums' }}>{formatMoney(totals.paid)}</td>
              <td style={{ padding: '16px 18px', textAlign: 'end', fontSize: 14.5, color: 'var(--fk-purple-dark)', fontVariantNumeric: 'tabular-nums' }}>{formatMoney(totals.remaining)}</td>
              <td></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
        {rows.length === 0 && <div style={{ padding: '44px 18px', textAlign: 'center', fontSize: 14, color: 'var(--fk-text-faint)' }}>لا توجد سجلات مطابقة.</div>}
      </div>
      <div style={{ marginTop: 12, fontSize: 12, color: 'var(--fk-text-faint)' }}>المتبقي يُحسب تلقائياً: قيمة الفاتورة − المدفوع</div>

      {modalTarget && (
        <ClientModal
          initial={modalTarget === 'new' ? null : modalTarget}
          onClose={() => setModalTarget(null)}
          onSave={async (input) => {
            if (modalTarget === 'new') await addClient(input);
            else await editClient(modalTarget.id, input);
            setModalTarget(null);
          }}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          name={deleteTarget.client_name}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={async () => {
            await removeClient(deleteTarget.id);
            setDeleteTarget(null);
          }}
        />
      )}
    </AppShell>
  );
}

const thStyle: React.CSSProperties = { textAlign: 'start', padding: '14px 18px', fontSize: 12.5, fontWeight: 400, color: 'var(--fk-text-label)' };
const tdStyle: React.CSSProperties = { padding: '16px 18px', fontSize: 14 };

function Th({ children, onClick, align = 'start' }: { children: React.ReactNode; onClick: () => void; align?: 'start' | 'end' }) {
  return (
    <th style={{ ...thStyle, textAlign: align }}>
      <button onClick={onClick} className="fk-btn-link" style={{ color: 'var(--fk-text-label)', fontSize: 12.5 }}>
        {children}
      </button>
    </th>
  );
}
