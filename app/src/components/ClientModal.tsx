import { useState } from 'react';
import { EVENT_TYPES } from '../types';
import type { Client, ClientInput, EventType } from '../types';
import { formatMoney } from '../lib/format';

interface Props {
  initial?: Client | null;
  onClose: () => void;
  onSave: (input: ClientInput) => Promise<void>;
}

export function ClientModal({ initial, onClose, onSave }: Props) {
  const [clientName, setClientName] = useState(initial?.client_name ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [eventType, setEventType] = useState<EventType>(initial?.event_type ?? 'مناسبة أخرى');
  const [eventDate, setEventDate] = useState(initial?.event_date ?? '');
  const [invoiceValue, setInvoiceValue] = useState(String(initial?.invoice_value ?? ''));
  const [paidAmount, setPaidAmount] = useState(String(initial?.paid_amount ?? ''));
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const invoice = Number(invoiceValue) || 0;
  const paid = Number(paidAmount) || 0;
  const remaining = invoice - paid;

  async function handleSave() {
    if (saving) return;
    setError(null);

    if (!clientName.trim()) {
      setError('يرجى إدخال اسم العميل');
      return;
    }
    if (invoice < 0 || paid < 0) {
      setError('القيم المالية يجب أن تكون أكبر من أو تساوي صفر');
      return;
    }
    if (paid > invoice) {
      setError('المبلغ المدفوع لا يمكن أن يتجاوز قيمة الفاتورة');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        client_name: clientName.trim(),
        phone: phone.trim() || null,
        event_type: eventType,
        event_date: eventDate || null,
        invoice_value: invoice,
        paid_amount: paid,
        notes: notes.trim() || null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر حفظ البيانات، حاول مرة أخرى');
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(31,55,51,.42)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        zIndex: 40,
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div
        className="fk-card"
        style={{ width: '100%', maxWidth: 460, padding: 'clamp(22px,3vw,34px)', animation: 'fkFade .25s ease both', maxHeight: '92vh', overflowY: 'auto' }}
      >
        <h3 style={{ fontFamily: 'Tajawal, sans-serif', fontWeight: 400, fontSize: 26, margin: '0 0 22px' }}>
          {initial ? 'تعديل بيانات العميل' : 'إضافة عميل'}
        </h3>

        <div style={{ marginBottom: 16 }}>
          <label className="fk-label">اسم العميل</label>
          <input className="fk-input" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="مثال: أروى ومحمد" disabled={saving} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label className="fk-label">رقم الجوال</label>
          <input
            className="fk-input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="05xxxxxxxx"
            style={{ direction: 'ltr', textAlign: 'left' }}
            disabled={saving}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label className="fk-label">نوع المناسبة</label>
          <select className="fk-input" value={eventType} onChange={(e) => setEventType(e.target.value as EventType)} disabled={saving}>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label className="fk-label">موعد الحفلة</label>
          <input type="date" className="fk-input" value={eventDate} onChange={(e) => setEventDate(e.target.value)} disabled={saving} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label className="fk-label">قيمة الفاتورة</label>
            <input
              type="number"
              min={0}
              className="fk-input"
              value={invoiceValue}
              onChange={(e) => setInvoiceValue(e.target.value)}
              placeholder="0"
              disabled={saving}
            />
          </div>
          <div>
            <label className="fk-label">المبلغ المدفوع</label>
            <input
              type="number"
              min={0}
              className="fk-input"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              placeholder="0"
              disabled={saving}
            />
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 16px',
            border: '1px solid var(--fk-purple)',
            background: 'rgba(178,166,192,.1)',
            borderRadius: 4,
          }}
        >
          <span style={{ fontSize: 13, color: 'var(--fk-text-label)' }}>المتبقي (تلقائي)</span>
          <span style={{ fontFamily: 'Tajawal, sans-serif', fontSize: 22, fontVariantNumeric: 'tabular-nums' }}>{formatMoney(remaining)}</span>
        </div>

        <div style={{ marginTop: 16 }}>
          <label className="fk-label">ملاحظات</label>
          <textarea
            className="fk-input"
            style={{ minHeight: 80, resize: 'vertical' }}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="ملاحظات إضافية (اختياري)"
            disabled={saving}
          />
        </div>

        {error && <div style={{ marginTop: 14, fontSize: 13, color: 'var(--fk-purple-dark)' }}>{error}</div>}

        <div style={{ display: 'flex', gap: 10, marginTop: 26 }}>
          <button className="fk-btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} onClick={handleSave} disabled={saving}>
            {saving && <span className="fk-spinner" />}
            حفظ
          </button>
          <button className="fk-btn-secondary" onClick={onClose} disabled={saving}>
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}
