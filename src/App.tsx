import { useState, Suspense, lazy } from "react";
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

// Lazy load heavy pages for better performance
const LazyActiveLoans = lazy(() => import('./pages/ActiveLoans').then(m => ({ default: m.ActiveLoans })));
const LazyHistory = lazy(() => import('./pages/History').then(m => ({ default: m.History })));
const LazyAdmin = lazy(() => import('./pages/Admin').then(m => ({ default: m.Admin })));
const LazyBatchOutflow = lazy(() => import('./pages/BatchOutflow').then(m => ({ default: m.BatchOutflow })));

type AppPage = 'home' | 'search' | 'active-loans' | 'history' | 'admin' | 'batch-outflow' | 'profile' | 'settings' | 'analytics' | 'ai-assistant' | 'voice-commands' | 'smart-notifications' | 'predictions';

const AppContent = () => {
  const [currentPage, setCurrentPage] = useState<AppPage>('home');

  const handleNavigate = (page: string) => {
    setCurrentPage(page as AppPage);
  };

  const handleBack = () => {
    setCurrentPage('home');
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onNavigate={handleNavigate} />;
      case 'search':
        return <SearchAndRegister onBack={handleBack} />;
      case 'active-loans':
        return (
          <Suspense fallback={<Loading />}>
            <LazyActiveLoans onBack={handleBack} />
          </Suspense>
        );
      case 'history':
        return (
          <Suspense fallback={<Loading />}>
            <LazyHistory onBack={handleBack} />
          </Suspense>
        );
      case 'admin':
        return (
          <Suspense fallback={<Loading />}>
            <LazyAdmin onBack={handleBack} />
          </Suspense>
        );
      case 'batch-outflow':
        return (
          <Suspense fallback={<Loading />}>
            <LazyBatchOutflow onBack={handleBack} />
          </Suspense>
        );
      case 'profile':
        return <Profile onBack={handleBack} />;
      case 'settings':
        return <Settings onBack={handleBack} />;
      // Placeholder pages for features not yet implemented
      case 'analytics':
      case 'ai-assistant':
      case 'voice-commands':
      case 'smart-notifications':
      case 'predictions':
        return (
          <div className="container mx-auto px-4 py-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Recurso em Desenvolvimento</h2>
              <p className="text-muted-foreground">Esta funcionalidade será disponibilizada em breve.</p>
            </div>
          </div>
        );
      default:
        return <Home onNavigate={handleNavigate} />;
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
                  onProfileClick={() => setCurrentPage('profile')}
                  onSettingsClick={() => setCurrentPage('settings')}
                />
              </div>
            </header>
            
            <main className="flex-1">
              {renderCurrentPage()}
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
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