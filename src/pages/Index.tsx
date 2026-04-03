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
import type { Order } from "@/types/order";

type View = "list" | "new" | "detail" | "customers" | "products" | "settings";

const Index = () => {
  const { user, isAdmin, logout, isLoading: authLoading } = useAuth();
  const { orders, addOrder, updateStatus, cancelOrder, deleteOrder } = useOrders();
  const { settings } = useSettings();
  const [view, setView] = useState<View>("list");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
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
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <UtensilsCrossed className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{settings.storeName}</h1>
              <p className="text-xs text-muted-foreground">
                Olá, {user.name} · <button onClick={logout} className="underline hover:text-foreground transition-colors">Sair</button>
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <Button variant="outline" size="icon" onClick={() => setView("settings")} title="Configurações">
                <Settings className="h-4 w-4" />
              </Button>
            )}
            <Button variant="outline" onClick={() => setView("products")} className="gap-1.5">
              <Package className="h-4 w-4" /> Produtos
            </Button>
            <Button variant="outline" onClick={() => setView("customers")} className="gap-1.5">
              <Users className="h-4 w-4" /> Clientes
            </Button>
            <Button onClick={() => setView("new")} className="gap-1.5">
              <Plus className="h-4 w-4" /> Novo Pedido
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card border rounded-xl p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Pedidos hoje</p>
            <p className="text-2xl font-bold text-foreground mt-1">{todayCount}</p>
          </div>
          <div className="bg-card border rounded-xl p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Faturamento hoje</p>
            <p className="text-2xl font-bold text-primary mt-1">R$ {todayRevenue.toFixed(2)}</p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, número ou telefone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList className="w-full justify-start">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="pending">Pendentes</TabsTrigger>
              <TabsTrigger value="preparing">Preparando</TabsTrigger>
              <TabsTrigger value="delivering">Entrega</TabsTrigger>
              <TabsTrigger value="completed">Concluídos</TabsTrigger>
              <TabsTrigger value="cancelled" className="text-destructive">Cancelados</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Orders */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <UtensilsCrossed className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Nenhum pedido encontrado</p>
              <p className="text-sm mt-1">Crie um novo pedido para começar</p>
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
