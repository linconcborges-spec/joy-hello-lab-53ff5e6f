import { Clock, MapPin, Printer, ListOrdered } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  HoverCard, 
  HoverCardContent, 
  HoverCardTrigger 
} from "@/components/ui/hover-card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Order } from "@/types/order";
import { STATUS_LABELS } from "@/types/order";
import { useState, useEffect } from "react";
import { differenceInMinutes } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

const statusVariant: Record<Order["status"], string> = {
  pending: "bg-warning/15 text-warning border-warning/30",
  preparing: "bg-primary/15 text-primary border-primary/30",
  delivering: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  completed: "bg-success/15 text-success border-success/30",
  cancelled: "bg-destructive/15 text-destructive border-destructive/30",
};

interface OrderCardProps {
  order: Order;
  onClick: () => void;
}

const OrderItemsSummary = ({ order }: { order: Order }) => {
  const { isAdmin } = useAuth();
  return (
  <div className="flex flex-col h-full overflow-hidden rounded-[1.5rem]">
    <div className="bg-primary/5 p-3 border-b border-primary/10">
      <p className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2 italic">
        <ListOrdered className="h-4 w-4" /> Itens do Pedido #{order.number}
      </p>
    </div>
    <div className="p-3 space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
      {order.items.map((item) => (
        <div key={item.id} className="flex justify-between items-start text-xs border-b border-border/40 pb-2 last:border-0 last:pb-0">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-black text-primary">{item.quantity}x</span>
              <span className="font-bold text-foreground uppercase tracking-tight">{item.product}</span>
            </div>
            {item.addons && item.addons.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1 pl-6">
                {item.addons.map((a, idx) => (
                  <Badge key={idx} variant="outline" className="text-[9px] uppercase font-bold py-0 h-4 bg-muted/30 border-none">
                    +{a.name}
                  </Badge>
                ))}
              </div>
            )}
            {item.observation && (
              <p className="text-[9px] text-orange-600 font-bold uppercase tracking-widest mt-1 pl-6 italic">
                Obs: {item.observation}
              </p>
            )}
          </div>
          <span className="text-[11px] font-black text-foreground ml-2">R$ {item.total.toFixed(2)}</span>
        </div>
      ))}
      {order.deliveryFee > 0 && (
        <div className="flex justify-between items-center text-[10px] pt-2 border-t border-primary/10 font-black uppercase tracking-widest opacity-60">
          <span>Taxa de Entrega</span>
          <span>R$ {order.deliveryFee.toFixed(2)}</span>
        </div>
      )}
    </div>
    <div className="bg-secondary/30 p-3 flex justify-between items-center mt-auto border-t border-border/10">
      <span className="text-[10px] font-black uppercase opacity-40 italic">Total Geral</span>
      <p className="text-base font-black text-primary tracking-tighter italic">R$ {order.totalAmount.toFixed(2)}</p>
    </div>
  </div>
  );
};

export function OrderCard({ order, onClick }: OrderCardProps) {
  const { isAdmin } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => {
      window.removeEventListener("resize", checkMobile);
      clearInterval(interval);
    };
  }, []);

  const elapsedMinutes = differenceInMinutes(now, new Date(order.createdAt));
  const isLate = elapsedMinutes >= 60 && order.status !== 'completed' && order.status !== 'cancelled';

  const formatElapsed = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m} min`;
  };

  const time = new Date(order.createdAt).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const CardUI = (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 border-border/60 overflow-hidden active:scale-[0.98] duration-200",
        isLate && "ring-2 ring-destructive ring-offset-2"
      )}
      onClick={(e) => {
        if (isMobile) {
          e.stopPropagation();
          setShowSummary(true);
        } else {
          onClick();
        }
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <p className="font-black text-foreground text-base uppercase tracking-tight leading-none">#{order.number}</p>
              {isLate && (
                <Badge className="bg-destructive text-white border-none text-[8px] px-1 h-4 font-black uppercase tracking-tighter">
                  ATRASADO!
                </Badge>
              )}
            </div>
            <p className="text-sm font-semibold text-foreground truncate max-w-[160px] italic">{order.customerName || "Avulso"}</p>
          </div>
          <div className="flex items-center gap-1.5">
            {order.isPrinted && (
              <Printer className="h-3.5 w-3.5 text-primary" />
            )}
            <Badge className={`${statusVariant[order.status]} border text-[10px] px-1.5 h-5 font-black uppercase tracking-wider shadow-sm`}>
              {STATUS_LABELS[order.status]}
            </Badge>
          </div>
        </div>

        <div className="space-y-1.5 text-xs text-muted-foreground mb-3 font-medium">
          {order.address && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3 shrink-0 opacity-50" />
              <span className="truncate uppercase text-[10px] tracking-tight">{order.address}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3 shrink-0 opacity-50" />
              <span className="text-[10px] font-black">{time}</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest bg-secondary/30 px-2 py-0.5 rounded-full">
              <span className={cn(isLate ? "text-destructive" : "text-muted-foreground")}>
                {formatElapsed(elapsedMinutes)}
              </span>
            </div>
          </div>
          {order.observation && (
            <div className="flex items-start gap-1.5 mt-2 bg-orange-500/5 px-2 py-1.5 rounded-xl border border-orange-500/10 border-dashed">
              <span className="text-[9px] font-black uppercase text-orange-600 line-clamp-2 italic tracking-tighter">
                OBS: {order.observation}
              </span>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-border/50 flex items-center justify-between">
          <span className="text-[9px] font-black text-muted-foreground uppercase flex items-center gap-1 opacity-50">
            <ListOrdered className="h-3 w-3" /> {order.items.length} {order.items.length === 1 ? "item" : "itens"}
          </span>
          <span className="font-black text-primary text-sm whitespace-nowrap italic tracking-tighter">
            R$ {order.totalAmount.toFixed(2)}
          </span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <HoverCard openDelay={1500}>
        <HoverCardTrigger asChild>
          {CardUI}
        </HoverCardTrigger>
        {!isMobile && (
          <HoverCardContent align="center" side="top" className="w-72 p-0 shadow-2xl border-primary/20 rounded-[1.5rem] overflow-hidden">
            <OrderItemsSummary order={order} />
          </HoverCardContent>
        )}
      </HoverCard>

      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="max-w-[calc(100vw-2rem)] w-[320px] p-0 border-none shadow-2xl rounded-[1.5rem] overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Itens do Pedido #{order.number}</DialogTitle>
          </DialogHeader>
          <OrderItemsSummary order={order} />
          <div className="p-3 pt-0 bg-secondary/30">
            <Button 
                onClick={() => { setShowSummary(false); onClick(); }} 
                className="w-full h-11 rounded-xl uppercase font-black text-xs gap-2"
                variant="default"
            >
                Ver Detalhes Completos
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
