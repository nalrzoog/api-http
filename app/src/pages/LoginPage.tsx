import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { loginUser, toArabicAuthError } from '../services/authService';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(
    (location.state as { passwordResetSuccess?: boolean } | null)?.passwordResetSuccess
      ? 'تم تحديث كلمة المرور بنجاح، يمكنك تسجيل الدخول الآن'
      : null
  );

  async function handleSubmit() {
    if (loading) return;
    setNotice(null);

    if (!email.trim() || !password) {
      setNotice('يرجى تعبئة البريد الإلكتروني وكلمة المرور');
      return;
    }

    setLoading(true);
    try {
      await loginUser(email.trim(), password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setNotice(toArabicAuthError(err, 'البريد الإلكتروني أو كلمة المرور غير صحيحة'));
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <h2 style={{ fontFamily: 'Tajawal, sans-serif', fontWeight: 400, fontSize: 30, margin: '0 0 6px' }}>تسجيل الدخول</h2>
      <p style={{ margin: '0 0 26px', fontSize: 14, color: 'var(--fk-text-muted)', fontWeight: 300, lineHeight: 1.9 }}>
        سجّل الدخول للوصول إلى لوحة التحكم
      </p>

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

      <div style={{ marginBottom: 16 }}>
        <label className="fk-label">كلمة المرور</label>
        <input
          type="password"
          className="fk-input"
          style={{ direction: 'ltr', textAlign: 'left' }}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
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
        دخول
      </button>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'space-between', marginTop: 20, fontSize: 13.5, color: 'var(--fk-text-muted)' }}>
        <Link to="/forgot-password" className="fk-btn-link" style={{ color: 'var(--fk-text-muted)', borderBottom: '1px solid var(--fk-border-input)' }}>
          نسيت كلمة المرور؟
        </Link>
        <Link to="/register" className="fk-btn-link" style={{ color: 'var(--fk-text)', borderBottom: '1px solid var(--fk-purple)' }}>
          ليس لديك حساب؟ إنشاء حساب
        </Link>
      </div>
    </AuthLayout>
  );
}
