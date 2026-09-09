import type { ReactNode } from 'react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { logoutUser } from '../services/authService';
import { useLanguage } from '../i18n/LanguageContext';
import logo from '../assets/flowers-knot-logo.png';

function tabStyle(active: boolean): React.CSSProperties {
  return {
    padding: '9px 16px',
    borderRadius: 4,
    fontSize: 14.5,
    cursor: 'pointer',
    border: '1px solid transparent',
    background: active ? 'var(--fk-green)' : 'none',
    color: active ? '#fff' : 'var(--fk-text)',
  };
}

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const { locale, setLocale, t } = useLanguage();
  const [loggingOut, setLoggingOut] = useState(false);

  const displayName = profile?.full_name || user?.email || '';
  const initial = displayName.trim().charAt(0).toLocaleUpperCase() || '؟';

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logoutUser();
    } finally {
      setLoggingOut(false);
      navigate('/login', { replace: true });
    }
  }

  return (
    <div>
      <header style={{ background: '#fff', borderBottom: '1px solid var(--fk-border)', position: 'sticky', top: 0, zIndex: 20 }}>
        <div
          style={{
            maxWidth: 1240,
            margin: '0 auto',
            padding: '14px clamp(16px,3vw,32px)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 18,
          }}
        >
          <img src={logo} alt="Flowers Knot" style={{ width: 150, height: 'auto', display: 'block' }} />
          <nav style={{ display: 'flex', gap: 6, marginInlineStart: 'auto' }}>
            <Link to="/dashboard" style={tabStyle(pathname === '/dashboard')}>
              {t('nav.dashboard')}
            </Link>
            <Link to="/clients" style={tabStyle(pathname === '/clients')}>
              {t('nav.clients')}
            </Link>
            <Link to="/workshops" style={tabStyle(pathname.startsWith('/workshops'))}>
              {t('nav.workshops')}
            </Link>
          </nav>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingInlineStart: 18, borderInlineStart: '1px solid var(--fk-border)', fontSize: 13 }}>
            <button
              onClick={() => setLocale('ar')}
              className="fk-btn-link"
              style={{ color: locale === 'ar' ? 'var(--fk-text)' : 'var(--fk-text-faint)', fontWeight: locale === 'ar' ? 500 : 400 }}
            >
              AR
            </button>
            <span style={{ color: 'var(--fk-border-input)' }}>|</span>
            <button
              onClick={() => setLocale('en')}
              className="fk-btn-link"
              style={{ color: locale === 'en' ? 'var(--fk-text)' : 'var(--fk-text-faint)', fontWeight: locale === 'en' ? 500 : 400 }}
            >
              EN
            </button>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              paddingInlineStart: 18,
              borderInlineStart: '1px solid var(--fk-border)',
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: 'rgba(178,166,192,.25)',
                border: '1px solid var(--fk-purple)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                color: 'var(--fk-text)',
              }}
            >
              {initial}
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.5 }}>
              <div>{displayName}</div>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="fk-btn-link"
                style={{ color: 'var(--fk-text-faint)' }}
              >
                {loggingOut ? '...جارِ الخروج' : 'تسجيل الخروج'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1240, margin: '0 auto', padding: 'clamp(24px,3.5vw,44px) clamp(16px,3vw,32px) 80px' }}>
        {children}
      </main>
    </div>
  );
}
