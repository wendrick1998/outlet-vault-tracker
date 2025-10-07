import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";
import { ErrorBoundary } from "./components/ErrorBoundary";
// Service worker will be registered by App.tsx
import { ThemeProvider } from "@/design/ThemeProvider";

// NOTE: AuthProvider and ReactQueryProvider are in App.tsx to avoid duplication
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>
);

// Service worker registration moved to App.tsx