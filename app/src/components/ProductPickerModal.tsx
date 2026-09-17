import { useMemo, useState } from 'react';
import { useProducts } from '../hooks/useProducts';
import type { Product } from '../types/invoice';
import { formatMoney } from '../lib/format';

const CATEGORIES = ['خلف العريس', 'استقبال', 'مغاسل', 'طاولات ما بعد العشاء', 'طاولات العشاء', 'طاولات العشاء VIP', 'طاولات الصالة'];

export function ProductPickerModal({ onClose, onAdd }: { onClose: () => void; onAdd: (product: Product) => void }) {
  const { products, loading, error } = useProducts();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('الكل');

  const filtered = useMemo(() => {
    let list = products;
    if (category !== 'الكل') list = list.filter((p) => p.category === category);
    const q = query.trim();
    if (q) list = list.filter((p) => p.name_ar.includes(q) || p.category.includes(q));
    return list;
  }, [products, category, query]);

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(31,55,51,.42)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 60 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="fk-card" style={{ width: '100%', maxWidth: 960, maxHeight: '90vh', display: 'flex', flexDirection: 'column', animation: 'fkFade .25s ease both' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--fk-border)', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontFamily: 'Tajawal, sans-serif', fontWeight: 400, fontSize: 22, margin: 0 }}>كتالوج المنتجات</h3>
          <button className="fk-btn-secondary" style={{ padding: '7px 16px', fontSize: 13 }} onClick={onClose}>
            إغلاق
          </button>
        </div>

        <div style={{ padding: '14px 22px', borderBottom: '1px solid var(--fk-border-faint)', display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <input className="fk-input" style={{ maxWidth: 260 }} placeholder="بحث عن منتج" value={query} onChange={(e) => setQuery(e.target.value)} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {['الكل', ...CATEGORIES].map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 4,
                  fontSize: 12.5,
                  border: '1px solid ' + (category === c ? 'var(--fk-green)' : 'var(--fk-border-input)'),
                  background: category === c ? 'var(--fk-green)' : '#fff',
                  color: category === c ? '#fff' : 'var(--fk-text)',
                  cursor: 'pointer',
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: 18, overflowY: 'auto', flex: 1 }}>
          {loading && <div style={{ textAlign: 'center', padding: 30, color: 'var(--fk-text-faint)' }}>...جارِ التحميل</div>}
          {error && <div style={{ color: 'var(--fk-purple-dark)', fontSize: 13.5, marginBottom: 12 }}>{error}</div>}
          {!loading && filtered.length === 0 && <div style={{ textAlign: 'center', padding: 30, color: 'var(--fk-text-faint)' }}>لا توجد نتائج</div>}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 14 }}>
            {filtered.map((p) => (
              <div key={p.id} className="fk-card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: 120, background: p.image_url ? `center/cover no-repeat url(${p.image_url})` : 'var(--fk-bg)' }} />
                <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                  <div style={{ fontSize: 13.5 }}>{p.name_ar}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--fk-text-muted)' }}>{p.category}</div>
                  <div style={{ fontSize: 15, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                    {formatMoney(p.price)} ريال {p.price_type === 'per_unit' ? '/ وحدة' : ''}
                  </div>
                  <button
                    className="fk-btn-primary"
                    style={{ marginTop: 8, padding: '8px', fontSize: 13 }}
                    onClick={() => onAdd(p)}
                  >
                    إضافة
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
