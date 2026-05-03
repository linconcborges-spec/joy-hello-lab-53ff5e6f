import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Order } from "@/types/order";
import type { AppSettings } from "@/hooks/useSettings";
import { printOrder } from "@/lib/PrintService";
import {
  getCachedData,
  setCachedData,
  addToOfflineQueue,
  getNextLocalOrderNumber,
  syncLocalOrderCounter,
} from "@/lib/offlineStorage";

/**
 * Retorna a data de início do ciclo atual (04:50 da madrugada)
 */
function getCycleStart() {
  const now = new Date();
  const cycleStart = new Date(now);
  cycleStart.setHours(4, 50, 0, 0);
  
  // Se ainda não deu 04:50 hoje, o ciclo começou ontem às 04:50
  if (now < cycleStart) {
    cycleStart.setDate(cycleStart.getDate() - 1);
  }
  return cycleStart.toISOString();
}

export function useOrders(startDate?: string, endDate?: string) {
  const start = startDate || getCycleStart();
  
  return useQuery({
    queryKey: ["orders", start, endDate],
    queryFn: async () => {
      try {
        let query = supabase
          .from("orders")
          .select(`
            *,
            items:order_items(
              *,
              addons:order_addons(*)
            )
          `)
          .gte("created_at", start);

        if (endDate) {
          query = query.lte("created_at", endDate);
        }

        const { data, error } = await query.order("created_at", { ascending: false });

        if (error) throw error;
        
        // Mapear snake_case do banco para camelCase do TS
        const mappedOrders = (data as any[]).map(order => ({
          id: order.id,
          number: order.number,
          customerName: order.customer_name,
          address: order.address,
          phone: order.phone,
          deliveryFee: Number(order.delivery_fee),
          totalAmount: Number(order.total_amount),
          changeFor: Number(order.change_for),
          status: order.status,
          paymentMethod: order.payment_method,
          isPrinted: order.is_printed,
          createdAt: order.created_at,
          cancelledBy: order.cancelled_by,
          cancelledAt: order.cancelled_at,
          lastEditedBy: order.last_edited_by,
          lastEditedAt: order.last_edited_at,
          observation: order.observation,
          originalSnapshot: order.original_snapshot,
          items: (order.items || []).map((item: any) => ({
            id: item.id,
            productCode: item.product_code ?? "",
            categoryId: item.category_id ?? null,
            product: item.product_name,
            quantity: item.quantity,
            unitPrice: Number(item.unit_price),
            total: Number(item.total),
            observation: item.observation,
            addons: (item.addons || []).map((addon: any) => ({
              name: addon.name,
              price: Number(addon.price)
            }))
          }))
        })) as Order[];
        
        // Garante explicitamente no frontend que o maior número ficará no index 0 (topo)
        const sorted = mappedOrders.sort((a, b) => b.number - a.number);

        // Sincroniza o contador local com o maior número do servidor
        if (sorted.length > 0) {
          syncLocalOrderCounter(sorted[0].number);
        }

        // Salva no cache para uso offline
        if (!startDate && !endDate) {
          setCachedData('orders_today', sorted);
        }

        return sorted;
      } catch (err) {
        // Offline: retorna cache local dos pedidos de hoje
        if (!startDate && !endDate) {
          const cached = getCachedData<Order[]>('orders_today');
          if (cached) return cached;
        }
        throw err;
      }
    },
  });
}

