import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { FullPageSpinner } from '../components/FullPageSpinner';
import { ProductPickerModal } from '../components/ProductPickerModal';
import { InvoiceItemsTable } from '../components/InvoiceItemsTable';
import { useInvoiceDetail } from '../hooks/useInvoiceDetail';
import { fetchClients } from '../services/clientService';
import { createInvoice, reserveNextInvoiceNumber, updateInvoice } from '../services/invoiceService';
import { computeInvoiceTotals } from '../types/invoice';
import type { Client } from '../types';
import type { DraftInvoiceItem, Invoice, InvoiceItem, InvoiceStatus, Product } from '../types/invoice';
import { INVOICE_STATUSES } from '../types/invoice';
import { formatMoney } from '../lib/format';
import { amountInWordsLine } from '../lib/numberToArabicWords';

function newKey() {
  return crypto.randomUUID();
}

function itemFromProduct(product: Product): DraftInvoiceItem {
  return {
    key: newKey(),
    product_id: product.id,
    product_name_snapshot: product.name_ar,
    description_snapshot: product.description_ar || product.name_ar,
    image_url_snapshot: product.image_url,
    quantity: 1,
    unit_price: product.price,
  };
}

function blankItem(): DraftInvoiceItem {
  return {
    key: newKey(),
    product_id: null,
    product_name_snapshot: 'صنف يدوي',
    description_snapshot: '',
    image_url_snapshot: null,
    quantity: 1,
    unit_price: 0,
  };
}

function itemsFromExisting(items: InvoiceItem[]): DraftInvoiceItem[] {
  return items.map((item) => ({
    key: item.id,
    product_id: item.product_id,
    product_name_snapshot: item.product_name_snapshot,
    description_snapshot: item.description_snapshot,
    image_url_snapshot: item.image_url_snapshot,
    quantity: item.quantity,
    unit_price: item.unit_price,
  }));
}

const today = () => new Date().toISOString().slice(0, 10);

