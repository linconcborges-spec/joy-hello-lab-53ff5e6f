import { useRegisterSW } from "virtual:pwa-register/react";
import { useEffect } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

export function PWALifecycle() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log("SW Registered: ", r);
      if (r) {
        // Verifica atualizações a cada hora
        setInterval(() => {
          console.log("Verificando atualizações do PWA...");
          r.update();
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.log("SW registration error", error);
    },
  });

  // Verificação imediata ao montar o componente
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(registration => {
        if (registration) {
          console.log("Verificação inicial de atualização...");
          registration.update();
        }
      });
    }
  }, []);

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
      toast.custom((id) => (
        <div className="w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
              <RefreshCw className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Atualização disponível</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                Nova versão pronta. Atualize para receber as melhorias.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => toast.dismiss(id)}
              className="flex-1 h-9 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Agora não
            </button>
            <button
              onClick={() => {
                toast.dismiss(id);
                setNeedRefresh(false);
                updateServiceWorker(true);
              }}
              className="flex-1 h-9 rounded-xl bg-orange-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-orange-700 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Atualizar agora
            </button>
          </div>
        </div>
      ), { duration: Infinity, position: "top-center" });
    }
  }, [needRefresh, updateServiceWorker, setNeedRefresh]);

  return null;
}
