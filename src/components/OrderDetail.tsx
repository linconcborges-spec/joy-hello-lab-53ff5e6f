import { ArrowLeft, Trash2, Ban, Printer, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
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
  onPrint?: (order: Order) => void;
  onEdit?: (order: Order) => void;
}

export function OrderDetail({ order, onBack, onUpdateStatus, onDelete, onCancel, onPrint, onEdit }: OrderDetailProps) {
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
          {!isCancelled && (
             <Button
               variant="secondary"
               size="sm"
               className="gap-1.5 bg-primary/10 text-primary hover:bg-primary/20"
               onClick={() => onEdit?.(order)}
             >
               <Pencil className="h-4 w-4" /> Editar
             </Button>
          )}
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
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-muted-foreground">{date}</p>
            {order.isPrinted ? (
              <Badge variant="outline" className="text-[10px] h-5 gap-1 bg-primary/5 border-primary/20 text-primary">
                <Printer className="h-3 w-3" /> Impresso
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] h-5 bg-muted/50 border-muted-foreground/20 text-muted-foreground">
                Não impresso
              </Badge>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 ml-auto" 
              onClick={() => onPrint?.(order)}
              title="Imprimir Pedido"
            >
              <Printer className="h-3.5 w-3.5" />
            </Button>
          </div>
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
            {order.observation && (
              <div className="sm:col-span-2 bg-orange-500/5 p-3 rounded-2xl border border-orange-500/10 border-dashed">
                <p className="text-orange-600 text-[10px] uppercase font-black tracking-widest mb-1 italic">Observação da Comanda</p>
                <p className="font-bold text-sm text-orange-700 uppercase italic leading-relaxed">"{order.observation}"</p>
              </div>
            )}
          </div>

          <div className="border-t pt-4">
            <p className="font-semibold mb-3">Itens</p>
            {order.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum item</p>
            ) : (
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className={cn(
                    "flex flex-col sm:flex-row sm:justify-between sm:items-start text-sm rounded-2xl px-4 py-3 border border-border/10",
                    isCancelled ? "bg-destructive/10 line-through opacity-70" : "bg-secondary/20"
                  )}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-black text-primary">{item.quantity}x</span>
                        <span className="font-bold break-words">{item.product}</span>
                      </div>
                      {item.addons && item.addons.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.addons.map((a, idx) => (
                            <Badge key={idx} variant="outline" className="text-[9px] uppercase font-bold py-0 h-4 bg-background/50 border-none">
                              +{a.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {item.observation && (
                        <p className="text-[10px] text-orange-600 font-bold uppercase tracking-widest mt-2 bg-orange-500/5 px-2 py-1 rounded-lg inline-block italic">
                          Obs: {item.observation}
                        </p>
                      )}
                    </div>
                    <div className="flex justify-end items-center mt-3 sm:mt-0 sm:ml-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-border/10">
                      <span className="font-black text-sm">R$ {item.total.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t pt-4 font-black">
            <div className="flex justify-between text-muted-foreground text-[10px] uppercase tracking-widest">
              <span>Subtotal</span>
              <span>R$ {(order.totalAmount - order.deliveryFee).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground text-[10px] uppercase tracking-widest">
              <span>Entrega</span>
              <span>R$ {order.deliveryFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg mt-2 pt-2 border-t border-border/20">
              <span className="uppercase italic tracking-tighter">Total Geral</span>
              <span className="text-primary tracking-tighter italic">R$ {order.totalAmount.toFixed(2)}</span>
            </div>
            {order.changeFor > 0 && order.paymentMethod === 'cash' && (
              <div className="flex justify-between text-[11px] text-muted-foreground mt-1 uppercase italic border-t border-border/20 pt-1">
                <span>Troco para R$ {order.changeFor.toFixed(2)}</span>
                <span className="font-bold">Diferença: R$ {(order.changeFor - order.totalAmount).toFixed(2)}</span>
              </div>
            )}
          </div>

          {order.originalSnapshot && (
            <div className="mt-8 border-t-4 border-dashed border-muted pt-6 opacity-80 bg-muted/5 p-4 rounded-3xl">
              <div className="flex items-center gap-2 mb-4">
                <span className="h-2 w-2 rounded-full bg-muted-foreground" />
                <h3 className="text-sm font-black uppercase italic tracking-tighter opacity-40">Pedido Original (Antes da Alteração)</h3>
              </div>
              
              <div className="space-y-2 opacity-60 pointer-events-none">
                {order.originalSnapshot.items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-[10px] font-bold uppercase py-1 border-b border-border/10">
                    <span>{item.quantity}x {item.product}</span>
                    <span>R$ {Number(item.total).toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-black text-xs pt-1">
                  <span>TOTAL ANTERIOR:</span>
                  <span>R$ {Number(order.originalSnapshot.totalAmount).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
