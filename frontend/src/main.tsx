import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import { ApiErrorException } from "./api/http";
import ErrorBoundary from "./components/ErrorBoundary";
import { ToastProvider, showToast } from "./lib/toast";
import "./index.css";

function notifyApiError(error: unknown, title: string): void {
  if (error instanceof ApiErrorException) {
    showToast({ title, description: error.message, tone: "danger" });
  }
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => notifyApiError(error, "Couldn't load data"),
  }),
  mutationCache: new MutationCache({
    onError: (error) => notifyApiError(error, "Action failed"),
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
