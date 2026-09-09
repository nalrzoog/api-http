import { useRef, useState } from 'react';
import { uploadWorkshopImage, validateWorkshopImage } from '../services/workshopService';
import { useLanguage } from '../i18n/LanguageContext';

export function ImageUploadField({
  value,
  onChange,
  disabled,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
}) {
  const { t } = useLanguage();
  const [preview, setPreview] = useState<string | null>(value);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | null) {
    if (!file) return;
    setError(null);

    const validationError = validateWorkshopImage(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Show a preview immediately, then upload.
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setUploading(true);
    try {
      const url = await uploadWorkshopImage(file);
      onChange(url);
      setPreview(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر رفع الصورة، حاول مرة أخرى');
      setPreview(value);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="fk-label">{t('workshop.image')}</label>
      <div
        style={{
          border: '1px dashed var(--fk-border-input)',
          borderRadius: 4,
          padding: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          background: '#fff',
        }}
      >
        <div
          style={{
            width: 84,
            height: 84,
            borderRadius: 4,
            background: preview ? `center/cover no-repeat url(${preview})` : 'var(--fk-bg)',
            border: '1px solid var(--fk-border)',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--fk-text-faint)',
            fontSize: 11,
          }}
        >
          {!preview && '—'}
        </div>
        <div style={{ flex: 1 }}>
          <button
            type="button"
            className="fk-btn-secondary"
            style={{ padding: '8px 16px', fontSize: 13 }}
            onClick={() => inputRef.current?.click()}
            disabled={disabled || uploading}
          >
            {uploading ? t('common.saving') : t('common.add')}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            hidden
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
          {error && <div style={{ marginTop: 8, fontSize: 12.5, color: 'var(--fk-purple-dark)' }}>{error}</div>}
        </div>
      </div>
    </div>
  );
}
