import { Plus, Phone, MapPin, Search, PackageCheck, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { AppSettings } from "@/hooks/useSettings";

interface OrderFormCustomerSectionProps {
  phone: string;
  setPhone: (v: string) => void;
  customerName: string;
  setCustomerName: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
  customerAddresses: string[];
  setCustomerAddresses: (v: string[]) => void;
  cnpj: string;
  setCnpj: (v: string) => void;
  isPickup: boolean;
  setIsPickup: (v: boolean) => void;
  setDeliveryFee: (v: number) => void;
  settings: AppSettings;
  addCustomerPending: boolean;
  onPhoneSearch: () => void;
  onOpenCustomerSearch: () => void;
  onQuickRegister: () => void;
  onClearCustomer: () => void;
}

const formatCpfCnpj = (value: string) => {
  const v = value.replace(/\D/g, "");
  if (v.length <= 11) {
    return v
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return v
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
    .slice(0, 18);
};

export function OrderFormCustomerSection({
  phone, setPhone,
  customerName, setCustomerName,
  address, setAddress,
  customerAddresses, setCustomerAddresses,
  cnpj, setCnpj,
  isPickup, setIsPickup,
  setDeliveryFee,
  settings,
  addCustomerPending,
  onPhoneSearch,
  onOpenCustomerSearch,
  onQuickRegister,
  onClearCustomer,
}: OrderFormCustomerSectionProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="uppercase">Dados do Cliente</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Busca por Telefone */}
        <div className="flex gap-2 items-end sticky top-0 bg-background/80 backdrop-blur-sm z-10 py-1">
          <div className="space-y-1.5 flex-1">
            <Label htmlFor="phone-search" className="uppercase font-black text-xs">Telefone / Identificação</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
              <Input
                id="phone-search"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(00) 00000-0000"
                className="pl-10 uppercase"
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onPhoneSearch(); } }}
              />
            </div>
          </div>
          <Button type="button" variant="secondary" onClick={onPhoneSearch} className="gap-1.5 h-10 uppercase font-black text-xs">
            <Search className="h-4 w-4" /> Buscar
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onClearCustomer}
            className="h-10 w-10 border-destructive/20 text-destructive hover:bg-destructive/10 shrink-0"
            title="Limpar Cliente"
          >
            <Eraser className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="uppercase font-black text-xs">Nome do Cliente</Label>
            <Input id="name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="NOME COMPLETO" className="uppercase placeholder:normal-case" />
          </div>

          {!isPickup && (
            <div className="space-y-1.5">
              <Label htmlFor="cnpj" className="uppercase font-black text-xs">CPF/CNPJ (Opcional)</Label>
              <Input id="cnpj" value={cnpj} onChange={(e) => setCnpj(formatCpfCnpj(e.target.value))} placeholder="000.000.000-00" />
            </div>
          )}

          {!isPickup && customerAddresses.length > 0 && (
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="uppercase font-black text-xs">Endereços Salvos</Label>
              <Select
                value={customerAddresses.includes(address) ? address : (address === "" ? "" : "new_address")}
                onValueChange={(val) => {
                  if (val === "new_address") {
                    setAddress("");
                    setTimeout(() => document.getElementById("address")?.focus(), 50);
                  } else {
                    setAddress(val);
                  }
                }}
              >
                <SelectTrigger className="bg-muted/30">
                  <SelectValue placeholder="SELECIONE UM ENDEREÇO SALVO OU ADICIONE..." />
                </SelectTrigger>
                <SelectContent>
                  {customerAddresses.map((addr, idx) => (
                    <SelectItem key={idx} value={addr} className="uppercase">{addr}</SelectItem>
                  ))}
                  <SelectItem value="new_address" className="uppercase font-bold text-primary">+ ADICIONAR NOVO ENDEREÇO...</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {!isPickup && (customerAddresses.length === 0 || !customerAddresses.includes(address)) && (
            <div className="space-y-1.5 sm:col-span-2 animate-in fade-in slide-in-from-top-1 duration-200">
              <Label htmlFor="address" className="uppercase font-black text-xs">Endereço de Entrega</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="RUA, NÚMERO, BAIRRO..."
                  className="pl-10 uppercase"
                />
              </div>
            </div>
          )}

          <div className="flex items-end pt-1 sm:col-span-2">
            <Button
              type="button"
              onClick={onQuickRegister}
              disabled={addCustomerPending || !customerName.trim() || !phone.trim() || (!isPickup && !address.trim())}
              className="gap-1.5 w-full bg-orange-500 text-white hover:bg-orange-600 border-none transition-colors uppercase font-black text-xs"
            >
              <Plus className="h-4 w-4" /> {isPickup ? "Cadastrar para Retirada" : "Salvar/Atualizar Cliente no Sistema"}
            </Button>
          </div>
        </div>

        {/* Toggle Retirada */}
        <div
          className={cn(
            "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none mt-4",
            isPickup
              ? "bg-primary/10 border-primary/30 ring-2 ring-primary/20"
              : "bg-secondary/40 border-border/20 hover:bg-secondary/60"
          )}
          onClick={() => {
            setIsPickup(!isPickup);
            if (!isPickup) {
              setAddress("");
              setDeliveryFee(settings.defaultDeliveryFee);
            } else {
              setDeliveryFee(0);
              setCustomerAddresses([]);
            }
          }}
        >
          <PackageCheck className={cn("h-5 w-5 shrink-0", isPickup ? "text-primary" : "text-muted-foreground")} />
          <div className="flex-1">
            <span className="font-bold text-sm uppercase">Retirada no Local</span>
            <p className="text-[10px] text-muted-foreground uppercase">Marque se o cliente vai retirar o pedido</p>
          </div>
          <div className={cn("h-6 w-11 rounded-full transition-colors relative", isPickup ? "bg-primary" : "bg-muted")}>
            <div className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform", isPickup ? "translate-x-5" : "translate-x-0.5")} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
