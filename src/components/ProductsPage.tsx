import { useState } from "react";
import { ArrowLeft, Plus, Pencil, Trash2, Search, Save, X, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { useProducts, useAddProduct, useUpdateProduct, useDeleteProduct } from "@/hooks/useProducts";
import { useAddons, useAddAddon, useUpdateAddon, useDeleteAddon } from "@/hooks/useAddons";
import { useCategories, useAddCategory, useDeleteCategory } from "@/hooks/useCategories";

function ConfirmDelete({ onConfirm, title }: { onConfirm: () => void; title: string }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
          <AlertDialogDescription>
            Essa ação removerá o(a) {title.toLowerCase()} permanentemente do banco de dados. Deseja continuar?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Sim, excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface ProductsPageProps {
  onBack: () => void;
}

export function ProductsPage({ onBack }: ProductsPageProps) {
  const { data: products = [], isLoading: loadingProducts } = useProducts();
  const { data: addons = [], isLoading: loadingAddons } = useAddons();
  const { data: categories = [], isLoading: loadingCategories } = useCategories();
  
  const addProduct = useAddProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  
  const addAddon = useAddAddon();
  const updateAddon = useUpdateAddon();
  const deleteAddon = useDeleteAddon();

  const addCategory = useAddCategory();
  const deleteCategory = useDeleteCategory();

  const [search, setSearch] = useState("");
  const [addonSearch, setAddonSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");

  // New category form
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showNewCategory, setShowNewCategory] = useState(false);

  // New product form
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newProductCategoryId, setNewProductCategoryId] = useState("none");
  const [showNewProduct, setShowNewProduct] = useState(false);

  // New addon form
  const [newAddonName, setNewAddonName] = useState("");
  const [newAddonPrice, setNewAddonPrice] = useState("");
  const [newAddonCategoryId, setNewAddonCategoryId] = useState("none");
  const [showNewAddon, setShowNewAddon] = useState(false);

  // Edit states
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editProductCategoryId, setEditProductCategoryId] = useState("none");

  const [editingAddonId, setEditingAddonId] = useState<string | null>(null);
  const [editAddonName, setEditAddonName] = useState("");
  const [editAddonPrice, setEditAddonPrice] = useState("");
  const [editAddonCategoryId, setEditAddonCategoryId] = useState("none");

  const filteredCategories = categories.filter((c) =>
    !categorySearch || c.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

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

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    addCategory.mutate(
      { name: newCategoryName.trim() },
      { onSuccess: () => { setNewCategoryName(""); setShowNewCategory(false); } }
    );
  };

  const handleAddProduct = () => {
    if (!newName.trim() || !newCode.trim()) return;
    addProduct.mutate(
      { 
        code: parseInt(newCode), 
        name: newName.trim(), 
        price: parseFloat(newPrice) || 0,
        description: newDescription.trim(),
        image_url: newImageUrl.trim(),
        category_id: newProductCategoryId === "none" ? null : newProductCategoryId
      },
      { 
        onSuccess: () => { 
          setNewCode(""); 
          setNewName(""); 
          setNewPrice(""); 
          setNewDescription("");
          setNewImageUrl("");
          setNewProductCategoryId("none"); 
          setShowNewProduct(false); 
        } 
      }
    );
  };

  const handleSaveProduct = (id: string) => {
    updateProduct.mutate(
      { 
        id, 
        name: editName, 
        price: parseFloat(editPrice) || 0,
        description: editDescription,
        image_url: editImageUrl,
        category_id: editProductCategoryId === "none" ? null : editProductCategoryId
      },
      { onSuccess: () => setEditingProductId(null) }
    );
  };

  const handleAddAddon = () => {
    if (!newAddonName.trim()) return;
    addAddon.mutate(
      { 
        name: newAddonName.trim(), 
        price: parseFloat(newAddonPrice) || 0,
        category_id: newAddonCategoryId === "none" ? null : newAddonCategoryId
      },
      { onSuccess: () => { setNewAddonName(""); setNewAddonPrice(""); setNewAddonCategoryId("none"); setShowNewAddon(false); } }
    );
  };

  const handleSaveAddon = (id: string) => {
    updateAddon.mutate(
      { 
        id, 
        name: editAddonName, 
        price: parseFloat(editAddonPrice) || 0,
        category_id: editAddonCategoryId === "none" ? null : editAddonCategoryId
      },
      { onSuccess: () => setEditingAddonId(null) }
    );
  };

  const getCategoryName = (id: string | null | undefined) => {
    if (!id) return "Sem categoria";
    const cat = categories.find(c => c.id === id);
    return cat ? cat.name : "Desconhecida";
  }

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
            <TabsTrigger value="categories">Categorias ({categories.length})</TabsTrigger>
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
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-4 items-end">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Código</Label>
                      <Input value={newCode} onChange={(e) => setNewCode(e.target.value)} placeholder="Cód." className="w-20" />
                    </div>
                    <div className="space-y-1.5 flex-1 min-w-[200px]">
                      <Label className="text-xs">Nome</Label>
                      <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nome do produto" />
                    </div>
                    <div className="space-y-1.5 w-40">
                      <Label className="text-xs">Categoria</Label>
                      <Select value={newProductCategoryId} onValueChange={setNewProductCategoryId}>
                        <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhuma</SelectItem>
                          {categories.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Preço (R$)</Label>
                      <Input type="number" step="0.01" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="0.00" className="w-28" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Descrição (Detalhamento do item)</Label>
                      <Input value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="Ex: Hambúrguer, Presunto, Mussarela..." />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">URL da Imagem (Link da foto)</Label>
                      <Input value={newImageUrl} onChange={(e) => setNewImageUrl(e.target.value)} placeholder="https://exemplo.com/foto.jpg" />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleAddProduct} disabled={addProduct.isPending} className="w-full md:w-auto">Salvar Produto</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-0 overflow-x-auto">
                {loadingProducts ? (
                  <p className="text-center py-8 text-muted-foreground">Carregando...</p>
                ) : (
                  <Table className="min-w-[800px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-20">Foto</TableHead>
                        <TableHead className="w-16">Cód.</TableHead>
                        <TableHead>Nome / Descrição</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="w-28">Preço</TableHead>
                        <TableHead className="w-24">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>
                            <div className="h-10 w-10 rounded-md bg-secondary flex items-center justify-center overflow-hidden border">
                              {p.image_url ? (
                                <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                              ) : (
                                <UtensilsCrossed className="h-4 w-4 text-muted-foreground opacity-20" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{p.code}</TableCell>
                          <TableCell>
                            {editingProductId === p.id ? (
                              <div className="space-y-2">
                                <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8 font-bold" placeholder="Nome" />
                                <Input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="h-7 text-[10px]" placeholder="Descrição" />
                                <Input value={editImageUrl} onChange={(e) => setEditImageUrl(e.target.value)} className="h-7 text-[10px]" placeholder="Link da Imagem" />
                              </div>
                            ) : (
                              <div>
                                <p className="font-bold text-sm uppercase">{p.name}</p>
                                <p className="text-[10px] text-muted-foreground line-clamp-1">{p.description || "Sem descrição"}</p>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {editingProductId === p.id ? (
                              <Select value={editProductCategoryId} onValueChange={setEditProductCategoryId}>
                                <SelectTrigger className="h-8"><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">Nenhuma</SelectItem>
                                  {categories.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-1 bg-secondary rounded-full uppercase">
                                {getCategoryName(p.category_id)}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {editingProductId === p.id ? (
                              <Input type="number" step="0.01" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="h-8 w-24" />
                            ) : (
                              <span className="font-black text-rose-600 italic">R$ {Number(p.price).toFixed(2)}</span>
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
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { 
                                    setEditingProductId(p.id); 
                                    setEditName(p.name); 
                                    setEditPrice(String(p.price)); 
                                    setEditDescription(p.description || "");
                                    setEditImageUrl(p.image_url || "");
                                    setEditProductCategoryId(p.category_id || "none"); 
                                  }}>
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <ConfirmDelete onConfirm={() => deleteProduct.mutate(p.id)} title="produto" />
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredProducts.length === 0 && (
                        <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum produto encontrado</TableCell></TableRow>
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
                <CardContent className="flex flex-wrap gap-2 items-end">
                  <div className="space-y-1.5 flex-1 min-w-[150px]">
                    <Label className="text-xs">Nome</Label>
                    <Input value={newAddonName} onChange={(e) => setNewAddonName(e.target.value)} placeholder="Ex: Bacon, Ovo..." />
                  </div>
                  <div className="space-y-1.5 w-32">
                    <Label className="text-xs">Categoria</Label>
                    <Select value={newAddonCategoryId} onValueChange={setNewAddonCategoryId}>
                      <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Todas / Geral</SelectItem>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                            ) : (
                              a.name
                            )}
                          </TableCell>
                          <TableCell>
                            {editingAddonId === a.id ? (
                              <Select value={editAddonCategoryId} onValueChange={setEditAddonCategoryId}>
                                <SelectTrigger className="h-8"><SelectValue placeholder="Todas" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">Todas / Geral</SelectItem>
                                  {categories.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <span className="text-xs px-2 py-1 bg-secondary rounded-full">
                                {!a.category_id ? "Todas / Geral" : getCategoryName(a.category_id)}
                              </span>
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
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingAddonId(a.id); setEditAddonName(a.name); setEditAddonPrice(String(a.price)); setEditAddonCategoryId(a.category_id || "none"); }}>
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
          </TabsContent>

          {/* CATEGORIES TAB */}
          <TabsContent value="categories" className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar categoria..." value={categorySearch} onChange={(e) => setCategorySearch(e.target.value)} className="pl-9" />
              </div>
              <Button onClick={() => setShowNewCategory(!showNewCategory)} className="gap-1.5">
                <Plus className="h-4 w-4" /> Nova
              </Button>
            </div>

            {showNewCategory && (
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base">Nova Categoria</CardTitle></CardHeader>
                <CardContent className="flex gap-2 items-end">
                  <div className="space-y-1.5 flex-1">
                    <Label className="text-xs">Nome da Categoria</Label>
                    <Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Ex: Bebidas, Lanches..." />
                  </div>
                  <Button onClick={handleAddCategory} disabled={addCategory.isPending}>Salvar</Button>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-0">
                {loadingCategories ? (
                  <p className="text-center py-8 text-muted-foreground">Carregando...</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead className="w-24">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCategories.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell>{c.name}</TableCell>
                          <TableCell>
                            <ConfirmDelete onConfirm={() => deleteCategory.mutate(c.id)} title="categoria" />
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredCategories.length === 0 && (
                        <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-8">Nenhuma categoria encontrada</TableCell></TableRow>
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
