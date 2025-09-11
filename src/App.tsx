import { useState, Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Loading } from "@/components/ui/loading";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Home } from "./pages/Home";
import { SearchAndRegister } from "./pages/SearchAndRegister";

// Lazy load heavy pages for better performance
const LazyActiveLoans = lazy(() => import('./pages/ActiveLoans').then(m => ({ default: m.ActiveLoans })));
const LazyHistory = lazy(() => import('./pages/History').then(m => ({ default: m.History })));
const LazyAdmin = lazy(() => import('./pages/Admin').then(m => ({ default: m.Admin })));
const LazyBatchOutflow = lazy(() => import('./pages/BatchOutflow').then(m => ({ default: m.BatchOutflow })));

type AppPage = 'home' | 'search' | 'active-loans' | 'history' | 'admin' | 'batch-outflow';

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
      default:
        return <Home onNavigate={handleNavigate} />;
    }
  };

  return (
    <ProtectedRoute>
      <div className="app">
        {renderCurrentPage()}
      </div>
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