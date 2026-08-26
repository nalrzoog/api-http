import { useState } from 'react';

export function ConfirmDeleteModal({
  name,
  onCancel,
  onConfirm,
}: {
  name: string;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    if (deleting) return;
    setDeleting(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر حذف السجل، حاول مرة أخرى');
      setDeleting(false);
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(31,55,51,.42)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 50 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !deleting) onCancel();
      }}
    >
      <div className="fk-card" style={{ width: '100%', maxWidth: 390, padding: 30, animation: 'fkFade .25s ease both' }}>
        <h3 style={{ fontFamily: 'Tajawal, sans-serif', fontWeight: 400, fontSize: 24, margin: '0 0 12px' }}>حذف السجل</h3>
        <p style={{ margin: '0 0 24px', fontSize: 14, lineHeight: 1.9, color: 'var(--fk-text-label)' }}>
          سيتم حذف سجل «{name}» نهائياً وتحديث اللوحة والرسوم البيانية. هل تريد المتابعة؟
        </p>
        {error && <div style={{ marginBottom: 14, fontSize: 13, color: 'var(--fk-purple-dark)' }}>{error}</div>}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleConfirm}
            disabled={deleting}
            style={{
              flex: 1,
              padding: 12,
              background: 'var(--fk-purple-dark)',
              color: '#fff',
              border: '1px solid var(--fk-purple-dark)',
              borderRadius: 4,
              fontSize: 15,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {deleting && <span className="fk-spinner" />}
            حذف
          </button>
          <button className="fk-btn-secondary" onClick={onCancel} disabled={deleting}>
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}
