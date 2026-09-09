import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { FullPageSpinner } from '../components/FullPageSpinner';
import { WorkshopModal } from '../components/WorkshopModal';
import { MaterialsTable } from '../components/MaterialsTable';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { useWorkshopDetail } from '../hooks/useWorkshopDetail';
import { computeMaterialsSummary } from '../types/workshop';
import { formatDate } from '../lib/format';
import { formatTime, workshopStatusColor } from '../lib/workshopFormat';
import { deleteWorkshop } from '../services/workshopService';
import { useLanguage } from '../i18n/LanguageContext';
import logo from '../assets/flowers-knot-logo.png';

export function WorkshopDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { locale, t } = useLanguage();
  const { workshop, materials, loading, error, saveWorkshop, addMaterial, editMaterial, removeMaterial, moveMaterial } = useWorkshopDetail(id);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  if (loading) return <FullPageSpinner />;

  if (!workshop) {
    return (
      <AppShell>
        <div className="fk-card" style={{ padding: 40, textAlign: 'center', color: 'var(--fk-text-faint)' }}>{t('common.noResults')}</div>
      </AppShell>
    );
  }

  const name = (locale === 'en' && workshop.name_en) || workshop.name_ar;
  const description = (locale === 'en' && workshop.description_en) || workshop.description_ar;
  const summary = computeMaterialsSummary(materials);

  async function handleExport() {
    if (!workshop || exporting) return;
    setExportError(null);
    setExporting(true);
    try {
      // Lazy-loaded: jsPDF + html2canvas are only needed here, so keep them
      // out of the main bundle everyone downloads on every page.
      const { exportWorkshopPdf } = await import('../lib/exportWorkshopPdf');
      await exportWorkshopPdf(workshop, materials, locale);
    } catch {
      setExportError('تعذر تصدير الملف، حاول مرة أخرى');
    } finally {
      setExporting(false);
    }
  }

  return (
    <AppShell>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 12, letterSpacing: '.2em', color: 'var(--fk-purple-dark)', marginBottom: 10 }}>{t('nav.workshops')}</div>
          <h1 style={{ fontFamily: 'Tajawal, sans-serif', fontWeight: 400, fontSize: 'clamp(26px,3vw,36px)', margin: '0 0 8px' }}>{name}</h1>
          <span style={{ fontSize: 12, color: workshopStatusColor(workshop.status), border: `1px solid ${workshopStatusColor(workshop.status)}`, borderRadius: 3, padding: '3px 10px' }}>
            {t(`status.${workshop.status}`)}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="fk-btn-secondary" style={{ padding: '10px 16px', fontSize: 13.5 }} onClick={handleExport} disabled={exporting}>
            {exporting ? t('common.saving') : t('common.exportPdf')}
          </button>
          <button className="fk-btn-secondary" style={{ padding: '10px 16px', fontSize: 13.5 }} onClick={() => setEditing(true)}>
            {t('common.edit')}
          </button>
          <button className="fk-btn-secondary" style={{ padding: '10px 16px', fontSize: 13.5, color: 'var(--fk-purple-dark)' }} onClick={() => setDeleting(true)}>
            {t('common.delete')}
          </button>
        </div>
      </div>

      {error && <div style={{ marginBottom: 16, fontSize: 13.5, color: 'var(--fk-purple-dark)' }}>{error}</div>}
      {exportError && <div style={{ marginBottom: 16, fontSize: 13.5, color: 'var(--fk-purple-dark)' }}>{exportError}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 16, marginBottom: 20 }}>
        {/* A: concept image */}
        <div className="fk-card" style={{ overflow: 'hidden' }}>
          <div
            style={{
              height: 220,
              background: workshop.image_url ? `center/cover no-repeat url(${workshop.image_url})` : 'var(--fk-green)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {!workshop.image_url && <img src={logo} alt="" style={{ width: 110, opacity: 0.5 }} />}
          </div>
          {description && <div style={{ padding: 18, fontSize: 13.5, color: 'var(--fk-text-label)', lineHeight: 1.8 }}>{description}</div>}
        </div>

        {/* B: workshop info */}
        <div className="fk-card" style={{ padding: 20 }}>
          <h3 style={{ fontFamily: 'Tajawal, sans-serif', fontWeight: 400, fontSize: 18, margin: '0 0 14px' }}>{t('workshop.information')}</h3>
          <InfoRow label={t('common.date')} value={formatDate(workshop.workshop_date)} />
          <InfoRow label={t('common.time')} value={workshop.start_time ? `${formatTime(workshop.start_time)}${workshop.end_time ? ' - ' + formatTime(workshop.end_time) : ''}` : '—'} />
          <InfoRow label={t('common.participants')} value={workshop.participants_count != null ? String(workshop.participants_count) : '—'} />
          <InfoRow label={t('common.location')} value={workshop.location || '—'} />
          {workshop.location_notes && <InfoRow label={t('workshop.locationNotes')} value={workshop.location_notes} />}
        </div>
      </div>

      {/* D: preparation status */}
      <div className="fk-card" style={{ padding: 20, marginBottom: 20 }}>
        <h3 style={{ fontFamily: 'Tajawal, sans-serif', fontWeight: 400, fontSize: 18, margin: '0 0 14px' }}>{t('workshop.preparation')}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 14, marginBottom: 14 }}>
          <Stat label={t('workshop.totalMaterials')} value={summary.total} />
          <Stat label={t('common.prepared')} value={summary.prepared} color="var(--fk-green)" />
          <Stat label={t('common.available')} value={summary.available} color="var(--fk-purple-dark)" />
          <Stat label={t('common.missing')} value={summary.missing} color="#B23A3A" />
        </div>
        <div style={{ height: 8, background: 'var(--fk-border-faint)', borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
          <div style={{ height: '100%', width: `${summary.percentReady}%`, background: 'var(--fk-purple)' }} />
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--fk-text-muted)' }}>
          {summary.preparedOrAvailable} / {summary.total} · {summary.percentReady}%
        </div>
      </div>

      {/* C: materials */}
      <div style={{ marginBottom: 20 }}>
        <MaterialsTable
          materials={materials}
          onAdd={(input) => addMaterial(input).then(() => undefined)}
          onEdit={(id, input) => editMaterial(id, input).then(() => undefined)}
          onDelete={removeMaterial}
          onQuickStatus={(id, status) => editMaterial(id, { status }).then(() => undefined)}
          onMove={moveMaterial}
        />
      </div>

      {/* E: internal notes */}
      {workshop.internal_notes && (
        <div className="fk-card" style={{ padding: 20 }}>
          <h3 style={{ fontFamily: 'Tajawal, sans-serif', fontWeight: 400, fontSize: 18, margin: '0 0 10px' }}>{t('workshop.internalNotes')}</h3>
          <div style={{ fontSize: 13.5, color: 'var(--fk-text-label)', lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>{workshop.internal_notes}</div>
        </div>
      )}

      {editing && (
        <WorkshopModal
          initial={workshop}
          onClose={() => setEditing(false)}
          onSave={async (input) => {
            await saveWorkshop(input);
            setEditing(false);
          }}
        />
      )}

      {deleting && (
        <ConfirmDeleteModal
          message={t('workshop.deleteWorkshopConfirm')}
          onCancel={() => setDeleting(false)}
          onConfirm={async () => {
            await deleteWorkshop(workshop.id);
            navigate('/workshops', { replace: true });
          }}
        />
      )}
    </AppShell>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--fk-border-faint)', fontSize: 13.5 }}>
      <span style={{ color: 'var(--fk-text-muted)' }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, color: 'var(--fk-text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: 'Tajawal, sans-serif', fontSize: 24, fontVariantNumeric: 'tabular-nums', color: color ?? 'var(--fk-text)' }}>{value}</div>
    </div>
  );
}
