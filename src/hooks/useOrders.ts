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

  const updateStatus = useCallback((id: string, status: Order["status"]) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  }, []);

  const deleteOrder = useCallback((id: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
  }, []);

  return { orders, addOrder, updateStatus, deleteOrder };
}
