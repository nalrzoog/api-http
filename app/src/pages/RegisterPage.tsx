import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { registerUser, toArabicAuthError } from '../services/authService';

export function RegisterPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit() {
    if (loading) return;
    setNotice(null);

    if (!fullName.trim() || !email.trim() || !password) {
      setNotice('يرجى تعبئة جميع الحقول');
      return;
    }
    if (password.length < 6) {
      setNotice('كلمة المرور يجب ألا تقل عن 6 أحرف');
      return;
    }
    if (password !== password2) {
      setNotice('كلمتا المرور غير متطابقتين');
      return;
    }

    setLoading(true);
    try {
      const result = await registerUser(fullName.trim(), email.trim(), password);
      if (result.session) {
        // Session created immediately — go straight to the dashboard.
        navigate('/dashboard', { replace: true });
      } else {
        // Project requires email confirmation before a session can exist.
        setNotice('تم إنشاء الحساب بنجاح. يرجى تأكيد البريد الإلكتروني عبر الرابط المرسل إليك ثم تسجيل الدخول.');
        setLoading(false);
      }
    } catch (err) {
      setNotice(toArabicAuthError(err, 'تعذر إنشاء الحساب، حاول مرة أخرى'));
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <h2 style={{ fontFamily: 'Tajawal, sans-serif', fontWeight: 400, fontSize: 30, margin: '0 0 6px' }}>إنشاء حساب</h2>
      <p style={{ margin: '0 0 26px', fontSize: 14, color: 'var(--fk-text-muted)', fontWeight: 300, lineHeight: 1.9 }}>
        أنشئ حسابك للوصول إلى لوحة التحكم
      </p>

      <div style={{ marginBottom: 16 }}>
        <label className="fk-label">الاسم</label>
        <input className="fk-input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="الاسم الكامل" disabled={loading} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label className="fk-label">البريد الإلكتروني</label>
        <input
          className="fk-input"
          style={{ direction: 'ltr', textAlign: 'left' }}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@flowersknot.sa"
          disabled={loading}
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
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label className="fk-label">تأكيد كلمة المرور</label>
        <input
          type="password"
          className="fk-input"
          style={{ direction: 'ltr', textAlign: 'left' }}
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
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
        إنشاء الحساب
      </button>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20, fontSize: 13.5 }}>
        <Link to="/login" className="fk-btn-link" style={{ color: 'var(--fk-text)', borderBottom: '1px solid var(--fk-purple)' }}>
          لديك حساب بالفعل؟ تسجيل الدخول
        </Link>
      </div>
    </AuthLayout>
  );
}
