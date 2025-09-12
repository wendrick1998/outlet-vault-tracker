import { useState, Suspense, lazy, useEffect } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Loading } from "@/components/ui/loading";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Header } from "@/components/Header";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Home } from "./pages/Home";
import { SearchAndRegister } from "./pages/SearchAndRegister";
import { Profile } from "./pages/Profile";
import { Settings } from "./pages/Settings";
import { InventoryConferencePage } from "./pages/InventoryConferencePage";
import { ConferenceReport } from "./pages/ConferenceReport";
import HistoricalAudits from "@/pages/HistoricalAudits";
import SystemMonitoring from "@/pages/SystemMonitoring";
import { Auth } from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazy load heavy pages for better performance
const LazyActiveLoans = lazy(() => import('./pages/ActiveLoans').then(m => ({ default: m.ActiveLoans })));
const LazyHistory = lazy(() => import('./pages/History').then(m => ({ default: m.History })));
const LazyAdmin = lazy(() => import('./pages/Admin').then(m => ({ default: m.Admin })));
const LazySearchAndOperate = lazy(() => import('./pages/SearchAndOperate').then(m => ({ default: m.SearchAndOperate })));
const LazyBatchOutflow = lazy(() => import('./pages/BatchOutflow').then(m => ({ default: m.BatchOutflow })));

type AppPage = 'home' | 'search-and-operate' | 'active-loans' | 'history' | 'admin' | 'profile' | 'settings' | 'analytics' | 'ai-assistant' | 'voice-commands' | 'smart-notifications' | 'predictions' | 'conference' | 'conference-report';

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const getCurrentPage = (): AppPage => {
    const path = location.pathname;
    if (path === '/') return 'home';
    if (path.startsWith('/search-and-operate')) return 'search-and-operate';
    if (path.startsWith('/active-loans')) return 'active-loans';
    if (path.startsWith('/history')) return 'history';
    if (path.startsWith('/admin')) return 'admin';
    if (path.startsWith('/profile')) return 'profile';
    if (path.startsWith('/settings')) return 'settings';
    if (path.startsWith('/conference')) return 'conference';
    return 'home';
  };

  const handleNavigate = (page: AppPage) => {
    if (page === 'home') {
      navigate('/');
    } else {
      navigate(`/${page}`);
    }
  };

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar 
            currentPage={getCurrentPage()} 
            onNavigate={handleNavigate}
          />
          <SidebarInset className="flex-1">
            <div className="flex flex-col h-screen">
              <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <div className="flex-1">
                  <Header 
                    title=""
                  />
                </div>
              </header>
              
              <main className="flex-1 overflow-auto">
                {children}
              </main>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
};

const AppContent = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Prefetch History page on mount
  useEffect(() => {
    import('./pages/History');
  }, []);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/auth" element={<Auth onLoginSuccess={() => navigate('/')} />} />
      
      {/* Protected routes with layout */}
      <Route 
        path="/" 
        element={
          <AppLayout>
            <Home onNavigate={(page) => navigate(page === 'home' ? '/' : `/${page}`)} />
          </AppLayout>
        } 
      />
      <Route 
        path="/search-register" 
        element={
          <AppLayout>
            <SearchAndRegister onBack={() => navigate('/')} />
          </AppLayout>
        }
      />
      <Route 
        path="/search-and-operate" 
        element={
          <AppLayout>
            <Suspense fallback={<Loading />}>
              <LazySearchAndOperate onBack={() => navigate('/')} />
            </Suspense>
          </AppLayout>
        } 
      />
      <Route 
        path="/active-loans" 
        element={
          <AppLayout>
            <Suspense fallback={<Loading />}>
              <LazyActiveLoans onBack={() => navigate('/')} />
            </Suspense>
          </AppLayout>
        } 
      />
      <Route 
        path="/history" 
        element={
          <AppLayout>
            <Suspense fallback={<Loading />}>
              <LazyHistory onBack={() => navigate('/')} />
            </Suspense>
          </AppLayout>
        } 
      />
      <Route 
        path="/batch-outflow" 
        element={
          <AppLayout>
            <Suspense fallback={<Loading />}>
              <LazyBatchOutflow onBack={() => navigate('/')} />
            </Suspense>
          </AppLayout>
        } 
      />
      <Route 
        path="/profile" 
        element={
          <AppLayout>
            <Profile onBack={() => navigate('/')} />
          </AppLayout>
        }
      />
      <Route 
        path="/settings" 
        element={
          <AppLayout>
            <Settings onBack={() => navigate('/')} />
          </AppLayout>
        }
      />
      <Route 
        path="/admin" 
        element={
          <AppLayout>
            <Suspense fallback={<Loading />}>
              <LazyAdmin onBack={() => navigate('/')} />
            </Suspense>
          </AppLayout>
        } 
      />
      <Route 
        path="/conference/:auditId/report" 
        element={
          <AppLayout>
            <ConferenceReport />
          </AppLayout>
        } 
      />
      <Route 
        path="/conference" 
        element={
          <AppLayout>
            <InventoryConferencePage />
          </AppLayout>
        } 
      />
      <Route 
        path="/historical-audits" 
        element={
          <AppLayout>
            <HistoricalAudits />
          </AppLayout>
        } 
      />
      <Route 
        path="/system-monitoring" 
        element={
          <AppLayout>
            <SystemMonitoring />
          </AppLayout>
        } 
      />
      
      {/* 404 page */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

// App wrapper with location-based ErrorBoundary reset
const AppWrapper = () => {
  const location = useLocation();
  
  return (
    <ErrorBoundary key={location.pathname}>
      <AppContent />
    </ErrorBoundary>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppWrapper />
      <Toaster />
      <Sonner />
    </AuthProvider>
  );
};

export default App;