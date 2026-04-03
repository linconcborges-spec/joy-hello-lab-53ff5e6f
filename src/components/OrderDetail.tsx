import { ArrowLeft, Trash2, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Order } from "@/types/order";
import { STATUS_LABELS, PAYMENT_LABELS } from "@/types/order";

interface OrderDetailProps {
  order: Order;
  onBack: () => void;
  onUpdateStatus: (id: string, status: Order["status"]) => void;
  onDelete: (id: string) => void;
  onCancel: (id: string) => void;
}

export function OrderDetail({ order, onBack, onUpdateStatus, onDelete, onCancel }: OrderDetailProps) {
  const date = new Date(order.createdAt).toLocaleString("pt-BR");
  const isPending = order.status === "pending";
  const isCancelled = order.status === "cancelled";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        <div className="flex gap-2">
          {/* Excluir: só em pedidos pendentes */}
          {isPending && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
                >
                  <Trash2 className="h-4 w-4" /> Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir pedido #{order.number}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Essa ação é permanente. O pedido será removido definitivamente do sistema.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Não</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(order.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Sim, excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {/* Cancelar: em pedidos que já avançaram (não pendente e não já cancelado) */}
          {!isPending && !isCancelled && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-orange-600 hover:text-orange-700 hover:bg-orange-500/10 gap-1.5"
                >
                  <Ban className="h-4 w-4" /> Cancelar Pedido
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancelar pedido #{order.number}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    O pedido será marcado como cancelado e ficará registrado no histórico. Essa ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Não</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onCancel(order.id)}
                    className="bg-orange-500 text-white hover:bg-orange-600"
                  >
                    Sim, cancelar pedido
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <Card className={isCancelled ? "border-destructive/40 bg-destructive/5" : ""}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">
              Pedido #{order.number}
              {isCancelled && <span className="ml-2 text-sm text-destructive font-normal">(CANCELADO)</span>}
            </CardTitle>
            {!isCancelled ? (
              <Select
                value={order.status}
                onValueChange={(val) => onUpdateStatus(order.id, val as Order["status"])}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS)
                    .filter(([key]) => key !== "cancelled")
                    .map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            ) : (
              <Badge variant="destructive">Cancelado</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{date}</p>
          {order.cancelledBy && (
            <p className="text-xs text-destructive mt-1">
              Cancelado por: {order.cancelledBy} em {new Date(order.cancelledAt!).toLocaleString("pt-BR")}
            </p>
          )}
          {order.lastEditedBy && !order.cancelledBy && (
            <p className="text-xs text-muted-foreground mt-1">
              Última edição por: {order.lastEditedBy} em {new Date(order.lastEditedAt!).toLocaleString("pt-BR")}
            </p>
          )}
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
                  <div key={item.id} className={`flex justify-between items-start text-sm rounded-lg px-3 py-2 ${isCancelled ? "bg-destructive/10 line-through opacity-70" : "bg-secondary/50"}`}>
                    <div>
                      <span className="font-medium">{item.quantity}x</span>{" "}
                      <span>{item.product}</span>
                      {item.addons && item.addons.length > 0 && (
                        <span className="text-muted-foreground ml-1">
                          (+{item.addons.map(a => a.name).join(", ")} R$ {item.addons.reduce((s, a) => s + a.price, 0).toFixed(2)})
                        </span>
                      )}
                      {item.observation && (
                        <p className="text-xs text-orange-600 mt-0.5">Obs: {item.observation}</p>
                      )}
                    </div>
                    <span className="font-medium whitespace-nowrap ml-2">R$ {item.total.toFixed(2)}</span>
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
            <div className={`flex justify-between text-lg font-bold pt-2 border-t ${isCancelled ? "line-through text-destructive" : ""}`}>
              <span>Total</span>
              <span className={isCancelled ? "text-destructive" : "text-primary"}>R$ {order.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
