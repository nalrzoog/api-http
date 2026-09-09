import { useMemo, useState } from 'react';
import { AppShell } from '../components/AppShell';
import { KpiCard } from '../components/KpiCard';
import { MonthlyInvoiceChart } from '../components/MonthlyInvoiceChart';
import { PaidRemainingDonut } from '../components/PaidRemainingDonut';
import { MonthlyEventsChart } from '../components/MonthlyEventsChart';
import { UpcomingEventsList } from '../components/UpcomingEventsList';
import { WorkshopsSummaryCard } from '../components/WorkshopsSummaryCard';
import { ClientModal } from '../components/ClientModal';
import { useClients } from '../hooks/useClients';
import { computeDashboard } from '../lib/dashboard';
import { formatMoney } from '../lib/format';
import { FullPageSpinner } from '../components/FullPageSpinner';

export function DashboardPage() {
  const { clients, loading, error, addClient } = useClients();
  const [adding, setAdding] = useState(false);

  const totals = useMemo(() => computeDashboard(clients), [clients]);

  if (loading) return <FullPageSpinner />;

  return (
    <AppShell>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 12, letterSpacing: '.2em', color: 'var(--fk-purple-dark)', marginBottom: 10 }}>نظرة عامة</div>
          <h1 style={{ fontFamily: 'Tajawal, sans-serif', fontWeight: 400, fontSize: 'clamp(28px,3.2vw,40px)', margin: 0 }}>لوحة التحكم</h1>
        </div>
        <button className="fk-btn-primary" style={{ padding: '12px 20px', fontSize: 14.5 }} onClick={() => setAdding(true)}>
          إضافة عميل
        </button>
      </div>
      <div style={{ height: 1, background: 'var(--fk-border)', margin: '22px 0 26px' }} />

      {error && <div style={{ marginBottom: 16, fontSize: 13.5, color: 'var(--fk-purple-dark)' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(186px,1fr))', gap: 14 }}>
        <KpiCard label="إجمالي العملاء" value={String(totals.totalClients)} />
        <KpiCard label="إجمالي قيمة الفواتير" value={formatMoney(totals.totalInvoice)} hint="ريال" />
        <KpiCard label="إجمالي المدفوع" value={formatMoney(totals.totalPaid)} hint={`${totals.paidPct}% من الفواتير`} />
        <KpiCard label="إجمالي المتبقي" value={formatMoney(totals.totalRemaining)} hint="ريال" highlight valueColor="var(--fk-purple-dark)" />
        <KpiCard label="المناسبات القادمة" value={String(totals.upcomingCount)} hint="حتى نهاية السنة" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 14, marginTop: 14 }}>
        <MonthlyInvoiceChart months={totals.months} />
        <PaidRemainingDonut totalInvoice={totals.totalInvoice} totalPaid={totals.totalPaid} totalRemaining={totals.totalRemaining} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 14, marginTop: 14 }}>
        <MonthlyEventsChart months={totals.months} />
        <UpcomingEventsList upcoming={totals.upcoming} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 14, marginTop: 14 }}>
        <WorkshopsSummaryCard />
      </div>

      {adding && (
        <ClientModal
          onClose={() => setAdding(false)}
          onSave={async (input) => {
            await addClient(input);
            setAdding(false);
          }}
        />
      )}
    </AppShell>
  );
}
