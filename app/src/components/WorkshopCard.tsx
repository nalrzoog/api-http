import { Link } from 'react-router-dom';
import type { MaterialsSummary, Workshop } from '../types/workshop';
import { formatDate } from '../lib/format';
import { formatTime, workshopStatusColor } from '../lib/workshopFormat';
import { useLanguage } from '../i18n/LanguageContext';
import logo from '../assets/flowers-knot-logo.png';

export function WorkshopCard({ workshop, materialsSummary }: { workshop: Workshop; materialsSummary: MaterialsSummary }) {
  const { locale, t } = useLanguage();
  const name = (locale === 'en' && workshop.name_en) || workshop.name_ar;

  return (
    <Link to={`/workshops/${workshop.id}`} className="fk-card" style={{ display: 'block', overflow: 'hidden' }}>
      <div
        style={{
          height: 140,
          background: workshop.image_url ? `center/cover no-repeat url(${workshop.image_url})` : 'var(--fk-green)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {!workshop.image_url && <img src={logo} alt="" style={{ width: 90, opacity: 0.5 }} />}
      </div>
      <div style={{ padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
          <div style={{ fontSize: 16 }}>{name}</div>
          <span style={{ fontSize: 11.5, color: workshopStatusColor(workshop.status), border: `1px solid ${workshopStatusColor(workshop.status)}`, borderRadius: 3, padding: '2px 8px', whiteSpace: 'nowrap' }}>
            {t(`status.${workshop.status}`)}
          </span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--fk-text-muted)', marginBottom: 4 }}>
          {formatDate(workshop.workshop_date)} {workshop.start_time ? `· ${formatTime(workshop.start_time)}` : ''}
        </div>
        <div style={{ fontSize: 13, color: 'var(--fk-text-muted)', marginBottom: 12 }}>
          {workshop.location || '—'} {workshop.participants_count != null ? `· ${workshop.participants_count} ${t('common.participants')}` : ''}
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--fk-text-label)', marginBottom: 6 }}>
          {materialsSummary.preparedOrAvailable} {locale === 'ar' ? 'من' : '/'} {materialsSummary.total} {t('workshop.materialsReady')}
        </div>
        <div style={{ height: 6, background: 'var(--fk-border-faint)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${materialsSummary.percentReady}%`, background: 'var(--fk-purple)' }} />
        </div>
      </div>
    </Link>
  );
}
