import { useState, useEffect } from "react";
import { Download, X, Smartphone } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if it's already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // iOS detection
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Show the customized installation prompt
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // For iOS, we can show instructions if not already standalone
    if (isIOSDevice && !window.matchMedia('(display-mode: standalone)').matches) {
        setShowPrompt(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    // We've used the prompt, and can't use it again, so discard it
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] animate-in fade-in slide-in-from-bottom-5 duration-500">
      <Card className="bg-primary text-primary-foreground p-4 shadow-2xl rounded-2xl border-none flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="flex gap-3">
            <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
               <Smartphone className="h-6 w-6" />
            </div>
            <div className="space-y-0.5">
              <p className="font-black text-sm uppercase tracking-tight">Instale o Aplicativo</p>
              <p className="text-[10px] opacity-90 leading-tight">
                {isIOS 
                  ? "Toque em compartilhar e depois em 'Adicionar à Tela de Início' para instalar." 
                  : "Adicione o Império Chiclets à sua tela inicial para acesso rápido e offline."}
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-white hover:bg-white/10" 
            onClick={() => setShowPrompt(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {!isIOS && deferredPrompt && (
          <Button 
            onClick={handleInstallClick}
            className="w-full bg-white text-primary hover:bg-white/90 font-black uppercase text-xs h-11"
          >
            <Download className="h-4 w-4 mr-2" /> Instalar Agora
          </Button>
        )}
      </Card>
    </div>
  );
}
