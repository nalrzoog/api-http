import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useWorkshops } from '../hooks/useWorkshops';
import { formatDate } from '../lib/format';
import { useLanguage } from '../i18n/LanguageContext';

export function WorkshopsSummaryCard() {
  const { locale, t } = useLanguage();
  const { workshops, loading } = useWorkshops();

  const { upcomingCount, preparingCount, nearest } = useMemo(() => {
    const todayIso = new Date().toISOString().slice(0, 10);
    const upcoming = workshops
      .filter((w) => w.workshop_date && w.workshop_date >= todayIso)
      .sort((a, b) => (a.workshop_date! < b.workshop_date! ? -1 : 1));
    return {
      upcomingCount: upcoming.length,
      preparingCount: workshops.filter((w) => w.status === 'قيد التجهيز').length,
      nearest: upcoming[0] ?? null,
    };
  }, [workshops]);

  if (loading) return null;

  return (
    <div className="fk-card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
        <h3 style={{ fontFamily: 'Tajawal, sans-serif', fontWeight: 400, fontSize: 21, margin: 0 }}>{t('nav.workshops')}</h3>
        <Link to="/workshops" className="fk-btn-link" style={{ color: 'var(--fk-purple-dark)', borderBottom: '1px solid var(--fk-purple)' }}>
          {locale === 'ar' ? 'عرض الكل' : 'View all'}
        </Link>
      </div>

      <div style={{ display: 'flex', gap: 24, marginBottom: nearest ? 18 : 0 }}>
        <div>
          <div style={{ fontFamily: 'Tajawal, sans-serif', fontSize: 30, fontVariantNumeric: 'tabular-nums' }}>{upcomingCount}</div>
          <div style={{ fontSize: 12, color: 'var(--fk-text-muted)', marginTop: 4 }}>{locale === 'ar' ? 'الورش القادمة' : 'Upcoming Workshops'}</div>
        </div>
        <div>
          <div style={{ fontFamily: 'Tajawal, sans-serif', fontSize: 30, fontVariantNumeric: 'tabular-nums', color: 'var(--fk-purple-dark)' }}>{preparingCount}</div>
          <div style={{ fontSize: 12, color: 'var(--fk-text-muted)', marginTop: 4 }}>{locale === 'ar' ? 'ورش قيد التجهيز' : 'Being Prepared'}</div>
        </div>
      </div>

      {nearest && (
        <div style={{ paddingTop: 16, borderTop: '1px solid var(--fk-border-faint)' }}>
          <Link to={`/workshops/${nearest.id}`} style={{ display: 'block' }}>
            <div style={{ fontSize: 14.5, marginBottom: 4 }}>{(locale === 'en' && nearest.name_en) || nearest.name_ar}</div>
            <div style={{ fontSize: 12.5, color: 'var(--fk-text-muted)' }}>
              {formatDate(nearest.workshop_date)}
              {nearest.participants_count != null ? ` · ${nearest.participants_count} ${t('common.participants')}` : ''}
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
