import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index.tsx";
import CustomerMenu from "./pages/CustomerMenu.tsx";
import NotFound from "./pages/NotFound.tsx";
import { InstallPWA } from "@/components/InstallPWA";
import { PWALifecycle } from "@/components/PWALifecycle";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { VersionWatermark } from "@/components/VersionWatermark";

const queryClient = new QueryClient();

function AppContent() {
  return (
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <InstallPWA />
        <PWALifecycle />
        <OfflineIndicator />
        <VersionWatermark />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/cardapio" element={<CustomerMenu />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppContent />
  </QueryClientProvider>
);

export default App;
