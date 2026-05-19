import { useState, useEffect } from "react";
import { Plus, Users, Package, CheckCircle2, XCircle } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { OrderDetail } from "@/components/OrderDetail";
import { NewOrderForm } from "@/components/NewOrderForm";
import { CustomersPage } from "@/components/CustomersPage";
import { ProductsPage } from "@/components/ProductsPage";
import { SettingsPage } from "@/components/SettingsPage";
import { LoginPage } from "@/components/LoginPage";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { KanbanBoard } from "@/components/dashboard/KanbanBoard";
import { HistoryTable } from "@/components/dashboard/HistoryTable";
import { BottomNav } from "@/components/dashboard/BottomNav";
import {
  useOrders, useAddOrder, useUpdateOrder, useUpdateOrderStatus,
  useCancelOrder, useMarkAsPrinted, useDeleteOrder, useAutoprint,
} from "@/hooks/useOrders";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { printOrder } from "@/lib/PrintService";

type View = "list" | "new" | "edit" | "detail" | "customers" | "products" | "settings";

const Index = () => {
  const { user, isAdmin, logout, isLoading: authLoading } = useAuth();
  const { settings, updateSettings } = useSettings();
  useOfflineSync();
  const { theme, setTheme } = useTheme();
  useAutoprint(settings);

  useEffect(() => { setTheme("light"); }, [setTheme]);

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
  const [historyTab, setHistoryTab] = useState<"completed" | "cancelled">("completed");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(new Date().setDate(new Date().getDate() - 7)),
    to: new Date(),
  });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!showRevenue) return;
    const t = setTimeout(() => setShowRevenue(false), 10000);
    return () => clearTimeout(t);
  }, [showRevenue]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === "n" && view !== "products") {
        e.preventDefault();
        setView("new");
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

  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  const filtered = orders.filter(o => {
    const matchSearch = !search || o.customerName.toLowerCase().includes(search.toLowerCase()) || o.number.toString().includes(search) || o.phone.includes(search);
    if (isHistoryView) return matchSearch && o.status === historyTab;
    return matchSearch;
  });

  const todayOrders = filtered;
  const todayCount = orders.length;
  const todayRevenue = orders.filter(o => o.status !== "cancelled").reduce((sum, o) => sum + o.totalAmount, 0);

  const handleOrderClick = (id: string) => { setSelectedOrderId(id); setView("detail"); };

  if (view === "new" || (view === "edit" && selectedOrder)) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-10 flex items-center justify-center">
        <div className="max-w-7xl w-full">
          <NewOrderForm
            initialOrder={view === "edit" ? selectedOrder : undefined}
            onSubmit={(order: any) => {
              if (view === "edit" && selectedOrder) {
                updateOrderMutation.mutate({ id: selectedOrder.id, orderData: order, originalSnapshot: order.originalSnapshot });
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
              if (order.status === "pending") updateStatusMutation.mutate({ id: order.id, status: "preparing", employeeName: user.name });
            }}
            onEdit={() => setView("edit")}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20 selection:text-primary overflow-x-hidden w-full max-w-full">
      <div className="max-w-[1600px] mx-auto px-6 sm:px-14 py-8 space-y-12">
        <DashboardHeader
          storeName={settings.storeName}
          userName={user.name}
          theme={theme}
          onThemeToggle={toggleTheme}
          onLogout={logout}
          isAdmin={isAdmin}
          todayCount={todayCount}
          todayRevenue={todayRevenue}
          showRevenue={showRevenue}
          onToggleRevenue={() => setShowRevenue(v => !v)}
          search={search}
          setSearch={setSearch}
          isHistoryView={isHistoryView}
          onToggleHistoryView={() => setIsHistoryView(v => !v)}
          dateRange={dateRange}
          setDateRange={setDateRange}
          onNavigate={(v) => setView(v)}
        />

        <div className="flex justify-center w-full pb-20 md:pb-0">
          {isHistoryView ? (
            <div className="w-full flex flex-col items-center space-y-6">
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-black uppercase italic tracking-tighter text-foreground opacity-10">Relatório Geral</h2>
                <div className="inline-flex items-center gap-1 bg-card border border-border/40 rounded-2xl p-1 shadow-sm">
                  <button
                    onClick={() => setHistoryTab("completed")}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${historyTab === "completed" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Concluídos
                  </button>
                  <button
                    onClick={() => setHistoryTab("cancelled")}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${historyTab === "cancelled" ? "bg-destructive text-destructive-foreground shadow-md" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
                  >
                    <XCircle className="h-3.5 w-3.5" /> Cancelados
                  </button>
                </div>
              </div>
              <HistoryTable orders={filtered} isAdmin={isAdmin} settings={settings} onOrderClick={handleOrderClick} />
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
                      Abrir Menu Virtual
                    </Button>
                  </div>
                </div>
              ) : (
                <KanbanBoard orders={todayOrders} onOrderClick={handleOrderClick} />
              )}
            </div>
          )}
        </div>
      </div>

      {isMobile && (
        <BottomNav
          todayOrders={todayOrders}
          isAdmin={isAdmin}
          showRevenue={showRevenue}
          todayRevenue={todayRevenue}
          onToggleRevenue={() => setShowRevenue(v => !v)}
          isHistoryView={isHistoryView}
          onExitHistory={() => setIsHistoryView(false)}
        />
      )}
    </div>
  );
};

export default Index;
