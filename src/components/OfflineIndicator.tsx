import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { getOfflineQueue } from '@/lib/offlineStorage';
import { WifiOff, Wifi, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';

/**
 * Indicador visual de status de conexão.
 * Aparece discretamente no canto inferior direito quando offline
 * ou quando existe fila de pedidos aguardando sincronização.
 */
export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const [queueCount, setQueueCount] = useState(0);
  const [justReconnected, setJustReconnected] = useState(false);
  const [prevOnline, setPrevOnline] = useState(isOnline);

  // Atualiza contagem da fila periodicamente
  useEffect(() => {
    const update = () => setQueueCount(getOfflineQueue().length);
    update();
    const interval = setInterval(update, 2000);
    return () => clearInterval(interval);
  }, []);

  // Detecta transição offline → online para mostrar feedback
  useEffect(() => {
    if (!prevOnline && isOnline) {
      setJustReconnected(true);
      setTimeout(() => setJustReconnected(false), 4000);
    }
    setPrevOnline(isOnline);
  }, [isOnline, prevOnline]);

  // Não exibe nada quando online e sem fila pendente
  if (isOnline && queueCount === 0 && !justReconnected) return null;

  if (isOnline && justReconnected && queueCount === 0) {
    return (
      <div className="fixed bottom-6 right-6 z-[200] animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-2.5 bg-emerald-500 text-white px-4 py-2.5 rounded-2xl shadow-xl shadow-emerald-500/30 text-xs font-black uppercase tracking-widest">
          <Wifi className="h-4 w-4" />
          <span>Conexão Restaurada</span>
        </div>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="fixed bottom-6 right-6 z-[200] animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col gap-1 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-white/10">
          <div className="flex items-center gap-2.5 text-xs font-black uppercase tracking-widest text-orange-400">
            <WifiOff className="h-4 w-4 shrink-0" />
            <span>Modo Offline</span>
          </div>
          {queueCount > 0 && (
            <div className="flex items-center gap-2 text-[10px] text-white/60 font-bold uppercase">
              <Clock className="h-3 w-3 text-orange-400/60 shrink-0" />
              <span>{queueCount} pedido{queueCount > 1 ? 's' : ''} aguardando envio</span>
            </div>
          )}
          <p className="text-[9px] text-white/40 font-medium mt-0.5">
            Pedidos serão sincronizados ao reconectar
          </p>
        </div>
      </div>
    );
  }

  // Online mas ainda tem fila pendente (sincronizando...)
  if (isOnline && queueCount > 0) {
    return (
      <div className="fixed bottom-6 right-6 z-[200] animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-2.5 bg-blue-600 text-white px-4 py-2.5 rounded-2xl shadow-xl shadow-blue-500/30 text-xs font-black uppercase tracking-widest">
          <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>Sincronizando {queueCount} pedido{queueCount > 1 ? 's' : ''}…</span>
        </div>
      </div>
    );
  }

  return null;
}
