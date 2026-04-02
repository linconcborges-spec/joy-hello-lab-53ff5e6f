import { useState } from "react";
import { ArrowLeft, Plus, Pencil, Trash2, Search, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProducts, useAddProduct, useUpdateProduct, useDeleteProduct } from "@/hooks/useProducts";
import { useAddons, useAddAddon, useUpdateAddon, useDeleteAddon } from "@/hooks/useAddons";

interface ProductsPageProps {
  onBack: () => void;
}

export function ProductsPage({ onBack }: ProductsPageProps) {
  const { data: products = [], isLoading: loadingProducts } = useProducts();
  const { data: addons = [], isLoading: loadingAddons } = useAddons();
  const addProduct = useAddProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const addAddon = useAddAddon();
  const updateAddon = useUpdateAddon();
  const deleteAddon = useDeleteAddon();

  const [search, setSearch] = useState("");
  const [addonSearch, setAddonSearch] = useState("");

  // New product form
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [showNewProduct, setShowNewProduct] = useState(false);

  // New addon form
  const [newAddonName, setNewAddonName] = useState("");
  const [newAddonPrice, setNewAddonPrice] = useState("");
  const [showNewAddon, setShowNewAddon] = useState(false);

  // Edit states
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");

  const [editingAddonId, setEditingAddonId] = useState<string | null>(null);
  const [editAddonName, setEditAddonName] = useState("");
  const [editAddonPrice, setEditAddonPrice] = useState("");

  const filteredProducts = products.filter(
    (p) =>
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toString().includes(search)
  );

  const filteredAddons = addons.filter(
    (a) =>
      !addonSearch ||
      a.name.toLowerCase().includes(addonSearch.toLowerCase()) ||
      a.code.toString().includes(addonSearch)
  );

  const handleAddProduct = () => {
    if (!newName.trim() || !newCode.trim()) return;
    addProduct.mutate(
      { code: parseInt(newCode), name: newName.trim(), price: parseFloat(newPrice) || 0 },
      { onSuccess: () => { setNewCode(""); setNewName(""); setNewPrice(""); setShowNewProduct(false); } }
    );
  };

  const handleSaveProduct = (id: string) => {
    updateProduct.mutate(
      { id, name: editName, price: parseFloat(editPrice) || 0 },
      { onSuccess: () => setEditingProductId(null) }
    );
  };

  const handleAddAddon = () => {
    if (!newAddonName.trim()) return;
    addAddon.mutate(
      { name: newAddonName.trim(), price: parseFloat(newAddonPrice) || 0 },
      { onSuccess: () => { setNewAddonName(""); setNewAddonPrice(""); setShowNewAddon(false); } }
    );
  };

  const handleSaveAddon = (id: string) => {
    updateAddon.mutate(
      { id, name: editAddonName, price: parseFloat(editAddonPrice) || 0 },
      { onSuccess: () => setEditingAddonId(null) }
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>

        <Tabs defaultValue="products">
          <TabsList>
            <TabsTrigger value="products">Produtos ({products.length})</TabsTrigger>
            <TabsTrigger value="addons">Adicionais ({addons.length})</TabsTrigger>
          </TabsList>

          {/* PRODUCTS TAB */}
          <TabsContent value="products" className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar produto por nome ou código..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
              <Button onClick={() => setShowNewProduct(!showNewProduct)} className="gap-1.5">
                <Plus className="h-4 w-4" /> Novo
              </Button>
            </div>

            {showNewProduct && (
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base">Novo Produto</CardTitle></CardHeader>
                <CardContent className="flex gap-2 items-end">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Código</Label>
                    <Input value={newCode} onChange={(e) => setNewCode(e.target.value)} placeholder="Cód." className="w-20" />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <Label className="text-xs">Nome</Label>
                    <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nome do produto" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Preço (R$)</Label>
                    <Input type="number" step="0.01" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="0.00" className="w-28" />
                  </div>
                  <Button onClick={handleAddProduct} disabled={addProduct.isPending}>Salvar</Button>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-0">
                {loadingProducts ? (
                  <p className="text-center py-8 text-muted-foreground">Carregando...</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-20">Código</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead className="w-28">Preço</TableHead>
                        <TableHead className="w-24">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-mono">{p.code}</TableCell>
                          <TableCell>
                            {editingProductId === p.id ? (
                              <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8" />
                            ) : (
                              p.name
                            )}
                          </TableCell>
                          <TableCell>
                            {editingProductId === p.id ? (
                              <Input type="number" step="0.01" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="h-8 w-24" />
                            ) : (
                              `R$ ${Number(p.price).toFixed(2)}`
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {editingProductId === p.id ? (
                                <>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleSaveProduct(p.id)}>
                                    <Save className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingProductId(null)}>
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingProductId(p.id); setEditName(p.name); setEditPrice(String(p.price)); }}>
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteProduct.mutate(p.id)}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredProducts.length === 0 && (
                        <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nenhum produto encontrado</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ADDONS TAB */}
          <TabsContent value="addons" className="space-y-4">
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
                <CardContent className="flex gap-2 items-end">
                  <div className="space-y-1.5 flex-1">
                    <Label className="text-xs">Nome</Label>
                    <Input value={newAddonName} onChange={(e) => setNewAddonName(e.target.value)} placeholder="Ex: Bacon, Ovo..." />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Preço (R$)</Label>
                    <Input type="number" step="0.01" value={newAddonPrice} onChange={(e) => setNewAddonPrice(e.target.value)} placeholder="0.00" className="w-28" />
                  </div>
                  <Button onClick={handleAddAddon} disabled={addAddon.isPending}>Salvar</Button>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-0">
                {loadingAddons ? (
                  <p className="text-center py-8 text-muted-foreground">Carregando...</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-20">Código</TableHead>
                        <TableHead>Nome</TableHead>
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
                            ) : (
                              a.name
                            )}
                          </TableCell>
                          <TableCell>
                            {editingAddonId === a.id ? (
                              <Input type="number" step="0.01" value={editAddonPrice} onChange={(e) => setEditAddonPrice(e.target.value)} className="h-8 w-24" />
                            ) : (
                              `R$ ${Number(a.price).toFixed(2)}`
                            )}
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
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingAddonId(a.id); setEditAddonName(a.name); setEditAddonPrice(String(a.price)); }}>
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteAddon.mutate(a.id)}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredAddons.length === 0 && (
                        <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nenhum adicional cadastrado</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
