import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";
import { ReactQueryProvider } from '@/lib/react-query';
import { ErrorBoundary } from "./components/ErrorBoundary";
import { registerServiceWorker } from "./register-sw";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <ReactQueryProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ReactQueryProvider>
    </ErrorBoundary>
  </StrictMode>
);

// Register service worker
registerServiceWorker();
