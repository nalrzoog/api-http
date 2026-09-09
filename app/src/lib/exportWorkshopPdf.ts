import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { translate, type Locale } from '../i18n/translations';
import { formatDate } from './format';
import { formatTime, materialStatusKey } from './workshopFormat';
import type { Workshop, WorkshopMaterial } from '../types/workshop';
import logoUrl from '../assets/flowers-knot-logo.png';

function escapeHtml(value: string): string {
  const div = document.createElement('div');
  div.textContent = value;
  return div.innerHTML;
}

/** Renders the preparation sheet as real DOM (so Arabic text shapes and
 * joins exactly as the browser would render it anywhere else in the app —
 * no font/reshaping issues), then rasterizes it into a paginated PDF. This
 * is the reliable way to guarantee correct Arabic rendering in a PDF. */
export async function exportWorkshopPdf(workshop: Workshop, materials: WorkshopMaterial[], locale: Locale): Promise<void> {
  const t = (section: 'workshop' | 'common' | 'status', key: string) => translate(locale, section, key);
  const isAr = locale === 'ar';

  const name = (isAr ? workshop.name_ar : workshop.name_en) || workshop.name_ar || workshop.name_en || '';
  const missing = materials.filter((m) => m.status === 'ناقص');

  const materialRows = materials
    .map((m) => {
      const mName = (isAr ? m.name_ar : m.name_en) || m.name_ar;
      return `<tr>
        <td style="padding:8px 10px;border-bottom:1px solid #EDEAE5;">${escapeHtml(mName)}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #EDEAE5;text-align:${isAr ? 'left' : 'right'};">${m.quantity}${m.unit ? ' ' + escapeHtml(m.unit) : ''}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #EDEAE5;text-align:${isAr ? 'left' : 'right'};">${escapeHtml(t('common', materialStatusKey(m.status).split('.')[1]))}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #EDEAE5;color:#6C7A77;">${m.notes ? escapeHtml(m.notes) : ''}</td>
      </tr>`;
    })
    .join('');

  const missingList = missing.length
    ? `<ul style="margin:0;padding-inline-start:20px;">${missing
        .map((m) => `<li style="margin-bottom:4px;">${m.quantity}${m.unit ? ' ' + escapeHtml(m.unit) : ''} ${escapeHtml((isAr ? m.name_ar : m.name_en) || m.name_ar)}</li>`)
        .join('')}</ul>`
    : `<div style="color:#6C7A77;">${isAr ? 'لا توجد مستلزمات ناقصة' : 'No missing materials'}</div>`;

  const container = document.createElement('div');
  container.setAttribute('dir', isAr ? 'rtl' : 'ltr');
  container.style.cssText = `position:fixed;top:0;${isAr ? 'right' : 'left'}:-99999px;width:780px;background:#fff;padding:40px;font-family:'Tajawal',sans-serif;color:#1F3733;`;
  container.innerHTML = `
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:24px;">
      <img src="${logoUrl}" style="width:130px;height:auto;display:block;" />
      <div>
        <div style="font-size:12px;letter-spacing:.18em;color:#B2A6C0;">FLOWERS KNOT</div>
        <div style="font-size:14px;color:#6C7A77;">${escapeHtml(t('workshop', 'preparationSheet'))}</div>
      </div>
    </div>

    <h1 style="font-weight:400;font-size:26px;margin:0 0 18px;">${escapeHtml(name)}</h1>

    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px;">
      <div><div style="font-size:11px;color:#6C7A77;margin-bottom:4px;">${escapeHtml(t('common', 'date'))}</div><div style="font-size:14px;">${formatDate(workshop.workshop_date)}</div></div>
      <div><div style="font-size:11px;color:#6C7A77;margin-bottom:4px;">${escapeHtml(t('common', 'time'))}</div><div style="font-size:14px;">${formatTime(workshop.start_time)}${workshop.end_time ? ' - ' + formatTime(workshop.end_time) : ''}</div></div>
      <div><div style="font-size:11px;color:#6C7A77;margin-bottom:4px;">${escapeHtml(t('common', 'participants'))}</div><div style="font-size:14px;">${workshop.participants_count ?? '—'}</div></div>
      <div><div style="font-size:11px;color:#6C7A77;margin-bottom:4px;">${escapeHtml(t('common', 'location'))}</div><div style="font-size:14px;">${escapeHtml(workshop.location || '—')}</div></div>
    </div>

    ${workshop.image_url ? `<img src="${workshop.image_url}" crossorigin="anonymous" style="width:100%;max-height:280px;object-fit:cover;border-radius:4px;margin-bottom:24px;display:block;" />` : ''}

    <h2 style="font-weight:400;font-size:18px;margin:0 0 10px;">${escapeHtml(t('common', 'materials'))}</h2>
    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:24px;">
      <thead>
        <tr style="background:#FAF9F7;">
          <th style="padding:8px 10px;text-align:${isAr ? 'right' : 'left'};font-weight:400;color:#4A5A57;border-bottom:1px solid #E4E1DC;">${isAr ? 'المستلزم' : 'Material'}</th>
          <th style="padding:8px 10px;text-align:${isAr ? 'left' : 'right'};font-weight:400;color:#4A5A57;border-bottom:1px solid #E4E1DC;">${escapeHtml(t('workshop', 'quantity'))}</th>
          <th style="padding:8px 10px;text-align:${isAr ? 'left' : 'right'};font-weight:400;color:#4A5A57;border-bottom:1px solid #E4E1DC;">${escapeHtml(t('workshop', 'status'))}</th>
          <th style="padding:8px 10px;text-align:${isAr ? 'right' : 'left'};font-weight:400;color:#4A5A57;border-bottom:1px solid #E4E1DC;">${escapeHtml(t('common', 'notes'))}</th>
        </tr>
      </thead>
      <tbody>${materialRows}</tbody>
    </table>

    <h2 style="font-weight:400;font-size:18px;margin:0 0 10px;color:#8E7FA3;">${escapeHtml(t('workshop', 'missingMaterials'))}</h2>
    <div style="font-size:13px;margin-bottom:24px;">${missingList}</div>

    ${
      workshop.internal_notes
        ? `<h2 style="font-weight:400;font-size:18px;margin:0 0 10px;">${escapeHtml(t('workshop', 'internalNotes'))}</h2>
           <div style="font-size:13px;color:#4A5A57;white-space:pre-wrap;">${escapeHtml(workshop.internal_notes)}</div>`
        : ''
    }
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

    pdf.save(`${name || 'workshop'}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}
