/**
 * offlineStorage.ts
 * Gerencia cache local de dados e fila de pedidos offline.
 * Usa localStorage para persistência entre recarregamentos.
 */

const CACHE_PREFIX = 'imperio_cache_';
const OFFLINE_QUEUE_KEY = 'imperio_offline_queue';
const LOCAL_ORDER_COUNTER_KEY = 'imperio_order_counter';

// ---------------------------------------------------------------------------
// Cache genérico de dados de referência (produtos, clientes, addons, settings)
// ---------------------------------------------------------------------------

export function getCachedData<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw).data as T;
  } catch {
    return null;
  }
}

export function setCachedData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(
      CACHE_PREFIX + key,
      JSON.stringify({ data, savedAt: Date.now() })
    );
  } catch {
    // Ignora erros de quota de armazenamento
  }
}

// ---------------------------------------------------------------------------
// Fila de pedidos criados enquanto offline
// ---------------------------------------------------------------------------

export interface OfflineOrder {
  /** ID temporário local (UUID) */
  tempId: string;
  /** Número local provisório (para impressão) */
  tempNumber: number;
  createdAt: string;
  /** Dados completos do pedido (mesma estrutura enviada ao Supabase) */
  orderData: any;
  /** Indica que a impressão já ocorreu — não reimprimir ao sincronizar */
  printed: boolean;
}

export function getOfflineQueue(): OfflineOrder[] {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function addToOfflineQueue(order: OfflineOrder): void {
  const queue = getOfflineQueue();
  queue.push(order);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

export function removeFromOfflineQueue(tempId: string): void {
  const queue = getOfflineQueue().filter((o) => o.tempId !== tempId);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

export function clearOfflineQueue(): void {
  localStorage.removeItem(OFFLINE_QUEUE_KEY);
}

// ---------------------------------------------------------------------------
// Contador local de número de pedido (para uso em modo offline)
// ---------------------------------------------------------------------------

/**
 * Retorna o próximo número de pedido disponível localmente.
 * Incrementa e persiste o contador.
 */
export function getNextLocalOrderNumber(): number {
  const current = parseInt(localStorage.getItem(LOCAL_ORDER_COUNTER_KEY) || '0', 10);
  const next = current + 1;
  localStorage.setItem(LOCAL_ORDER_COUNTER_KEY, String(next));
  return next;
}

/**
 * Atualiza o contador local se o número do servidor for maior.
 * Deve ser chamado após cada busca bem-sucedida de pedidos no Supabase.
 */
export function syncLocalOrderCounter(serverHighestNumber: number): void {
  const local = parseInt(localStorage.getItem(LOCAL_ORDER_COUNTER_KEY) || '0', 10);
  if (serverHighestNumber > local) {
    localStorage.setItem(LOCAL_ORDER_COUNTER_KEY, String(serverHighestNumber));
  }
}
