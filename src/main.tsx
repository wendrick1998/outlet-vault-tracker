import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ReactQueryProvider } from "./lib/react-query";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { initializeMonitoring } from "./lib/monitoring";
import { Loading } from "./components/ui/loading";

// Initialize performance monitoring
initializeMonitoring();

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
