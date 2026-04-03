import { useState } from "react";
import { Plus, Search, UtensilsCrossed, Users, Package, Settings, LogOut, Eye, EyeOff, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderCard } from "@/components/OrderCard";
import { OrderDetail } from "@/components/OrderDetail";
import { NewOrderForm } from "@/components/NewOrderForm";
import { CustomersPage } from "@/components/CustomersPage";
import { ProductsPage } from "@/components/ProductsPage";
import { SettingsPage } from "@/components/SettingsPage";
import { LoginPage } from "@/components/LoginPage";
import { useOrders, useAddOrder, useUpdateOrderStatus, useCancelOrder, useMarkAsPrinted } from "@/hooks/useOrders";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";
import { printOrder } from "@/lib/PrintService";
import type { Order } from "@/types/order";

type View = "list" | "new" | "detail" | "customers" | "products" | "settings";

const Index = () => {
  const { user, isAdmin, logout, isLoading: authLoading } = useAuth();
  const { settings } = useSettings();
  
  const [view, setView] = useState<View>("list");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showRevenue, setShowRevenue] = useState(false);
  const [isHistoryView, setIsHistoryView] = useState(false);

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

  // Novos Hooks do Supabase
  const { data: orders = [], isLoading: ordersLoading } = useOrders(isHistoryView ? "2000-01-01" : undefined);
  const addOrderMutation = useAddOrder();
  const updateStatusMutation = useUpdateOrderStatus();
  const cancelOrderMutation = useCancelOrder();
  const markAsPrintedMutation = useMarkAsPrinted();

  // Enquanto carrega a sessão ou pedidos, mostra loading
  if (authLoading || ordersLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground font-medium">Sincronizando com o banco de dados...</p>
        </div>
      </div>
    );
  }

  // Sem login -> tela de login
  if (!user) {
    return <LoginPage />;
  }

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

  const filtered = orders.filter((o) => {
    const matchSearch =
      !search ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.number.toString().includes(search) ||
      o.phone.includes(search);
    return matchSearch;
  });

  const todayOrders = filtered; // Já vem filtrado pelo hookuseOrders(start)

  const todayCount = orders.length;

  const todayRevenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  if (view === "new") {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto p-4 sm:p-6">
          <NewOrderForm
            onSubmit={(order) => {
              addOrderMutation.mutate(order, {
                onSuccess: () => setView("list")
              });
            }}
            onCancel={() => setView("list")}
          />
        </div>
      </div>
    );
  }

  if (view === "customers") {
    return <CustomersPage onBack={() => setView("list")} />;
  }

  if (view === "products") {
    return <ProductsPage onBack={() => setView("list")} />;
  }

  if (view === "settings") {
    return <SettingsPage onBack={() => setView("list")} />;
  }

  if (view === "detail" && selectedOrder) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto p-4 sm:p-6">
          <OrderDetail
            order={selectedOrder}
            onBack={() => setView("list")}
            onUpdateStatus={(id, status) => updateStatusMutation.mutate({ id, status, employeeName: user.name })}
            onDelete={(id) => {
              // Agora a exclusão pode ser via cancelamento ou status, 
              // mantendo a lógica de UI do componente
              setView("list");
            }}
            onCancel={(id) => {
              cancelOrderMutation.mutate({ id, employeeName: user.name });
            }}
            onPrint={(order) => {
              printOrder(order, settings);
              markAsPrintedMutation.mutate(order.id);
            }}
          />
        </div>
      </div>
    );
  }

  const KanbanColumn = ({ 
    title, 
    status, 
    orders, 
    colorClass 
  }: { 
    title: string; 
    status: Order["status"]; 
    orders: Order[]; 
    colorClass: string;
  }) => {
    const columnOrders = orders.filter(o => o.status === status);
    
    return (
      <div className="flex flex-col h-[700px] min-w-[280px] bg-secondary/5 rounded-2xl border border-border/40 overflow-hidden">
        <div className={`p-4 border-b border-border/40 flex items-center justify-between ${colorClass}`}>
          <h2 className="text-sm font-black uppercase tracking-tighter flex items-center gap-2">
            {title}
            <span className="bg-background/50 px-2 py-0.5 rounded-full text-[10px] font-bold">
              {columnOrders.length}
            </span>
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
          {columnOrders.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20 py-10">
              <Package className="h-8 w-8 mb-2" />
              <p className="text-[10px] font-bold uppercase">Vazio</p>
            </div>
          ) : (
            columnOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onClick={() => {
                  setSelectedOrderId(order.id);
                  setView("detail");
                }}
              />
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div className="max-w-full px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <UtensilsCrossed className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-foreground tracking-tight italic uppercase">{settings.storeName}</h1>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-tight">
                Painel Gestão · {user.name} · <button onClick={logout} className="text-primary hover:underline">Sair</button>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-secondary/30 p-2 rounded-2xl border border-border/40 flex-1 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar pedido..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-background/50 border-none h-10 rounded-xl"
              />
            </div>
            <div className="h-8 w-px bg-border/40 mx-2" />
            <div className="flex items-center gap-4 pr-2 whitespace-nowrap">
              <div className="flex flex-col">
                <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">
                  {isHistoryView ? "Total Pedidos" : "Pedidos Hoje"}
                </span>
                <span className="text-sm font-black text-foreground leading-none">{todayCount}</span>
              </div>
              <div className="flex flex-col relative group">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">
                    {isHistoryView ? "Faturamento Total" : "Total Hoje"}
                  </span>
                  <button 
                    onClick={() => setShowRevenue(!showRevenue)}
                    className="p-0.5 hover:bg-primary/10 rounded transition-colors text-muted-foreground hover:text-primary"
                    title={showRevenue ? "Ocultar faturamento" : "Mostrar faturamento"}
                  >
                    {showRevenue ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </button>
                </div>
                <span className={`text-sm font-black text-primary leading-none transition-all duration-300 ${!showRevenue ? "blur-sm select-none" : ""}`}>
                  {showRevenue ? `R$ ${todayRevenue.toFixed(2)}` : "R$ 0.000,00"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button 
              variant={isHistoryView ? "default" : "outline"}
              onClick={() => setIsHistoryView(!isHistoryView)}
              className="gap-2 rounded-xl h-12 border-border/40 font-bold uppercase text-xs"
              title="Alternar entre pedidos de hoje e histórico completo"
            >
              <Calendar className="h-4 w-4" /> {isHistoryView ? "Ver Hoje" : "Histórico"}
            </Button>
            {isAdmin && (
              <Button variant="outline" size="icon" onClick={() => setView("settings")} title="Configurações" className="rounded-xl h-12 w-12 border-border/40">
                <Settings className="h-5 w-5" />
              </Button>
            )}
            <Button variant="outline" onClick={() => setView("products")} className="gap-2 rounded-xl h-12 border-border/40 font-bold uppercase text-xs">
              <Package className="h-4 w-4" /> Produtos
            </Button>
            <Button variant="outline" onClick={() => setView("customers")} className="gap-2 rounded-xl h-12 border-border/40 font-bold uppercase text-xs">
              <Users className="h-4 w-4" /> Clientes
            </Button>
            <Button onClick={() => setView("new")} className="gap-2 rounded-xl h-12 shadow-lg shadow-primary/20 font-black uppercase text-xs px-6">
              <Plus className="h-4 w-4" /> Novo Pedido
            </Button>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar-h min-h-[720px]">
          <KanbanColumn 
            title="Pendentes" 
            status="pending" 
            orders={todayOrders} 
            colorClass="bg-warning/10 text-warning"
          />
          <KanbanColumn 
            title="Em Produção" 
            status="preparing" 
            orders={todayOrders} 
            colorClass="bg-primary/10 text-primary"
          />
          <KanbanColumn 
            title="Em Entrega" 
            status="delivering" 
            orders={todayOrders} 
            colorClass="bg-blue-500/10 text-blue-600"
          />
          <KanbanColumn 
            title="Finalizados" 
            status="completed" 
            orders={todayOrders} 
            colorClass="bg-success/10 text-success"
          />
          <div className="w-[200px] shrink-0 opacity-80">
            <KanbanColumn 
              title="Cancelados" 
              status="cancelled" 
              orders={todayOrders} 
              colorClass="bg-destructive/10 text-destructive"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
