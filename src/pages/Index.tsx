import { useState } from "react";
import { Plus, Search, UtensilsCrossed, Users, Package, Settings, LogOut } from "lucide-react";
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
import { useOrders } from "@/hooks/useOrders";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";
import { printOrder } from "@/lib/PrintService";
import type { Order } from "@/types/order";

type View = "list" | "new" | "detail" | "customers" | "products" | "settings";

const Index = () => {
  const { user, isAdmin, logout, isLoading: authLoading } = useAuth();
  const { orders, addOrder, updateStatus, cancelOrder, deleteOrder, markAsPrinted } = useOrders();
  const { settings } = useSettings();
  const [view, setView] = useState<View>("list");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Enquanto carrega a sessão, mostra nada
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
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

  const todayCount = orders.filter(
    (o) => new Date(o.createdAt).toDateString() === new Date().toDateString()
  ).length;

  const todayRevenue = orders
    .filter(
      (o) =>
        new Date(o.createdAt).toDateString() === new Date().toDateString() &&
        o.status !== "cancelled"
    )
    .reduce((sum, o) => sum + o.totalAmount, 0);

  if (view === "new") {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto p-4 sm:p-6">
          <NewOrderForm
            onSubmit={(order) => {
              addOrder(order);
              setView("list");
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
            onUpdateStatus={(id, status) => updateStatus(id, status, user.name)}
            onDelete={(id) => {
              deleteOrder(id);
              setView("list");
            }}
            onCancel={(id) => {
              cancelOrder(id, user.name);
            }}
            onPrint={(order) => {
              printOrder(order, settings);
              markAsPrinted(order.id);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <UtensilsCrossed className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-foreground tracking-tight">{settings.storeName}</h1>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
                Painel de Controle · {user.name} · <button onClick={logout} className="text-primary hover:underline transition-colors">Sair</button>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {isAdmin && (
              <Button variant="outline" size="icon" onClick={() => setView("settings")} title="Configurações" className="rounded-xl">
                <Settings className="h-4 w-4" />
              </Button>
            )}
            <Button variant="outline" onClick={() => setView("products")} className="gap-1.5 rounded-xl">
              <Package className="h-4 w-4" /> Produtos
            </Button>
            <Button variant="outline" onClick={() => setView("customers")} className="gap-1.5 rounded-xl">
              <Users className="h-4 w-4" /> Clientes
            </Button>
            <Button onClick={() => setView("new")} className="gap-1.5 rounded-xl shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4" /> Novo Pedido
            </Button>
          </div>
        </div>

        {/* Info Bar */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-secondary/30 p-4 rounded-3xl border border-border/40 backdrop-blur-sm">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Pedidos hoje</span>
              <span className="text-xl font-black text-foreground">{todayCount}</span>
            </div>
            <div className="h-8 w-px bg-border/60 hidden sm:block" />
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Faturamento total hoje</span>
              <span className="text-xl font-black text-primary">R$ {todayRevenue.toFixed(2)}</span>
            </div>
          </div>

          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, número ou telefone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background/50 border-border/40 rounded-2xl h-11"
            />
          </div>
        </div>

        {/* Orders Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-full text-center py-24 text-muted-foreground bg-secondary/10 rounded-3xl border border-dashed border-border/60">
              <UtensilsCrossed className="h-16 w-16 mx-auto mb-4 opacity-10" />
              <p className="text-lg font-bold">Nenhum pedido encontrado</p>
              <p className="text-sm">Crie um novo pedido ou ajuste sua busca</p>
            </div>
          ) : (
            filtered.map((order) => (
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
    </div>
  );
};

export default Index;
