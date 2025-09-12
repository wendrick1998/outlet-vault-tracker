import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ReactQueryProvider } from '@/lib/react-query';
import { ErrorBoundary } from "./components/ErrorBoundary";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <ReactQueryProvider>
        <App />
      </ReactQueryProvider>
    </ErrorBoundary>
  </StrictMode>
);
