import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider, MutationCache } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import { useAppRealtime, globalBroadcastChannel } from './hooks/useAppRealtime';
import { setSentryUser, clearSentryUser } from './lib/sentry';

import Portal from './pages/Portal';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import PersonnelSystem from './pages/PersonnelSystem';
import DutySystem from './pages/DutySystem';
import SalarySystem from './pages/SalarySystem';
import LeaveSystem from './pages/LeaveSystem';
import { QueueSystem } from './pages/QueueSystem/QueueSystem';
import { RequestManagement } from './pages/RequestManagement/RequestManagement';
import { AccountingSystem } from './pages/AccountingSystem/AccountingSystem';
import SystemSettings from './pages/SystemSettings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      staleTime: 0,
    },
  },
  mutationCache: new MutationCache({
    onSuccess: () => {
      globalBroadcastChannel.send({ type: 'broadcast', event: 'force_sync', payload: {} });
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

      </BrowserRouter>
    </QueryClientProvider>
  );
}
