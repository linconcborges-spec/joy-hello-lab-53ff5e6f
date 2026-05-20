import { useState, useEffect } from "react";
import { Plus, Search, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAddons, useAddAddon, useUpdateAddon, useDeleteAddon } from "@/hooks/useAddons";
import { useCategories } from "@/hooks/useCategories";

interface AddonsTabProps {
  newTrigger: number;
}

export function AddonsTab({ newTrigger }: AddonsTabProps) {
  const { data: addons = [], isLoading: loadingAddons } = useAddons();
  const { data: categories = [] } = useCategories();
  const addAddon = useAddAddon();
  const updateAddon = useUpdateAddon();
  const deleteAddon = useDeleteAddon();

  const [addonSearch, setAddonSearch] = useState("");
  const [showNewAddon, setShowNewAddon] = useState(false);
  const [newAddonName, setNewAddonName] = useState("");
  const [newAddonPrice, setNewAddonPrice] = useState("");
  const [newAddonCategoryIds, setNewAddonCategoryIds] = useState<string[]>([]);

  // Sheet de edição
  const [editingAddon, setEditingAddon] = useState<any | null>(null);
  const [editAddonName, setEditAddonName] = useState("");
  const [editAddonPrice, setEditAddonPrice] = useState("");
  const [editAddonCategoryIds, setEditAddonCategoryIds] = useState<string[]>([]);

  useEffect(() => {
    if (newTrigger > 0) setShowNewAddon(true);
  }, [newTrigger]);

  const getCategoryName = (id: string | null | undefined) => {
    if (!id) return "Sem categoria";
    const cat = categories.find(c => c.id === id);
    return cat ? cat.name : "Desconhecida";
  };

  const handleAddAddon = () => {
    if (!newAddonName.trim()) return;
    addAddon.mutate(
      { name: newAddonName.trim(), price: parseFloat(newAddonPrice) || 0, category_ids: newAddonCategoryIds },
      { onSuccess: () => { setNewAddonName(""); setNewAddonPrice(""); setNewAddonCategoryIds([]); setShowNewAddon(false); } }
    );
  };

  const openEditSheet = (a: any) => {
    setEditingAddon(a);
    setEditAddonName(a.name);
    setEditAddonPrice(String(a.price));
    setEditAddonCategoryIds(a.category_ids ?? (a.category_id ? [a.category_id] : []));
  };

  const handleSaveAddon = () => {
    if (!editingAddon) return;
    updateAddon.mutate(
      { id: editingAddon.id, name: editAddonName, price: parseFloat(editAddonPrice) || 0, category_ids: editAddonCategoryIds },
      { onSuccess: () => setEditingAddon(null) }
    );
  };

  const filteredAddons = addons.filter(
    (a) => !addonSearch || a.name.toLowerCase().includes(addonSearch.toLowerCase()) || a.code.toString().includes(addonSearch)
  );

  return (
    <>
      {/* Busca + botão novo */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar adicional..." value={addonSearch} onChange={(e) => setAddonSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={() => setShowNewAddon(!showNewAddon)} className="gap-1.5 shrink-0">
          <Plus className="h-4 w-4" /> Novo
        </Button>
      </div>

      {/* Formulário novo adicional */}
      {showNewAddon && (
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Novo Adicional</CardTitle>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowNewAddon(false)}><X className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="space-y-1.5 flex-1 min-w-[150px]">
                <Label className="text-xs">Nome</Label>
                <Input value={newAddonName} onChange={(e) => setNewAddonName(e.target.value)} placeholder="Ex: Bacon, Ovo..." />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Preço (R$)</Label>
                <Input type="number" step="0.01" value={newAddonPrice} onChange={(e) => setNewAddonPrice(e.target.value)} placeholder="0.00" className="w-28" />
              </div>
              <Button onClick={handleAddAddon} disabled={addAddon.isPending} className="shrink-0">Salvar</Button>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Categorias — deixe em branco para exibir em todos os produtos</Label>
              <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
                {categories.map(c => (
                  <label key={c.id} className="flex items-center gap-1.5 cursor-pointer">
                    <Checkbox
                      checked={newAddonCategoryIds.includes(c.id)}
                      onCheckedChange={(checked) =>
                        setNewAddonCategoryIds(prev => checked ? [...prev, c.id] : prev.filter(id => id !== c.id))
                      }
                    />
                    <span className="text-xs font-semibold uppercase">{c.name}</span>
                  </label>
                ))}
                {categories.length === 0 && <span className="text-xs text-muted-foreground">Nenhuma categoria cadastrada</span>}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de adicionais */}
      <div className="space-y-1.5">
        {loadingAddons ? (
          <p className="text-center py-10 text-sm text-muted-foreground">Carregando...</p>
        ) : filteredAddons.length === 0 ? (
          <div className="text-center py-10 border border-dashed rounded-xl opacity-40">
            <p className="text-xs font-bold uppercase">Nenhum adicional cadastrado</p>
          </div>
        ) : (
          filteredAddons.map((a) => (
            <div key={a.id} className="group flex items-center gap-3 bg-card px-3 py-2.5 rounded-xl border border-border/30 hover:border-border/60 transition-all">
              {/* Código */}
              <span className="text-xs font-mono text-muted-foreground w-10 shrink-0">{a.code}</span>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-xs">{a.name}</p>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {(a.category_ids ?? []).length === 0 ? (
                    <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded-full text-muted-foreground">Todos</span>
                  ) : (
                    (a.category_ids ?? []).map((cid: string) => (
                      <span key={cid} className="text-[10px] px-1.5 py-0.5 bg-muted rounded-full text-muted-foreground">{getCategoryName(cid)}</span>
                    ))
                  )}
                </div>
              </div>

              {/* Preço */}
              <span className="font-bold text-sm text-rose-600 shrink-0">R$ {Number(a.price).toFixed(2)}</span>

              {/* Ações no hover */}
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditSheet(a)} title="Editar">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteAddon.mutate(a.id)} title="Excluir">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Sheet de edição */}
      <Sheet open={!!editingAddon} onOpenChange={(o) => !o && setEditingAddon(null)}>
        <SheetContent className="w-full sm:max-w-sm overflow-y-auto">
          <SheetHeader className="mb-5">
            <SheetTitle className="text-base font-bold">Editar adicional</SheetTitle>
          </SheetHeader>

          {editingAddon && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Nome</Label>
                <Input value={editAddonName} onChange={(e) => setEditAddonName(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Preço (R$)</Label>
                <Input type="number" step="0.01" value={editAddonPrice} onChange={(e) => setEditAddonPrice(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Categorias — deixe em branco para exibir em todos</Label>
                <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
                  {categories.map(c => (
                    <label key={c.id} className="flex items-center gap-1.5 cursor-pointer">
                      <Checkbox
                        checked={editAddonCategoryIds.includes(c.id)}
                        onCheckedChange={(checked) =>
                          setEditAddonCategoryIds(prev => checked ? [...prev, c.id] : prev.filter(id => id !== c.id))
                        }
                      />
                      <span className="text-xs font-semibold uppercase">{c.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setEditingAddon(null)}>Cancelar</Button>
                <Button className="flex-1" onClick={handleSaveAddon} disabled={updateAddon.isPending}>
                  {updateAddon.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
