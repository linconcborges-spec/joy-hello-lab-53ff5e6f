import { useState } from "react";
import { Package, Printer } from "lucide-react";
import { OrderCard } from "@/components/OrderCard";
import { AuthModal } from "@/components/AuthModal";
import {
  ContextMenu, ContextMenuContent, ContextMenuItem,
  ContextMenuLabel, ContextMenuSeparator, ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useUpdateOrderStatus, useCancelOrder, useMarkAsPrinted } from "@/hooks/useOrders";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";
import { printOrder } from "@/lib/PrintService";
import type { Order } from "@/types/order";

interface KanbanColumnProps {
  title: string;
  status: Order["status"];
  orders: Order[];
  colorClass: string;
  compact?: boolean;
  onOrderClick: (id: string) => void;
}

export function KanbanColumn({ title, status, orders, colorClass, compact = false, onOrderClick }: KanbanColumnProps) {
  const columnOrders = orders.filter(o => o.status === status);
  const updateStatusMutation = useUpdateOrderStatus();
  const cancelOrderMutation = useCancelOrder();
  const markAsPrintedMutation = useMarkAsPrinted();
  const { user } = useAuth();
  const { settings } = useSettings();
  const [authCancelOpen, setAuthCancelOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);

  return (
    <div className={`flex flex-col ${compact ? "h-full" : "h-[820px] min-w-[340px]"} bg-card rounded-3xl border border-border/40 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300`}>
      <div className={`px-6 py-5 border-b border-border/40 flex items-center justify-between ${colorClass} bg-opacity-5`}>
        <h2 className="text-sm font-black uppercase tracking-tighter flex items-center gap-3">
          <span className={`h-2 w-2 rounded-full ${colorClass.split(" ")[0]}`} />
          {title}
          <span className="bg-foreground/5 px-2 py-0.5 rounded-full text-[10px] font-black opacity-60">
            {columnOrders.length}
          </span>
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {columnOrders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-10 py-10">
            <Package className="h-10 w-10 mb-2" />
            <p className="text-[10px] font-black uppercase tracking-tighter">Sem Pedidos</p>
          </div>
        ) : (
          columnOrders.map((order) => (
            <ContextMenu key={order.id}>
              <ContextMenuTrigger>
                <OrderCard order={order} onClick={() => onOrderClick(order.id)} />
              </ContextMenuTrigger>
              <ContextMenuContent className="w-56 rounded-xl shadow-xl border-border/60">
                <ContextMenuLabel className="text-[10px] uppercase font-black opacity-50">Pedido #{order.number}</ContextMenuLabel>
                <ContextMenuSeparator />
                {order.status === "preparing" && (
                  <ContextMenuItem className="rounded-lg m-1" onClick={() => updateStatusMutation.mutate({ id: order.id, status: "delivering", employeeName: user?.name || "" })}>Mover para Entrega</ContextMenuItem>
                )}
                {order.status === "delivering" && (
                  <ContextMenuItem className="rounded-lg m-1" onClick={() => updateStatusMutation.mutate({ id: order.id, status: "completed", employeeName: user?.name || "" })}>Concluir Pedido</ContextMenuItem>
                )}
                <ContextMenuSeparator />
                <ContextMenuItem
                  className="rounded-lg m-1 font-bold text-primary"
                  onClick={() => {
                    printOrder(order, settings);
                    markAsPrintedMutation.mutate(order.id);
                    if (order.status === "pending") {
                      updateStatusMutation.mutate({ id: order.id, status: "preparing", employeeName: user?.name || "" });
                    }
                  }}
                >
                  <Printer className="h-4 w-4 mr-2" /> Imprimir e Produzir
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem className="text-destructive font-bold rounded-lg m-1" onClick={() => { setOrderToCancel(order.id); setAuthCancelOpen(true); }}>Cancelar Pedido</ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          ))
        )}
      </div>
      <AuthModal
        open={authCancelOpen}
        onOpenChange={setAuthCancelOpen}
        onAuthorize={(employeeName) => {
          if (orderToCancel) {
            cancelOrderMutation.mutate({ id: orderToCancel, employeeName });
            setOrderToCancel(null);
          }
        }}
        title="Autorização para Cancelamento"
        description="Por favor, confirme sua identidade para cancelar este pedido."
      />
    </div>
  );
}
