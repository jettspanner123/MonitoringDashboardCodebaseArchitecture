import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import ApplicationRouter from "./Router/ApplicationRouter";
import "./index.css";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ApplicationRouter />
      {/* unstyled: toast content supplies its own visuals (see CopyConfirmationToastSharedComponent) instead of sonner's default look */}
      <Toaster position="bottom-right" toastOptions={{ unstyled: true }} />
    </QueryClientProvider>
  </StrictMode>,
);
