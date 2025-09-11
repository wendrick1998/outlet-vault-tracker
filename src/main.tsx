import { StrictMode, Suspense } from "react";
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

// Initialize performance monitoring
initializeMonitoring();

// Setup prefetching and analytics
setupPrefetching();

// Initialize bundle analyzer in development
bundleAnalyzer.init();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <ReactQueryProvider>
        <Suspense fallback={<Loading />}>
          <App />
        </Suspense>
      </ReactQueryProvider>
    </ErrorBoundary>
  </StrictMode>
);