export function useAddOrder() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (orderData: Omit<Order, "id" | "number" | "createdAt">) => {
      // -----------------------------------------------------------------------
      // MODO OFFLINE: salva na fila local e retorna um objeto fictício
      // -----------------------------------------------------------------------
      if (!navigator.onLine) {
        const tempNumber = getNextLocalOrderNumber();
        const tempId = crypto.randomUUID();
        const now = new Date().toISOString();

        addToOfflineQueue({
          tempId,
          tempNumber,
          createdAt: now,
          orderData,
          printed: true,
        });

        // Adiciona otimisticamente ao cache local de pedidos de hoje
        const cachedOrders = getCachedData<Order[]>('orders_today') || [];
        const fakeOrder: Order = {
          ...(orderData as any),
          id: tempId,
          number: tempNumber,
          createdAt: now,
          isPrinted: true,
        };
        setCachedData('orders_today', [fakeOrder, ...cachedOrders]);

        // Atualiza o React Query cache local para o Kanban refletir o pedido
        qc.setQueryData(
          ["orders", getCycleStart(), undefined],
          (old: Order[] | undefined) => [fakeOrder, ...(old || [])]
        );

        toast.success("Pedido salvo localmente. Será enviado ao servidor quando a conexão voltar.", {
          duration: 6000,
        });

        return { id: tempId, number: tempNumber };
      }

      // -----------------------------------------------------------------------
      // MODO ONLINE: fluxo normal
      // -----------------------------------------------------------------------
      const cycleStart = getCycleStart();
      
      // 1. Buscar o próximo número do pedido para o ciclo atual
      const { data: lastOrders } = await supabase
        .from("orders")
        .select("number")
        .gte("created_at", cycleStart)
        .order("number", { ascending: false })
        .limit(1);

      const nextNumber = (lastOrders && lastOrders.length > 0) ? lastOrders[0].number + 1 : 1;

      // 2. Inserir o cabeçalho do pedido
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          number: nextNumber,
          customer_name: orderData.customerName,
          address: orderData.address,
          phone: orderData.phone,
          cnpj: orderData.cnpj || null,
          delivery_fee: orderData.deliveryFee,
          total_amount: orderData.totalAmount,
          change_for: orderData.changeFor,
          status: orderData.status,
          payment_method: orderData.paymentMethod,
          is_printed: orderData.isPrinted ?? false,
          observation: orderData.observation || null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 3. Inserir itens e seus adicionais
      for (const item of orderData.items) {
        const { data: insertedItem, error: itemError } = await supabase
          .from("order_items")
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
          const addonsToInsert = item.addons.map(addon => ({
            order_item_id: insertedItem.id,
            name: addon.name,
            price: addon.price,
          }));

          const { error: addonsError } = await supabase
            .from("order_addons")
            .insert(addonsToInsert);
          
          if (addonsError) throw addonsError;
        }
      }

      // Atualiza contador local
      syncLocalOrderCounter(nextNumber);
      return order;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erro ao criar pedido");
    }
  });
}

export function useUpdateOrder() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, orderData, originalSnapshot }: { id: string; orderData: Omit<Order, "id" | "number" | "createdAt">; originalSnapshot?: any }) => {
      // 1. Update order metadata
      const updateData: any = {
        customer_name: orderData.customerName,
        address: orderData.address,
        phone: orderData.phone,
        cnpj: orderData.cnpj || null,
        delivery_fee: orderData.deliveryFee,
        total_amount: orderData.totalAmount,
        change_for: orderData.changeFor,
        status: orderData.status,
        payment_method: orderData.paymentMethod,
        is_printed: orderData.isPrinted ?? false,
        observation: orderData.observation || null,
        last_edited_by: orderData.lastEditedBy || null,
        last_edited_at: new Date().toISOString(),
      };

      if (originalSnapshot) {
        updateData.original_snapshot = originalSnapshot;
      }

      const { error: orderError } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", id);

      if (orderError) throw orderError;

      // 2. Delete existing items (cascading will handle addons if setup, but let's be sure)
      const { error: deleteError } = await supabase
        .from("order_items")
        .delete()
        .eq("order_id", id);

      if (deleteError) throw deleteError;

      // 3. Insert updated items and their addons
      for (const item of orderData.items) {
        const { data: insertedItem, error: itemError } = await supabase
          .from("order_items")
          .insert({
            order_id: id,
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
          const addonsToInsert = item.addons.map(addon => ({
            order_item_id: insertedItem.id,
            name: addon.name,
            price: addon.price,
          }));

          const { error: addonsError } = await supabase
            .from("order_addons")
            .insert(addonsToInsert);
          
          if (addonsError) throw addonsError;
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Pedido atualizado!");
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erro ao atualizar pedido");
    }
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, employeeName }: { id: string; status: Order["status"]; employeeName?: string }) => {
      const updateData: any = { status };
      if (employeeName) {
        updateData.last_edited_by = employeeName;
        updateData.last_edited_at = new Date().toISOString();
      }
      
      const { error } = await supabase.from("orders").update(updateData).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, employeeName }: { id: string; employeeName: string }) => {
      const { error } = await supabase
        .from("orders")
        .update({
          status: "cancelled",
          cancelled_by: employeeName,
          cancelled_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Pedido cancelado");
    },
  });
}

