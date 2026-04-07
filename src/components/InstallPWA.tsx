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
    <div className="fixed bottom-6 left-6 z-[100] animate-in fade-in slide-in-from-bottom-10 duration-700 max-w-sm w-[calc(100vw-3rem)]">
      <Card className="bg-white text-slate-900 p-5 shadow-2xl rounded-2xl border border-slate-100 flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-2xl bg-[#f15a24] p-2 flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/20 overflow-hidden">
             <img src="/icon.svg" alt="App Icon" className="w-full h-full object-contain" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-base text-slate-900 leading-none">
              Instalar <span className="text-[#f15a24]">Império</span>
            </h3>
            <p className="text-xs text-slate-500 leading-tight">
              Instale o app para acesso rápido e a melhor experiência de pedidos.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!isIOS && deferredPrompt ? (
            <Button 
              onClick={handleInstallClick}
              className="flex-1 bg-[#f15a24] hover:bg-[#d94e1f] text-white font-bold rounded-xl h-11 gap-2"
            >
              <Download className="h-4 w-4" /> Instalar
            </Button>
          ) : isIOS ? (
            <div className="flex-1 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 italic text-[10px] text-slate-600 text-center">
              Toque em compartilhar <span className="font-bold">↑</span> e depois em <span className="font-bold">'Adicionar à Tela de Início'</span>
            </div>
          ) : null}
          
          <Button 
            variant="ghost" 
            className="flex-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 font-bold rounded-xl h-11"
            onClick={() => setShowPrompt(false)}
          >
            Agora não
          </Button>
        </div>
      </Card>
    </div>
  );
}
