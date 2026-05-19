import { Search, FileText, Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ContextMenu, ContextMenuContent, ContextMenuItem,
  ContextMenuLabel, ContextMenuSeparator, ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { printOrder } from "@/lib/PrintService";
import type { Order } from "@/types/order";
import { STATUS_LABELS } from "@/types/order";

interface HistoryTableProps {
  orders: Order[];
  isAdmin: boolean;
  settings: any;
  onOrderClick: (id: string) => void;
}

export function HistoryTable({ orders, isAdmin, settings, onOrderClick }: HistoryTableProps) {
  return (
    <div className="bg-card rounded-3xl border border-border/40 overflow-hidden shadow-sm mx-auto max-w-6xl w-full">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/5 hover:bg-secondary/5 border-b border-border/40">
              <TableHead className="w-[100px] font-black uppercase text-[10px] px-6">Número</TableHead>
              <TableHead className="font-black uppercase text-[10px] px-6">Cliente</TableHead>
              <TableHead className="font-black uppercase text-[10px] px-6">Conclusão</TableHead>
              <TableHead className="font-black uppercase text-[10px] px-6">Pagamento</TableHead>
              {isAdmin && <TableHead className="font-black uppercase text-[10px] px-6 text-right">Total</TableHead>}
              <TableHead className="font-black uppercase text-[10px] px-6 text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-60 text-center text-muted-foreground italic opacity-50">
                  <div className="flex flex-col items-center gap-2">
                    <Search className="h-8 w-8 opacity-20" />
                    <p className="text-[10px] font-black uppercase">Nenhum resultado</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <ContextMenu key={order.id}>
                  <ContextMenuTrigger asChild>
                    <TableRow
                      className="cursor-pointer transition-colors hover:bg-primary/5 group border-b border-border/20 last:border-0"
                      onClick={() => onOrderClick(order.id)}
                    >
                      <TableCell className="font-black text-xs px-6">#{order.number}</TableCell>
                      <TableCell className="font-medium px-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold">{order.customerName || "Avulso"}</span>
                          <span className="text-[10px] text-muted-foreground font-medium">{order.phone || "S/ Telefone"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-[11px] px-6 font-medium text-muted-foreground">
                        {format(new Date(order.lastEditedAt || order.createdAt), "dd MMM, HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="px-6">
                        <Badge variant="outline" className="text-[9px] uppercase font-bold py-0 h-5 border-border/60">
                          {order.paymentMethod === "cash" ? "Dinheiro" : order.paymentMethod === "pix" ? "PIX" : "Cartão"}
                        </Badge>
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right font-black text-sm px-6">
                          R$ {order.totalAmount.toFixed(2)}
                        </TableCell>
                      )}
                      <TableCell className="text-center px-6">
                        <Badge variant={order.status === "completed" ? "success" : "destructive"} className="text-[9px] uppercase font-black px-2 shadow-sm">
                          {STATUS_LABELS[order.status]}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  </ContextMenuTrigger>
                  <ContextMenuContent className="w-56 rounded-xl shadow-xl">
                    <ContextMenuLabel className="text-[10px] uppercase font-black opacity-50">Pedido #{order.number}</ContextMenuLabel>
                    <ContextMenuSeparator />
                    <ContextMenuItem className="gap-3 rounded-lg m-1" onClick={() => onOrderClick(order.id)}>
                      <FileText className="h-4 w-4 text-muted-foreground" /> Visualizar Detalhes
                    </ContextMenuItem>
                    <ContextMenuItem className="gap-3 rounded-lg m-1" onClick={() => printOrder(order, settings)}>
                      <Printer className="h-4 w-4 text-muted-foreground" /> Reimprimir
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
