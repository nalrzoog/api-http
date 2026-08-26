import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { supabase } from '../lib/supabase';
import { toArabicAuthError, updatePassword } from '../services/authService';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // The recovery link redirects here with a token that supabase-js
    // exchanges for a temporary session automatically (detectSessionInUrl).
    supabase.auth.getSession().then(({ data }) => setReady(Boolean(data.session)));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSubmit() {
    if (loading) return;
    setNotice(null);

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
      await updatePassword(password);
      await supabase.auth.signOut();
      navigate('/login', { replace: true, state: { passwordResetSuccess: true } });
    } catch (err) {
      setNotice(toArabicAuthError(err, 'تعذر تحديث كلمة المرور، حاول مرة أخرى'));
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <h2 style={{ fontFamily: 'Tajawal, sans-serif', fontWeight: 400, fontSize: 30, margin: '0 0 6px' }}>تعيين كلمة مرور جديدة</h2>
      <p style={{ margin: '0 0 26px', fontSize: 14, color: 'var(--fk-text-muted)', fontWeight: 300, lineHeight: 1.9 }}>
        أدخل كلمة المرور الجديدة لحسابك
      </p>

      {!ready && (
        <div style={{ marginBottom: 16, fontSize: 13.5, color: 'var(--fk-text-muted)' }}>
          جارِ التحقق من رابط إعادة التعيين...
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <label className="fk-label">كلمة المرور الجديدة</label>
        <input
          type="password"
          className="fk-input"
          style={{ direction: 'ltr', textAlign: 'left' }}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          disabled={loading || !ready}
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
          disabled={loading || !ready}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />
      </div>

      {notice && (
        <div style={{ margin: '0 0 16px', padding: '11px 14px', border: '1px solid var(--fk-purple)', background: 'rgba(178,166,192,.12)', borderRadius: 4, fontSize: 13.5, lineHeight: 1.8, color: '#3B4A47' }}>
          {notice}
        </div>
      )}

      <button
        className="fk-btn-primary"
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        onClick={handleSubmit}
        disabled={loading || !ready}
      >
        {loading && <span className="fk-spinner" />}
        حفظ كلمة المرور
      </button>
    </AuthLayout>
  );
}
