import { useState } from "react";
import { Plus, Pencil, Trash2, Users, Search, ArrowLeft, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  useCustomers,
  useAddCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
  type Customer,
} from "@/hooks/useCustomers";

interface CustomersPageProps {
  onBack: () => void;
}

export function CustomersPage({ onBack }: CustomersPageProps) {
  const { data: customers = [], isLoading } = useCustomers();
  const addCustomer = useAddCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState({ name: "", addresses: [""] as string[], phone: "" });

  const filtered = customers.filter(
    (c) =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", addresses: [""], phone: "" });
    setDialogOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({ 
      name: c.name, 
      addresses: c.addresses && c.addresses.length > 0 ? c.addresses : [""], 
      phone: c.phone 
    });
    setDialogOpen(true);
  };

  const updateAddress = (index: number, val: string) => {
    const newAddresses = [...form.addresses];
    newAddresses[index] = val;
    setForm({ ...form, addresses: newAddresses });
  };

  const addAddressField = () => {
    setForm({ ...form, addresses: [...form.addresses, ""] });
  };

  const removeAddressField = (index: number) => {
    if (form.addresses.length <= 1) return;
    setForm({ ...form, addresses: form.addresses.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    
    // Filtra endereços vazios
    const validAddresses = form.addresses.filter(a => a.trim() !== "");
    const finalForm = { ...form, addresses: validAddresses };

    if (editing) {
      await updateCustomer.mutateAsync({ id: editing.id, ...finalForm });
    } else {
      await addCustomer.mutateAsync(finalForm);
    }
    setDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1200px] mx-auto p-4 sm:p-10 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 rounded-xl">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <Users className="h-6 w-6" />
              </div>
              <h1 className="text-3xl font-black uppercase italic tracking-tighter">Clientes</h1>
            </div>
          </div>
          <Button onClick={openNew} className="gap-2 h-12 px-6 rounded-2xl font-black uppercase text-xs shadow-xl shadow-primary/20">
            <Plus className="h-4 w-4" /> Novo Cliente
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground opacity-50" />
          <Input
            placeholder="Buscar por nome ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 h-14 rounded-2xl border-none bg-card shadow-sm font-medium"
          />
        </div>

        {isLoading ? (
          <p className="text-center text-muted-foreground py-12">Carregando...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground bg-card rounded-[3rem] border border-dashed border-border/60">
            <Users className="h-16 w-16 mx-auto mb-4 opacity-10" />
            <p className="font-black uppercase tracking-tighter opacity-30">Nenhum cliente encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((c) => (
              <Card key={c.id} className="border-border/40 hover:border-primary/40 transition-colors rounded-3xl overflow-hidden shadow-sm group">
                <CardContent className="p-5 flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center text-secondary-foreground">
                        <Phone className="h-4 w-4 opacity-40" />
                      </div>
                      <div>
                        <p className="font-black uppercase tracking-tight text-foreground leading-tight">{c.name}</p>
                        <p className="text-xs font-bold text-primary">{c.phone}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => openEdit(c)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-xl text-destructive/40 hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          if (confirm(`Remover cliente ${c.name}?`)) {
                            deleteCustomer.mutate(c.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5 pt-2 border-t border-border/40">
                    <p className="text-[10px] font-black uppercase opacity-30 tracking-widest">Endereços Salvos</p>
                    <div className="flex flex-wrap gap-2">
                      {c.addresses && c.addresses.length > 0 ? (
                        c.addresses.map((addr, idx) => (
                          <div key={idx} className="bg-muted/50 px-3 py-1 rounded-lg text-[10px] font-bold text-muted-foreground truncate max-w-full">
                            {addr}
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] italic opacity-30">Nenhum endereço</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-xl p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
            <DialogHeader className="p-8 pb-4 bg-primary/5">
              <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">
                {editing ? "Editar Cliente" : "Novo Cliente"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="cname" className="text-[10px] font-black uppercase opacity-50 ml-2">Nome Completo *</Label>
                  <Input 
                    id="cname" 
                    value={form.name} 
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} 
                    placeholder="Ex: João da Silva" 
                    className="h-12 rounded-xl border-none bg-muted/30 font-bold"
                    required 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cphone" className="text-[10px] font-black uppercase opacity-50 ml-2">Telefone</Label>
                  <Input 
                    id="cphone" 
                    value={form.phone} 
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} 
                    placeholder="(00) 00000-0000" 
                    className="h-12 rounded-xl border-none bg-muted/30 font-bold"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-black uppercase opacity-50 ml-2">Endereços de Entrega</Label>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={addAddressField}
                    className="h-7 text-[10px] font-black uppercase text-primary hover:bg-primary/10 rounded-lg px-2"
                  >
                    + Adicionar
                  </Button>
                </div>
                
                <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                  {form.addresses.map((addr, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Input 
                        value={addr} 
                        onChange={(e) => updateAddress(idx, e.target.value)} 
                        placeholder={`Endereço ${idx + 1}`} 
                        className="h-12 rounded-xl border-none bg-muted/30 font-medium flex-1"
                      />
                      {form.addresses.length > 1 && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeAddressField(idx)}
                          className="h-12 w-12 text-destructive/40 hover:text-destructive hover:bg-destructive/10 rounded-xl"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full h-14 rounded-2xl font-black uppercase text-sm shadow-xl shadow-primary/20" disabled={addCustomer.isPending || updateCustomer.isPending}>
                {editing ? "Salvar Alterações" : "Cadastrar Cliente"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
