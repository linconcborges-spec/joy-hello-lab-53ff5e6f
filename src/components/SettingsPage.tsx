import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Plus, Pencil, Trash2, Save, X, Eye, EyeOff, Shield, User, Download, Moon, Sun, Store, Clock, Instagram, Facebook, Phone, MapPin, Bike, ToggleLeft, ToggleRight, Printer, RefreshCw } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useEmployees, useAddEmployee, useUpdateEmployee, useDeleteEmployee } from "@/hooks/useEmployees";
import { useSettings, type BusinessHours } from "@/hooks/useSettings";
import { useOrders } from "@/hooks/useOrders";
import { useAuth } from "@/hooks/useAuth";
import { useStorage } from "@/hooks/useStorage";
import { exportOrdersToCSV, exportFullSystemBackup, importFullSystemBackup } from "@/lib/ExportService";
import { CloudUpload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SettingsPageProps {
  onBack: () => void;
}

const DAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export function SettingsPage({ onBack }: SettingsPageProps) {
  const { theme, setTheme } = useTheme();
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const { data: employees = [], isLoading: employeesLoading } = useEmployees();
  const { data: orders = [] } = useOrders();
  const addEmployee = useAddEmployee();
  const updateEmployee = useUpdateEmployee();
  const deleteEmployee = useDeleteEmployee();
  const { settings, updateSettings, isCurrentlyOpen } = useSettings();
  const [showResetDialog, setShowResetDialog] = useState(false);

  // ─── General settings state ──────────────────────────────────────────────
  const [storeName, setStoreName] = useState(settings.storeName);
  const [defaultDeliveryFee, setDefaultDeliveryFee] = useState(settings.defaultDeliveryFee);
  const [printPaperWidth, setPrintPaperWidth] = useState(settings.printPaperWidth);
  const [printMargin, setPrintMargin] = useState(settings.printMargin);
  const [printMarginTop, setPrintMarginTop] = useState(settings.printMarginTop || "0mm");
  const [printFontSize, setPrintFontSize] = useState(settings.printFontSize);
  const [targetPrinter, setTargetPrinter] = useState(settings.targetPrinter || "");
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl || "");
  const [bannerUrl, setBannerUrl] = useState(settings.bannerUrl || "");
  const [availablePrinters, setAvailablePrinters] = useState<string[]>([]);

  // ─── Digital Menu settings state ─────────────────────────────────────────
  const [menuOpen, setMenuOpen] = useState(settings.menuOpen ?? true);
  const [autoPrint, setAutoPrint] = useState(settings.autoPrint ?? false);
  const [storeAddress, setStoreAddress] = useState(settings.storeAddress || "");
  const [storePhone, setStorePhone] = useState(settings.storePhone || "");
  const [deliveryTimeMin, setDeliveryTimeMin] = useState(settings.deliveryTimeMin || 30);
  const [deliveryTimeMax, setDeliveryTimeMax] = useState(settings.deliveryTimeMax || 50);
  const [instagramUrl, setInstagramUrl] = useState(settings.instagramUrl || "");
  const [facebookUrl, setFacebookUrl] = useState(settings.facebookUrl || "");
  const [whatsappNumber, setWhatsappNumber] = useState(settings.whatsappNumber || "");
  const [businessHours, setBusinessHours] = useState<BusinessHours[]>(
    settings.businessHours && settings.businessHours.length === 7
      ? settings.businessHours
      : DAY_NAMES.map(() => ({ open: "08:00", close: "22:00", enabled: true }))
  );

  // Sync when settings load
  useEffect(() => {
    setStoreName(settings.storeName);
    setDefaultDeliveryFee(settings.defaultDeliveryFee);
    setPrintPaperWidth(settings.printPaperWidth);
    setPrintMargin(settings.printMargin);
    setPrintMarginTop(settings.printMarginTop || "0mm");
    setPrintFontSize(settings.printFontSize);
    setTargetPrinter(settings.targetPrinter || "");
    setLogoUrl(settings.logoUrl || "");
    setBannerUrl(settings.bannerUrl || "");
    setMenuOpen(settings.menuOpen ?? true);
    setAutoPrint(settings.autoPrint ?? false);
    setStoreAddress(settings.storeAddress || "");
    setStorePhone(settings.storePhone || "");
    setDeliveryTimeMin(settings.deliveryTimeMin || 30);
    setDeliveryTimeMax(settings.deliveryTimeMax || 50);
    setInstagramUrl(settings.instagramUrl || "");
    setFacebookUrl(settings.facebookUrl || "");
    setWhatsappNumber(settings.whatsappNumber || "");
    if (settings.businessHours && settings.businessHours.length === 7) {
      setBusinessHours(settings.businessHours);
    }
  }, [settings]);

  const { uploadImage, isUploading } = useStorage();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage(file);
    if (url) {
      if (type === 'logo') setLogoUrl(url);
      else setBannerUrl(url);
    }
  };

  useEffect(() => {
    const win = window as any;
    if (win.__TAURI_INTERNALS__) {
      import("@tauri-apps/api/tauri").then(({ invoke: tauriInvoke }) => {
        tauriInvoke<string[]>("get_printers").then((res) => {
          setAvailablePrinters(res);
        }).catch(console.error);
      }).catch(console.error);
    }
  }, []);

  // ─── Employee form state ──────────────────────────────────────────────────
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("user");
  const [showNewPass, setShowNewPass] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editRole, setEditRole] = useState("user");
  const [showEditPass, setShowEditPass] = useState(false);

  const handleAdd = () => {
    if (!newName.trim() || !newUsername.trim() || !newPassword.trim()) return;
    addEmployee.mutate(
      { name: newName.trim(), username: newUsername.trim().toLowerCase(), password: newPassword, role: newRole },
      { onSuccess: () => { setNewName(""); setNewUsername(""); setNewPassword(""); setNewRole("user"); setShowNew(false); } }
    );
  };

  const handleSave = (id: string) => {
    const payload: any = { id, name: editName, username: editUsername.toLowerCase(), role: editRole };
    if (editPassword.trim()) payload.password = editPassword;
    updateEmployee.mutate(payload, { onSuccess: () => setEditingId(null) });
  };

  const handleSaveGeneral = () => {
    updateSettings({ storeName, defaultDeliveryFee, printPaperWidth, printMargin, printMarginTop, printFontSize, targetPrinter, logoUrl, bannerUrl });
    toast.success("Configurações gerais salvas!");
  };

  const handleSaveDigitalMenu = () => {
    updateSettings({ menuOpen, storeAddress, storePhone, deliveryTimeMin, deliveryTimeMax, instagramUrl, facebookUrl, whatsappNumber, businessHours });
    toast.success("Menu digital atualizado!");
  };

  const startEdit = (emp: any) => {
    setEditingId(emp.id);
    setEditName(emp.name);
    setEditUsername(emp.username);
    setEditPassword("");
    setEditRole(emp.role);
    setShowEditPass(false);
  };

  const updateHour = (idx: number, field: keyof BusinessHours, value: string | boolean) => {
    setBusinessHours(prev => prev.map((h, i) => i === idx ? { ...h, [field]: value } : h));
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
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>

        <h2 className="text-xl font-bold">Configurações</h2>

        <Tabs defaultValue="general">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="general" className="gap-1.5 text-xs"><Store className="h-3.5 w-3.5" />Geral</TabsTrigger>
            <TabsTrigger value="digital" className="gap-1.5 text-xs"><Clock className="h-3.5 w-3.5" />Menu Digital</TabsTrigger>
            <TabsTrigger value="employees" className="gap-1.5 text-xs"><User className="h-3.5 w-3.5" />Equipe</TabsTrigger>
          </TabsList>

          {/* ══════════════ GENERAL TAB ══════════════ */}
          <TabsContent value="general" className="space-y-4 mt-4">
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
                      <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} />
                      <Button type="button" variant="secondary" size="icon" className="shrink-0" onClick={() => logoInputRef.current?.click()} disabled={isUploading}>
                        {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudUpload className="h-4 w-4" />}
                      </Button>
                    </div>
                    {logoUrl && (<div className="h-20 w-20 rounded-xl border overflow-hidden mt-2 bg-slate-50"><img src={logoUrl} alt="Logo" className="h-full w-full object-contain" /></div>)}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Banner de Fundo</Label>
                    <div className="flex gap-2">
                      <Input value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} placeholder="URL do Banner" className="flex-1" />
                      <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'banner')} />
                      <Button type="button" variant="secondary" size="icon" className="shrink-0" onClick={() => bannerInputRef.current?.click()} disabled={isUploading}>
                        {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudUpload className="h-4 w-4" />}
                      </Button>
                    </div>
                    {bannerUrl && (<div className="h-20 w-full rounded-xl border overflow-hidden mt-2 bg-slate-50"><img src={bannerUrl} alt="Banner" className="h-full w-full object-cover" /></div>)}
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
                        {availablePrinters.map(p => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input value={targetPrinter} onChange={(e) => setTargetPrinter(e.target.value)} placeholder="Ex: POS-58 ou XP-80C" className="border-primary/20 bg-primary/5" />
                  )}
                </div>
                <div className="sm:col-span-3 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border/40 mt-2">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={autoPrint}
                      onCheckedChange={(v) => {
                        setAutoPrint(v);
                        updateSettings({ autoPrint: v });
                        toast.success(v
                          ? "Impressão automática ativada!"
                          : "Impressão automática desativada."
                        );
                      }}
                    />
                    <div className="space-y-0.5">
                      <Label className="text-xs font-black uppercase flex items-center gap-2">
                        <Printer className="h-3 w-3" /> Impressão Automática
                      </Label>
                      <p className="text-[10px] text-muted-foreground">Imprimir novos pedidos automaticamente ao chegar</p>
                    </div>
                  </div>
                  <Button onClick={handleSaveGeneral} className="gap-1.5 w-full sm:w-auto"><Save className="h-4 w-4" /> Salvar Configurações</Button>
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
                            const serverVersion = data.version;
                            const currentVersion = __APP_VERSION__;

                            if (serverVersion !== currentVersion) {
                              toast.success(`Nova versão ${serverVersion} encontrada! Atualizando...`, { id: toastId });
                              
                              if ('serviceWorker' in navigator) {
                                const registration = await navigator.serviceWorker.getRegistration();
                                if (registration) {
                                  await registration.update();
                                  if (registration.waiting) {
                                    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                                  }
                                }
                              }
                              
                              setTimeout(() => {
                                window.location.reload();
                              }, 2000);
                            } else {
                              toast.success("Você já está na versão mais recente!", { id: toastId });
                              if ('serviceWorker' in navigator) {
                                const reg = await navigator.serviceWorker.getRegistration();
                                reg?.update();
                              }
                            }
                          } catch (err) {
                            console.error("Erro ao verificar versão:", err);
                            toast.error("Erro ao conectar com o servidor.", { id: toastId });
                          }
                        }}
                      >
                        <RefreshCw className="h-4 w-4" /> Verificar Atualizações
                      </Button>

                      <Button 
                        variant="ghost" 
                        className="gap-2 h-11 text-muted-foreground hover:text-destructive hover:bg-destructive/5 border border-transparent hover:border-destructive/20"
                        onClick={() => setShowResetDialog(true)}
                      >
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
          </TabsContent>

          {/* ══════════════ DIGITAL MENU TAB ══════════════ */}
          <TabsContent value="digital" className="space-y-4 mt-4">

            {/* Status aberto/fechado */}
            <Card className={cn("border-2 transition-colors", isCurrentlyOpen ? "border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-950/20" : "border-destructive/40 bg-red-50/30 dark:bg-red-950/10")}>
              <CardContent className="flex items-center justify-between p-5">
                <div className="space-y-1">
                  <p className="font-black text-base uppercase tracking-tight">
                    {isCurrentlyOpen ? "🟢 Loja Aberta" : "🔴 Loja Fechada"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {!menuOpen 
                      ? "A loja foi fechada manualmente por um administrador." 
                      : !isCurrentlyOpen 
                        ? "A loja está fechada automaticamente pelo horário de funcionamento." 
                        : "Clientes podem visualizar e fazer pedidos pelo menu digital."}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Switch
                    checked={menuOpen}
                    onCheckedChange={(v) => {
                      setMenuOpen(v);
                      updateSettings({ menuOpen: v });
                      toast.success(v ? "Operação ativada!" : "Operação desativada!");
                    }}
                    className="scale-125"
                  />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Controle Manual</span>
                </div>
              </CardContent>
            </Card>

            {/* Informações do estabelecimento */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-primary flex items-center gap-2"><MapPin className="h-4 w-4" /> Informações do Estabelecimento</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs">Endereço Completo</Label>
                  <Input value={storeAddress} onChange={(e) => setStoreAddress(e.target.value)} placeholder="Rua das Flores, 123 — Centro, Cidade — UF" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Telefone / WhatsApp</Label>
                  <Input value={storePhone} onChange={(e) => setStorePhone(e.target.value)} placeholder="(00) 00000-0000" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Número WhatsApp (só números, com DDI)</Label>
                  <Input value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} placeholder="5511999999999" />
                  <p className="text-[10px] text-muted-foreground">Ex: 5511999999999 (55 = Brasil + DDD + número)</p>
                </div>
              </CardContent>
            </Card>

            {/* Tempo de entrega */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-primary flex items-center gap-2"><Bike className="h-4 w-4" /> Tempo Médio de Entrega</CardTitle>
                <CardDescription className="text-xs">Exibido no topo do menu digital para os clientes.</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-3">
                <div className="space-y-1.5 flex-1">
                  <Label className="text-xs">Mínimo (min)</Label>
                  <Input type="number" min={1} value={deliveryTimeMin} onChange={(e) => setDeliveryTimeMin(parseInt(e.target.value) || 0)} placeholder="30" />
                </div>
                <div className="flex items-end pb-2 text-muted-foreground font-black text-sm">até</div>
                <div className="space-y-1.5 flex-1">
                  <Label className="text-xs">Máximo (min)</Label>
                  <Input type="number" min={1} value={deliveryTimeMax} onChange={(e) => setDeliveryTimeMax(parseInt(e.target.value) || 0)} placeholder="50" />
                </div>
                <div className="flex items-end pb-2">
                  <Badge variant="outline" className="text-xs font-black whitespace-nowrap">{deliveryTimeMin}–{deliveryTimeMax} min</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Redes Sociais */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-primary flex items-center gap-2"><Instagram className="h-4 w-4" /> Redes Sociais</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1.5"><Instagram className="h-3.5 w-3.5 text-pink-500" /> Instagram</Label>
                  <Input value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} placeholder="https://instagram.com/seu_perfil" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1.5"><Facebook className="h-3.5 w-3.5 text-blue-500" /> Facebook</Label>
                  <Input value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} placeholder="https://facebook.com/sua_pagina" />
                </div>
              </CardContent>
            </Card>

            {/* Horários de Funcionamento */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-primary flex items-center gap-2"><Clock className="h-4 w-4" /> Horários de Funcionamento</CardTitle>
                <CardDescription className="text-xs">Configure o horário de abertura e fechamento para cada dia da semana.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {DAY_NAMES.map((day, idx) => (
                  <div key={idx} className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border transition-all",
                    businessHours[idx]?.enabled ? "bg-card border-border/40" : "bg-muted/30 border-dashed opacity-60"
                  )}>
                    <Switch
                      checked={businessHours[idx]?.enabled ?? true}
                      onCheckedChange={(v) => updateHour(idx, "enabled", v)}
                    />
                    <span className={cn("text-xs font-black uppercase w-16 shrink-0", businessHours[idx]?.enabled ? "text-foreground" : "text-muted-foreground")}>
                      {day}
                    </span>
                    {businessHours[idx]?.enabled ? (
                      <>
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            type="time"
                            value={businessHours[idx]?.open || "08:00"}
                            onChange={(e) => updateHour(idx, "open", e.target.value)}
                            className="h-8 text-xs w-28"
                          />
                          <span className="text-[10px] text-muted-foreground font-bold">até</span>
                          <Input
                            type="time"
                            value={businessHours[idx]?.close || "22:00"}
                            onChange={(e) => updateHour(idx, "close", e.target.value)}
                            className="h-8 text-xs w-28"
                          />
                        </div>
                      </>
                    ) : (
                      <span className="text-[10px] text-muted-foreground uppercase font-black flex-1">Fechado</span>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSaveDigitalMenu} className="gap-1.5 w-full sm:w-auto">
                <Save className="h-4 w-4" /> Salvar Configurações do Menu
              </Button>
            </div>
          </TabsContent>

          {/* ══════════════ EMPLOYEES TAB ══════════════ */}
          <TabsContent value="employees" className="space-y-4 mt-4">
            {isAdmin && (
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold">Funcionários Cadastrados</h3>
                <Button onClick={() => setShowNew(!showNew)} className="gap-1.5"><Plus className="h-4 w-4" /> Novo Funcionário</Button>
              </div>
            )}

            {showNew && (
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base">Cadastrar Funcionário</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label className="text-xs">Nome Completo</Label><Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ex: Maria Silva" /></div>
                  <div className="space-y-1.5"><Label className="text-xs">Login</Label><Input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="Ex: maria" /></div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Senha</Label>
                    <div className="relative">
                      <Input type={showNewPass ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Senha de acesso" className="pr-10" />
                      <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowNewPass(!showNewPass)} tabIndex={-1}>
                        {showNewPass ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Papel</Label>
                    <Select value={newRole} onValueChange={setNewRole}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Usuário</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2 flex justify-end">
                    <Button onClick={handleAdd} disabled={addEmployee.isPending || !newName.trim() || !newUsername.trim() || !newPassword.trim()}>Salvar</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-0">
                {authLoading || employeesLoading ? (
                  <p className="text-center py-8 text-muted-foreground">Carregando...</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Login</TableHead>
                        <TableHead>Papel</TableHead>
                        <TableHead className="w-28">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employees
                        .filter(emp => isAdmin || emp.id === user?.id)
                        .map((emp) => (
                        <TableRow key={emp.id}>
                          <TableCell>{editingId === emp.id ? <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8" /> : emp.name}</TableCell>
                          <TableCell>{editingId === emp.id ? <Input value={editUsername} onChange={(e) => setEditUsername(e.target.value)} className="h-8" /> : <span className="font-mono text-sm">{emp.username}</span>}</TableCell>
                          <TableCell>
                            {editingId === emp.id ? (
                              <Select value={editRole} onValueChange={setEditRole}>
                                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user">Usuário</SelectItem>
                                  <SelectItem value="admin">Administrador</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge variant={emp.role === "admin" ? "default" : "secondary"} className="gap-1">
                                {emp.role === "admin" ? <Shield className="h-3 w-3" /> : <User className="h-3 w-3" />}
                                {emp.role === "admin" ? "Admin" : "Usuário"}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {editingId === emp.id ? (
                                <>
                                  <div className="flex items-center gap-1">
                                    <div className="relative">
                                      <Input type={showEditPass ? "text" : "password"} value={editPassword} onChange={(e) => setEditPassword(e.target.value)} placeholder="Nova senha (vazio = manter)" className="h-8 w-40 pr-8 text-xs" />
                                      <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full w-8 hover:bg-transparent" onClick={() => setShowEditPass(!showEditPass)} tabIndex={-1}>
                                        {showEditPass ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                      </Button>
                                    </div>
                                  </div>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleSave(emp.id)}><Save className="h-3.5 w-3.5" /></Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingId(null)}><X className="h-3.5 w-3.5" /></Button>
                                </>
                              ) : (
                                <>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(emp)}><Pencil className="h-3.5 w-3.5" /></Button>
                                  {isAdmin && (
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Remover funcionário?</AlertDialogTitle>
                                          <AlertDialogDescription>O acesso de "{emp.name}" ({emp.username}) será removido permanentemente.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => deleteEmployee.mutate(emp.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Sim, remover</AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  )}
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {employees.length === 0 && (
                        <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nenhum funcionário cadastrado</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent className="rounded-[2rem] border-0">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black uppercase italic tracking-tighter">
              Atenção Total! 🚨
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium">
              Isso limpará todos os caches e dados locais do seu navegador. 
              Você será desconectado e o sistema será reiniciado do zero. 
              Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="rounded-xl border-slate-100 font-bold uppercase text-[10px]">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              className="rounded-xl bg-destructive hover:bg-destructive/90 font-black uppercase text-[10px] italic tracking-widest shadow-lg shadow-destructive/20"
              onClick={async () => {
                const tId = toast.loading("Limpando tudo...");
                
                try {
                  // 1. Limpa caches
                  if ('caches' in window) {
                    const keys = await caches.keys();
                    for (const key of keys) await caches.delete(key);
                  }
                  
                  // 2. Desregistra SW
                  if ('serviceWorker' in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistration();
                    for (const reg of registrations) await reg.unregister();
                  }
                  
                  // 3. Limpa storage
                  localStorage.clear();
                  sessionStorage.clear();
                  
                  toast.success("Limpeza concluída!", { id: tId });
                  
                  // 4. Reload forçado
                  setTimeout(() => {
                    window.location.href = window.location.origin + '?reset=' + Date.now();
                  }, 1000);
                } catch (err) {
                  toast.error("Erro na limpeza profunda.", { id: tId });
                }
              }}
            >
              Sim, Redefinir Agora
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
