import { StrictMode, Suspense, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ReactQueryProvider } from '@/lib/react-query';
import { setupPrefetching } from '@/lib/prefetch';
import { analytics } from '@/lib/analytics';
import { ErrorBoundary } from "./components/ErrorBoundary";
import { initializeMonitoring } from "./lib/monitoring";
import { Loading } from "./components/ui/loading";
import { bundleAnalyzer } from '@/lib/bundle-analyzer';
import { UpdateNotification } from '@/components/ui/update-notification';
import { OfflineIndicator } from '@/components/ui/offline-indicator';
import { register } from '@/lib/serviceWorker';
import { config } from '@/lib/environment';

// Initialize performance monitoring
initializeMonitoring();

// Setup prefetching and analytics
setupPrefetching();

// Initialize bundle analyzer in development
bundleAnalyzer.init();

const AppWithUpdates = () => {
  const [updateRegistration, setUpdateRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (config.serviceWorker.enabled) {
      register({
        onUpdate: (registration) => {
          setUpdateRegistration(registration);
        },
        onSuccess: (registration) => {
          analytics.track('sw_install_success', {
            scope: registration.scope
          });
        }
      });
    }
  }, []);

  return (
    <>
      <App />
      <OfflineIndicator />
      {updateRegistration && (
        <UpdateNotification
          registration={updateRegistration}
          onDismiss={() => setUpdateRegistration(null)}
        />
      )}
    </>
  );
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <ReactQueryProvider>
        <Suspense fallback={<Loading />}>
          <AppWithUpdates />
        </Suspense>
      </ReactQueryProvider>
    </ErrorBoundary>
  </StrictMode>
);
