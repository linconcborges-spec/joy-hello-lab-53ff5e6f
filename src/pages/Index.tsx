import { useState, useEffect } from "react";
import { 
  Plus, Search, UtensilsCrossed, Users, Package, Settings, 
  Calendar as CalendarIcon, Printer, FileText, ChevronDown,
  LayoutDashboard, Truck, CheckCircle2, Clock, XCircle,
  Sun, Moon, ExternalLink
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OrderCard } from "@/components/OrderCard";
import { OrderDetail } from "@/components/OrderDetail";
import { NewOrderForm } from "@/components/NewOrderForm";
import { CustomersPage } from "@/components/CustomersPage";
import { ProductsPage } from "@/components/ProductsPage";
import { SettingsPage } from "@/components/SettingsPage";
import { LoginPage } from "@/components/LoginPage";
import { AuthModal } from "@/components/AuthModal";
import { 
  useOrders, useAddOrder, useUpdateOrder, useUpdateOrderStatus, 
  useCancelOrder, useMarkAsPrinted, useDeleteOrder, useAutoprint
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

type View = "list" | "new" | "edit" | "detail" | "customers" | "products" | "settings";

const Index = () => {
  const { user, isAdmin, logout, isLoading: authLoading } = useAuth();
  const { settings, updateSettings } = useSettings();
  const { theme, setTheme } = useTheme();

  // Impressão automática via Supabase Realtime (pedidos do mobile e desktop)
  useAutoprint(settings);

  // Iniciar sempre com a cor clara conforme solicitado (reset no mount para ignorar cache do navegador)
  useEffect(() => {
    setTheme("light");
  }, [setTheme]);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    updateSettings({ theme: newTheme });
  };
  
  const [view, setView] = useState<View>("list");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showRevenue, setShowRevenue] = useState(false);
  const [isHistoryView, setIsHistoryView] = useState(false);
  const [kanbanLastCol, setKanbanLastCol] = useState<"completed" | "cancelled">("completed");
  
  // Filtros de Histórico
  const [historyTab, setHistoryTab] = useState<"completed" | "cancelled">("completed");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(new Date().setDate(new Date().getDate() - 7)),
    to: new Date()
  });

  const [authCancelOpen, setAuthCancelOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'n') {
        if (view !== "products") {
          e.preventDefault();
          setView("new");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [view]);

  const { data: orders = [], isLoading: ordersLoading } = useOrders(
    isHistoryView ? dateRange.from?.toISOString() : undefined,
    isHistoryView ? dateRange.to?.toISOString() : undefined
  );
  
  const addOrderMutation = useAddOrder();
  const updateOrderMutation = useUpdateOrder();
  const updateStatusMutation = useUpdateOrderStatus();
  const cancelOrderMutation = useCancelOrder();
  const markAsPrintedMutation = useMarkAsPrinted();
  const deleteOrderMutation = useDeleteOrder();

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
      if (historyTab === "completed") return matchSearch && o.status === "completed";
      if (historyTab === "cancelled") return matchSearch && o.status === "cancelled";
      return false;
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
      <div className={`flex flex-col ${compact ? 'h-full' : 'h-[820px] min-w-[340px]'} bg-card rounded-3xl border border-border/40 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300`}>
        <div className={`px-6 py-5 border-b border-border/40 flex items-center justify-between ${colorClass} bg-opacity-5`}>
          <h2 className="text-sm font-black uppercase tracking-tighter flex items-center gap-3">
            <span className={`h-2 w-2 rounded-full ${colorClass.replace('bg-', 'bg-').split(' ')[0]}`} />
            {title}
            <span className="bg-foreground/5 px-2 py-0.5 rounded-full text-[10px] font-black opacity-60">
              {columnOrders.length}
            </span>
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
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
                  {order.status === "preparing" && (
                    <ContextMenuItem className="rounded-lg m-1" onClick={() => updateStatusMutation.mutate({ id: order.id, status: "delivering", employeeName: user.name })}>Mover para Entrega</ContextMenuItem>
                  )}
                  {order.status === "delivering" && (
                    <ContextMenuItem className="rounded-lg m-1" onClick={() => updateStatusMutation.mutate({ id: order.id, status: "completed", employeeName: user.name })}>Concluir Pedido</ContextMenuItem>
                  )}
                  <ContextMenuSeparator />
                  <ContextMenuItem 
                    className="rounded-lg m-1 font-bold text-primary" 
                    onClick={() => {
                      printOrder(order, settings);
                      markAsPrintedMutation.mutate(order.id);
                      if (order.status === "pending") {
                        updateStatusMutation.mutate({ id: order.id, status: "preparing", employeeName: user.name });
                      }
                    }}
                  >
                    <Printer className="h-4 w-4 mr-2" /> Imprimir e Produzir
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem className="text-destructive font-bold rounded-lg m-1" onClick={() => { setOrderToCancel(order.id); setAuthCancelOpen(true); }}>Cancelar Pedido</ContextMenuItem>
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
              {isAdmin && <TableHead className="font-black uppercase text-[10px] px-6 text-right">Total</TableHead>}
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
                      {isAdmin && (
                        <TableCell className="text-right font-black text-sm px-6">
                          R$ {order.totalAmount.toFixed(2)}
                        </TableCell>
                      )}
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

  if (view === "new" || (view === "edit" && selectedOrder)) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-10 flex items-center justify-center">
        <div className="max-w-7xl w-full">
          <NewOrderForm
            initialOrder={view === "edit" ? selectedOrder : undefined}
            onSubmit={(order: any) => {
              if (view === "edit" && selectedOrder) {
                updateOrderMutation.mutate({ 
                  id: selectedOrder.id, 
                  orderData: order,
                  originalSnapshot: order.originalSnapshot
                });
              } else {
                addOrderMutation.mutate(order);
              }
              setView("list");
            }}
            onCancel={() => setView("list")}
            onOpenCustomers={() => setView("customers")}
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
        <div className="max-w-7xl w-full">
          <OrderDetail
            order={selectedOrder}
            onBack={() => setView("list")}
            onUpdateStatus={(id, status) => updateStatusMutation.mutate({ id, status, employeeName: user.name })}
            onDelete={(id) => { deleteOrderMutation.mutate(id); setView("list"); }}
            onCancel={(id, employeeName) => cancelOrderMutation.mutate({ id, employeeName })}
            onPrint={(order) => { 
              printOrder(order, settings); 
              markAsPrintedMutation.mutate(order.id); 
              if (order.status === "pending") {
                updateStatusMutation.mutate({ id: order.id, status: "preparing", employeeName: user.name });
              }
            }}
            onEdit={(order) => setView("edit")}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20 selection:text-primary overflow-x-hidden w-full max-w-full">
      <div className="max-w-[1600px] mx-auto px-6 sm:px-14 py-8 space-y-12">
        {/* Superior Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 text-center lg:text-left">
          <div className="flex flex-col lg:flex-row items-center gap-4">
            <div className="h-16 w-16 rounded-3xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/30 transform hover:rotate-3 transition-transform">
              <UtensilsCrossed className="h-8 w-8 text-primary-foreground" />
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-foreground">{settings.storeName}</h1>
              <div className="flex items-center justify-center lg:justify-start gap-4">
                <Badge variant="outline" className="text-[9px] uppercase font-black tracking-widest px-2">{user.name}</Badge>
                <button 
                  onClick={toggleTheme} 
                  className="flex items-center justify-center h-8 w-8 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                  title={theme === "light" ? "Mudar para modo escuro" : "Mudar para modo claro"}
                >
                  {theme === "light" ? <Moon className="h-4 w-4 text-slate-700" /> : <Sun className="h-4 w-4 text-yellow-500" />}
                </button>
                <button onClick={logout} className="text-primary hover:text-primary/70 text-[10px] font-bold uppercase underline underline-offset-4 decoration-2">Sair do Sistema</button>
              </div>
            </div>
          </div>
          
          {/* Stats & Search Central Container */}
          <div className="flex flex-col md:flex-row items-center gap-3 bg-card p-2 rounded-3xl border border-border/40 shadow-sm flex-1 max-w-xl mx-auto lg:mx-0">
            <div className="relative flex-1 w-full max-w-[280px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
              <Input
                placeholder="Busca..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-11 bg-background border-none h-11 rounded-2xl shadow-inner text-sm font-medium"
              />
            </div>
            
            {isHistoryView && (
              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto px-1">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-10 rounded-2xl border-border/40 gap-2 shrink-0">
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
              </div>
            )}

            <div className="hidden md:block h-8 w-px bg-border/20 mx-1" />
            
            <div className="flex items-center gap-8 px-6 py-2 w-full md:w-auto justify-around">
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-60">Vendas</span>
                <span className="text-xl font-black leading-none tabular-nums">{todayCount}</span>
              </div>

              <div className="h-8 w-px bg-border/30" />

              {isAdmin && (
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-60">Total</span>
                  <span
                    onClick={() => setShowRevenue(!showRevenue)}
                    className={`text-xl font-black text-primary leading-none transition-all duration-500 tabular-nums cursor-pointer select-none ${!showRevenue ? "blur-sm opacity-20" : ""}`}
                  >
                    R$ {todayRevenue.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {/* Botões de Ícones (Novo Padrão) */}
            <Button 
              variant={isHistoryView ? "default" : "outline"} 
              size="icon" 
              onClick={() => setIsHistoryView(!isHistoryView)} 
              title={isHistoryView ? "Painel Operational" : "Histórico"}
              className="h-12 w-12 rounded-2xl bg-card border-border/40 shadow-sm transition-all active:scale-90"
            >
              {isHistoryView ? <LayoutDashboard className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
            </Button>
            
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setView("customers")} 
              title="Clientes"
              className="h-12 w-12 rounded-2xl bg-card border-border/40 shadow-sm transition-all active:scale-90"
            >
              <Users className="h-5 w-5" />
            </Button>

            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setView("products")} 
              title="Produtos"
              className="h-12 w-12 rounded-2xl bg-card border-border/40 shadow-sm transition-all active:scale-90"
            >
              <Package className="h-5 w-5" />
            </Button>

            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setView("settings")} 
              title="Configurações"
              className="h-12 w-12 rounded-2xl bg-card border-border/40 shadow-sm transition-all active:scale-90"
            >
              <Settings className="h-5 w-5" />
            </Button>

            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => window.open("/cardapio", "_blank")}
              title="Abrir Menu Virtual"
              className="h-12 w-12 rounded-2xl bg-card border-border/40 shadow-sm transition-all active:scale-90 text-primary border-primary/30 hover:bg-primary/5"
            >
              <ExternalLink className="h-5 w-5" />
            </Button>

            <div className="hidden lg:block h-10 w-px bg-border/20 mx-1" />

            <Button onClick={() => setView("new")} className="hidden lg:flex h-14 rounded-2xl px-8 shadow-xl shadow-primary/20 font-black uppercase text-xs gap-3 transform hover:-translate-y-0.5 transition-transform">
              <Plus className="h-5 w-5" /> Novo Pedido
            </Button>
          </div>
        </div>


        {/* View Switcher: Kanban vs History Table */}
        <div className="flex justify-center w-full pb-20 md:pb-0">
          {isHistoryView ? (
            <div className="w-full flex flex-col items-center space-y-6">
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-black uppercase italic tracking-tighter text-foreground opacity-10">Relatório Geral</h2>
                <div className="inline-flex items-center gap-1 bg-card border border-border/40 rounded-2xl p-1 shadow-sm">
                  <button
                    onClick={() => setHistoryTab("completed")}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                      historyTab === "completed"
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Concluídos
                  </button>
                  <button
                    onClick={() => setHistoryTab("cancelled")}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                      historyTab === "cancelled"
                        ? "bg-destructive text-destructive-foreground shadow-md"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Cancelados
                  </button>
                </div>
              </div>
              <HistoryTable />
            </div>
          ) : (
            <div className="w-full">
              {isMobile ? (
                <div className="flex flex-col items-center space-y-8 py-8 px-4">
                  <div className="w-full max-w-sm bg-card rounded-[3rem] border border-border/40 p-12 shadow-2xl shadow-primary/10 text-center space-y-8 flex flex-col items-center">
                    
                    <button 
                      onClick={() => setView("new")}
                      className="group relative h-40 w-40 bg-primary rounded-full flex items-center justify-center shadow-2xl shadow-primary/40 transform active:scale-90 transition-all"
                    >
                      <Plus className="h-20 w-20 text-primary-foreground group-hover:scale-110 transition-transform" />
                      <div className="absolute inset-0 rounded-full border-4 border-primary animate-ping opacity-20" />
                    </button>

                    <div>
                      <h2 className="text-3xl font-black uppercase tracking-tighter">Iniciar Pedido</h2>
                      <p className="text-[11px] font-black uppercase text-muted-foreground tracking-widest mt-2 opacity-50">Toque no ícone acima para começar</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                    <Button variant="outline" onClick={() => setView("products")} className="h-24 rounded-3xl border-border/40 bg-card flex-col gap-2 font-black uppercase text-[10px] tracking-widest">
                      <Package className="h-6 w-6 opacity-40" /> Produtos
                    </Button>
                    <Button variant="outline" onClick={() => setView("customers")} className="h-24 rounded-3xl border-border/40 bg-card flex-col gap-2 font-black uppercase text-[10px] tracking-widest">
                      <Users className="h-6 w-6 opacity-40" /> Clientes
                    </Button>
                    <Button variant="outline" onClick={() => window.open("/cardapio", "_blank")} className="h-24 rounded-3xl border-primary/20 bg-primary/5 text-primary flex-col gap-2 font-black uppercase text-[10px] tracking-widest col-span-2">
                      <ExternalLink className="h-6 w-6 opacity-60" /> Menu Virtual
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-8 overflow-x-auto pb-8 custom-scrollbar-h justify-center">
                  <KanbanColumn title="Pendentes" status="pending" orders={todayOrders} colorClass="text-warning" />
                  <KanbanColumn title="Produção" status="preparing" orders={todayOrders} colorClass="text-primary" />
                  <KanbanColumn title="Entrega" status="delivering" orders={todayOrders} colorClass="text-blue-500" />
                  {/* Última coluna com toggle Concluídos/Cancelados */}
                  <div className="flex flex-col h-[820px] min-w-[340px] bg-card rounded-3xl border border-border/40 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div className="px-6 py-5 border-b border-border/40 flex items-center justify-between bg-secondary/5">
                      <div className="flex items-center gap-1.5 p-1 bg-background/50 rounded-2xl border border-border/40">
                        <button
                          onClick={() => setKanbanLastCol("completed")}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                            kanbanLastCol === "completed"
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : "text-muted-foreground hover:bg-muted/50"
                          }`}
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Concluídos
                          <span className="bg-foreground/5 px-1.5 py-0.5 rounded-full text-[9px]">
                            {todayOrders.filter(o => o.status === "completed").length}
                          </span>
                        </button>
                        <button
                          onClick={() => setKanbanLastCol("cancelled")}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                            kanbanLastCol === "cancelled"
                              ? "bg-destructive/15 text-destructive"
                              : "text-muted-foreground hover:bg-muted/50"
                          }`}
                        >
                          <XCircle className="h-3 w-3" />
                          Cancelados
                          <span className="bg-foreground/5 px-1.5 py-0.5 rounded-full text-[9px]">
                            {todayOrders.filter(o => o.status === "cancelled").length}
                          </span>
                        </button>
                      </div>
                      <span className="h-2 w-2 rounded-full bg-secondary-foreground/20" />
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                      {todayOrders.filter(o => o.status === kanbanLastCol).length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-10 py-10">
                          <Package className="h-10 w-10 mb-2" />
                          <p className="text-[10px] font-black uppercase tracking-tighter">Sem Pedidos</p>
                        </div>
                      ) : (
                        todayOrders.filter(o => o.status === kanbanLastCol).map((order) => (
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
                              <ContextMenuItem className="gap-3 rounded-lg m-1" onClick={() => { setSelectedOrderId(order.id); setView("detail"); }}>
                                <FileText className="h-4 w-4 text-muted-foreground" /> Ver Detalhes
                              </ContextMenuItem>
                              <ContextMenuItem className="gap-3 rounded-lg m-1" onClick={() => printOrder(order, settings)}>
                                <Printer className="h-4 w-4 text-muted-foreground" /> Reimprimir
                              </ContextMenuItem>
                            </ContextMenuContent>
                          </ContextMenu>
                        ))
                      )}
                    </div>
                  </div>
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
          
          {isAdmin && (
            <>
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
            </>
          )}
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
};

function BottomNavItem({ icon: Icon, color, count, status, title }: { icon: any, color: string, count: number, status: Order["status"], title: string }) {
  return (
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
}

function DrawerKanbanColumn({ status, title, colorClass }: { status: any, title: string, colorClass: string }) {
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
};

export default Index;
