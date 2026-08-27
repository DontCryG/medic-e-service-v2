import React, { lazy, Suspense } from 'react';
import { 
  createBrowserRouter, 
  RouterProvider, 
  createRoutesFromElements,
  Route, 
  Navigate 
} from 'react-router-dom';
import { QueryClient, QueryClientProvider, MutationCache } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import { useAppRealtime, broadcastForceSync } from './hooks/useAppRealtime';
import { setSentryUser, clearSentryUser } from './lib/sentry';
import { supabase } from './lib/supabase';
import GlobalError from './components/common/GlobalError';

const Portal = lazy(() => import('./pages/Portal'));
const MainLayout = lazy(() => import('./layouts/MainLayout'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const PersonnelSystem = lazy(() => import('./pages/PersonnelSystem'));
const DutySystem = lazy(() => import('./pages/DutySystem'));
const SalarySystem = lazy(() => import('./pages/SalarySystem'));
const LeaveSystem = lazy(() => import('./pages/LeaveSystem'));
const QueueSystem = lazy(() => import('./pages/QueueSystem/QueueSystem').then(m => ({ default: m.QueueSystem })));
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

// Portal Route Wrapper (Reactive)
const PortalRoute = () => {
  const { user } = useAuthStore();
  return user ? <Navigate to="/dashboard" replace /> : <Portal />;
};

// Leave System Wrapper
const LeaveRoute = () => {
  const { user } = useAuthStore();
  return (
    <ProtectedRoute>
      <LeaveSystem profile={user} />
    </ProtectedRoute>
  );
};

// Duty System Wrapper
const DutyRoute = () => {
  const { user } = useAuthStore();
  return <DutySystem profile={user} />;
};

// Personnel System Wrapper
const PersonnelRoute = () => {
  const { user } = useAuthStore();
  return (
    <AdminRoute>
      <PersonnelSystem profile={user} />
    </AdminRoute>
  );
};

// Salary System Wrapper
const SalaryRoute = () => {
  const { user } = useAuthStore();
  return (
    <AdminRoute>
      <SalarySystem profile={user} />
    </AdminRoute>
  );
};

// Component to run hooks that need QueryClient context
function AppEffects() {
  useAppRealtime();
  return null;
}

const FallbackLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc' }}>
    <div style={{ padding: '20px', borderRadius: '12px', background: '#ffffff', color: 'var(--text-primary)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>กำลังดาวน์โหลดข้อมูลระบบ... (Loading System)
    </div>
  </div>
);

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route errorElement={<GlobalError />}>
      {/* Public Portal Route */}
      <Route path="/" element={<PortalRoute />} />

      {/* Protected Main Layout */}
      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/queue" element={<QueueSystem />} />
        <Route path="/duty" element={<DutyRoute />} />
        <Route path="/leave" element={<LeaveRoute />} />
        
        {/* Admin Routes */}
        <Route path="/personnel" element={<PersonnelRoute />} />
        <Route path="/salary" element={<SalaryRoute />} />
        <Route path="/accounting" element={<AdminRoute><AccountingSystem /></AdminRoute>} />
        <Route path="/settings" element={<AdminRoute><SystemSettings /></AdminRoute>} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  )
);

export default function App() {
  const { user } = useAuthStore();

  // Force Logout Check (v2.2)
  React.useEffect(() => {
    const checkVersionAndLogout = async () => {
      const FORCE_LOGOUT_VERSION = 'v2.2'; 
      const currentVersion = localStorage.getItem('app_force_logout_version');
      if (currentVersion !== FORCE_LOGOUT_VERSION) {
        await supabase.auth.signOut();
        useAuthStore.getState().logout();
        localStorage.setItem('app_force_logout_version', FORCE_LOGOUT_VERSION);
        window.location.href = '/';
      }
    };
    checkVersionAndLogout();
  }, []);

  // Sync user identity to Sentry whenever auth state changes
  React.useEffect(() => {
    if (user) {
      setSentryUser(user.discord_id, user.ic_name);
    } else {
      clearSentryUser();
    }
  }, [user]);

  // Global Auth Sync to prevent 401 errors when session expires
  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if ((!session || error) && useAuthStore.getState().user) {
        useAuthStore.getState().logout();
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
        useAuthStore.getState().logout();
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppEffects />
      <Suspense fallback={<FallbackLoader />}>
        <RouterProvider router={router} />
      </Suspense>
    </QueryClientProvider>
  );
}
