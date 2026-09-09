import { useState } from 'react';
import { WORKSHOP_STATUSES } from '../types/workshop';
import type { Workshop, WorkshopInput, WorkshopStatus } from '../types/workshop';
import { ImageUploadField } from './ImageUploadField';
import { useLanguage } from '../i18n/LanguageContext';

interface Props {
  initial?: Workshop | null;
  onClose: () => void;
  onSave: (input: WorkshopInput) => Promise<void>;
}

export function WorkshopModal({ initial, onClose, onSave }: Props) {
  const { t } = useLanguage();
  const [nameAr, setNameAr] = useState(initial?.name_ar ?? '');
  const [nameEn, setNameEn] = useState(initial?.name_en ?? '');
  const [descriptionAr, setDescriptionAr] = useState(initial?.description_ar ?? '');
  const [descriptionEn, setDescriptionEn] = useState(initial?.description_en ?? '');
  const [imageUrl, setImageUrl] = useState<string | null>(initial?.image_url ?? null);
  const [workshopDate, setWorkshopDate] = useState(initial?.workshop_date ?? '');
  const [startTime, setStartTime] = useState(initial?.start_time?.slice(0, 5) ?? '');
  const [endTime, setEndTime] = useState(initial?.end_time?.slice(0, 5) ?? '');
  const [participants, setParticipants] = useState(String(initial?.participants_count ?? ''));
  const [location, setLocation] = useState(initial?.location ?? '');
  const [locationNotes, setLocationNotes] = useState(initial?.location_notes ?? '');
  const [internalNotes, setInternalNotes] = useState(initial?.internal_notes ?? '');
  const [status, setStatus] = useState<WorkshopStatus>(initial?.status ?? 'مسودة');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (saving) return;
    setError(null);

    if (!nameAr.trim()) {
      setError(t('common.required'));
      return;
    }
    const participantsCount = participants.trim() === '' ? null : Number(participants);
    if (participantsCount !== null && (Number.isNaN(participantsCount) || participantsCount < 0)) {
      setError(t('common.required'));
      return;
    }

    let durationMinutes: number | null = null;
    if (startTime && endTime) {
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      const diff = eh * 60 + em - (sh * 60 + sm);
      durationMinutes = diff > 0 ? diff : null;
    }

    setSaving(true);
    try {
      await onSave({
        name_ar: nameAr.trim(),
        name_en: nameEn.trim() || null,
        description_ar: descriptionAr.trim() || null,
        description_en: descriptionEn.trim() || null,
        image_url: imageUrl,
        workshop_date: workshopDate || null,
        start_time: startTime || null,
        end_time: endTime || null,
        duration_minutes: durationMinutes,
        participants_count: participantsCount,
        location: location.trim() || null,
        location_notes: locationNotes.trim() || null,
        internal_notes: internalNotes.trim() || null,
        status,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.saveFailed'));
      setSaving(false);
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(31,55,51,.42)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 40 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div className="fk-card" style={{ width: '100%', maxWidth: 560, padding: 'clamp(22px,3vw,34px)', animation: 'fkFade .25s ease both', maxHeight: '92vh', overflowY: 'auto' }}>
        <h3 style={{ fontFamily: 'Tajawal, sans-serif', fontWeight: 400, fontSize: 26, margin: '0 0 22px' }}>
          {initial ? t('workshop.editWorkshop') : t('workshop.addWorkshop').replace('+ ', '')}
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label className="fk-label">{t('workshop.nameAr')}</label>
            <input className="fk-input" value={nameAr} onChange={(e) => setNameAr(e.target.value)} disabled={saving} />
          </div>
          <div>
            <label className="fk-label">{t('workshop.nameEn')}</label>
            <input className="fk-input" style={{ direction: 'ltr', textAlign: 'left' }} value={nameEn} onChange={(e) => setNameEn(e.target.value)} disabled={saving} />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <ImageUploadField value={imageUrl} onChange={setImageUrl} disabled={saving} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label className="fk-label">
              {t('workshop.descriptionAr')} ({t('common.optional')})
            </label>
            <textarea className="fk-input" style={{ minHeight: 70, resize: 'vertical' }} value={descriptionAr} onChange={(e) => setDescriptionAr(e.target.value)} disabled={saving} />
          </div>
          <div>
            <label className="fk-label">
              {t('workshop.descriptionEn')} ({t('common.optional')})
            </label>
            <textarea
              className="fk-input"
              style={{ minHeight: 70, resize: 'vertical', direction: 'ltr', textAlign: 'left' }}
              value={descriptionEn}
              onChange={(e) => setDescriptionEn(e.target.value)}
              disabled={saving}
            />
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--fk-border)', margin: '4px 0 18px' }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label className="fk-label">{t('common.date')}</label>
            <input type="date" className="fk-input" value={workshopDate} onChange={(e) => setWorkshopDate(e.target.value)} disabled={saving} />
          </div>
          <div>
            <label className="fk-label">{t('workshop.startTime')}</label>
            <input type="time" className="fk-input" value={startTime} onChange={(e) => setStartTime(e.target.value)} disabled={saving} />
          </div>
          <div>
            <label className="fk-label">{t('workshop.endTime')}</label>
            <input type="time" className="fk-input" value={endTime} onChange={(e) => setEndTime(e.target.value)} disabled={saving} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label className="fk-label">{t('common.participants')}</label>
            <input type="number" min={0} className="fk-input" value={participants} onChange={(e) => setParticipants(e.target.value)} disabled={saving} />
          </div>
          <div>
            <label className="fk-label">{t('workshop.status')}</label>
            <select className="fk-input" value={status} onChange={(e) => setStatus(e.target.value as WorkshopStatus)} disabled={saving}>
              {WORKSHOP_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`status.${s}`)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label className="fk-label">{t('common.location')}</label>
          <input className="fk-input" value={location} onChange={(e) => setLocation(e.target.value)} disabled={saving} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label className="fk-label">
            {t('workshop.locationNotes')} ({t('common.optional')})
          </label>
          <input className="fk-input" value={locationNotes} onChange={(e) => setLocationNotes(e.target.value)} disabled={saving} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label className="fk-label">
            {t('workshop.internalNotes')} ({t('common.optional')})
          </label>
          <textarea className="fk-input" style={{ minHeight: 70, resize: 'vertical' }} value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} disabled={saving} />
        </div>

        {error && <div style={{ marginBottom: 14, fontSize: 13, color: 'var(--fk-purple-dark)' }}>{error}</div>}

        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
          <button className="fk-btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} onClick={handleSave} disabled={saving}>
            {saving && <span className="fk-spinner" />}
            {t('common.save')}
          </button>
          <button className="fk-btn-secondary" onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
