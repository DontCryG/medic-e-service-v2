import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import { useAppRealtime } from './hooks/useAppRealtime';

// Lazy Load Pages
const Portal = React.lazy(() => import('./pages/Portal'));
const MainLayout = React.lazy(() => import('./layouts/MainLayout'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const PersonnelSystem = React.lazy(() => import('./pages/PersonnelSystem'));
const DutySystem = React.lazy(() => import('./pages/DutySystem'));
const SalarySystem = React.lazy(() => import('./pages/SalarySystem'));
const LeaveSystem = React.lazy(() => import('./pages/LeaveSystem'));
const QueueSystem = React.lazy(() => import('./pages/QueueSystem/QueueSystem').then(module => ({ default: module.QueueSystem })));
const RequestManagement = React.lazy(() => import('./pages/RequestManagement/RequestManagement').then(module => ({ default: module.RequestManagement })));
const AccountingSystem = React.lazy(() => import('./pages/AccountingSystem/AccountingSystem').then(module => ({ default: module.AccountingSystem })));
const SystemSettings = React.lazy(() => import('./pages/SystemSettings'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
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

export default function App() {
  const { user } = useAuthStore();

  return (
    <QueryClientProvider client={queryClient}>
      <AppEffects />
      <BrowserRouter>
        <React.Suspense fallback={
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '1rem' }}>
            <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
            <div style={{ color: '#64748b', fontSize: '0.9rem' }}>กำลังโหลดข้อมูลระบบ...</div>
          </div>
        }>
          <Routes>
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
          </Routes>
        </React.Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
