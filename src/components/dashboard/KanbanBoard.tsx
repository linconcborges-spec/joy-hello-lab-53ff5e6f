import { useState } from "react";
import { CheckCircle2, XCircle, Package, Printer, FileText } from "lucide-react";
import { OrderCard } from "@/components/OrderCard";
import { AuthModal } from "@/components/AuthModal";
import {
  ContextMenu, ContextMenuContent, ContextMenuItem,
  ContextMenuLabel, ContextMenuSeparator, ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { KanbanColumn } from "./KanbanColumn";
import { useUpdateOrderStatus, useCancelOrder } from "@/hooks/useOrders";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";
import { printOrder } from "@/lib/PrintService";
import type { Order } from "@/types/order";

interface KanbanBoardProps {
  orders: Order[];
  onOrderClick: (id: string) => void;
}

export function KanbanBoard({ orders, onOrderClick }: KanbanBoardProps) {
  const [lastCol, setLastCol] = useState<"completed" | "cancelled">("completed");
  const [authCancelOpen, setAuthCancelOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
  const updateStatusMutation = useUpdateOrderStatus();
  const cancelOrderMutation = useCancelOrder();
  const { user } = useAuth();
  const { settings } = useSettings();

  const lastColOrders = orders.filter(o => o.status === lastCol);

  return (
    <div className="flex gap-8 overflow-x-auto pb-8 custom-scrollbar-h justify-center">
      <KanbanColumn title="Pendentes" status="pending" orders={orders} colorClass="text-warning" onOrderClick={onOrderClick} />
      <KanbanColumn title="Produção" status="preparing" orders={orders} colorClass="text-primary" onOrderClick={onOrderClick} />
      <KanbanColumn title="Entrega" status="delivering" orders={orders} colorClass="text-blue-500" onOrderClick={onOrderClick} />

      {/* Combined last column: toggle between Concluídos / Cancelados */}
      <div className="flex flex-col h-[820px] min-w-[340px] bg-card rounded-3xl border border-border/40 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className="px-6 py-5 border-b border-border/40 flex items-center justify-between bg-secondary/5">
          <div className="flex items-center gap-1.5 p-1 bg-background/50 rounded-2xl border border-border/40">
            <button
              onClick={() => setLastCol("completed")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                lastCol === "completed"
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : "text-muted-foreground hover:bg-muted/50"
              }`}
            >
              <CheckCircle2 className="h-3 w-3" />
              Concluídos
              <span className="bg-foreground/5 px-1.5 py-0.5 rounded-full text-[9px]">
                {orders.filter(o => o.status === "completed").length}
              </span>
            </button>
            <button
              onClick={() => setLastCol("cancelled")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                lastCol === "cancelled"
                  ? "bg-destructive/15 text-destructive"
                  : "text-muted-foreground hover:bg-muted/50"
              }`}
            >
              <XCircle className="h-3 w-3" />
              Cancelados
              <span className="bg-foreground/5 px-1.5 py-0.5 rounded-full text-[9px]">
                {orders.filter(o => o.status === "cancelled").length}
              </span>
            </button>
          </div>
          <span className="h-2 w-2 rounded-full bg-secondary-foreground/20" />
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {lastColOrders.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-10 py-10">
              <Package className="h-10 w-10 mb-2" />
              <p className="text-[10px] font-black uppercase tracking-tighter">Sem Pedidos</p>
            </div>
          ) : (
            lastColOrders.map((order) => (
              <ContextMenu key={order.id}>
                <ContextMenuTrigger>
                  <OrderCard order={order} onClick={() => onOrderClick(order.id)} />
                </ContextMenuTrigger>
                <ContextMenuContent className="w-56 rounded-xl shadow-xl border-border/60">
                  <ContextMenuLabel className="text-[10px] uppercase font-black opacity-50">Pedido #{order.number}</ContextMenuLabel>
                  <ContextMenuSeparator />
                  <ContextMenuItem className="gap-3 rounded-lg m-1" onClick={() => onOrderClick(order.id)}>
                    <FileText className="h-4 w-4 text-muted-foreground" /> Ver Detalhes
                  </ContextMenuItem>
                  <ContextMenuItem className="gap-3 rounded-lg m-1" onClick={() => printOrder(order, settings)}>
                    <Printer className="h-4 w-4 text-muted-foreground" /> Reimprimir
                  </ContextMenuItem>
                  {lastCol === "completed" && (
                    <>
                      <ContextMenuSeparator />
                      <ContextMenuItem className="text-destructive font-bold rounded-lg m-1" onClick={() => { setOrderToCancel(order.id); setAuthCancelOpen(true); }}>Cancelar Pedido</ContextMenuItem>
                    </>
                  )}
                </ContextMenuContent>
              </ContextMenu>
            ))
          )}
        </div>
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
