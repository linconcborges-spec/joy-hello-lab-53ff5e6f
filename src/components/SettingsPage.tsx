import { useState, useEffect } from "react";
import { ArrowLeft, Store, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useEmployees, useAddEmployee, useUpdateEmployee, useDeleteEmployee } from "@/hooks/useEmployees";
import { useSettings, type BusinessHours } from "@/hooks/useSettings";
import { useOrders } from "@/hooks/useOrders";
import { useAuth } from "@/hooks/useAuth";
import { useStorage } from "@/hooks/useStorage";
import { toast } from "sonner";
import { GeneralSettingsTab } from "@/components/settings/GeneralSettingsTab";
import { DigitalMenuTab } from "@/components/settings/DigitalMenuTab";
import { EmployeesTab } from "@/components/settings/EmployeesTab";

interface SettingsPageProps {
  onBack: () => void;
}

export function SettingsPage({ onBack }: SettingsPageProps) {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const { data: employees = [], isLoading: employeesLoading } = useEmployees();
  const { data: orders = [] } = useOrders();
  const addEmployee = useAddEmployee();
  const updateEmployee = useUpdateEmployee();
  const deleteEmployee = useDeleteEmployee();
  const { settings, updateSettings, isCurrentlyOpen } = useSettings();
  const { uploadImage, isUploading } = useStorage();
  const [showResetDialog, setShowResetDialog] = useState(false);

  // ─── General settings state ──────────────────────────────────────────────
  const [storeName, setStoreName] = useState(settings.storeName);
  const [defaultDeliveryFee, setDefaultDeliveryFee] = useState(settings.defaultDeliveryFee);
  const [printPaperWidth, setPrintPaperWidth] = useState(settings.printPaperWidth);
  const [printMargin, setPrintMargin] = useState(settings.printMargin);
  const [printMarginTop, setPrintMarginTop] = useState(settings.printMarginTop || "0mm");
  const [printFontSize, setPrintFontSize] = useState(settings.printFontSize);
  const [targetPrinter, setTargetPrinter] = useState(settings.targetPrinter || "");
  const [publicUrl, setPublicUrl] = useState(settings.publicUrl || "");
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl || "");
  const [bannerUrl, setBannerUrl] = useState(settings.bannerUrl || "");
  const [autoPrint, setAutoPrint] = useState(settings.autoPrint ?? false);
  const [availablePrinters, setAvailablePrinters] = useState<string[]>([]);

  // ─── Digital menu state ───────────────────────────────────────────────────
  const [menuOpen, setMenuOpen] = useState(settings.menuOpen ?? true);
  const [storeAddress, setStoreAddress] = useState(settings.storeAddress || "");
  const [storePhone, setStorePhone] = useState(settings.storePhone || "");
  const [deliveryTimeMin, setDeliveryTimeMin] = useState(settings.deliveryTimeMin || 30);
  const [deliveryTimeMax, setDeliveryTimeMax] = useState(settings.deliveryTimeMax || 50);
  const [instagramUrl, setInstagramUrl] = useState(settings.instagramUrl || "");
  const [facebookUrl, setFacebookUrl] = useState(settings.facebookUrl || "");
  const [whatsappNumber, setWhatsappNumber] = useState(settings.whatsappNumber || "");
  const [businessHours, setBusinessHours] = useState<BusinessHours[]>(
    settings.businessHours?.length === 7
      ? settings.businessHours
      : Array.from({ length: 7 }, () => ({ open: "08:00", close: "22:00", enabled: true }))
  );

  // Sync all state when settings load from DB
  useEffect(() => {
    setStoreName(settings.storeName);
    setDefaultDeliveryFee(settings.defaultDeliveryFee);
    setPrintPaperWidth(settings.printPaperWidth);
    setPrintMargin(settings.printMargin);
    setPrintMarginTop(settings.printMarginTop || "0mm");
    setPrintFontSize(settings.printFontSize);
    setTargetPrinter(settings.targetPrinter || "");
    setPublicUrl(settings.publicUrl || "");
    setLogoUrl(settings.logoUrl || "");
    setBannerUrl(settings.bannerUrl || "");
    setAutoPrint(settings.autoPrint ?? false);
    setMenuOpen(settings.menuOpen ?? true);
    setStoreAddress(settings.storeAddress || "");
    setStorePhone(settings.storePhone || "");
    setDeliveryTimeMin(settings.deliveryTimeMin || 30);
    setDeliveryTimeMax(settings.deliveryTimeMax || 50);
    setInstagramUrl(settings.instagramUrl || "");
    setFacebookUrl(settings.facebookUrl || "");
    setWhatsappNumber(settings.whatsappNumber || "");
    if (settings.businessHours?.length === 7) setBusinessHours(settings.businessHours);
  }, [settings]);

  // Detect available Tauri printers
  useEffect(() => {
    const win = window as any;
    if (win.__TAURI_INTERNALS__) {
      import("@tauri-apps/api/tauri").then(({ invoke: tauriInvoke }) => {
        tauriInvoke<string[]>("get_printers").then(setAvailablePrinters).catch(console.error);
      }).catch(console.error);
    }
  }, []);

  const handleSaveGeneral = () => {
    updateSettings({ storeName, defaultDeliveryFee, printPaperWidth, printMargin, printMarginTop, printFontSize, targetPrinter, publicUrl, logoUrl, bannerUrl });
    toast.success("Configurações gerais salvas!");
  };

  const handleSaveDigitalMenu = () => {
    updateSettings({ menuOpen, storeAddress, storePhone, deliveryTimeMin, deliveryTimeMax, instagramUrl, facebookUrl, whatsappNumber, businessHours });
    toast.success("Menu digital atualizado!");
  };

  const handleHourChange = (idx: number, field: keyof BusinessHours, value: string | boolean) => {
    setBusinessHours(prev => prev.map((h, i) => i === idx ? { ...h, [field]: value } : h));
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

          <TabsContent value="general" className="mt-4">
            <GeneralSettingsTab
              storeName={storeName} setStoreName={setStoreName}
              defaultDeliveryFee={defaultDeliveryFee} setDefaultDeliveryFee={setDefaultDeliveryFee}
              printPaperWidth={printPaperWidth} setPrintPaperWidth={setPrintPaperWidth}
              printMargin={printMargin} setPrintMargin={setPrintMargin}
              printMarginTop={printMarginTop} setPrintMarginTop={setPrintMarginTop}
              printFontSize={printFontSize} setPrintFontSize={setPrintFontSize}
              targetPrinter={targetPrinter} setTargetPrinter={setTargetPrinter}
              publicUrl={publicUrl} setPublicUrl={setPublicUrl}
              logoUrl={logoUrl} setLogoUrl={setLogoUrl}
              bannerUrl={bannerUrl} setBannerUrl={setBannerUrl}
              autoPrint={autoPrint}
              availablePrinters={availablePrinters}
              isUploading={isUploading}
              isAdmin={isAdmin}
              orders={orders}
              onSaveGeneral={handleSaveGeneral}
              onAutoPrintChange={(v) => { setAutoPrint(v); updateSettings({ autoPrint: v }); toast.success(v ? "Impressão automática ativada!" : "Impressão automática desativada."); }}
              onUploadImage={uploadImage}
              onShowReset={() => setShowResetDialog(true)}
            />
          </TabsContent>

          <TabsContent value="digital" className="mt-4">
            <DigitalMenuTab
              menuOpen={menuOpen} setMenuOpen={setMenuOpen}
              storeAddress={storeAddress} setStoreAddress={setStoreAddress}
              storePhone={storePhone} setStorePhone={setStorePhone}
              deliveryTimeMin={deliveryTimeMin} setDeliveryTimeMin={setDeliveryTimeMin}
              deliveryTimeMax={deliveryTimeMax} setDeliveryTimeMax={setDeliveryTimeMax}
              instagramUrl={instagramUrl} setInstagramUrl={setInstagramUrl}
              facebookUrl={facebookUrl} setFacebookUrl={setFacebookUrl}
              whatsappNumber={whatsappNumber} setWhatsappNumber={setWhatsappNumber}
              businessHours={businessHours}
              isCurrentlyOpen={isCurrentlyOpen}
              onHourChange={handleHourChange}
              onMenuOpenChange={(v) => { setMenuOpen(v); updateSettings({ menuOpen: v }); toast.success(v ? "Operação ativada!" : "Operação desativada!"); }}
              onSave={handleSaveDigitalMenu}
            />
          </TabsContent>

          <TabsContent value="employees" className="mt-4">
            <EmployeesTab
              isAdmin={isAdmin}
              currentUserId={user?.id}
              employees={employees}
              employeesLoading={employeesLoading}
              authLoading={authLoading}
              onAdd={(data) => addEmployee.mutate(data)}
              onUpdate={(data) => updateEmployee.mutate(data)}
              onDelete={(data) => deleteEmployee.mutate(data)}
              isAddPending={addEmployee.isPending}
            />
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent className="rounded-[2rem] border-0">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black uppercase italic tracking-tighter">Atenção Total! 🚨</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium">
              Isso limpará todos os caches e dados locais do seu navegador.
              Você será desconectado e o sistema será reiniciado do zero.
              Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="rounded-xl border-slate-100 font-bold uppercase text-[10px]">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive hover:bg-destructive/90 font-black uppercase text-[10px] italic tracking-widest shadow-lg shadow-destructive/20"
              onClick={async () => {
                const tId = toast.loading("Limpando tudo...");
                try {
                  if ("caches" in window) { const keys = await caches.keys(); for (const key of keys) await caches.delete(key); }
                  if ("serviceWorker" in navigator) { const regs = await navigator.serviceWorker.getRegistrations(); for (const reg of regs) await reg.unregister(); }
                  localStorage.clear();
                  sessionStorage.clear();
                  toast.success("Limpeza concluída!", { id: tId });
                  setTimeout(() => { window.location.href = window.location.origin + "?reset=" + Date.now(); }, 1000);
                } catch { toast.error("Erro na limpeza profunda.", { id: tId }); }
              }}
            >
              Sim, Redefinir Agora
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
