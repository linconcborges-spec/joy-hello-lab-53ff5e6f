import { useState } from "react";
import { Package, Truck, CheckCircle2, Clock, LayoutDashboard, MessageCircle } from "lucide-react";
import { OrderCard } from "@/components/OrderCard";
import { AuthModal } from "@/components/AuthModal";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { AdminChatPanel } from "@/components/chat/AdminChatPanel";
import type { ChatMessage } from "@/hooks/useChatMessages";
import {
  ContextMenu, ContextMenuContent, ContextMenuItem,
  ContextMenuLabel, ContextMenuSeparator, ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useOrders, useUpdateOrderStatus, useCancelOrder } from "@/hooks/useOrders";
import { useAuth } from "@/hooks/useAuth";
import type { Order } from "@/types/order";

function DrawerKanbanColumn({ status, title }: { status: Order["status"]; title: string }) {
  const { data: orders = [] } = useOrders();
  const columnOrders = orders.filter(o => o.status === status);
  const updateStatusMutation = useUpdateOrderStatus();
  const cancelOrderMutation = useCancelOrder();
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);

  return (
    <div className="h-full flex flex-col space-y-4 overflow-y-auto pb-10 custom-scrollbar">
      {columnOrders.length === 0 ? (
        <div className="h-60 flex flex-col items-center justify-center opacity-10">
          <Package className="h-12 w-12 mb-2" />
          <p className="text-xs font-black uppercase tracking-tighter">Nenhum pedido aqui</p>
        </div>
      ) : (
        columnOrders.map((order) => (
          <ContextMenu key={order.id}>
            <ContextMenuTrigger>
              <OrderCard order={order} onClick={() => {}} />
            </ContextMenuTrigger>
            <ContextMenuContent className="w-56 rounded-xl shadow-xl">
              <ContextMenuLabel className="text-[10px] uppercase font-black opacity-50">Pedido #{order.number}</ContextMenuLabel>
              <ContextMenuSeparator />
              <ContextMenuItem className="rounded-lg m-1" onClick={() => updateStatusMutation.mutate({ id: order.id, status: "completed", employeeName: user?.name || "" })}>Concluir Pedido</ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem className="text-destructive font-bold rounded-lg m-1" onClick={() => { setOrderToCancel(order.id); setAuthOpen(true); }}>Cancelar Pedido</ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        ))
      )}
      <AuthModal
        open={authOpen}
        onOpenChange={setAuthOpen}
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

interface BottomNavItemProps {
  icon: React.ElementType;
  color: string;
  count: number;
  status: Order["status"];
  title: string;
}

function BottomNavItem({ icon: Icon, color, count, status, title }: BottomNavItemProps) {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <button className="flex flex-col items-center gap-0.5 relative px-2 py-1 transform active:scale-90 transition-transform">
          <Icon className={`h-6 w-6 ${color}`} />
          <span className="text-[8px] font-black uppercase tracking-tighter opacity-70">{title}</span>
          {count > 0 && (
            <span className={`absolute -top-1 right-2 w-4 h-4 rounded-full ${color.replace("text-", "bg-")} text-white text-[8px] font-black flex items-center justify-center border-2 border-background`}>
              {count}
            </span>
          )}
        </button>
      </DrawerTrigger>
      <DrawerContent className="h-[90vh] p-4 pt-0">
        <DrawerHeader className="px-0">
          <DrawerTitle className="text-xl font-black uppercase tracking-tighter text-center">{title}</DrawerTitle>
        </DrawerHeader>
        <div className="flex-1 overflow-hidden">
          <DrawerKanbanColumn status={status} title={title} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

interface BottomNavProps {
  todayOrders: Order[];
  isAdmin: boolean;
  showRevenue: boolean;
  todayRevenue: number;
  onToggleRevenue: () => void;
  isHistoryView: boolean;
  onExitHistory: () => void;
  chatUnread?: number;
  chatMessages?: ChatMessage[];
  chatLoaded?: boolean;
  onChatMarkRead?: (sid: string) => Promise<void>;
  onChatAddOptimistic?: (msg: ChatMessage) => void;
  onChatReplaceOptimistic?: (tempId: string, real: ChatMessage) => void;
  onChatRemoveOptimistic?: (tempId: string) => void;
}

export function BottomNav({ todayOrders, isAdmin, showRevenue, todayRevenue, onToggleRevenue, isHistoryView, onExitHistory, chatUnread = 0, chatMessages = [], chatLoaded = false, onChatMarkRead, onChatAddOptimistic, onChatReplaceOptimistic, onChatRemoveOptimistic }: BottomNavProps) {
  if (isHistoryView) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button size="icon" onClick={onExitHistory} className="h-16 w-16 rounded-full shadow-2xl bg-foreground text-background">
          <LayoutDashboard className="h-8 w-8" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-t border-border/40 px-4 py-2 flex items-center justify-between shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
      <div className="flex items-center gap-1 justify-around flex-1">
        <BottomNavItem icon={Clock} color="text-warning" count={todayOrders.filter(o => o.status === "pending").length} status="pending" title="Pendentes" />
        <BottomNavItem icon={Package} color="text-primary" count={todayOrders.filter(o => o.status === "preparing").length} status="preparing" title="Produção" />
        <BottomNavItem icon={Truck} color="text-blue-500" count={todayOrders.filter(o => o.status === "delivering").length} status="delivering" title="Entrega" />
        <BottomNavItem icon={CheckCircle2} color="text-success" count={todayOrders.filter(o => o.status === "completed").length} status="completed" title="Finalizados" />
        <Drawer>
          <DrawerTrigger asChild>
            <button className="flex flex-col items-center gap-0.5 relative px-2 py-1 transform active:scale-90 transition-transform">
              <MessageCircle className="h-6 w-6 text-green-500" />
              <span className="text-[8px] font-black uppercase tracking-tighter opacity-70">Chat</span>
              {chatUnread > 0 && (
                <span className="absolute -top-1 right-2 min-w-4 h-4 px-0.5 rounded-full bg-green-500 text-white text-[8px] font-black flex items-center justify-center border-2 border-background">
                  {chatUnread > 9 ? "9+" : chatUnread}
                </span>
              )}
            </button>
          </DrawerTrigger>
          <DrawerContent className="h-[90vh] p-4 pt-0">
            <DrawerHeader className="px-0">
              <DrawerTitle className="text-xl font-black uppercase tracking-tighter text-center">Chat</DrawerTitle>
            </DrawerHeader>
            <div className="flex-1 overflow-hidden h-full">
              <AdminChatPanel
                messages={chatMessages}
                loaded={chatLoaded}
                onMarkRead={onChatMarkRead ?? (async () => {})}
                onAddOptimistic={onChatAddOptimistic ?? (() => {})}
                onReplaceOptimistic={onChatReplaceOptimistic ?? (() => {})}
                onRemoveOptimistic={onChatRemoveOptimistic ?? (() => {})}
              />
            </div>
          </DrawerContent>
        </Drawer>
      </div>
      {isAdmin && (
        <>
          <div className="h-8 w-px bg-border/40 mx-2" />
          <button onClick={onToggleRevenue} className="flex flex-col items-end pr-2 min-w-[80px]">
            <span className="text-[8px] font-black uppercase opacity-40 tracking-widest">Balanço</span>
            <span className={`text-[13px] font-black text-primary leading-tight transition-all ${!showRevenue ? "blur-sm opacity-20" : ""}`}>
              R$ {todayRevenue.toFixed(2)}
            </span>
          </button>
        </>
      )}
    </div>
  );
}
