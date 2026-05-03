import { useRegisterSW } from "virtual:pwa-register/react";
import { useEffect } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { Button } from "./ui/button";

export function PWALifecycle() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log("SW Registered: ", r);
    },
    onRegisterError(error) {
      console.log("SW registration error", error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  useEffect(() => {
    if (offlineReady) {
      toast.success("O aplicativo está pronto para ser usado offline!", {
        duration: 5000,
      });
    }
  }, [offlineReady]);

  useEffect(() => {
    if (needRefresh) {
      console.log("Nova versão detectada, exibindo toast...");
      toast("🚀 Atualização Disponível!", {
        description: "Uma nova versão do sistema está pronta. Atualize agora para receber as melhorias.",
        duration: Infinity,
        position: "top-center",
        action: (
          <Button 
            size="sm" 
            variant="default" 
            className="h-9 bg-orange-600 hover:bg-orange-700 text-white font-black uppercase text-[10px] px-4 shadow-lg shadow-orange-500/20"
            onClick={() => {
              console.log("Atualizando Service Worker...");
              updateServiceWorker(true);
            }}
          >
            <RefreshCw className="h-3 w-3 mr-2 animate-spin-slow" />
            Atualizar Agora
          </Button>
        ),
        cancel: (
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-9 text-[10px] uppercase font-bold text-muted-foreground"
            onClick={close}
          >
            Agora Não
          </Button>
        ),
      });
    }
  }, [needRefresh, updateServiceWorker]);

  return null;
}
