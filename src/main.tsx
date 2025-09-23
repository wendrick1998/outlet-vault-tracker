import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";
import { ReactQueryProvider } from '@/lib/react-query';
import { ErrorBoundary } from "./components/ErrorBoundary";
// Service worker will be registered by App.tsx
import { ThemeProvider } from "@/design/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <ReactQueryProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </ReactQueryProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>
);

// Service worker registration moved to App.tsx