export function InvoiceEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectCustomerId = searchParams.get('customerId');
  const { invoice: existingInvoice, items: existingItems, loading: loadingExisting, error: loadError } = useInvoiceDetail(id);

  const [clients, setClients] = useState<Client[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState<string | null>(null);
  const [numberError, setNumberError] = useState<string | null>(null);

  const [customerMode, setCustomerMode] = useState<'existing' | 'manual'>('existing');
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(today());
  const [deliveryDate, setDeliveryDate] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<InvoiceStatus>('مسودة');
  const [discount, setDiscount] = useState('0');
  const [items, setItems] = useState<DraftInvoiceItem[]>([]);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Load customers for the picker (independent of Realtime — a simple list is enough here).
  useEffect(() => {
    fetchClients()
      .then((data) => {
        setClients(data);
        // Preselect a customer passed via ?customerId= (e.g. "إصدار فاتورة" from the clients page).
        if (!isEditing && preselectCustomerId) {
          const client = data.find((c) => c.id === preselectCustomerId);
          if (client) {
            setCustomerId(client.id);
            setCustomerName(client.client_name);
            setCustomerPhone(client.phone ?? '');
          }
        }
      })
      .catch(() => {
        /* non-fatal: manual entry still works if this fails */
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reserve the invoice number once, only when creating a new invoice.
  useEffect(() => {
    if (isEditing || invoiceNumber) return;
    reserveNextInvoiceNumber()
      .then(setInvoiceNumber)
      .catch((err) => setNumberError(err instanceof Error ? err.message : 'تعذر إصدار رقم الفاتورة'));
  }, [isEditing, invoiceNumber]);

  // Populate the form once the existing invoice finishes loading (edit mode).
  useEffect(() => {
    if (!isEditing || initialized || !existingInvoice) return;
    setInvoiceNumber(existingInvoice.invoice_number);
    setCustomerMode(existingInvoice.customer_id ? 'existing' : 'manual');
    setCustomerId(existingInvoice.customer_id);
    setCustomerName(existingInvoice.customer_name);
    setCustomerPhone(existingInvoice.customer_phone ?? '');
    setInvoiceDate(existingInvoice.invoice_date);
    setDeliveryDate(existingInvoice.delivery_date ?? '');
    setLocation(existingInvoice.location ?? '');
    setNotes(existingInvoice.notes ?? '');
    setStatus(existingInvoice.status);
    setDiscount(String(existingInvoice.discount));
    setItems(itemsFromExisting(existingItems));
    setInitialized(true);
  }, [isEditing, initialized, existingInvoice, existingItems]);

  const totals = useMemo(() => computeInvoiceTotals(items, Number(discount) || 0), [items, discount]);
  const discountExceedsSubtotal = Number(discount) > totals.subtotal;

  function handleSelectCustomer(id: string) {
    setCustomerId(id);
    const client = clients.find((c) => c.id === id);
    if (client) {
      setCustomerName(client.client_name);
      setCustomerPhone(client.phone ?? '');
    }
  }

  function handleItemChange(key: string, patch: Partial<DraftInvoiceItem>) {
    setItems((prev) => prev.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  }

  function handleItemRemove(key: string) {
    setItems((prev) => prev.filter((item) => item.key !== key));
  }

  function buildPreviewInvoice(): { invoice: Invoice; items: InvoiceItem[] } {
    const now = new Date().toISOString();
    const invoice: Invoice = {
      id: id ?? 'preview',
      invoice_number: invoiceNumber ?? '—',
      customer_id: customerId,
      customer_name: customerName.trim() || 'عميل',
      customer_phone: customerPhone || null,
      invoice_date: invoiceDate,
      delivery_date: deliveryDate || null,
      location: location || null,
      subtotal: totals.subtotal,
      discount: totals.discount,
      net_total: totals.netTotal,
      payment_1_amount: totals.payment1,
      payment_2_amount: totals.payment2,
      status,
      notes: notes || null,
      created_at: now,
      updated_at: now,
    };
    const previewItems: InvoiceItem[] = items.map((item, index) => ({
      id: item.key,
      invoice_id: invoice.id,
      product_id: item.product_id,
      product_name_snapshot: item.product_name_snapshot,
      description_snapshot: item.description_snapshot,
      image_url_snapshot: item.image_url_snapshot,
      quantity: item.quantity,
      unit_price: item.unit_price,
      line_total: Math.round(item.quantity * item.unit_price * 100) / 100,
      sort_order: index,
    }));
    return { invoice, items: previewItems };
  }

  function validate(): string | null {
    if (!customerName.trim()) return 'يرجى اختيار عميل أو إدخال اسم العميل يدوياً';
    if (items.length === 0) return 'يرجى إضافة منتج واحد على الأقل';
    if (items.some((item) => item.quantity <= 0)) return 'الكمية يجب أن تكون أكبر من صفر لكل صنف';
    if (discountExceedsSubtotal) return 'الخصم أكبر من إجمالي الفاتورة';
    if (!invoiceNumber) return 'تعذر إصدار رقم الفاتورة، أعد تحميل الصفحة';
    return null;
  }

  async function handlePreview() {
    if (previewBusy) return;
    setSaveError(null);
    setPreviewBusy(true);
    try {
      const { invoice, items: previewItems } = buildPreviewInvoice();
      const { printInvoicePdf } = await import('../lib/exportInvoicePdf');
      await printInvoicePdf(invoice, previewItems);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'تعذر إنشاء المعاينة، حاول مرة أخرى');
    } finally {
      setPreviewBusy(false);
    }
  }

  async function handleSave() {
    if (saving) return;
    const validationError = validate();
    if (validationError) {
      setSaveError(validationError);
      return;
    }

    setSaveError(null);
    setSaving(true);
    try {
      const input = {
        customer_id: customerMode === 'existing' ? customerId : null,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim() || null,
        invoice_date: invoiceDate,
        delivery_date: deliveryDate || null,
        location: location.trim() || null,
        subtotal: totals.subtotal,
        discount: totals.discount,
        status,
        notes: notes.trim() || null,
      };

      const saved = isEditing && id ? await updateInvoice(id, input, items) : await createInvoice(invoiceNumber!, input, items);
      navigate(`/invoices/${saved.id}`, { replace: true });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'تعذر حفظ الفاتورة، حاول مرة أخرى');
    } finally {
      setSaving(false);
    }
  }

  async function handleDownload() {
    if (!isEditing || !existingInvoice) return;
    const { exportInvoicePdf } = await import('../lib/exportInvoicePdf');
    await exportInvoicePdf(existingInvoice, existingItems);
  }

  if (isEditing && loadingExisting) return <FullPageSpinner />;
  if (isEditing && !loadingExisting && !existingInvoice) {
    return (
      <AppShell>
        <div className="fk-card" style={{ padding: 40, textAlign: 'center', color: 'var(--fk-text-faint)' }}>لم يتم العثور على الفاتورة</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 12, letterSpacing: '.2em', color: 'var(--fk-purple-dark)', marginBottom: 10 }}>الفواتير</div>
          <h1 style={{ fontFamily: 'Tajawal, sans-serif', fontWeight: 400, fontSize: 'clamp(26px,3vw,36px)', margin: 0 }}>
            {isEditing ? 'تعديل الفاتورة' : 'إصدار فاتورة جديدة'}
          </h1>
          <div style={{ fontSize: 13, color: 'var(--fk-text-muted)', marginTop: 8, fontVariantNumeric: 'tabular-nums' }}>
            رقم الفاتورة: {invoiceNumber ?? (numberError ? '—' : '...')}
          </div>
          {numberError && <div style={{ fontSize: 12.5, color: 'var(--fk-purple-dark)', marginTop: 4 }}>{numberError}</div>}
        </div>
        {isEditing && existingInvoice && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="fk-btn-secondary" style={{ padding: '10px 16px', fontSize: 13.5 }} onClick={handleDownload}>
              تحميل PDF
            </button>
          </div>
        )}
      </div>

      {loadError && <div style={{ marginBottom: 16, fontSize: 13.5, color: 'var(--fk-purple-dark)' }}>{loadError}</div>}

      {/* Customer */}
      <div className="fk-card" style={{ padding: 22, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontFamily: 'Tajawal, sans-serif', fontWeight: 400, fontSize: 19, margin: 0 }}>العميل</h3>
          <button
            className="fk-btn-link"
            style={{ color: 'var(--fk-purple-dark)' }}
            onClick={() => {
              setCustomerMode((m) => (m === 'existing' ? 'manual' : 'existing'));
              setCustomerId(null);
            }}
          >
            {customerMode === 'existing' ? 'إدخال عميل يدوي' : 'اختيار عميل من القائمة'}
          </button>
        </div>

        {customerMode === 'existing' ? (
          <div style={{ marginBottom: 16 }}>
            <label className="fk-label">العميل</label>
            <select className="fk-input" value={customerId ?? ''} onChange={(e) => handleSelectCustomer(e.target.value)}>
              <option value="" disabled>
                اختر عميلاً
              </option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.client_name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label className="fk-label">اسم العميل</label>
              <input className="fk-input" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            </div>
            <div>
              <label className="fk-label">رقم الجوال (اختياري)</label>
              <input className="fk-input" style={{ direction: 'ltr', textAlign: 'left' }} value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
            </div>
          </div>
        )}

        {customerMode === 'existing' && customerId && (
          <div style={{ fontSize: 13, color: 'var(--fk-text-muted)', marginBottom: 16 }}>
            {customerName} {customerPhone ? `· ${customerPhone}` : ''}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
          <div>
            <label className="fk-label">تاريخ الفاتورة</label>
            <input type="date" className="fk-input" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
          </div>
          <div>
            <label className="fk-label">تاريخ التوريد</label>
            <input type="date" className="fk-input" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
          </div>
          <div>
            <label className="fk-label">الموقع</label>
            <input className="fk-input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="مثال: قاعات عبية نجد - الرياض" />
          </div>
          <div>
            <label className="fk-label">الحالة</label>
            <select className="fk-input" value={status} onChange={(e) => setStatus(e.target.value as InvoiceStatus)}>
              {INVOICE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Items */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h3 style={{ fontFamily: 'Tajawal, sans-serif', fontWeight: 400, fontSize: 19, margin: 0 }}>المنتجات</h3>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="fk-btn-secondary" style={{ padding: '9px 16px', fontSize: 13.5 }} onClick={() => setItems((prev) => [...prev, blankItem()])}>
            + سطر يدوي
          </button>
          <button className="fk-btn-primary" style={{ padding: '9px 16px', fontSize: 13.5 }} onClick={() => setPickerOpen(true)}>
            + إضافة منتج
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <InvoiceItemsTable items={items} onChange={handleItemChange} onRemove={handleItemRemove} />
      </div>

      {/* Totals */}
      <div className="fk-card" style={{ padding: 22, marginBottom: 20, maxWidth: 420, marginInlineStart: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '6px 0' }}>
          <span style={{ color: 'var(--fk-text-muted)' }}>المجموع</span>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatMoney(totals.subtotal)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14, padding: '6px 0' }}>
          <span style={{ color: 'var(--fk-text-muted)' }}>خصم خاص</span>
          <input
            type="number"
            min={0}
            className="fk-input"
            style={{ width: 130, padding: '8px 10px', textAlign: 'end' }}
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
          />
        </div>
        {discountExceedsSubtotal && <div style={{ fontSize: 12.5, color: 'var(--fk-purple-dark)', marginBottom: 6 }}>الخصم أكبر من إجمالي الفاتورة</div>}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, padding: '10px 0', borderTop: '1px solid var(--fk-border)', marginTop: 6 }}>
          <span>صافي الفاتورة</span>
          <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>{formatMoney(totals.netTotal)}</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--fk-text-faint)', marginTop: 4 }}>{amountInWordsLine(totals.netTotal)}</div>
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--fk-border-faint)', fontSize: 12.5, color: 'var(--fk-text-label)', lineHeight: 1.9 }}>
          <div>شروط الدفع:</div>
          <div>50% مقدماً ({formatMoney(totals.payment1)}) ريال</div>
          <div>50% قبل التوريد بـ 24 ساعة ({formatMoney(totals.payment2)}) ريال</div>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label className="fk-label">ملاحظات (اختياري)</label>
        <textarea className="fk-input" style={{ minHeight: 70, resize: 'vertical' }} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      {saveError && <div style={{ marginBottom: 16, fontSize: 13.5, color: 'var(--fk-purple-dark)' }}>{saveError}</div>}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button className="fk-btn-secondary" style={{ padding: '12px 20px', fontSize: 14 }} onClick={handlePreview} disabled={previewBusy}>
          {previewBusy ? '...جارِ التحضير' : 'معاينة الفاتورة'}
        </button>
        <button
          className="fk-btn-primary"
          style={{ padding: '12px 24px', fontSize: 14.5, display: 'flex', alignItems: 'center', gap: 8 }}
          onClick={handleSave}
          disabled={saving}
        >
          {saving && <span className="fk-spinner" />}
          حفظ وإصدار الفاتورة
        </button>
        <button className="fk-btn-secondary" style={{ padding: '12px 20px', fontSize: 14 }} onClick={() => navigate('/invoices')} disabled={saving}>
          إلغاء
        </button>
      </div>

      {pickerOpen && (
        <ProductPickerModal
          onClose={() => setPickerOpen(false)}
          onAdd={(product) => setItems((prev) => [...prev, itemFromProduct(product)])}
        />
      )}
    </AppShell>
  );
}
