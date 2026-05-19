import { useState, useEffect } from "react";
import { Plus, Pencil, Save, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useAddons, useAddAddon, useUpdateAddon, useDeleteAddon } from "@/hooks/useAddons";
import { useCategories } from "@/hooks/useCategories";
import { ConfirmDelete } from "./ConfirmDelete";

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

  const [editingAddonId, setEditingAddonId] = useState<string | null>(null);
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

  const handleSaveAddon = (id: string) => {
    updateAddon.mutate(
      { id, name: editAddonName, price: parseFloat(editAddonPrice) || 0, category_ids: editAddonCategoryIds },
      { onSuccess: () => setEditingAddonId(null) }
    );
  };

  const filteredAddons = addons.filter(
    (a) => !addonSearch || a.name.toLowerCase().includes(addonSearch.toLowerCase()) || a.code.toString().includes(addonSearch)
  );

  return (
    <>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar adicional..." value={addonSearch} onChange={(e) => setAddonSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={() => setShowNewAddon(!showNewAddon)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Novo
        </Button>
      </div>

      {showNewAddon && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Novo Adicional</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2 items-end">
              <div className="space-y-1.5 flex-1 min-w-[150px]">
                <Label className="text-xs">Nome</Label>
                <Input value={newAddonName} onChange={(e) => setNewAddonName(e.target.value)} placeholder="Ex: Bacon, Ovo..." />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Preço (R$)</Label>
                <Input type="number" step="0.01" value={newAddonPrice} onChange={(e) => setNewAddonPrice(e.target.value)} placeholder="0.00" className="w-28" />
              </div>
              <Button onClick={handleAddAddon} disabled={addAddon.isPending}>Salvar</Button>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Categorias (selecione uma ou mais — deixe em branco para exibir em todas)</Label>
              <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
                {categories.map(c => (
                  <label key={c.id} className="flex items-center gap-1.5 cursor-pointer">
                    <Checkbox
                      checked={newAddonCategoryIds.includes(c.id)}
                      onCheckedChange={(checked) =>
                        setNewAddonCategoryIds(prev =>
                          checked ? [...prev, c.id] : prev.filter(id => id !== c.id)
                        )
                      }
                    />
                    <span className="text-xs font-bold uppercase">{c.name}</span>
                  </label>
                ))}
                {categories.length === 0 && <span className="text-xs text-muted-foreground">Nenhuma categoria cadastrada</span>}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {loadingAddons ? (
            <p className="text-center py-8 text-muted-foreground">Carregando...</p>
          ) : (
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Código</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="w-28">Preço</TableHead>
                  <TableHead className="w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAddons.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono">{a.code}</TableCell>
                    <TableCell>
                      {editingAddonId === a.id ? (
                        <Input value={editAddonName} onChange={(e) => setEditAddonName(e.target.value)} className="h-8" />
                      ) : a.name}
                    </TableCell>
                    <TableCell>
                      {editingAddonId === a.id ? (
                        <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                          {categories.map(c => (
                            <label key={c.id} className="flex items-center gap-1.5 cursor-pointer">
                              <Checkbox
                                checked={editAddonCategoryIds.includes(c.id)}
                                onCheckedChange={(checked) =>
                                  setEditAddonCategoryIds(prev =>
                                    checked ? [...prev, c.id] : prev.filter(id => id !== c.id)
                                  )
                                }
                              />
                              <span className="text-[10px] font-bold uppercase">{c.name}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {(a.category_ids ?? []).length === 0 ? (
                            <span className="text-xs px-2 py-1 bg-secondary rounded-full">Todas / Geral</span>
                          ) : (
                            (a.category_ids ?? []).map((cid: string) => (
                              <span key={cid} className="text-xs px-2 py-1 bg-secondary rounded-full">{getCategoryName(cid)}</span>
                            ))
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingAddonId === a.id ? (
                        <Input type="number" step="0.01" value={editAddonPrice} onChange={(e) => setEditAddonPrice(e.target.value)} className="h-8 w-24" />
                      ) : `R$ ${Number(a.price).toFixed(2)}`}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {editingAddonId === a.id ? (
                          <>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleSaveAddon(a.id)}>
                              <Save className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingAddonId(null)}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                              setEditingAddonId(a.id);
                              setEditAddonName(a.name);
                              setEditAddonPrice(String(a.price));
                              setEditAddonCategoryIds(a.category_ids ?? (a.category_id ? [a.category_id] : []));
                            }}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <ConfirmDelete onConfirm={() => deleteAddon.mutate(a.id)} title="adicional" />
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredAddons.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum adicional cadastrado</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
