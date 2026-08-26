import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { requestPasswordReset, toArabicAuthError } from '../services/authService';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    if (loading) return;
    setNotice(null);

    if (!email.trim()) {
      setNotice('يرجى إدخال البريد الإلكتروني');
      return;
    }

    setLoading(true);
    try {
      await requestPasswordReset(email.trim());
      setSent(true);
    } catch (err) {
      setNotice(toArabicAuthError(err, 'تعذر إرسال رابط إعادة التعيين، حاول مرة أخرى'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <h2 style={{ fontFamily: 'Tajawal, sans-serif', fontWeight: 400, fontSize: 30, margin: '0 0 6px' }}>نسيت كلمة المرور؟</h2>
      <p style={{ margin: '0 0 26px', fontSize: 14, color: 'var(--fk-text-muted)', fontWeight: 300, lineHeight: 1.9 }}>
        أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور
      </p>

      {sent ? (
        <div style={{ padding: '11px 14px', border: '1px solid var(--fk-purple)', background: 'rgba(178,166,192,.12)', borderRadius: 4, fontSize: 13.5, lineHeight: 1.8, color: '#3B4A47' }}>
          إذا كان البريد الإلكتروني مسجلاً لدينا، فسيصلك رابط إعادة تعيين كلمة المرور خلال دقائق.
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 16 }}>
            <label className="fk-label">البريد الإلكتروني</label>
            <input
              className="fk-input"
              style={{ direction: 'ltr', textAlign: 'left' }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@flowersknot.sa"
              disabled={loading}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          {notice && (
            <div style={{ margin: '0 0 16px', padding: '11px 14px', border: '1px solid var(--fk-purple)', background: 'rgba(178,166,192,.12)', borderRadius: 4, fontSize: 13.5, lineHeight: 1.8, color: '#3B4A47' }}>
              {notice}
            </div>
          )}

          <button className="fk-btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} onClick={handleSubmit} disabled={loading}>
            {loading && <span className="fk-spinner" />}
            إرسال رابط إعادة التعيين
          </button>
        </>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20, fontSize: 13.5 }}>
        <Link to="/login" className="fk-btn-link" style={{ color: 'var(--fk-text-muted)', borderBottom: '1px solid var(--fk-border-input)' }}>
          العودة لتسجيل الدخول
        </Link>
      </div>
    </AuthLayout>
  );
}
