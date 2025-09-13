import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";
import { ReactQueryProvider } from '@/lib/react-query';
import { ErrorBoundary } from "./components/ErrorBoundary";
import { registerServiceWorker } from "./register-sw";
import { ThemeProvider } from "@/design/ThemeProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <ReactQueryProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ReactQueryProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>
);

// Register service worker
registerServiceWorker();