import type { Client } from '../types';

export interface MonthBucket {
  key: string; // YYYY-MM
  label: string; // short Arabic month label
  invoice: number;
  paid: number;
  remaining: number;
  count: number;
  barPct: number; // this bar's height relative to the tallest month (0-100)
  paidPct: number; // paid share of this bar's own height (0-100)
  remainPct: number; // remaining share of this bar's own height (0-100)
  countPct: number; // event count relative to the busiest month (0-100)
}

export interface DashboardTotals {
  totalClients: number;
  totalInvoice: number;
  totalPaid: number;
  totalRemaining: number;
  paidPct: number;
  upcomingCount: number;
  months: MonthBucket[];
  upcoming: Client[];
}

const MONTH_LABELS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
];

/** Builds the last 6 months (oldest → current) so the charts always show a
 * fixed, predictable window ending at "now" regardless of what data exists. */
function lastSixMonthKeys(): { key: string; year: number; month: number; label: string }[] {
  const now = new Date();
  const out = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    out.push({ key, year: d.getFullYear(), month: d.getMonth(), label: MONTH_LABELS[d.getMonth()] });
  }
  return out;
}

export function computeDashboard(clients: Client[]): DashboardTotals {
  const totalClients = clients.length;
  const totalInvoice = clients.reduce((sum, c) => sum + Number(c.invoice_value), 0);
  const totalPaid = clients.reduce((sum, c) => sum + Number(c.paid_amount), 0);
  const totalRemaining = clients.reduce((sum, c) => sum + Number(c.remaining_amount), 0);
  const paidPct = totalInvoice > 0 ? Math.round((totalPaid / totalInvoice) * 100) : 0;

  const todayIso = new Date().toISOString().slice(0, 10);
  const upcoming = clients
    .filter((c) => c.event_date && c.event_date >= todayIso)
    .sort((a, b) => (a.event_date! < b.event_date! ? -1 : 1));

  const buckets = lastSixMonthKeys().map((m) => {
    const monthClients = clients.filter((c) => c.event_date?.startsWith(m.key));
    const invoice = monthClients.reduce((s, c) => s + Number(c.invoice_value), 0);
    const paid = monthClients.reduce((s, c) => s + Number(c.paid_amount), 0);
    const remaining = monthClients.reduce((s, c) => s + Number(c.remaining_amount), 0);
    return { key: m.key, label: m.label, invoice, paid, remaining, count: monthClients.length };
  });

  const maxInvoice = Math.max(1, ...buckets.map((b) => b.invoice));
  const maxCount = Math.max(1, ...buckets.map((b) => b.count));

  const months: MonthBucket[] = buckets.map((b) => ({
    ...b,
    barPct: Math.round((b.invoice / maxInvoice) * 100),
    paidPct: b.invoice > 0 ? Math.round((b.paid / b.invoice) * 100) : 0,
    remainPct: b.invoice > 0 ? Math.round((b.remaining / b.invoice) * 100) : 0,
    countPct: Math.round((b.count / maxCount) * 100),
  }));

  return {
    totalClients,
    totalInvoice,
    totalPaid,
    totalRemaining,
    paidPct,
    upcomingCount: upcoming.length,
    months,
    upcoming,
  };
}
