import { useEffect, useState } from 'react';
import { AppShell } from '../components/AppShell';
import { WorkshopCard } from '../components/WorkshopCard';
import { WorkshopModal } from '../components/WorkshopModal';
import { FullPageSpinner } from '../components/FullPageSpinner';
import { useWorkshops } from '../hooks/useWorkshops';
import { fetchAllMaterials } from '../services/workshopService';
import { computeMaterialsSummary } from '../types/workshop';
import type { WorkshopMaterial } from '../types/workshop';
import { useLanguage } from '../i18n/LanguageContext';

export function WorkshopsPage() {
  const { t } = useLanguage();
  const { workshops, loading, error, addWorkshop } = useWorkshops();
  const [adding, setAdding] = useState(false);
  const [materialsByWorkshop, setMaterialsByWorkshop] = useState<Map<string, WorkshopMaterial[]>>(new Map());

  useEffect(() => {
    let active = true;
    fetchAllMaterials().then((all) => {
      if (!active) return;
      const grouped = new Map<string, WorkshopMaterial[]>();
      for (const m of all) {
        const list = grouped.get(m.workshop_id) ?? [];
        list.push(m);
        grouped.set(m.workshop_id, list);
      }
      setMaterialsByWorkshop(grouped);
    });
    return () => {
      active = false;
    };
  }, [workshops]);

  if (loading) return <FullPageSpinner />;

  return (
    <AppShell>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ fontSize: 12, letterSpacing: '.2em', color: 'var(--fk-purple-dark)', marginBottom: 10 }}>{t('nav.workshops')}</div>
          <h1 style={{ fontFamily: 'Tajawal, sans-serif', fontWeight: 400, fontSize: 'clamp(28px,3.2vw,40px)', margin: 0 }}>{t('nav.workshops')}</h1>
        </div>
        <button className="fk-btn-primary" style={{ padding: '12px 20px', fontSize: 14.5 }} onClick={() => setAdding(true)}>
          {t('workshop.addWorkshop')}
        </button>
      </div>
      <div style={{ height: 1, background: 'var(--fk-border)', margin: '22px 0 26px' }} />

      {error && <div style={{ marginBottom: 16, fontSize: 13.5, color: 'var(--fk-purple-dark)' }}>{error}</div>}

      {workshops.length === 0 ? (
        <div className="fk-card" style={{ padding: '48px 18px', textAlign: 'center', fontSize: 14, color: 'var(--fk-text-faint)' }}>
          {t('workshop.noWorkshops')}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 16 }}>
          {workshops.map((w) => (
            <WorkshopCard key={w.id} workshop={w} materialsSummary={computeMaterialsSummary(materialsByWorkshop.get(w.id) ?? [])} />
          ))}
        </div>
      )}

      {adding && (
        <WorkshopModal
          onClose={() => setAdding(false)}
          onSave={async (input) => {
            await addWorkshop(input);
            setAdding(false);
          }}
        />
      )}
    </AppShell>
  );
}
