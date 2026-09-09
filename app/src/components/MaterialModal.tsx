import { useState } from 'react';
import { MATERIAL_STATUSES } from '../types/workshop';
import type { MaterialStatus, WorkshopMaterial, WorkshopMaterialInput } from '../types/workshop';
import { useLanguage } from '../i18n/LanguageContext';
import { materialStatusKey } from '../lib/workshopFormat';

interface Props {
  initial?: WorkshopMaterial | null;
  onClose: () => void;
  onSave: (input: WorkshopMaterialInput) => Promise<void>;
}

export function MaterialModal({ initial, onClose, onSave }: Props) {
  const { t } = useLanguage();
  const [nameAr, setNameAr] = useState(initial?.name_ar ?? '');
  const [nameEn, setNameEn] = useState(initial?.name_en ?? '');
  const [quantity, setQuantity] = useState(String(initial?.quantity ?? 1));
  const [unit, setUnit] = useState(initial?.unit ?? '');
  const [status, setStatus] = useState<MaterialStatus>(initial?.status ?? 'ناقص');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (saving) return;
    setError(null);

    if (!nameAr.trim()) {
      setError(t('common.required'));
      return;
    }
    const qty = Number(quantity);
    if (Number.isNaN(qty) || qty < 0) {
      setError(t('common.required'));
      return;
    }

    setSaving(true);
    try {
      await onSave({
        name_ar: nameAr.trim(),
        name_en: nameEn.trim() || null,
        quantity: qty,
        unit: unit.trim() || null,
        status,
        notes: notes.trim() || null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.saveFailed'));
      setSaving(false);
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(31,55,51,.42)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 45 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div className="fk-card" style={{ width: '100%', maxWidth: 440, padding: 'clamp(22px,3vw,30px)', animation: 'fkFade .25s ease both' }}>
        <h3 style={{ fontFamily: 'Tajawal, sans-serif', fontWeight: 400, fontSize: 22, margin: '0 0 20px' }}>
          {initial ? t('workshop.editMaterial') : t('workshop.addMaterial').replace('+ ', '')}
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <label className="fk-label">{t('workshop.materialNameAr')}</label>
            <input className="fk-input" value={nameAr} onChange={(e) => setNameAr(e.target.value)} disabled={saving} />
          </div>
          <div>
            <label className="fk-label">{t('workshop.materialNameEn')}</label>
            <input className="fk-input" style={{ direction: 'ltr', textAlign: 'left' }} value={nameEn} onChange={(e) => setNameEn(e.target.value)} disabled={saving} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <label className="fk-label">{t('workshop.quantity')}</label>
            <input type="number" min={0} className="fk-input" value={quantity} onChange={(e) => setQuantity(e.target.value)} disabled={saving} />
          </div>
          <div>
            <label className="fk-label">
              {t('workshop.unit')} ({t('common.optional')})
            </label>
            <input className="fk-input" value={unit} onChange={(e) => setUnit(e.target.value)} disabled={saving} />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label className="fk-label">{t('workshop.status')}</label>
          <select className="fk-input" value={status} onChange={(e) => setStatus(e.target.value as MaterialStatus)} disabled={saving}>
            {MATERIAL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(materialStatusKey(s))}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 18 }}>
          <label className="fk-label">
            {t('common.notes')} ({t('common.optional')})
          </label>
          <textarea className="fk-input" style={{ minHeight: 60, resize: 'vertical' }} value={notes} onChange={(e) => setNotes(e.target.value)} disabled={saving} />
        </div>

        {error && <div style={{ marginBottom: 14, fontSize: 13, color: 'var(--fk-purple-dark)' }}>{error}</div>}

        <div style={{ display: 'flex', gap: 10 }}>
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
