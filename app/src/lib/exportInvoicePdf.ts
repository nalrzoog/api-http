import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { Invoice, InvoiceItem } from '../types/invoice';
import { amountInWordsLine } from './numberToArabicWords';
import { formatDate, formatMoney } from './format';
import logoUrl from '../assets/flowers-knot-logo.png';

const BANK = {
  accountName: 'Alham Alwrd Altjaryt',
  swift: 'INMASARIXXX',
  bankName: 'INMA Bank',
  iban: 'SA 7805000068205117541000',
};
const FOOTER_ADDRESS = '13321 Riyadh – Prince Abdullah Bin Saud Bin Abdullah Snatan St. – Tel: 0502655271';
const MIN_TABLE_ROWS = 7;

function escapeHtml(value: string): string {
  const div = document.createElement('div');
  div.textContent = value;
  return div.innerHTML;
}

/** Renders the "FN Invoice" template as real DOM (so Arabic shapes exactly
 * as it does everywhere else in the app), then rasterizes it into a
 * paginated A4 PDF — same proven approach as the Workshops PDF export. */
async function buildInvoicePdf(invoice: Invoice, items: InvoiceItem[]): Promise<jsPDF> {
  const padCount = Math.max(0, MIN_TABLE_ROWS - items.length);
  const itemRows = items
    .map(
      (item) => `<tr>
        <td style="padding:9px 12px;border:1px solid #E4E1DC;text-align:center;font-variant-numeric:tabular-nums;">${formatMoney(item.line_total)}</td>
        <td style="padding:9px 12px;border:1px solid #E4E1DC;text-align:center;font-variant-numeric:tabular-nums;">${formatMoney(item.unit_price)}</td>
        <td style="padding:9px 12px;border:1px solid #E4E1DC;text-align:center;font-variant-numeric:tabular-nums;">${item.quantity}</td>
        <td style="padding:9px 12px;border:1px solid #E4E1DC;">${escapeHtml(item.description_snapshot || item.product_name_snapshot)}</td>
      </tr>`
    )
    .join('');
  const blankRows = Array.from({ length: padCount })
    .map(
      () =>
        `<tr><td style="padding:9px 12px;border:1px solid #E4E1DC;">&nbsp;</td><td style="padding:9px 12px;border:1px solid #E4E1DC;">&nbsp;</td><td style="padding:9px 12px;border:1px solid #E4E1DC;">&nbsp;</td><td style="padding:9px 12px;border:1px solid #E4E1DC;">&nbsp;</td></tr>`
    )
    .join('');

  const container = document.createElement('div');
  container.setAttribute('dir', 'rtl');
  container.style.cssText =
    'position:fixed;top:0;right:-99999px;width:794px;background:#fff;padding:40px 44px;font-family:\'Tajawal\',sans-serif;color:#1F1F1F;';
  container.innerHTML = `
    <div style="position:relative;">
      <img src="${logoUrl}" style="position:absolute;inset:0;margin:auto;top:280px;width:360px;opacity:.06;z-index:0;" />

      <div style="position:relative;z-index:1;">
        <div style="text-align:center;margin-bottom:8px;">
          <img src="${logoUrl}" style="width:160px;height:auto;display:inline-block;" />
        </div>
        <h1 style="text-align:center;font-weight:700;font-size:22px;margin:0 0 26px;">فاتورة تجارية</h1>

        <div style="font-size:13.5px;line-height:2.1;margin-bottom:20px;">
          <div>رقم الفاتورة : ${escapeHtml(invoice.invoice_number)}</div>
          <div>تاريخ الفاتورة: ${formatDate(invoice.invoice_date)}</div>
          <div>تاريخ التوريد: ${invoice.delivery_date ? formatDate(invoice.delivery_date) : '—'}</div>
          <div>الموقع: ${escapeHtml(invoice.location || '—')}</div>
          <div>العميل: المحترم / ـين: ${escapeHtml(invoice.customer_name)}</div>
        </div>

        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:4px;">
          <thead>
            <tr style="background:#FAF9F7;">
              <th style="padding:9px 12px;border:1px solid #E4E1DC;font-weight:400;">المجموع</th>
              <th style="padding:9px 12px;border:1px solid #E4E1DC;font-weight:400;">سعر الوحدة</th>
              <th style="padding:9px 12px;border:1px solid #E4E1DC;font-weight:400;">الكمية</th>
              <th style="padding:9px 12px;border:1px solid #E4E1DC;font-weight:400;">الوصــــف</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
            ${blankRows}
            <tr>
              <td colspan="3" style="padding:9px 12px;border:1px solid #E4E1DC;font-weight:700;">المجموع</td>
              <td style="padding:9px 12px;border:1px solid #E4E1DC;text-align:center;font-weight:700;font-variant-numeric:tabular-nums;">${formatMoney(invoice.subtotal)}</td>
            </tr>
            <tr>
              <td colspan="3" style="padding:9px 12px;border:1px solid #E4E1DC;">خصم خاص</td>
              <td style="padding:9px 12px;border:1px solid #E4E1DC;text-align:center;font-variant-numeric:tabular-nums;">${invoice.discount > 0 ? '-' : ''}${formatMoney(invoice.discount)}</td>
            </tr>
            <tr>
              <td colspan="3" style="padding:9px 12px;border:1px solid #E4E1DC;font-weight:700;">صافي الفاتورة</td>
              <td style="padding:9px 12px;border:1px solid #E4E1DC;text-align:center;font-weight:700;font-variant-numeric:tabular-nums;">${formatMoney(invoice.net_total)}</td>
            </tr>
          </tbody>
        </table>

        <div style="text-align:center;font-size:13.5px;font-weight:700;margin:18px 0;">${escapeHtml(amountInWordsLine(invoice.net_total))}</div>

        <div style="text-align:center;font-size:12.5px;color:#4A5A57;margin-bottom:18px;">السعر يشمل التوريد والتوصيل لموقع العميل</div>

        <div style="font-size:13px;margin-bottom:20px;">
          <div style="font-weight:700;margin-bottom:6px;">شروط الدفع:</div>
          <div>50% من قيمة الفاتورة مقدماً (${formatMoney(invoice.payment_1_amount)}) ريال</div>
          <div>50% من قيمة الفاتورة قبل التوريد ب 24 ساعة (${formatMoney(invoice.payment_2_amount)}) ريال</div>
        </div>

        <div style="font-size:12.5px;line-height:1.9;margin-bottom:24px;">
          <div style="margin-bottom:6px;">الرجاء تحويل قيمة الفاتورة على الحساب:</div>
          <div style="direction:ltr;text-align:left;font-family:monospace;">
            Account Name : ${BANK.accountName}<br/>
            SWIFT : ${BANK.swift}<br/>
            Bank Name : ${BANK.bankName}<br/>
            IBAN : ${BANK.iban}
          </div>
        </div>

        <div style="border-top:1px solid #E4E1DC;padding-top:12px;display:flex;align-items:center;justify-content:center;gap:10px;font-size:11px;color:#6C7A77;">
          <img src="${logoUrl}" style="width:60px;height:auto;" />
          <span style="direction:ltr;">${FOOTER_ADDRESS}</span>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    await document.fonts.ready;
    const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgData = canvas.toDataURL('image/png');
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
    heightLeft -= pdfHeight;
    while (heightLeft > 0) {
      position -= pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    return pdf;
  } finally {
    document.body.removeChild(container);
  }
}

export async function exportInvoicePdf(invoice: Invoice, items: InvoiceItem[]): Promise<void> {
  const pdf = await buildInvoicePdf(invoice, items);
  pdf.save(`invoice-${invoice.invoice_number}.pdf`);
}

/** Opens the PDF in a new tab so the browser's native viewer print button
 * handles printing — reliable on both desktop and mobile. */
export async function printInvoicePdf(invoice: Invoice, items: InvoiceItem[]): Promise<void> {
  const pdf = await buildInvoicePdf(invoice, items);
  window.open(pdf.output('bloburl') as unknown as string, '_blank');
}
