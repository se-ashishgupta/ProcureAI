import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ThemeProvider } from "@/providers/theme-provider";
import { ReduxProvider } from "@/providers/redux-provider";
import { AbilityProvider } from "@/providers/ability-provider";
import { Toaster } from "@/components/ui/sonner";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ReduxProvider>
      <AbilityProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="vite-ui-theme" disableTransitionOnChange>
          <App />
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </AbilityProvider>
    </ReduxProvider>
  </StrictMode>,
);
