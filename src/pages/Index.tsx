import { useState, useEffect } from "react";
import { 
  Plus, Search, UtensilsCrossed, Users, Package, Settings, 
  Eye, EyeOff, Calendar as CalendarIcon, Printer, FileText, ChevronDown,
  LayoutDashboard, Truck, CheckCircle2, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OrderCard } from "@/components/OrderCard";
import { OrderDetail } from "@/components/OrderDetail";
import { NewOrderForm } from "@/components/NewOrderForm";
import { CustomersPage } from "@/components/CustomersPage";
import { ProductsPage } from "@/components/ProductsPage";
import { SettingsPage } from "@/components/SettingsPage";
import { LoginPage } from "@/components/LoginPage";
import { 
  useOrders, useAddOrder, useUpdateOrderStatus, 
  useCancelOrder, useMarkAsPrinted 
} from "@/hooks/useOrders";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";
import { printOrder } from "@/lib/PrintService";
import type { Order } from "@/types/order";
import { STATUS_LABELS } from "@/types/order";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Checkbox } from "@/components/ui/checkbox";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";

import { 
  ContextMenu, 
  ContextMenuContent, 
  ContextMenuItem, 
  ContextMenuTrigger,
  ContextMenuSeparator,
  ContextMenuLabel
} from "@/components/ui/context-menu";

type View = "list" | "new" | "detail" | "customers" | "products" | "settings";

