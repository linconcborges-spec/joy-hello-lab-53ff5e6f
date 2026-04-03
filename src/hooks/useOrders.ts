import { useState, useEffect, useCallback } from "react";
import type { Order } from "@/types/order";

const STORAGE_KEY = "imperio-orders";

function loadOrders(): Order[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveOrders(orders: Order[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>(loadOrders);

  useEffect(() => {
    saveOrders(orders);
  }, [orders]);

  const addOrder = useCallback((order: Omit<Order, "id" | "number" | "createdAt">) => {
    setOrders((prev) => {
      const nextNumber = prev.length > 0 ? Math.max(...prev.map((o) => o.number)) + 1 : 1;
      const newOrder: Order = {
        ...order,
        id: crypto.randomUUID(),
        number: nextNumber,
        createdAt: new Date().toISOString(),
      };
      return [newOrder, ...prev];
    });
  }, []);

  const updateStatus = useCallback((id: string, status: Order["status"], employeeName?: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        const updated = { ...o, status };
        if (employeeName) {
          updated.lastEditedBy = employeeName;
          updated.lastEditedAt = new Date().toISOString();
        }
        return updated;
      })
    );
  }, []);

  const cancelOrder = useCallback((id: string, employeeName: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        return {
          ...o,
          status: "cancelled" as const,
          cancelledBy: employeeName,
          cancelledAt: new Date().toISOString(),
        };
      })
    );
  }, []);

  const deleteOrder = useCallback((id: string) => {
    setOrders((prev) => {
      const order = prev.find((o) => o.id === id);
      // Só permite excluir pedidos pendentes
      if (order && order.status !== "pending") return prev;
      return prev.filter((o) => o.id !== id);
    });
  }, []);

  const markAsPrinted = useCallback((id: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, isPrinted: true } : o))
    );
  }, []);

  return { orders, addOrder, updateStatus, cancelOrder, deleteOrder, markAsPrinted };
}
