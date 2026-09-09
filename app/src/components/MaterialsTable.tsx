import { useState } from 'react';
import { MATERIAL_STATUSES } from '../types/workshop';
import type { MaterialStatus, WorkshopMaterial, WorkshopMaterialInput } from '../types/workshop';
import { useLanguage } from '../i18n/LanguageContext';
import { materialStatusColor, materialStatusKey } from '../lib/workshopFormat';
import { MaterialModal } from './MaterialModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface Props {
  materials: WorkshopMaterial[];
  onAdd: (input: WorkshopMaterialInput) => Promise<void>;
  onEdit: (id: string, input: WorkshopMaterialInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onQuickStatus: (id: string, status: MaterialStatus) => Promise<void>;
  onMove: (id: string, direction: 'up' | 'down') => Promise<void>;
}

export function MaterialsTable({ materials, onAdd, onEdit, onDelete, onQuickStatus, onMove }: Props) {
  const { locale, t } = useLanguage();
  const [modalTarget, setModalTarget] = useState<WorkshopMaterial | 'new' | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WorkshopMaterial | null>(null);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h3 style={{ fontFamily: 'Tajawal, sans-serif', fontWeight: 400, fontSize: 21, margin: 0 }}>{t('common.materials')}</h3>
        <button className="fk-btn-primary" style={{ padding: '9px 16px', fontSize: 13.5 }} onClick={() => setModalTarget('new')}>
          {t('workshop.addMaterial')}
        </button>
      </div>

      {materials.length === 0 ? (
        <div className="fk-card" style={{ padding: '30px 18px', textAlign: 'center', fontSize: 14, color: 'var(--fk-text-faint)' }}>
          {t('workshop.noMaterials')}
        </div>
      ) : (
        <div className="fk-card" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
            <thead>
              <tr style={{ background: '#FAF9F7', borderBottom: '1px solid var(--fk-border)' }}>
                <th style={th}></th>
                <th style={th}>{locale === 'en' ? 'Material' : 'المستلزم'}</th>
                <th style={{ ...th, textAlign: 'end' }}>{t('workshop.quantity')}</th>
                <th style={{ ...th, textAlign: 'end' }}>{t('workshop.status')}</th>
                <th style={th}>{t('common.notes')}</th>
                <th style={{ ...th, textAlign: 'end' }}>{t('common.edit')}</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((m, i) => {
                const name = (locale === 'en' && m.name_en) || m.name_ar;
                return (
                  <tr key={m.id} style={{ borderBottom: '1px solid var(--fk-border-faint)' }}>
                    <td style={{ ...td, whiteSpace: 'nowrap' }}>
                      <button className="fk-btn-link" style={{ color: 'var(--fk-text-muted)' }} disabled={i === 0} onClick={() => onMove(m.id, 'up')}>
                        ▲
                      </button>
                      <button className="fk-btn-link" style={{ color: 'var(--fk-text-muted)', marginInlineStart: 4 }} disabled={i === materials.length - 1} onClick={() => onMove(m.id, 'down')}>
                        ▼
                      </button>
                    </td>
                    <td style={td}>{name}</td>
                    <td style={{ ...td, textAlign: 'end', fontVariantNumeric: 'tabular-nums' }}>
                      {m.quantity} {m.unit ?? ''}
                    </td>
                    <td style={{ ...td, textAlign: 'end' }}>
                      <select
                        value={m.status}
                        onChange={(e) => onQuickStatus(m.id, e.target.value as MaterialStatus)}
                        style={{ padding: '6px 8px', borderRadius: 4, border: `1px solid ${materialStatusColor(m.status)}`, color: materialStatusColor(m.status), fontSize: 12.5, background: '#fff' }}
                      >
                        {MATERIAL_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {t(materialStatusKey(s))}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{ ...td, fontSize: 13, color: 'var(--fk-text-muted)' }}>{m.notes || '—'}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'end' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="fk-btn-secondary" style={{ padding: '6px 12px', fontSize: 12.5 }} onClick={() => setModalTarget(m)}>
                          {t('common.edit')}
                        </button>
                        <button className="fk-btn-secondary" style={{ padding: '6px 12px', fontSize: 12.5, color: 'var(--fk-purple-dark)' }} onClick={() => setDeleteTarget(m)}>
                          {t('common.delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modalTarget && (
        <MaterialModal
          initial={modalTarget === 'new' ? null : modalTarget}
          onClose={() => setModalTarget(null)}
          onSave={async (input) => {
            if (modalTarget === 'new') await onAdd(input);
            else await onEdit(modalTarget.id, input);
            setModalTarget(null);
          }}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          message={t('workshop.deleteMaterialConfirm')}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={async () => {
            await onDelete(deleteTarget.id);
            setDeleteTarget(null);
          }}
        />
      )}
    </div>
  );
}

const th: React.CSSProperties = { textAlign: 'start', padding: '12px 14px', fontSize: 12, fontWeight: 400, color: 'var(--fk-text-label)' };
const td: React.CSSProperties = { padding: '12px 14px', fontSize: 14 };
