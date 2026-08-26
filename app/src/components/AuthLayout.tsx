import type { ReactNode } from 'react';
import logo from '../assets/flowers-knot-logo.png';

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))' }}>
      <div
        style={{
          background: 'var(--fk-green)',
          color: '#fff',
          padding: 'clamp(32px,5vw,72px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 48,
          minHeight: 280,
        }}
      >
        <div style={{ fontSize: 13, letterSpacing: '.22em', color: 'var(--fk-purple)' }}>FLOWERS KNOT</div>
        <div>
          <div style={{ width: 56, height: 1, background: 'var(--fk-purple)', marginBottom: 28 }} />
          <h1 style={{ fontFamily: 'Tajawal, sans-serif', fontWeight: 400, fontSize: 'clamp(30px,3.4vw,46px)', lineHeight: 1.45, margin: '0 0 18px' }}>
            نظام إدارة المناسبات
            <br />
            والعملاء
          </h1>
          <p style={{ margin: 0, maxWidth: '34ch', fontSize: 15, lineHeight: 2, color: 'rgba(255,255,255,.72)', fontWeight: 300 }}>
            لوحة واحدة تجمع العملاء، مواعيد الحفلات، الفواتير والمدفوعات — بدلاً من ملفات الإكسل المتفرقة.
          </p>
        </div>
        <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.45)', letterSpacing: '.04em' }}>
          منصة داخلية خاصة بشركاء فلورز نوت · ١٠ مستخدمين كحد أقصى
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(28px,4vw,64px)' }}>
        <div style={{ width: '100%', maxWidth: 420, animation: 'fkFade .5s ease both' }}>
          <div className="fk-card" style={{ padding: '18px 22px', marginBottom: 28, display: 'flex', justifyContent: 'center' }}>
            <img src={logo} alt="Flowers Knot" style={{ width: 200, height: 'auto', display: 'block' }} />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
