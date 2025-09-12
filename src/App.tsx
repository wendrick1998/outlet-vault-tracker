import { useState, Suspense, lazy } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Loading } from "@/components/ui/loading";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Header } from "@/components/Header";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Home } from "./pages/Home";
import { SearchAndRegister } from "./pages/SearchAndRegister";
import { Profile } from "./pages/Profile";
import { Settings } from "./pages/Settings";
import { InventoryConferencePage } from "./pages/InventoryConferencePage";
import { ConferenceReport } from "./pages/ConferenceReport";

// Lazy load heavy pages for better performance
const LazyActiveLoans = lazy(() => import('./pages/ActiveLoans').then(m => ({ default: m.ActiveLoans })));
const LazyHistory = lazy(() => import('./pages/History').then(m => ({ default: m.History })));
const LazyAdmin = lazy(() => import('./pages/Admin').then(m => ({ default: m.Admin })));
const LazySearchAndOperate = lazy(() => import('./pages/SearchAndOperate').then(m => ({ default: m.SearchAndOperate })));

type AppPage = 'home' | 'search-and-operate' | 'active-loans' | 'history' | 'admin' | 'profile' | 'settings' | 'analytics' | 'ai-assistant' | 'voice-commands' | 'smart-notifications' | 'predictions' | 'conference' | 'conference-report';

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Determine current page from URL
  const getCurrentPage = (): AppPage => {
    const path = location.pathname;
    if (path.startsWith('/conference/report')) return 'conference-report';
    if (path.startsWith('/conference')) return 'conference';
    if (path.startsWith('/search-and-operate')) return 'search-and-operate';
    if (path.startsWith('/active-loans')) return 'active-loans';
    if (path.startsWith('/history')) return 'history';
    if (path.startsWith('/admin')) return 'admin';
    if (path.startsWith('/profile')) return 'profile';
    if (path.startsWith('/settings')) return 'settings';
    return 'home';
  };

  const currentPage = getCurrentPage();

  const handleNavigate = (page: string) => {
    switch (page) {
      case 'home':
        navigate('/');
        break;
      case 'search-and-operate':
        navigate('/search-and-operate');
        break;
      case 'active-loans':
        navigate('/active-loans');
        break;
      case 'history':
        navigate('/history');
        break;
      case 'admin':
        navigate('/admin');
        break;
      case 'profile':
        navigate('/profile');
        break;
      case 'settings':
        navigate('/settings');
        break;
      case 'conference':
        navigate('/conference');
        break;
      default:
        navigate('/');
    }
  };

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar onNavigate={handleNavigate} currentPage={currentPage} />
          
          <SidebarInset className="flex-1">
            <header className="bg-primary text-primary-foreground shadow-medium border-b">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <SidebarTrigger />
                  <div>
                    <h1 className="text-lg font-semibold">Cofre Tracker</h1>
                    <p className="text-sm opacity-90 text-primary-foreground/80">Sistema de Inventário</p>
                  </div>
                </div>
                
                <Header 
                  onNavigate={handleNavigate}
                  onProfileClick={() => navigate('/profile')}
                  onSettingsClick={() => navigate('/settings')}
                />
              </div>
            </header>
            
            <main className="flex-1">
              {children}
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
};

const AppContent = () => {
  return (
    <Routes>
      <Route path="/" element={
        <AppLayout>
          <Home onNavigate={(page) => window.location.href = `/${page === 'home' ? '' : page}`} />
        </AppLayout>
      } />
      
      <Route path="/search-and-operate" element={
        <AppLayout>
          <Suspense fallback={<Loading />}>
            <LazySearchAndOperate onBack={() => window.history.back()} />
          </Suspense>
        </AppLayout>
      } />
      
      <Route path="/active-loans" element={
        <AppLayout>
          <Suspense fallback={<Loading />}>
            <LazyActiveLoans onBack={() => window.history.back()} />
          </Suspense>
        </AppLayout>
      } />
      
      <Route path="/history" element={
        <AppLayout>
          <Suspense fallback={<Loading />}>
            <LazyHistory onBack={() => window.history.back()} />
          </Suspense>
        </AppLayout>
      } />
      
      <Route path="/admin" element={
        <AppLayout>
          <Suspense fallback={<Loading />}>
            <LazyAdmin onBack={() => window.history.back()} />
          </Suspense>
        </AppLayout>
      } />
      
      <Route path="/profile" element={
        <AppLayout>
          <Profile onBack={() => window.history.back()} />
        </AppLayout>
      } />
      
      <Route path="/settings" element={
        <AppLayout>
          <Settings onBack={() => window.history.back()} />
        </AppLayout>
      } />
      
      <Route path="/conference" element={
        <AppLayout>
          <InventoryConferencePage />
        </AppLayout>
      } />
      
      <Route path="/conference/:auditId" element={
        <AppLayout>
          <InventoryConferencePage />
        </AppLayout>
      } />
      
      <Route path="/conference/report/:auditId" element={
        <AppLayout>
          <ConferenceReport />
        </AppLayout>
      } />
      
      {/* Placeholder routes for features not yet implemented */}
      <Route path="/analytics" element={
        <AppLayout>
          <div className="container mx-auto px-4 py-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Recurso em Desenvolvimento</h2>
              <p className="text-muted-foreground">Esta funcionalidade será disponibilizada em breve.</p>
            </div>
          </div>
        </AppLayout>
      } />
      
      <Route path="/ai-assistant" element={
        <AppLayout>
          <div className="container mx-auto px-4 py-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Recurso em Desenvolvimento</h2>
              <p className="text-muted-foreground">Esta funcionalidade será disponibilizada em breve.</p>
            </div>
          </div>
        </AppLayout>
      } />
      
      <Route path="/voice-commands" element={
        <AppLayout>
          <div className="container mx-auto px-4 py-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Recurso em Desenvolvimento</h2>
              <p className="text-muted-foreground">Esta funcionalidade será disponibilizada em breve.</p>
            </div>
          </div>
        </AppLayout>
      } />
      
      <Route path="/smart-notifications" element={
        <AppLayout>
          <div className="container mx-auto px-4 py-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Recurso em Desenvolvimento</h2>
              <p className="text-muted-foreground">Esta funcionalidade será disponibilizada em breve.</p>
            </div>
          </div>
        </AppLayout>
      } />
      
      <Route path="/predictions" element={
        <AppLayout>
          <div className="container mx-auto px-4 py-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Recurso em Desenvolvimento</h2>
              <p className="text-muted-foreground">Esta funcionalidade será disponibilizada em breve.</p>
            </div>
          </div>
        </AppLayout>
      } />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Toaster />
      <Sonner />
      <AppContent />
    </AuthProvider>
  );
};

export default App;