export function useMarkAsPrinted() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("orders").update({ is_printed: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useDeleteOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Deletar itens e adicionais primeiro (caso não haja ON DELETE CASCADE)
      const { data: items } = await supabase
        .from("order_items")
        .select("id")
        .eq("order_id", id);

      if (items && items.length > 0) {
        const itemIds = items.map((i) => i.id);
        await supabase.from("order_addons").delete().in("order_item_id", itemIds);
        await supabase.from("order_items").delete().eq("order_id", id);
      }

      const { error } = await supabase.from("orders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Pedido excluído!");
    },
    onError: () => toast.error("Erro ao excluir pedido"),
  });
}

// ---------------------------------------------------------------------------
// Hook de Impressão Automática via Supabase Realtime
// Escuta novos pedidos (INSERT) e dispara a impressão diretamente no desktop.
// Quando um pedido é impresso, avança o status para "Em Produção" e marca
// como impresso no banco.
// ---------------------------------------------------------------------------
export function useAutoprint(settings: AppSettings) {
  const qc = useQueryClient();
  const markAsPrinted = useMarkAsPrinted();
  const updateStatus = useUpdateOrderStatus();
  // Ref para evitar reimprimir o mesmo pedido se o hook re-subscribir
  const printedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!settings.autoPrint) return;

    const channelId = `orders-autoprint-${Math.random().toString(36).substring(7)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes' as any,
        { event: 'INSERT', schema: 'public', table: 'orders' },
        async (payload: any) => {
          const newOrder = payload.new;
          if (!newOrder?.id) return;

          // Evita imprimir o mesmo pedido duas vezes (ex: reconexão do canal)
          if (printedIds.current.has(newOrder.id)) return;
          printedIds.current.add(newOrder.id);

          // Busca o pedido completo com itens e adicionais
          const { data } = await supabase
            .from('orders')
            .select(`
              *,
              items:order_items(
                *,
                addons:order_addons(*)
              )
            `)
            .eq('id', newOrder.id)
            .single();

          if (!data) return;

          // Mapeia para o tipo Order (snake_case → camelCase)
          const order: Order = {
            id: data.id,
            number: data.number,
            customerName: data.customer_name,
            address: data.address,
            phone: data.phone,
            cnpj: data.cnpj || '',
            deliveryFee: Number(data.delivery_fee),
            totalAmount: Number(data.total_amount),
            changeFor: Number(data.change_for),
             status: data.status as any,
             paymentMethod: data.payment_method as any,
            isPrinted: data.is_printed,
            createdAt: data.created_at,
            cancelledBy: data.cancelled_by,
            cancelledAt: data.cancelled_at,
            lastEditedBy: data.last_edited_by,
            lastEditedAt: data.last_edited_at,
            observation: data.observation,
            originalSnapshot: data.original_snapshot,
             isPickup: (data as any).is_pickup,
            items: (data.items || []).map((item: any) => ({
              id: item.id,
              productCode: item.product_code ?? '',
              categoryId: item.category_id ?? null,
              product: item.product_name,
              quantity: item.quantity,
              unitPrice: Number(item.unit_price),
              total: Number(item.total),
              observation: item.observation,
              addons: (item.addons || []).map((addon: any) => ({
                name: addon.name,
                price: Number(addon.price),
              })),
            })),
          };

          // Imprime o pedido
          await printOrder(order, settings);
          toast.success(`🖨️ Pedido #${order.number} recebido e enviado para impressão!`, {
            duration: 8000,
          });

          // Marca como impresso e avança status
          markAsPrinted.mutate(order.id);
          if (order.status === 'pending') {
            updateStatus.mutate({ id: order.id, status: 'preparing' });
          }

          // Atualiza a lista de pedidos na tela
          qc.invalidateQueries({ queryKey: ['orders'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.autoPrint, settings.targetPrinter, settings.printPaperWidth, settings.printFontSize]);
}
