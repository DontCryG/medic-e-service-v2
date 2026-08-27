import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Sentry } from './lib/sentry'
import { initSentry } from './lib/sentry'
import './index.css'
import App from './App.tsx'

// Init Sentry BEFORE anything else renders
initSentry();

const container = document.getElementById('root')!;

// Auto-reload when Vite fails to fetch lazy-loaded chunks (happens after deployment)
window.addEventListener('vite:preloadError', () => {
  window.location.reload();
});

createRoot(container).render(
  <StrictMode>
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => {
        const err = error as Error;
        // Auto-reload on Vite chunk load errors (happens after new deployments)
        if (
          err?.message?.includes('Importing a module script failed') || 
          err?.message?.includes('Failed to fetch dynamically imported module') ||
          err?.message?.includes('dynamically imported module')
        ) {
          window.location.reload();
          return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-main, sans-serif)' }}>กำลังอัปเดตระบบ...</div>;
        }

        return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-main, sans-serif)',
          background: '#f8fafc', gap: '1rem', padding: '2rem', textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem' }}>🚨</div>
          <h2 style={{ color: '#0f172a', margin: 0 }}>ระบบขัดข้องชั่วคราว</h2>
          <p style={{ color: '#64748b', margin: 0 }}>พบข้อผิดพลาดบางอย่าง ลองรีเฟรชหน้าเว็บอีกครั้ง หรือติดต่อผู้ดูแลระบบ</p>
          <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: 0 }}>
            {(error as Error)?.message}
          </p>
          <button
            onClick={resetError}
            style={{
              marginTop: '0.5rem', padding: '0.75rem 2rem', borderRadius: '10px',
              background: '#6366f1', color: 'white', border: 'none',
              fontWeight: 600, cursor: 'pointer', fontSize: '1rem'
            }}
          >
            รีเฟรชหน้าเว็บ
          </button>
        </div>
        );
      }}
    >
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>,
)
