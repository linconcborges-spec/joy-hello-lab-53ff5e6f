import { Clock, MapPin, Phone, ChevronRight, Printer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    <Card
      className="cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 border-border/60"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-bold text-foreground text-lg">#{order.number}</p>
            <p className="text-sm font-medium text-foreground/80">{order.customerName || "Cliente não informado"}</p>
          </div>
          <div className="flex items-center gap-2">
            {order.isPrinted && (
              <Printer className="h-4 w-4 text-primary" />
            )}
            <Badge className={`${statusVariant[order.status]} border text-xs font-medium`}>
              {STATUS_LABELS[order.status]}
            </Badge>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        <div className="space-y-1.5 text-sm text-muted-foreground">
          {order.address && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{order.address}</span>
            </div>
          )}
          {order.phone && (
            <div className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 shrink-0" />
              <span>{order.phone}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span>{time}</span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {order.items.length} {order.items.length === 1 ? "item" : "itens"} · {PAYMENT_LABELS[order.paymentMethod]}
          </span>
          <span className="font-bold text-primary text-lg">
            R$ {order.totalAmount.toFixed(2)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
