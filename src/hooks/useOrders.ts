import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Order, OrderItem } from "@/types/order";

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
      
      // Garante explicitamente no frontend que o maior número (mais novo) ficará no index 0 (topo)
      return mappedOrders.sort((a, b) => b.number - a.number);
    },
  });
}

export function useAddOrder() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (orderData: Omit<Order, "id" | "number" | "createdAt">) => {
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
    mutationFn: async ({ id, orderData }: { id: string; orderData: Omit<Order, "id" | "number" | "createdAt"> }) => {
      // 1. Update order metadata
      const { error: orderError } = await supabase
        .from("orders")
        .update({
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
        })
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
