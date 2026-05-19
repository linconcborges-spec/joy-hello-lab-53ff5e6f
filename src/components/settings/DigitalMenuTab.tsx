import { Save, Clock, Instagram, Facebook, MapPin, Bike } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { BusinessHours } from "@/hooks/useSettings";

const DAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

interface DigitalMenuTabProps {
  menuOpen: boolean; setMenuOpen: (v: boolean) => void;
  storeAddress: string; setStoreAddress: (v: string) => void;
  storePhone: string; setStorePhone: (v: string) => void;
  deliveryTimeMin: number; setDeliveryTimeMin: (v: number) => void;
  deliveryTimeMax: number; setDeliveryTimeMax: (v: number) => void;
  instagramUrl: string; setInstagramUrl: (v: string) => void;
  facebookUrl: string; setFacebookUrl: (v: string) => void;
  whatsappNumber: string; setWhatsappNumber: (v: string) => void;
  businessHours: BusinessHours[];
  isCurrentlyOpen: boolean;
  onHourChange: (idx: number, field: keyof BusinessHours, value: string | boolean) => void;
  onMenuOpenChange: (v: boolean) => void;
  onSave: () => void;
}

export function DigitalMenuTab({
  menuOpen, setMenuOpen,
  storeAddress, setStoreAddress,
  storePhone, setStorePhone,
  deliveryTimeMin, setDeliveryTimeMin,
  deliveryTimeMax, setDeliveryTimeMax,
  instagramUrl, setInstagramUrl,
  facebookUrl, setFacebookUrl,
  whatsappNumber, setWhatsappNumber,
  businessHours,
  isCurrentlyOpen,
  onHourChange,
  onMenuOpenChange,
  onSave,
}: DigitalMenuTabProps) {
  return (
    <div className="space-y-4">
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
              onCheckedChange={onMenuOpenChange}
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
              <Switch checked={businessHours[idx]?.enabled ?? true} onCheckedChange={(v) => onHourChange(idx, "enabled", v)} />
              <span className={cn("text-xs font-black uppercase w-16 shrink-0", businessHours[idx]?.enabled ? "text-foreground" : "text-muted-foreground")}>{day}</span>
              {businessHours[idx]?.enabled ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input type="time" value={businessHours[idx]?.open || "08:00"} onChange={(e) => onHourChange(idx, "open", e.target.value)} className="h-8 text-xs w-28" />
                  <span className="text-[10px] text-muted-foreground font-bold">até</span>
                  <Input type="time" value={businessHours[idx]?.close || "22:00"} onChange={(e) => onHourChange(idx, "close", e.target.value)} className="h-8 text-xs w-28" />
                </div>
              ) : (
                <span className="text-[10px] text-muted-foreground uppercase font-black flex-1">Fechado</span>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onSave} className="gap-1.5 w-full sm:w-auto">
          <Save className="h-4 w-4" /> Salvar Configurações do Menu
        </Button>
      </div>
    </div>
  );
}
