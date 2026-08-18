import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Sentry } from './lib/sentry'
import { initSentry } from './lib/sentry'
import './index.css'
import './App.css'
import './responsive.css'
import App from './App.tsx'

// Init Sentry BEFORE anything else renders
initSentry();

const container = document.getElementById('root')!;

createRoot(container).render(
  <StrictMode>
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif',
          background: '#f8fafc', gap: '1rem', padding: '2rem', textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem' }}>⚠️</div>
          <h2 style={{ color: '#0f172a', margin: 0 }}>เกิดข้อผิดพลาดที่ไม่คาดคิด</h2>
          <p style={{ color: '#64748b', margin: 0 }}>
            ระบบได้บันทึกข้อผิดพลาดนี้แล้ว กรุณาลองใหม่อีกครั้ง
          </p>
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
            ลองใหม่อีกครั้ง
          </button>
        </div>
      )}
    >
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>,
)