const Index = () => {
  const { user, isAdmin, logout, isLoading: authLoading } = useAuth();
  const { settings } = useSettings();
  
  const [view, setView] = useState<View>("list");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showRevenue, setShowRevenue] = useState(false);
  const [isHistoryView, setIsHistoryView] = useState(false);
  
  // Filtros de Histórico
  const [showCancelled, setShowCancelled] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(new Date().setDate(new Date().getDate() - 7)),
    to: new Date()
  });

  // Responsive state
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Auto-hide revenue after 10 seconds
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (showRevenue) {
      timeout = setTimeout(() => {
        setShowRevenue(false);
      }, 10000);
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [showRevenue]);

  const { data: orders = [], isLoading: ordersLoading } = useOrders(
    isHistoryView ? dateRange.from?.toISOString() : undefined,
    isHistoryView ? dateRange.to?.toISOString() : undefined
  );
  
  const addOrderMutation = useAddOrder();
  const updateStatusMutation = useUpdateOrderStatus();
  const cancelOrderMutation = useCancelOrder();
  const markAsPrintedMutation = useMarkAsPrinted();

  if (authLoading || (ordersLoading && !isHistoryView)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-14 w-14 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-2xl shadow-primary/20" />
          <p className="text-muted-foreground font-black uppercase tracking-widest text-[10px]">Sincronizando Banco de Dados</p>
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

  const filtered = orders.filter((o) => {
    const matchSearch =
      !search ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.number.toString().includes(search) ||
      o.phone.includes(search);
    
    if (isHistoryView) {
      const isCompleted = o.status === "completed";
      const isCancelled = o.status === "cancelled";
      if (showCancelled) return matchSearch && (isCompleted || isCancelled);
      return matchSearch && isCompleted;
    }
    return matchSearch;
  });

  const todayOrders = filtered; 
  const todayCount = orders.length;
  const todayRevenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const KanbanColumn = ({ title, status, orders, colorClass, compact = false }: { title: string; status: Order["status"]; orders: Order[]; colorClass: string; compact?: boolean }) => {
    const columnOrders = orders.filter(o => o.status === status);
    return (
      <div className={`flex flex-col ${compact ? 'h-full' : 'h-[700px] min-w-[300px]'} bg-card rounded-3xl border border-border/40 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300`}>
        <div className={`p-4 border-b border-border/40 flex items-center justify-between ${colorClass} bg-opacity-5`}>
          <h2 className="text-sm font-black uppercase tracking-tighter flex items-center gap-3">
            <span className={`h-2 w-2 rounded-full ${colorClass.replace('bg-', 'bg-').split(' ')[0]}`} />
            {title}
            <span className="bg-foreground/5 px-2 py-0.5 rounded-full text-[10px] font-black opacity-60">
              {columnOrders.length}
            </span>
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
          {columnOrders.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-10 py-10">
              <Package className="h-10 w-10 mb-2" />
              <p className="text-[10px] font-black uppercase tracking-tighter">Sem Pedidos</p>
            </div>
          ) : (
            columnOrders.map((order) => (
              <ContextMenu key={order.id}>
                <ContextMenuTrigger>
                  <OrderCard
                    order={order}
                    onClick={() => {
                      setSelectedOrderId(order.id);
                      setView("detail");
                    }}
                  />
                </ContextMenuTrigger>
                <ContextMenuContent className="w-56 rounded-xl shadow-xl border-border/60">
                  <ContextMenuLabel className="text-[10px] uppercase font-black opacity-50">Pedido #{order.number}</ContextMenuLabel>
                  <ContextMenuSeparator />
                  {order.status === "pending" && (
                    <ContextMenuItem className="rounded-lg m-1" onClick={() => updateStatusMutation.mutate({ id: order.id, status: "preparing", employeeName: user.name })}>Mover para Produção</ContextMenuItem>
                  )}
                  {order.status === "preparing" && (
                    <ContextMenuItem className="rounded-lg m-1" onClick={() => updateStatusMutation.mutate({ id: order.id, status: "delivering", employeeName: user.name })}>Mover para Entrega</ContextMenuItem>
                  )}
                  {order.status === "delivering" && (
                    <ContextMenuItem className="rounded-lg m-1" onClick={() => updateStatusMutation.mutate({ id: order.id, status: "completed", employeeName: user.name })}>Concluir Pedido</ContextMenuItem>
                  )}
                  <ContextMenuSeparator />
                  <ContextMenuLabel className="text-[10px] uppercase font-black opacity-50 px-3">Mudar Status</ContextMenuLabel>
                  <ContextMenuItem className="rounded-lg m-1" onClick={() => updateStatusMutation.mutate({ id: order.id, status: "pending", employeeName: user.name })}>Pendente</ContextMenuItem>
                  <ContextMenuItem className="rounded-lg m-1" onClick={() => updateStatusMutation.mutate({ id: order.id, status: "preparing", employeeName: user.name })}>Produção</ContextMenuItem>
                  <ContextMenuItem className="rounded-lg m-1" onClick={() => updateStatusMutation.mutate({ id: order.id, status: "delivering", employeeName: user.name })}>Entrega</ContextMenuItem>
                  <ContextMenuItem className="rounded-lg m-1" onClick={() => updateStatusMutation.mutate({ id: order.id, status: "completed", employeeName: user.name })}>Concluído</ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem className="text-destructive font-bold rounded-lg m-1" onClick={() => cancelOrderMutation.mutate({ id: order.id, employeeName: user.name })}>Cancelar Pedido</ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))
          )}
        </div>
      </div>
    );
  };

  const HistoryTable = () => (
    <div className="bg-card rounded-3xl border border-border/40 overflow-hidden shadow-sm mx-auto max-w-6xl w-full">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/5 hover:bg-secondary/5 border-b border-border/40">
              <TableHead className="w-[100px] font-black uppercase text-[10px] px-6">Número</TableHead>
              <TableHead className="font-black uppercase text-[10px] px-6">Cliente</TableHead>
              <TableHead className="font-black uppercase text-[10px] px-6">Conclusão</TableHead>
              <TableHead className="font-black uppercase text-[10px] px-6">Pagamento</TableHead>
              <TableHead className="font-black uppercase text-[10px] px-6 text-right">Total</TableHead>
              <TableHead className="font-black uppercase text-[10px] px-6 text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-60 text-center text-muted-foreground italic opacity-50">
                  <div className="flex flex-col items-center gap-2">
                    <Search className="h-8 w-8 opacity-20" />
                    <p className="text-[10px] font-black uppercase">Nenhum resultado</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((order) => (
                <ContextMenu key={order.id}>
                  <ContextMenuTrigger asChild>
                    <TableRow 
                      className="cursor-pointer transition-colors hover:bg-primary/5 group border-b border-border/20 last:border-0"
                      onClick={() => { setSelectedOrderId(order.id); setView("detail"); }}
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
                          {order.paymentMethod === 'cash' ? 'Dinheiro' : order.paymentMethod === 'pix' ? 'PIX' : 'Cartão'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-black text-sm px-6">
                        R$ {order.totalAmount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center px-6">
                        <Badge variant={order.status === 'completed' ? 'success' : 'destructive'} className="text-[9px] uppercase font-black px-2 shadow-sm">
                          {STATUS_LABELS[order.status]}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  </ContextMenuTrigger>
                  <ContextMenuContent className="w-56 rounded-xl shadow-xl">
                    <ContextMenuLabel className="text-[10px] uppercase font-black opacity-50">Pedido #{order.number}</ContextMenuLabel>
                    <ContextMenuSeparator />
                    <ContextMenuItem className="gap-3 rounded-lg m-1" onClick={() => { setSelectedOrderId(order.id); setView("detail"); }}>
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

  const FAB = ({ icon: Icon, color, title, status, count }: { icon: any, color: string, title: string, status: Order["status"], count: number }) => (
    <Drawer>
      <DrawerTrigger asChild>
        <button 
          className={`h-14 w-14 rounded-full ${color} shadow-lg flex items-center justify-center relative transition-transform active:scale-90`}
          title={title}
        >
          <Icon className="h-6 w-6 text-white" />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 bg-white text-[10px] font-black px-1.5 py-0.5 rounded-full border-2 border-current leading-none min-w-[20px] text-center" style={{ color: color.replace('bg-', '') }}>
              {count}
            </span>
          )}
        </button>
      </DrawerTrigger>
      <DrawerContent className="h-[85vh] p-4 pt-0">
        <DrawerHeader className="px-0">
          <DrawerTitle className="text-xl font-black uppercase tracking-tighter text-center">{title}</DrawerTitle>
        </DrawerHeader>
        <div className="flex-1 overflow-hidden">
          <KanbanColumn 
            title={title} 
            status={status} 
            orders={todayOrders} 
            colorClass={color.replace('bg-', 'bg-opacity-10 text-')} 
            compact 
          />
        </div>
      </DrawerContent>
    </Drawer>
  );

  if (view === "new") {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-10 flex items-center justify-center">
        <div className="max-w-3xl w-full">
          <NewOrderForm
            onSubmit={(order) => addOrderMutation.mutate(order, { onSuccess: () => setView("list") })}
            onCancel={() => setView("list")}
          />
        </div>
      </div>
    );
  }

  if (view === "customers") return <CustomersPage onBack={() => setView("list")} />;
  if (view === "products") return <ProductsPage onBack={() => setView("list")} />;
  if (view === "settings") return <SettingsPage onBack={() => setView("list")} />;

  if (view === "detail" && selectedOrder) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-10 flex items-center justify-center">
        <div className="max-w-3xl w-full">
          <OrderDetail
            order={selectedOrder}
            onBack={() => setView("list")}
            onUpdateStatus={(id, status) => updateStatusMutation.mutate({ id, status, employeeName: user.name })}
            onDelete={(id) => setView("list")}
            onCancel={(id) => cancelOrderMutation.mutate({ id, employeeName: user.name })}
            onPrint={(order) => { printOrder(order, settings); markAsPrintedMutation.mutate(order.id); }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20 selection:text-primary overflow-x-hidden w-full max-w-full">
      <div className="container mx-auto px-4 sm:px-6 py-6 space-y-10">
        {/* Superior Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 text-center lg:text-left">
          <div className="flex flex-col lg:flex-row items-center gap-4">
            <div className="h-16 w-16 rounded-3xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/30 transform hover:rotate-3 transition-transform">
              <UtensilsCrossed className="h-8 w-8 text-primary-foreground" />
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-black text-foreground tracking-tight italic uppercase">{settings.storeName}</h1>
              <div className="flex items-center justify-center lg:justify-start gap-3">
                <Badge variant="outline" className="text-[9px] uppercase font-black tracking-widest px-2">{user.name}</Badge>
                <button onClick={logout} className="text-primary hover:text-primary/70 text-[10px] font-bold uppercase underline underline-offset-4 decoration-2">Sair do Sistema</button>
              </div>
            </div>
          </div>
          
          {/* Stats & Search Central Container */}
          <div className="flex flex-col md:flex-row items-center gap-4 bg-card p-3 rounded-3xl border border-border/40 shadow-sm flex-1 max-w-2xl mx-auto lg:mx-0">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
              <Input
                placeholder="Busca centralizada..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-11 bg-background border-none h-11 rounded-2xl shadow-inner text-sm font-medium"
              />
            </div>
            {isHistoryView && (
              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto px-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-11 rounded-2xl border-border/40 gap-2 shrink-0">
                      <CalendarIcon className="h-3 w-3" />
                      <span className="text-[10px] font-black uppercase">
                        {dateRange.from ? format(dateRange.from, "dd/MM") : "Dê"} - {dateRange.to ? format(dateRange.to, "dd/MM") : "Até"}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar mode="range" selected={dateRange as any} onSelect={(r: any) => setDateRange(r || { from: undefined, to: undefined })} numberOfMonths={2} locale={ptBR} />
                  </PopoverContent>
                </Popover>
                <div className="flex items-center gap-2 bg-secondary/10 px-3 py-2 rounded-2xl border border-border/20 h-11">
                  <Checkbox checked={showCancelled} onCheckedChange={(c) => setShowCancelled(c as boolean)} className="border-border/60" />
                  <span className="text-[9px] font-black uppercase opacity-60">Cancelados</span>
                </div>
              </div>
            )}
            <div className="hidden md:block h-8 w-px bg-border/40 md:mx-1" />
            <div className="flex items-center gap-6 px-4 py-2 border-t md:border-t-0 border-border/20 w-full md:w-auto justify-around">
              <div className="flex flex-col items-center md:items-end">
                <span className="text-[9px] text-muted-foreground uppercase font-black tracking-tighter">Pedidos</span>
                <span className="text-lg font-black leading-none">{todayCount}</span>
              </div>
              <div className="flex flex-col items-center md:items-end">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-muted-foreground uppercase font-black tracking-tighter">Faturamento</span>
                  <button onClick={() => setShowRevenue(!showRevenue)} className="hover:text-primary transition-colors">
                    {showRevenue ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </button>
                </div>
                <span className={`text-lg font-black text-primary leading-none transition-all duration-500 ${!showRevenue ? "blur-md select-none opacity-20" : ""}`}>
                  R$ {todayRevenue.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setView("settings")} className="h-14 w-14 rounded-2xl bg-card border-border/40 shadow-sm hover:shadow-md">
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="outline" onClick={() => setView("products")} className="h-14 rounded-2xl px-5 border-border/40 bg-card gap-2 text-[11px] font-black uppercase shadow-sm">
              <Package className="h-4 w-4" /> Produtos
            </Button>
            <Button onClick={() => setView("new")} className="hidden lg:flex h-14 rounded-2xl px-8 shadow-xl shadow-primary/20 font-black uppercase text-xs gap-3">
              <Plus className="h-5 w-5" /> Novo Pedido
            </Button>
          </div>
        </div>

        {/* Action Buttons Central (Desktop) */}
        {!isMobile && (
          <div className="flex items-center justify-center gap-3">
             <Button 
                variant={isHistoryView ? "default" : "outline"} 
                onClick={() => setIsHistoryView(!isHistoryView)} 
                className="h-14 rounded-full px-10 gap-3 border-border/40 font-black uppercase tracking-widest text-[11px] shadow-sm"
              >
                {isHistoryView ? <LayoutDashboard className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                {isHistoryView ? "Painel Operacional" : "Histórico de Vendas"}
              </Button>
              <Button variant="outline" onClick={() => setView("customers")} className="h-14 rounded-full px-10 border-border/40 gap-3 font-black uppercase tracking-widest text-[11px] shadow-sm">
                <Users className="h-5 w-5" /> Clientes
              </Button>
          </div>
        )}

        {/* View Switcher: Kanban vs History Table */}
        <div className="flex justify-center w-full pb-20 md:pb-0">
          {isHistoryView ? (
            <div className="w-full flex flex-col items-center space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-black uppercase italic tracking-tighter text-foreground opacity-10">Relatório Geral</h2>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Listagem tabular para análise detalhada de performance</p>
              </div>
              <HistoryTable />
            </div>
          ) : (
            <div className="w-full">
              {isMobile ? (
                <div className="flex flex-col items-center space-y-8 py-4">
                  <div className="w-full max-w-sm bg-card rounded-[2.5rem] border border-border/40 p-8 shadow-2xl shadow-primary/10 text-center space-y-6">
                    <div className="h-24 w-24 bg-primary/5 rounded-full flex items-center justify-center mx-auto border-2 border-primary/20">
                      <Plus className="h-12 w-12 text-primary animate-pulse" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black uppercase tracking-tighter">Iniciar Pedido</h2>
                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1 opacity-60">Toque abaixo para abrir o balcão</p>
                    </div>
                    <Button 
                      onClick={() => setView("new")} 
                      className="h-20 w-full rounded-[2rem] shadow-xl shadow-primary/30 text-xl font-black uppercase tracking-widest gap-4 transform active:scale-95 transition-all"
                    >
                      <Plus className="h-8 w-8" /> Novo Pedido
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 w-full px-2">
                    <Button variant="outline" onClick={() => setView("products")} className="h-24 rounded-3xl border-border/40 bg-card flex-col gap-2 font-black uppercase text-[10px] tracking-widest">
                      <Package className="h-6 w-6 opacity-40" /> Produtos
                    </Button>
                    <Button variant="outline" onClick={() => setView("customers")} className="h-24 rounded-3xl border-border/40 bg-card flex-col gap-2 font-black uppercase text-[10px] tracking-widest">
                      <Users className="h-6 w-6 opacity-40" /> Clientes
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-6 overflow-x-auto pb-8 custom-scrollbar-h justify-center">
                  <KanbanColumn title="Pendentes" status="pending" orders={todayOrders} colorClass="text-warning" />
                  <KanbanColumn title="Produção" status="preparing" orders={todayOrders} colorClass="text-primary" />
                  <KanbanColumn title="Entrega" status="delivering" orders={todayOrders} colorClass="text-blue-500" />
                  <KanbanColumn title="Concluídos" status="completed" orders={todayOrders} colorClass="text-success" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      {isMobile && !isHistoryView && view === "list" && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-t border-border/40 px-4 py-2 flex items-center justify-between shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
          <div className="flex items-center gap-1 justify-around flex-1">
            <BottomNavItem icon={Clock} color="text-warning" count={todayOrders.filter(o => o.status === 'pending').length} status="pending" title="Pendentes" />
            <BottomNavItem icon={UtensilsCrossed} color="text-primary" count={todayOrders.filter(o => o.status === 'preparing').length} status="preparing" title="Produção" />
            <BottomNavItem icon={Truck} color="text-blue-500" count={todayOrders.filter(o => o.status === 'delivering').length} status="delivering" title="Entrega" />
            <BottomNavItem icon={CheckCircle2} color="text-success" count={todayOrders.filter(o => o.status === 'completed').length} status="completed" title="Finalizados" />
          </div>
          
          <div className="h-8 w-px bg-border/40 mx-2" />
          
          <button 
            onClick={() => setShowRevenue(!showRevenue)}
            className="flex flex-col items-end pr-2 min-w-[80px]"
          >
            <span className="text-[8px] font-black uppercase opacity-40 tracking-widest">Balanço</span>
            <span className={`text-[13px] font-black text-primary leading-tight transition-all ${!showRevenue ? "blur-sm opacity-20" : ""}`}>
               R$ {todayRevenue.toFixed(2)}
            </span>
          </button>
        </div>
      )}
      
      {isMobile && isHistoryView && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button 
            size="icon" 
            onClick={() => setIsHistoryView(false)}
            className="h-16 w-16 rounded-full shadow-2xl bg-foreground text-background"
          >
            <LayoutDashboard className="h-8 w-8" />
          </Button>
        </div>
      )}
    </div>
  );
};

const BottomNavItem = ({ icon: Icon, color, count, status, title }: { icon: any, color: string, count: number, status: Order["status"], title: string }) => (
  <Drawer>
    <DrawerTrigger asChild>
      <button className="flex flex-col items-center gap-0.5 relative px-2 py-1 transform active:scale-90 transition-transform">
        <Icon className={`h-6 w-6 ${color}`} />
        <span className="text-[8px] font-black uppercase tracking-tighter opacity-70">{title}</span>
        {count > 0 && (
          <span className={`absolute -top-1 right-2 w-4 h-4 rounded-full ${color.replace('text-', 'bg-')} text-white text-[8px] font-black flex items-center justify-center border-2 border-background`}>
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
        <DrawerKanbanColumn status={status} title={title} colorClass={color} />
      </div>
    </DrawerContent>
  </Drawer>
);

const DrawerKanbanColumn = ({ status, title, colorClass }: { status: any, title: string, colorClass: string }) => {
  const { data: orders = [] } = useOrders();
  const columnOrders = orders.filter(o => o.status === status);
  const updateStatusMutation = useUpdateOrderStatus();
  const cancelOrderMutation = useCancelOrder();
  const { user } = useAuth();

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
              <OrderCard
                order={order}
                onClick={() => {}} // Could open details if needed
              />
            </ContextMenuTrigger>
            <ContextMenuContent className="w-56 rounded-xl shadow-xl">
              <ContextMenuLabel className="text-[10px] uppercase font-black opacity-50">Pedido #{order.number}</ContextMenuLabel>
              <ContextMenuSeparator />
              <ContextMenuItem className="rounded-lg m-1" onClick={() => updateStatusMutation.mutate({ id: order.id, status: "completed", employeeName: user?.name || '' })}>Concluir Pedido</ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem className="text-destructive font-bold rounded-lg m-1" onClick={() => cancelOrderMutation.mutate({ id: order.id, employeeName: user?.name || '' })}>Cancelar Pedido</ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        ))
      )}
    </div>
  );
};

export default Index;
