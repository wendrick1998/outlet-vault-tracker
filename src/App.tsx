import { useState, useEffect } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useServiceWorkerUpdate } from '@/lib/useServiceWorkerUpdate';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
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

import { SearchAndOperate } from "./pages/SearchAndOperate";
import { BatchOutflow } from "./pages/BatchOutflow";
import { ActiveLoans } from "./pages/ActiveLoans";
import { History } from "./pages/History";
import { Admin } from "./pages/Admin";

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
                    title="Cofre Tracker"
                    onProfileClick={() => navigate('/profile')}
                    onSettingsClick={() => navigate('/settings')}
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
  const { hasUpdate, apply } = useServiceWorkerUpdate();

  // Prefetch pages for better performance
  useEffect(() => {
    // Pre-load pages that might be accessed
    import('./pages/History');
    import('./pages/Admin');
    import('./pages/ActiveLoans');
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {hasUpdate && (
        <div 
          role="status" 
          aria-live="polite"
          className="fixed bottom-3 left-1/2 -translate-x-1/2 rounded-lg border bg-card p-3 shadow-lg z-50"
        >
          Nova versão disponível. 
          <button 
            className="underline ml-2 hover:no-underline" 
            onClick={apply}
            aria-label="Atualizar aplicação para a nova versão"
          >
            Atualizar
          </button>
        </div>
      )}
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
            <SearchAndOperate onBack={() => navigate('/')} />
          </AppLayout>
        } 
      />
      <Route 
        path="/active-loans" 
        element={
          <AppLayout>
            <ActiveLoans onBack={() => navigate('/')} />
          </AppLayout>
        } 
      />
      <Route 
        path="/history" 
        element={
          <AppLayout>
            <History onBack={() => navigate('/')} />
          </AppLayout>
        } 
      />
      <Route 
        path="/batch-outflow" 
        element={
          <AppLayout>
            <BatchOutflow onBack={() => navigate('/')} />
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
            <Admin onBack={() => navigate('/')} />
          </AppLayout>
        } 
      />
      <Route 
        path="/admin/ui-inventory" 
        element={
          <AppLayout>
            <Admin onBack={() => navigate('/')} />
          </AppLayout>
        } 
      />
      <Route 
        path="/admin/design" 
        element={
          <AppLayout>
            <Admin onBack={() => navigate('/')} />
          </AppLayout>
        } 
      />
      <Route 
        path="/admin/ui-kit" 
        element={
          <AppLayout>
            <Admin onBack={() => navigate('/')} />
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
    </div>
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