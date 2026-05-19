import { useRef } from "react";
import { Save, Download, Plus, Trash2, RefreshCw, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CloudUpload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { exportOrdersToCSV, exportFullSystemBackup, importFullSystemBackup } from "@/lib/ExportService";
import type { Order } from "@/types/order";

interface GeneralSettingsTabProps {
  storeName: string; setStoreName: (v: string) => void;
  defaultDeliveryFee: number; setDefaultDeliveryFee: (v: number) => void;
  printPaperWidth: string; setPrintPaperWidth: (v: string) => void;
  printMargin: string; setPrintMargin: (v: string) => void;
  printMarginTop: string; setPrintMarginTop: (v: string) => void;
  printFontSize: string; setPrintFontSize: (v: string) => void;
  targetPrinter: string; setTargetPrinter: (v: string) => void;
  logoUrl: string; setLogoUrl: (v: string) => void;
  bannerUrl: string; setBannerUrl: (v: string) => void;
  autoPrint: boolean;
  availablePrinters: string[];
  isUploading: boolean;
  isAdmin: boolean;
  orders: Order[];
  onSaveGeneral: () => void;
  onAutoPrintChange: (v: boolean) => void;
  onUploadImage: (file: File) => Promise<string | null>;
  onShowReset: () => void;
}

export function GeneralSettingsTab({
  storeName, setStoreName,
  defaultDeliveryFee, setDefaultDeliveryFee,
  printPaperWidth, setPrintPaperWidth,
  printMargin, setPrintMargin,
  printMarginTop, setPrintMarginTop,
  printFontSize, setPrintFontSize,
  targetPrinter, setTargetPrinter,
  logoUrl, setLogoUrl,
  bannerUrl, setBannerUrl,
  autoPrint,
  availablePrinters,
  isUploading,
  isAdmin,
  orders,
  onSaveGeneral,
  onAutoPrintChange,
  onUploadImage,
  onShowReset,
}: GeneralSettingsTabProps) {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "banner") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await onUploadImage(file);
    if (url) {
      if (type === "logo") setLogoUrl(url);
      else setBannerUrl(url);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        importFullSystemBackup(json);
      } catch {
        toast.error("Formato de arquivo inválido. Use o backup .json");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-primary">Estabelecimento</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Nome do Estabelecimento</Label>
            <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Ex: Império Chiclets" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Taxa de Entrega Padrão (R$)</Label>
            <Input type="number" step="0.01" min={0} value={defaultDeliveryFee === 0 ? "" : defaultDeliveryFee} onChange={(e) => setDefaultDeliveryFee(parseFloat(e.target.value) || 0)} placeholder="0.00" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-primary">Identidade Visual (Cardápio)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Logo da Loja</Label>
              <div className="flex gap-2">
                <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="URL da Logo" className="flex-1" />
                <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, "logo")} />
                <Button type="button" variant="secondary" size="icon" className="shrink-0" onClick={() => logoInputRef.current?.click()} disabled={isUploading}>
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudUpload className="h-4 w-4" />}
                </Button>
              </div>
              {logoUrl && <div className="h-20 w-20 rounded-xl border overflow-hidden mt-2 bg-slate-50"><img src={logoUrl} alt="Logo" className="h-full w-full object-contain" /></div>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Banner de Fundo</Label>
              <div className="flex gap-2">
                <Input value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} placeholder="URL do Banner" className="flex-1" />
                <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, "banner")} />
                <Button type="button" variant="secondary" size="icon" className="shrink-0" onClick={() => bannerInputRef.current?.click()} disabled={isUploading}>
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudUpload className="h-4 w-4" />}
                </Button>
              </div>
              {bannerUrl && <div className="h-20 w-full rounded-xl border overflow-hidden mt-2 bg-slate-50"><img src={bannerUrl} alt="Banner" className="h-full w-full object-cover" /></div>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-primary">Configurações de Impressão</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Largura do Papel (ex: 80mm)</Label>
            <Input value={printPaperWidth} onChange={(e) => setPrintPaperWidth(e.target.value)} placeholder="80mm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-primary">Espaço Superior (ex: 3cm)</Label>
            <Input value={printMarginTop} onChange={(e) => setPrintMarginTop(e.target.value)} placeholder="3cm ou 30mm" className="border-primary/20" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Margens Laterais (ex: 0mm)</Label>
            <Input value={printMargin} onChange={(e) => setPrintMargin(e.target.value)} placeholder="0mm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Tamanho da Fonte (ex: 14px)</Label>
            <Input value={printFontSize} onChange={(e) => setPrintFontSize(e.target.value)} placeholder="14px" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs font-bold text-primary">Impressora de Destino</Label>
            {availablePrinters.length > 0 ? (
              <Select value={targetPrinter || "default"} onValueChange={(v) => setTargetPrinter(v === "default" ? "" : v)}>
                <SelectTrigger className="border-primary/20 bg-primary/5 font-medium"><SelectValue placeholder="Selecione a impressora..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="default" className="italic font-bold text-muted-foreground">- IMPRESSORA PADRÃO DO WINDOWS -</SelectItem>
                  {availablePrinters.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <Input value={targetPrinter} onChange={(e) => setTargetPrinter(e.target.value)} placeholder="Ex: POS-58 ou XP-80C" className="border-primary/20 bg-primary/5" />
            )}
          </div>
          <div className="sm:col-span-3 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border/40 mt-2">
            <div className="flex items-center gap-3">
              <Switch checked={autoPrint} onCheckedChange={onAutoPrintChange} />
              <div className="space-y-0.5">
                <Label className="text-xs font-black uppercase flex items-center gap-2">
                  <Printer className="h-3 w-3" /> Impressão Automática
                </Label>
                <p className="text-[10px] text-muted-foreground">Imprimir novos pedidos automaticamente ao chegar</p>
              </div>
            </div>
            <Button onClick={onSaveGeneral} className="gap-1.5 w-full sm:w-auto"><Save className="h-4 w-4" /> Salvar Configurações</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-primary">Sistema e Versão</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-orange-500/5 border border-orange-500/20">
            <div className="space-y-1">
              <p className="text-sm font-bold text-orange-600">Versão Atual</p>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-tight">v{__APP_VERSION__}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="gap-2 h-11 border-orange-500/30 text-orange-600 hover:bg-orange-500/10"
                onClick={async () => {
                  const toastId = "pwa-update";
                  toast.info("Verificando versão no servidor...", { id: toastId });
                  try {
                    const response = await fetch(`/version.json?t=${Date.now()}`);
                    const data = await response.json();
                    if (data.version !== __APP_VERSION__) {
                      toast.success(`Nova versão ${data.version} encontrada! Atualizando...`, { id: toastId });
                      if ("serviceWorker" in navigator) {
                        const reg = await navigator.serviceWorker.getRegistration();
                        if (reg) { await reg.update(); if (reg.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" }); }
                      }
                      setTimeout(() => window.location.reload(), 2000);
                    } else {
                      toast.success("Você já está na versão mais recente!", { id: toastId });
                      if ("serviceWorker" in navigator) { const reg = await navigator.serviceWorker.getRegistration(); reg?.update(); }
                    }
                  } catch { toast.error("Erro ao conectar com o servidor.", { id: toastId }); }
                }}
              >
                <RefreshCw className="h-4 w-4" /> Verificar Atualizações
              </Button>
              <Button variant="ghost" className="gap-2 h-11 text-muted-foreground hover:text-destructive hover:bg-destructive/5 border border-transparent hover:border-destructive/20" onClick={onShowReset}>
                <Trash2 className="h-4 w-4" /> Redefinir App
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isAdmin && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-primary">Backup e Manutenção</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div className="space-y-1">
                <p className="text-sm font-bold text-primary">Backup Completo do Sistema</p>
                <p className="text-xs text-muted-foreground">Baixe toda a base de dados para um arquivo JSON seguro.</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button onClick={() => exportFullSystemBackup()} className="gap-2 h-11 bg-primary hover:bg-primary/90"><Download className="h-4 w-4" /> Exportar JSON</Button>
                <div className="relative">
                  <input type="file" accept=".json" onChange={handleImport} className="absolute inset-0 opacity-0 cursor-pointer" title="Importar Backup" />
                  <Button variant="outline" className="gap-2 h-11 border-primary/30"><Plus className="h-4 w-4" /> Importar JSON</Button>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-secondary/20 border border-border/40">
              <div className="space-y-1">
                <p className="text-sm font-bold">Relatório de Pedidos (CSV)</p>
                <p className="text-xs text-muted-foreground">Baixe o resumo dos pedidos atuais para o Excel.</p>
              </div>
              <Button variant="outline" onClick={() => exportOrdersToCSV(orders)} disabled={orders.length === 0} className="gap-2 shrink-0 border-primary/20 hover:bg-primary/5 h-11"><Download className="h-4 w-4" /> Exportar CSV</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
