import { useState } from "react";
import { Plus, Pencil, Trash2, Users, Search, ArrowLeft } from "lucide-react";
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
  const [form, setForm] = useState({ name: "", address: "", phone: "" });

  const filtered = customers.filter(
    (c) =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toString().includes(search) ||
      c.phone.includes(search)
  );

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", address: "", phone: "" });
    setDialogOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({ name: c.name, address: c.address, phone: c.phone });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (editing) {
      await updateCustomer.mutateAsync({ id: editing.id, ...form });
    } else {
      await addCustomer.mutateAsync(form);
    }
    setDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Button>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Clientes</h1>
            </div>
          </div>
          <Button onClick={openNew} className="gap-1.5">
            <Plus className="h-4 w-4" /> Novo Cliente
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, código ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {isLoading ? (
          <p className="text-center text-muted-foreground py-8">Carregando...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nenhum cliente encontrado</p>
            <p className="text-sm mt-1">Cadastre um novo cliente para começar</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((c) => (
              <Card key={c.id} className="border-border/60">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {c.code}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{c.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {c.phone || "Sem telefone"} {c.address ? `· ${c.address}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => deleteCustomer.mutate(c.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="cname">Nome *</Label>
                <Input id="cname" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nome do cliente" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cphone">Telefone</Label>
                <Input id="cphone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="(00) 00000-0000" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="caddress">Endereço</Label>
                <Input id="caddress" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="Endereço completo" />
              </div>
              <Button type="submit" className="w-full" disabled={addCustomer.isPending || updateCustomer.isPending}>
                {editing ? "Salvar" : "Cadastrar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
