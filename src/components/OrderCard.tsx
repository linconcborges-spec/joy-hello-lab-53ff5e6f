import { Clock, MapPin, Phone, ChevronRight, Printer, ListOrdered } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  HoverCard, 
  HoverCardContent, 
  HoverCardTrigger 
} from "@/components/ui/hover-card";
import type { Order } from "@/types/order";
import { STATUS_LABELS, PAYMENT_LABELS } from "@/types/order";

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

export function OrderCard({ order, onClick }: OrderCardProps) {
  const time = new Date(order.createdAt).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <HoverCard openDelay={1500}>
      <HoverCardTrigger asChild>
        <Card
          className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 border-border/60 overflow-hidden"
          onClick={onClick}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-black text-foreground text-base uppercase tracking-tight leading-none">#{order.number}</p>
                <p className="text-sm font-semibold text-foreground truncate max-w-[160px] mt-1">{order.customerName || "Avulso"}</p>
              </div>
              <div className="flex items-center gap-1.5">
                {order.isPrinted && (
                  <Printer className="h-3.5 w-3.5 text-primary" />
                )}
                <Badge className={`${statusVariant[order.status]} border text-[10px] px-1.5 h-5 font-bold uppercase tracking-wider`}>
                  {STATUS_LABELS[order.status]}
                </Badge>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-muted-foreground mb-3">
              {order.address && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{order.address}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Clock className="h-3 w-3 shrink-0" />
                <span>{time}</span>
              </div>
              {order.observation && (
                <div className="flex items-start gap-1.5 mt-2 bg-orange-500/5 px-2 py-1 rounded-lg border border-orange-500/10">
                  <span className="text-[10px] font-black uppercase text-orange-600 line-clamp-2 italic">
                    OBS: {order.observation}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-border/50 flex items-center justify-between">
              <span className="text-[10px] font-medium text-muted-foreground uppercase flex items-center gap-1">
                <ListOrdered className="h-3 w-3" /> {order.items.length} {order.items.length === 1 ? "item" : "itens"}
              </span>
              <span className="font-bold text-primary text-sm whitespace-nowrap">
                R$ {order.totalAmount.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>
      </HoverCardTrigger>
      <HoverCardContent className="w-64 p-0 shadow-2xl border-primary/20">
        <div className="bg-primary/5 p-2 border-b border-primary/10">
          <p className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
            <ListOrdered className="h-3.5 w-3.5" /> Itens do Pedido #{order.number}
          </p>
        </div>
        <div className="p-2 space-y-1.5 max-h-[300px] overflow-y-auto">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between items-start text-xs border-b border-border/40 pb-1.5 last:border-0 last:pb-0">
              <div className="flex-1">
                <span className="font-bold text-foreground">{item.quantity}x</span>{" "}
                <span className="text-muted-foreground font-medium">{item.product}</span>
                {item.addons && item.addons.length > 0 && (
                  <p className="text-[9px] text-muted-foreground pl-4 font-normal italic">
                    +{item.addons.map(a => a.name).join(", ")}
                  </p>
                )}
              </div>
              <span className="text-[11px] font-bold text-foreground">R$ {item.total.toFixed(2)}</span>
            </div>
          ))}
          {order.deliveryFee > 0 && (
            <div className="flex justify-between items-center text-[11px] pt-1 border-t border-primary/10 font-medium">
              <span className="text-muted-foreground">Taxa de Entrega</span>
              <span className="font-bold">R$ {order.deliveryFee.toFixed(2)}</span>
            </div>
          )}
        </div>
        <div className="bg-secondary/30 p-2 text-right">
          <p className="text-sm font-black text-primary tracking-tight">TOTAL: R$ {order.totalAmount.toFixed(2)}</p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
