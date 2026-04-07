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
      toast("Nova versão disponível!", {
        description: "Deseja atualizar seu aplicativo para a versão mais recente?",
        action: (
          <Button 
            size="sm" 
            variant="default" 
            className="h-8 bg-primary text-primary-foreground font-black uppercase text-[10px]"
            onClick={() => updateServiceWorker(true)}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Atualizar Agora
          </Button>
        ),
        cancel: (
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-8 text-[10px] uppercase font-bold"
            onClick={close}
          >
            Agora Não
          </Button>
        ),
        duration: Infinity,
      });
    }
  }, [needRefresh, updateServiceWorker]);

  return null;
}
