import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider, MutationCache } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import { useAppRealtime, broadcastForceSync } from './hooks/useAppRealtime';
import { setSentryUser, clearSentryUser } from './lib/sentry';

const Portal = lazy(() => import('./pages/Portal'));
const MainLayout = lazy(() => import('./layouts/MainLayout'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const PersonnelSystem = lazy(() => import('./pages/PersonnelSystem'));
const DutySystem = lazy(() => import('./pages/DutySystem'));
const SalarySystem = lazy(() => import('./pages/SalarySystem'));
const LeaveSystem = lazy(() => import('./pages/LeaveSystem'));
const QueueSystem = lazy(() => import('./pages/QueueSystem/QueueSystem').then(m => ({ default: m.QueueSystem })));
const RequestManagement = lazy(() => import('./pages/RequestManagement/RequestManagement').then(m => ({ default: m.RequestManagement })));
const AccountingSystem = lazy(() => import('./pages/AccountingSystem/AccountingSystem').then(m => ({ default: m.AccountingSystem })));
const SystemSettings = lazy(() => import('./pages/SystemSettings'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      staleTime: 0,
    },
  },
  mutationCache: new MutationCache({
    onSuccess: () => {
      broadcastForceSync();
    }
  })
});

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuthStore();
  
  if (!user) return <Navigate to="/" replace />;
  if (user.role === 'user' || user.role === 'resigned') {
    // If somehow a restricted user is logged in, log them out
    logout();
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

// Admin Route Wrapper
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin' || user?.role === 'director' || user?.role === 'management';
  
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

// Component to run hooks that need QueryClient context
function AppEffects() {
  useAppRealtime();
  return null;
}

const FallbackLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-main)' }}>
    <div style={{ padding: '20px', borderRadius: '12px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      กำลังโหลดระบบ... (Loading System)
    </div>
  </div>
);

export default function App() {
  const { user } = useAuthStore();

  // Sync user identity to Sentry whenever auth state changes
  React.useEffect(() => {
    if (user) {
      setSentryUser(user.discord_id, user.ic_name);
    } else {
      clearSentryUser();
    }
  }, [user]);

  return (
    <QueryClientProvider client={queryClient}>
      <AppEffects />
      <BrowserRouter>

          <Suspense fallback={<FallbackLoader />}><Routes>
            {/* Public Portal Route */}
            <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Portal />} />

            {/* Protected Main Layout */}
            <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              
              {/* Stubs for future migration */}
              <Route path="/queue" element={<QueueSystem />} />
              <Route path="/duty" element={<DutySystem profile={user} />} />
              <Route 
                path="/leave" 
                element={
                  <ProtectedRoute>
                    <LeaveSystem profile={user} />
                  </ProtectedRoute>
                } 
              />
              
              {/* Admin Routes */}
              <Route path="/personnel" element={<AdminRoute><PersonnelSystem profile={user} /></AdminRoute>} />
              <Route path="/requests" element={<ProtectedRoute><RequestManagement /></ProtectedRoute>} />
              <Route path="/salary" element={<AdminRoute><SalarySystem profile={user} /></AdminRoute>} />
              <Route path="/accounting" element={<AdminRoute><AccountingSystem /></AdminRoute>} />
              <Route path="/settings" element={<AdminRoute><SystemSettings /></AdminRoute>} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes></Suspense>

      </BrowserRouter>
    </QueryClientProvider>
  );
}


