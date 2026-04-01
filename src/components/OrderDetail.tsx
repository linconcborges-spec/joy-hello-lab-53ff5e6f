import { ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Order } from "@/types/order";
import { STATUS_LABELS, PAYMENT_LABELS } from "@/types/order";

interface OrderDetailProps {
  order: Order;
  onBack: () => void;
  onUpdateStatus: (id: string, status: Order["status"]) => void;
  onDelete: (id: string) => void;
}

export function OrderDetail({ order, onBack, onUpdateStatus, onDelete }: OrderDetailProps) {
  const date = new Date(order.createdAt).toLocaleString("pt-BR");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(order.id)}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Pedido #{order.number}</CardTitle>
            <Select
              value={order.status}
              onValueChange={(val) => onUpdateStatus(order.id, val as Order["status"])}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground">{date}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Cliente</p>
              <p className="font-medium">{order.customerName || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Telefone</p>
              <p className="font-medium">{order.phone || "—"}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Endereço</p>
              <p className="font-medium">{order.address || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Pagamento</p>
              <Badge variant="secondary">{PAYMENT_LABELS[order.paymentMethod]}</Badge>
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="font-semibold mb-3">Itens</p>
            {order.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum item</p>
            ) : (
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-sm bg-secondary/50 rounded-lg px-3 py-2">
                    <div>
                      <span className="font-medium">{item.quantity}x</span>{" "}
                      <span>{item.product}</span>
                      {item.additionalPrice > 0 && (
                        <span className="text-muted-foreground ml-1">(+R$ {item.additionalPrice.toFixed(2)})</span>
                      )}
                    </div>
                    <span className="font-medium">R$ {item.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t pt-4 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>R$ {(order.totalAmount - order.deliveryFee).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Entrega</span>
              <span>R$ {order.deliveryFee.toFixed(2)}</span>
            </div>
            {order.changeFor > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Troco para</span>
                <span>R$ {order.changeFor.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Total</span>
              <span className="text-primary">R$ {order.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
