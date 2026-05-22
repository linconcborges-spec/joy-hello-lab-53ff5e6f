import { useEffect } from "react";
import { Download, Share } from "lucide-react";
import { toast } from "sonner";

export function InstallPWA() {
  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

    const showToast = (prompt?: any) => {
      toast.custom((id) => (
        <div className="w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-orange-100 flex items-center justify-center shrink-0 overflow-hidden">
              <img src="/icon.svg" alt="" className="w-6 h-6 object-contain" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">
                Instalar <span className="text-[#f15a24]">Império</span>
              </p>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                {isIOS
                  ? "Adicione à tela de início para a melhor experiência."
                  : "Acesso rápido e melhor experiência de pedidos."}
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

            {isIOS ? (
              <button
                onClick={() => toast.dismiss(id)}
                className="flex-1 h-9 rounded-xl bg-orange-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-orange-700 transition-colors"
              >
                <Share className="h-3.5 w-3.5" /> Compartilhar
              </button>
            ) : prompt ? (
              <button
                onClick={async () => {
                  toast.dismiss(id);
                  prompt.prompt();
                  await prompt.userChoice;
                }}
                className="flex-1 h-9 rounded-xl bg-orange-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-orange-700 transition-colors"
              >
                <Download className="h-3.5 w-3.5" /> Instalar
              </button>
            ) : null}
          </div>
        </div>
      ), { duration: Infinity, position: "bottom-left" });
    };

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      showToast(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    if (isIOS) showToast();

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  return null;
}
