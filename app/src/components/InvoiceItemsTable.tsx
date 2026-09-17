import type { DraftInvoiceItem } from '../types/invoice';
import { lineTotal } from '../types/invoice';
import { formatMoney } from '../lib/format';

interface Props {
  items: DraftInvoiceItem[];
  onChange: (key: string, patch: Partial<DraftInvoiceItem>) => void;
  onRemove: (key: string) => void;
}

export function InvoiceItemsTable({ items, onChange, onRemove }: Props) {
  if (items.length === 0) {
    return (
      <div className="fk-card" style={{ padding: '30px 18px', textAlign: 'center', fontSize: 14, color: 'var(--fk-text-faint)' }}>
        لم تتم إضافة منتجات بعد. اضغط "إضافة منتج" لاختيار المنتجات من الكتالوج.
      </div>
    );
  }

  return (
    <div className="fk-card" style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
        <thead>
          <tr style={{ background: '#FAF9F7', borderBottom: '1px solid var(--fk-border)' }}>
            <th style={th}>صورة</th>
            <th style={th}>الوصف</th>
            <th style={{ ...th, textAlign: 'end', width: 90 }}>الكمية</th>
            <th style={{ ...th, textAlign: 'end', width: 130 }}>سعر الوحدة</th>
            <th style={{ ...th, textAlign: 'end', width: 110 }}>المجموع</th>
            <th style={{ ...th, width: 60 }}></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.key} style={{ borderBottom: '1px solid var(--fk-border-faint)' }}>
              <td style={td}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 4,
                    background: item.image_url_snapshot ? `center/cover no-repeat url(${item.image_url_snapshot})` : 'var(--fk-bg)',
                    border: '1px solid var(--fk-border)',
                  }}
                />
              </td>
              <td style={{ ...td, minWidth: 220 }}>
                <input
                  className="fk-input"
                  style={{ padding: '8px 10px', fontSize: 13.5 }}
                  value={item.description_snapshot ?? ''}
                  onChange={(e) => onChange(item.key, { description_snapshot: e.target.value })}
                  placeholder="وصف الصنف"
                />
              </td>
              <td style={{ ...td, textAlign: 'end' }}>
                <input
                  type="number"
                  min={0}
                  step="1"
                  className="fk-input"
                  style={{ padding: '8px 10px', fontSize: 13.5, textAlign: 'end', width: 80 }}
                  value={item.quantity}
                  onChange={(e) => onChange(item.key, { quantity: Math.max(0, Number(e.target.value) || 0) })}
                />
              </td>
              <td style={{ ...td, textAlign: 'end' }}>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className="fk-input"
                  style={{ padding: '8px 10px', fontSize: 13.5, textAlign: 'end', width: 110 }}
                  value={item.unit_price}
                  onChange={(e) => onChange(item.key, { unit_price: Math.max(0, Number(e.target.value) || 0) })}
                />
              </td>
              <td style={{ ...td, textAlign: 'end', fontVariantNumeric: 'tabular-nums' }}>{formatMoney(lineTotal(item))}</td>
              <td style={{ ...td, textAlign: 'center' }}>
                <button
                  className="fk-btn-link"
                  style={{ color: 'var(--fk-purple-dark)' }}
                  onClick={() => onRemove(item.key)}
                  title="حذف"
                >
                  حذف
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const th: React.CSSProperties = { textAlign: 'start', padding: '12px 14px', fontSize: 12, fontWeight: 400, color: 'var(--fk-text-label)' };
const td: React.CSSProperties = { padding: '10px 14px', fontSize: 14 };
