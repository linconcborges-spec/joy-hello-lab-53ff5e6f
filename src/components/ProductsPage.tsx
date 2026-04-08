import { useState } from "react";
import { ArrowLeft, Plus, Pencil, Trash2, Search, Save, X, UtensilsCrossed, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
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
import { useStorage } from "@/hooks/useStorage";

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
  const { uploadImage } = useStorage();
  
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
  const [isUploading, setIsUploading] = useState(false);

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const url = await uploadImage(file);
    setIsUploading(false);

    if (url) {
      if (isEdit) setEditImageUrl(url);
      else setNewImageUrl(url);
      toast.success("Foto carregada!");
    }
  };

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
    <div className="min-h-screen bg-background antialiased">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar ao Painel
        </Button>

        <header className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Catálogo de Produtos</h1>
            <p className="text-sm text-muted-foreground">Gerencie o cardápio, adicionais e categorias do seu estabelecimento.</p>
        </header>

        <Tabs defaultValue="products" className="w-full">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="products" className="font-medium">Produtos ({products.length})</TabsTrigger>
            <TabsTrigger value="addons" className="font-medium">Adicionais ({addons.length})</TabsTrigger>
            <TabsTrigger value="categories" className="font-medium">Categorias ({categories.length})</TabsTrigger>
          </TabsList>

          {/* PRODUCTS TAB */}
          <TabsContent value="products" className="space-y-4 pt-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <Input placeholder="Buscar produto..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-11 border-muted" />
              </div>
              <Button onClick={() => setShowNewProduct(!showNewProduct)} className="h-11 gap-2 font-semibold bg-rose-600 hover:bg-rose-700">
                <Plus className="h-4 w-4" /> Novo Produto
              </Button>
            </div>

            {showNewProduct && (
              <Card className="border-rose-100 bg-rose-50/10">
                <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Cadastrar Novo Item</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Cód. Interno</Label>
                      <Input value={newCode} onChange={(e) => setNewCode(e.target.value)} placeholder="001" className="bg-white" />
                    </div>
                    <div className="space-y-1.5 col-span-2">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Nome Comercial</Label>
                      <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ex: X-Salada Especial" className="bg-white" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Preço (R$)</Label>
                      <Input type="number" step="0.01" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="0.00" className="bg-white" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5 flex-1">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Descrição / Ingredientes</Label>
                      <Input value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="Breve resumo para o cliente..." className="bg-white" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Categoria</Label>
                      <Select value={newProductCategoryId} onValueChange={setNewProductCategoryId}>
                        <SelectTrigger className="bg-white"><SelectValue placeholder="Escolha..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhuma</SelectItem>
                          {categories.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Foto do Produto</Label>
                      <div className="flex gap-2">
                         <div className="flex-1 relative">
                            <Input value={newImageUrl} onChange={(e) => setNewImageUrl(e.target.value)} placeholder="URL ou Upload..." className="bg-white pr-10" />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                <label className="cursor-pointer hover:text-rose-600 transition-all">
                                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e)} disabled={isUploading} />
                                </label>
                            </div>
                         </div>
                         {newImageUrl && (
                             <div className="h-10 w-10 rounded border bg-white overflow-hidden shrink-0">
                                <img src={newImageUrl} className="h-full w-full object-cover" />
                             </div>
                         )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button onClick={handleAddProduct} disabled={addProduct.isPending || isUploading} className="w-full md:w-auto font-bold uppercase tracking-widest text-[11px] h-11 px-8 bg-slate-900">Salvar no Catálogo</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-muted/40 shadow-sm overflow-hidden">
              <CardContent className="p-0 overflow-x-auto">
                {loadingProducts ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
                      <p className="text-xs font-medium text-muted-foreground">Sincronizando produtos...</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="w-16 text-[10px] uppercase font-bold">Foto</TableHead>
                        <TableHead className="w-16 text-[10px] uppercase font-bold text-center">Cód</TableHead>
                        <TableHead className="text-[10px] uppercase font-bold">Resumo do Item</TableHead>
                        <TableHead className="text-[10px] uppercase font-bold">Categoria</TableHead>
                        <TableHead className="w-28 text-[10px] uppercase font-bold">Preço</TableHead>
                        <TableHead className="w-24 text-[10px] uppercase font-bold text-right pr-6">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((p) => (
                        <TableRow key={p.id} className="group hover:bg-muted/5 transition-colors">
                          <TableCell>
                            <div className="h-10 w-10 rounded-lg bg-secondary/50 flex items-center justify-center overflow-hidden border border-muted transition-all group-hover:scale-105">
                              {p.image_url ? (
                                <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                              ) : (
                                <UtensilsCrossed className="h-4 w-4 text-muted-foreground/30" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-[11px] text-center text-muted-foreground">{p.code}</TableCell>
                          <TableCell>
                            {editingProductId === p.id ? (
                              <div className="space-y-2 py-2">
                                <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8 font-semibold text-xs" />
                                <Input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="h-7 text-[10px]" />
                                <div className="flex gap-2">
                                    <Input value={editImageUrl} onChange={(e) => setEditImageUrl(e.target.value)} className="h-7 text-[10px] flex-1" />
                                    <label className="h-7 w-7 flex items-center justify-center bg-muted rounded cursor-pointer hover:bg-rose-50 hover:text-rose-600 transition-colors">
                                         {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                                         <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, true)} disabled={isUploading} />
                                    </label>
                                </div>
                              </div>
                            ) : (
                              <div className="py-2">
                                <p className="font-semibold text-sm text-slate-800 uppercase tracking-tight">{p.name}</p>
                                <p className="text-[10px] text-muted-foreground font-medium line-clamp-1 italic">{p.description || "Sem descrição disponível"}</p>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {editingProductId === p.id ? (
                              <Select value={editProductCategoryId} onValueChange={setEditProductCategoryId}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">Nenhuma</SelectItem>
                                  {categories.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge variant="secondary" className="text-[9px] font-semibold bg-muted text-muted-foreground uppercase px-2">
                                {getCategoryName(p.category_id)}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {editingProductId === p.id ? (
                              <Input type="number" step="0.01" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="h-8 w-24 font-bold" />
                            ) : (
                              <span className="font-bold text-slate-900 text-sm">R$ {Number(p.price).toFixed(2)}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <div className="flex justify-end gap-1">
                              {editingProductId === p.id ? (
                                <>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600" onClick={() => handleSaveProduct(p.id)}>
                                    <Save className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setEditingProductId(null)}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900" onClick={() => { 
                                    setEditingProductId(p.id); 
                                    setEditName(p.name); 
                                    setEditPrice(String(p.price)); 
                                    setEditDescription(p.description || "");
                                    setEditImageUrl(p.image_url || "");
                                    setEditProductCategoryId(p.category_id || "none"); 
                                  }}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <ConfirmDelete onConfirm={() => deleteProduct.mutate(p.id)} title="produto" />
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredProducts.length === 0 && (
                        <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-20 text-xs font-medium">Nenhum produto encontrado para sua busca.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ADDONS TAB */}
          <TabsContent value="addons" className="space-y-4 pt-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <Input placeholder="Buscar adicional..." value={addonSearch} onChange={(e) => setAddonSearch(e.target.value)} className="pl-9 h-11" />
              </div>
              <Button onClick={() => setShowNewAddon(!showNewAddon)} className="h-11 gap-2 font-semibold">
                <Plus className="h-4 w-4" /> Novo Adicional
              </Button>
            </div>

            {showNewAddon && (
              <Card className="border-slate-100 bg-slate-50/20">
                <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Cadastrar Adicional / Complemento</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="space-y-1.5 col-span-2">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Nome</Label>
                    <Input value={newAddonName} onChange={(e) => setNewAddonName(e.target.value)} placeholder="Ex: Bacon Crocante, Ovo frito..." className="bg-white" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Vincular a Categoria</Label>
                    <Select value={newAddonCategoryId} onValueChange={setNewAddonCategoryId}>
                      <SelectTrigger className="bg-white"><SelectValue placeholder="Todas" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Todas / Geral</SelectItem>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Preço Extra</Label>
                    <div className="flex gap-2">
                        <Input type="number" step="0.01" value={newAddonPrice} onChange={(e) => setNewAddonPrice(e.target.value)} placeholder="0.00" className="bg-white" />
                        <Button onClick={handleAddAddon} disabled={addAddon.isPending}>Salvar</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-muted/40 shadow-sm overflow-hidden">
              <CardContent className="p-0 overflow-x-auto">
                {loadingAddons ? (
                  <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                ) : (
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="w-20 text-[10px] uppercase font-bold text-center">Cód</TableHead>
                        <TableHead className="text-[10px] uppercase font-bold">Nome do Adicional</TableHead>
                        <TableHead className="text-[10px] uppercase font-bold">Abrangência</TableHead>
                        <TableHead className="w-28 text-[10px] uppercase font-bold">Preço Base</TableHead>
                        <TableHead className="w-24 text-[10px] uppercase font-bold text-right pr-6">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAddons.map((a) => (
                        <TableRow key={a.id} className="hover:bg-muted/5 transition-colors">
                          <TableCell className="font-mono text-[10px] text-center text-muted-foreground">{a.code}</TableCell>
                          <TableCell>
                            {editingAddonId === a.id ? (
                              <Input value={editAddonName} onChange={(e) => setEditAddonName(e.target.value)} className="h-8 text-xs" />
                            ) : (
                              <span className="font-medium text-sm text-slate-700">{a.name}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {editingAddonId === a.id ? (
                              <Select value={editAddonCategoryId} onValueChange={setEditAddonCategoryId}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todas" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">Todas / Geral</SelectItem>
                                  {categories.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge variant="outline" className="text-[9px] font-semibold text-muted-foreground uppercase border-muted/50">
                                {!a.category_id ? "Todas Categorias" : getCategoryName(a.category_id)}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {editingAddonId === a.id ? (
                              <Input type="number" step="0.01" value={editAddonPrice} onChange={(e) => setEditAddonPrice(e.target.value)} className="h-8 w-24" />
                            ) : (
                              <span className="font-semibold text-rose-600/80 text-sm">R$ {Number(a.price).toFixed(2)}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <div className="flex justify-end gap-1">
                              {editingAddonId === a.id ? (
                                <>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600" onClick={() => handleSaveAddon(a.id)}>
                                    <Save className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingAddonId(null)}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900" onClick={() => { setEditingAddonId(a.id); setEditAddonName(a.name); setEditAddonPrice(String(a.price)); setEditAddonCategoryId(a.category_id || "none"); }}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <ConfirmDelete onConfirm={() => deleteAddon.mutate(a.id)} title="adicional" />
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* CATEGORIES TAB */}
          <TabsContent value="categories" className="space-y-4 pt-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <Input placeholder="Buscar categoria..." value={categorySearch} onChange={(e) => setCategorySearch(e.target.value)} className="pl-9 h-11" />
              </div>
              <Button onClick={() => setShowNewCategory(!showNewCategory)} className="h-11 gap-2 font-semibold">
                <Plus className="h-4 w-4" /> Nova Categoria
              </Button>
            </div>

            {showNewCategory && (
              <Card className="border-slate-100 bg-slate-50/20">
                <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Criar Nova Categoria</CardTitle></CardHeader>
                <CardContent className="flex gap-2 items-end">
                  <div className="space-y-1.5 flex-1">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Nome amigável</Label>
                    <Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Ex: Combos, Bebidas, Pizzas..." className="bg-white h-11" />
                  </div>
                  <Button onClick={handleAddCategory} disabled={addCategory.isPending} className="h-11 px-8">Criar Agora</Button>
                </CardContent>
              </Card>
            )}

            <Card className="border-muted/40 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                {loadingCategories ? (
                  <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                ) : (
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="text-[10px] uppercase font-bold pl-6">Título da Categoria</TableHead>
                        <TableHead className="w-24 text-[10px] uppercase font-bold text-right pr-6">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCategories.map((c) => (
                        <TableRow key={c.id} className="hover:bg-muted/5 transition-colors">
                          <TableCell className="font-semibold text-sm text-slate-700 pl-6 uppercase tracking-tight">{c.name}</TableCell>
                          <TableCell className="text-right pr-6">
                            <ConfirmDelete onConfirm={() => deleteCategory.mutate(c.id)} title="categoria" />
                          </TableCell>
                        </TableRow>
                      ))}
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
