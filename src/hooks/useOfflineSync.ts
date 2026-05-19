import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getOfflineQueue, removeFromOfflineQueue } from '@/lib/offlineStorage';
import { useOnlineStatus } from './useOnlineStatus';
import { toast } from 'sonner';
import { getCycleStart } from '@/lib/cycleUtils';

/**
 * Hook que monitora a reconexão com a internet e sincroniza
 * automaticamente os pedidos criados enquanto offline.
 *
 * Deve ser montado uma única vez no topo da aplicação (App.tsx ou Index.tsx).
 */
export function useOfflineSync() {
  const isOnline = useOnlineStatus();
  const qc = useQueryClient();
  // Referência para evitar múltiplas execuções simultâneas
  const syncingRef = useRef(false);

  useEffect(() => {
    if (!isOnline || syncingRef.current) return;

    const queue = getOfflineQueue();
    if (queue.length === 0) return;

    syncingRef.current = true;

    const sync = async () => {
      let synced = 0;
      let failed = 0;

      try {
        for (const offlineOrder of queue) {
          try {
            // 1. Descobrir o próximo número real no Supabase
            const cycleStart = getCycleStart();
            const { data: lastOrders } = await supabase
              .from('orders')
              .select('number')
              .gte('created_at', cycleStart)
              .order('number', { ascending: false })
              .limit(1);

            const nextNumber =
              lastOrders && lastOrders.length > 0 ? lastOrders[0].number + 1 : 1;

            const od = offlineOrder.orderData;

            // 2. Inserir pedido no Supabase
            const { data: order, error: orderError } = await supabase
              .from('orders')
              .insert({
                number: nextNumber,
                customer_name: od.customerName,
                address: od.address,
                phone: od.phone,
                cnpj: od.cnpj || null,
                delivery_fee: od.deliveryFee,
                total_amount: od.totalAmount,
                change_for: od.changeFor,
                status: od.status,
                payment_method: od.paymentMethod,
                is_printed: od.isPrinted ?? true,
                observation: od.observation || null,
                created_at: offlineOrder.createdAt,
              })
              .select()
              .single();

            if (orderError) throw orderError;

            // 3. Inserir itens e adicionais
            for (const item of od.items) {
              const { data: insertedItem, error: itemError } = await supabase
                .from('order_items')
                .insert({
                  order_id: order.id,
                  product_code: item.productCode || null,
                  category_id: item.categoryId || null,
                  product_name: item.product,
                  quantity: item.quantity,
                  unit_price: item.unitPrice,
                  total: item.total,
                  observation: item.observation || null,
                })
                .select()
                .single();

              if (itemError) throw itemError;

              if (item.addons && item.addons.length > 0) {
                const { error: addonError } = await supabase.from('order_addons').insert(
                  item.addons.map((addon: any) => ({
                    order_item_id: insertedItem.id,
                    name: addon.name,
                    price: addon.price,
                  }))
                );
                if (addonError) throw addonError;
              }
            }

            // 4. Remove da fila local após sucesso
            removeFromOfflineQueue(offlineOrder.tempId);
            synced++;
          } catch (err) {
            console.error('[OfflineSync] Falha ao sincronizar pedido:', err);
            failed++;
          }
        }

        // Invalida cache para atualizar o Kanban com os pedidos sincronizados
        qc.invalidateQueries({ queryKey: ['orders'] });

        if (synced > 0) {
          toast.success(
            `✅ ${synced} pedido${synced > 1 ? 's' : ''} offline sincronizado${synced > 1 ? 's' : ''}!`,
            { duration: 5000 }
          );
        }
        if (failed > 0) {
          toast.error(
            `⚠️ ${failed} pedido${failed > 1 ? 's' : ''} não pud${failed > 1 ? 'eram' : 'e'} ser sincronizado${failed > 1 ? 's' : ''}. Verifique a conexão.`,
            { duration: 8000 }
          );
        }
      } finally {
        syncingRef.current = false;
      }
    };

    sync();
  }, [isOnline, qc]);
}

