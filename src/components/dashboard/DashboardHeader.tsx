import {
  UtensilsCrossed, Users, Package, Settings, Clock,
  LayoutDashboard, ExternalLink, Sun, Moon,
  Calendar as CalendarIcon, Search, Plus, BarChart2, MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DashboardHeaderProps {
  storeName: string;
  userName: string;
  theme: string | undefined;
  onThemeToggle: () => void;
  onLogout: () => void;
  isAdmin: boolean;
  todayCount: number;
  todayRevenue: number;
  showRevenue: boolean;
  onToggleRevenue: () => void;
  search: string;
  setSearch: (v: string) => void;
  isHistoryView: boolean;
  onToggleHistoryView: () => void;
  dateRange: { from: Date | undefined; to: Date | undefined };
  setDateRange: (r: any) => void;
  onNavigate: (view: "new" | "customers" | "products" | "settings" | "chat") => void;
  onOpenFinancialDashboard: () => void;
  chatUnread?: number;
}

export function DashboardHeader({
  storeName, userName, theme, onThemeToggle, onLogout,
  isAdmin, todayCount, todayRevenue, showRevenue, onToggleRevenue,
  search, setSearch,
  isHistoryView, onToggleHistoryView,
  dateRange, setDateRange,
  onNavigate,
  onOpenFinancialDashboard,
  chatUnread = 0,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 text-center lg:text-left">
      <div className="flex flex-col lg:flex-row items-center gap-4">
        <div className="h-16 w-16 rounded-3xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/30 transform hover:rotate-3 transition-transform">
          <UtensilsCrossed className="h-8 w-8 text-primary-foreground" />
        </div>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">{storeName}</h1>
          <div className="flex items-center justify-center lg:justify-start gap-4">
            <Badge variant="outline" className="text-[9px] uppercase font-black tracking-widest px-2">{userName}</Badge>
            <button
              onClick={onThemeToggle}
              className="flex items-center justify-center h-8 w-8 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
              title={theme === "light" ? "Mudar para modo escuro" : "Mudar para modo claro"}
            >
              {theme === "light" ? <Moon className="h-4 w-4 text-slate-700" /> : <Sun className="h-4 w-4 text-yellow-500" />}
            </button>
            <button onClick={onLogout} className="text-primary hover:text-primary/70 text-[10px] font-bold uppercase underline underline-offset-4 decoration-2">Sair do Sistema</button>
          </div>
        </div>
      </div>

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
                onClick={onToggleRevenue}
                className={`text-xl font-black text-primary leading-none transition-all duration-500 tabular-nums cursor-pointer select-none ${!showRevenue ? "blur-sm opacity-20" : ""}`}
              >
                R$ {todayRevenue.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          variant={isHistoryView ? "default" : "outline"}
          size="icon"
          onClick={onToggleHistoryView}
          title={isHistoryView ? "Painel Operacional" : "Histórico"}
          className="h-12 w-12 rounded-2xl bg-card border-border/40 shadow-sm transition-all active:scale-90"
        >
          {isHistoryView ? <LayoutDashboard className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
        </Button>

        <Button variant="outline" size="icon" onClick={() => onNavigate("customers")} title="Clientes" className="h-12 w-12 rounded-2xl bg-card border-border/40 shadow-sm transition-all active:scale-90">
          <Users className="h-5 w-5" />
        </Button>

        <Button variant="outline" size="icon" onClick={() => onNavigate("products")} title="Produtos" className="h-12 w-12 rounded-2xl bg-card border-border/40 shadow-sm transition-all active:scale-90">
          <Package className="h-5 w-5" />
        </Button>

        <Button variant="outline" size="icon" onClick={() => onNavigate("settings")} title="Configurações" className="h-12 w-12 rounded-2xl bg-card border-border/40 shadow-sm transition-all active:scale-90">
          <Settings className="h-5 w-5" />
        </Button>

        <div className="relative">
          <Button variant="outline" size="icon" onClick={() => onNavigate("chat")} title="Chat com clientes" className="h-12 w-12 rounded-2xl bg-card border-border/40 shadow-sm transition-all active:scale-90 text-green-600 border-green-200 hover:bg-green-50">
            <MessageCircle className="h-5 w-5" />
          </Button>
          {chatUnread > 0 && (
            <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-green-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-background pointer-events-none">
              {chatUnread > 9 ? "9+" : chatUnread}
            </span>
          )}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => window.open("/cardapio", "_blank")}
          title="Abrir Menu Virtual"
          className="h-12 w-12 rounded-2xl bg-card border-border/40 shadow-sm transition-all active:scale-90 text-primary border-primary/30 hover:bg-primary/5"
        >
          <ExternalLink className="h-5 w-5" />
        </Button>

        {isAdmin && (
          <Button
            variant="outline"
            size="icon"
            onClick={onOpenFinancialDashboard}
            title="Dashboard Financeiro"
            className="h-12 w-12 rounded-2xl bg-card border-border/40 shadow-sm transition-all active:scale-90"
          >
            <BarChart2 className="h-5 w-5" />
          </Button>
        )}

        <div className="hidden lg:block h-10 w-px bg-border/20 mx-1" />

        <Button onClick={() => onNavigate("new")} className="hidden lg:flex h-14 rounded-2xl px-8 shadow-xl shadow-primary/20 font-black uppercase text-xs gap-3 transform hover:-translate-y-0.5 transition-transform">
          <Plus className="h-5 w-5" /> Novo Pedido
        </Button>
      </div>
    </div>
  );
}
