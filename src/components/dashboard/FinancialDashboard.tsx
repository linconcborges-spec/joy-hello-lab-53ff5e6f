import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useOrders } from "@/hooks/useOrders";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrendingUp, ShoppingBag, Banknote, Receipt } from "lucide-react";

interface FinancialDashboardProps {
  open: boolean;
  onClose: () => void;
}

const PAYMENT_COLORS = { cash: "#f59e0b", card: "#6366f1", pix: "#10b981" };
const PAYMENT_LABELS = { cash: "Dinheiro", card: "Cartão", pix: "PIX" };
const BAR_COLOR = "hsl(var(--primary))";

export function FinancialDashboard({ open, onClose }: FinancialDashboardProps) {
  const start = subDays(new Date(), 29).toISOString();
  const end = new Date().toISOString();
  const { data: orders = [] } = useOrders(start, end);

  const activeOrders = useMemo(() => orders.filter(o => o.status !== "cancelled"), [orders]);

  // Revenue + count per day (last 7 days)
  const dailyData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      return { label: format(d, "EEE", { locale: ptBR }), date: format(d, "yyyy-MM-dd"), revenue: 0, orders: 0 };
    });
    activeOrders.forEach(o => {
      const day = o.createdAt.slice(0, 10);
      const found = days.find(d => d.date === day);
      if (found) { found.revenue += o.totalAmount; found.orders += 1; }
    });
    return days.map(d => ({ ...d, revenue: parseFloat(d.revenue.toFixed(2)) }));
  }, [activeOrders]);

  // Top 8 products by quantity
  const topProducts = useMemo(() => {
    const map: Record<string, { qty: number; revenue: number }> = {};
    activeOrders.forEach(o =>
      o.items.forEach(item => {
        if (!map[item.product]) map[item.product] = { qty: 0, revenue: 0 };
        map[item.product].qty += item.quantity;
        map[item.product].revenue += item.total;
      })
    );
    return Object.entries(map)
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8);
  }, [activeOrders]);

  // Payment breakdown
  const paymentData = useMemo(() => {
    const map: Record<string, { count: number; revenue: number }> = { cash: { count: 0, revenue: 0 }, card: { count: 0, revenue: 0 }, pix: { count: 0, revenue: 0 } };
    activeOrders.forEach(o => {
      const m = o.paymentMethod as keyof typeof map;
      if (map[m]) { map[m].count += 1; map[m].revenue += o.totalAmount; }
    });
    return Object.entries(map)
      .filter(([, v]) => v.count > 0)
      .map(([key, v]) => ({ key, label: PAYMENT_LABELS[key as keyof typeof PAYMENT_LABELS], ...v, color: PAYMENT_COLORS[key as keyof typeof PAYMENT_COLORS] }));
  }, [activeOrders]);

  const totalRevenue = activeOrders.reduce((s, o) => s + o.totalAmount, 0);
  const totalOrders = activeOrders.length;
  const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const todayRevenue = dailyData.at(-1)?.revenue ?? 0;

  const MetricCard = ({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub?: string }) => (
    <div className="bg-card rounded-2xl border border-border/40 p-4 space-y-2">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4 opacity-60" />
        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{label}</span>
      </div>
      <p className="text-2xl font-black text-foreground tracking-tighter">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground font-medium">{sub}</p>}
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-2xl font-black uppercase italic tracking-tighter">Dashboard Financeiro</SheetTitle>
          <p className="text-xs text-muted-foreground font-medium uppercase">Últimos 30 dias • pedidos concluídos</p>
        </SheetHeader>

        {/* Métricas */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <MetricCard icon={Banknote} label="Faturamento Total" value={`R$ ${totalRevenue.toFixed(2)}`} sub="30 dias" />
          <MetricCard icon={ShoppingBag} label="Total de Pedidos" value={String(totalOrders)} sub="30 dias" />
          <MetricCard icon={Receipt} label="Ticket Médio" value={`R$ ${avgTicket.toFixed(2)}`} />
          <MetricCard icon={TrendingUp} label="Hoje" value={`R$ ${todayRevenue.toFixed(2)}`} sub={`${dailyData.at(-1)?.orders ?? 0} pedidos`} />
        </div>

        {/* Faturamento por dia */}
        <div className="bg-card rounded-2xl border border-border/40 p-4 mb-6">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-4">Faturamento — Últimos 7 Dias</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={dailyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${v}`} />
              <Tooltip
                formatter={(v: number) => [`R$ ${v.toFixed(2)}`, "Faturamento"]}
                contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", fontSize: 11, fontWeight: 700 }}
              />
              <Bar dataKey="revenue" fill={BAR_COLOR} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Forma de pagamento */}
        {paymentData.length > 0 && (
          <div className="bg-card rounded-2xl border border-border/40 p-4 mb-6">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-4">Formas de Pagamento</p>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie data={paymentData} dataKey="count" cx="50%" cy="50%" outerRadius={50} innerRadius={28}>
                    {paymentData.map((entry) => <Cell key={entry.key} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {paymentData.map(p => (
                  <div key={p.key} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
                      <span className="font-bold uppercase">{p.label}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black">{p.count} ped.</span>
                      <span className="text-muted-foreground ml-2">R$ {p.revenue.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Top produtos */}
        {topProducts.length > 0 && (
          <div className="bg-card rounded-2xl border border-border/40 p-4">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-4">Produtos Mais Vendidos</p>
            <div className="space-y-2">
              {topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="text-[10px] font-black w-5 text-center opacity-40">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold uppercase truncate">{p.name}</span>
                      <span className="text-xs font-black text-primary ml-2 shrink-0">{p.qty}x</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(p.qty / (topProducts[0]?.qty || 1)) * 100}%`, background: "hsl(var(--primary))" }}
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium w-16 text-right shrink-0">R$ {p.revenue.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
