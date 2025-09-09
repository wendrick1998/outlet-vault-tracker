import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Home } from "./pages/Home";
import { SearchAndRegister } from "./pages/SearchAndRegister";
import { ActiveLoans } from "./pages/ActiveLoans";
import { History } from "./pages/History";
import { Admin } from "./pages/Admin";
import { BatchOutflow } from "./pages/BatchOutflow";

type AppPage = 'home' | 'search' | 'active-loans' | 'history' | 'admin' | 'batch-outflow';

const App = () => {
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
        return <ActiveLoans onBack={handleBack} />;
      case 'history':
        return <History onBack={handleBack} />;
      case 'admin':
        return <Admin onBack={handleBack} />;
      case 'batch-outflow':
        return <BatchOutflow onBack={handleBack} />;
      default:
        return <Home onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="app">
      <Toaster />
      <Sonner />
      {renderCurrentPage()}
    </div>
  );
};

export default App;
