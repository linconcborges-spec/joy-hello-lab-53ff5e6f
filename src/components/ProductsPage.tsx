import { useState } from "react";
import { ArrowLeft, Plus, Pencil, Trash2, Search, Save, X, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useProducts, useAddProduct, useUpdateProduct, useDeleteProduct } from "@/hooks/useProducts";
import { useAddons, useAddAddon, useUpdateAddon, useDeleteAddon } from "@/hooks/useAddons";
import { useCategories, useAddCategory, useUpdateCategory, useDeleteCategory } from "@/hooks/useCategories";
import { useStorage } from "@/hooks/useStorage";
import { CloudUpload, Loader2, GripVertical, ChevronUp, ChevronDown, Eye, EyeOff, MoreVertical, Copy } from "lucide-react";
import { useRef } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

function AssignProductsDialog({ 
  open, 
  onClose, 
  categoryId, 
  products, 
  updateProduct, 
  getCategoryName 
}: { 
  open: boolean;
  onClose: () => void;
  categoryId: string | null;
  products: any[];
  updateProduct: any;
  getCategoryName: (id: string | null | undefined) => string;
}) {
  const [search, setSearch] = useState("");

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        onClose();
        setSearch("");
      }
    }}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col p-4">
        <DialogHeader>
          <DialogTitle>Vincular Produtos</DialogTitle>
        </DialogHeader>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            autoFocus
            placeholder="Buscar por nome ou código..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="pl-9" 
          />
        </div>
        <div className="flex-1 overflow-y-auto pr-2 space-y-2 py-4">
          {(() => {
            const searchLower = search.toLowerCase();
            const allSorted = [...products]
              .filter(p => !search || p.name.toLowerCase().includes(searchLower) || (p.code && p.code.toString().toLowerCase().includes(searchLower)))
              .sort((a, b) => a.name.localeCompare(b.name));
            
            if (allSorted.length === 0) {
              return <p className="text-center text-muted-foreground text-sm py-8">Nenhum produto encontrado...</p>;
            }

            return allSorted.map(p => {
              const isAssigned = p.category_id === categoryId;
              return (
                <div key={p.id} className="flex items-start space-x-3 p-3 hover:bg-muted/50 rounded-lg cursor-pointer border border-transparent hover:border-border transition-all" onClick={(e) => {
                  e.preventDefault();
                  updateProduct.mutate({ id: p.id, category_id: isAssigned ? null : categoryId });
                }}>
                  <Checkbox checked={isAssigned} className="mt-1" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{p.code ? `${p.code} - ` : ""}{p.name}</p>
                    {p.category_id && p.category_id !== categoryId && (
                      <p className="text-[10px] text-muted-foreground uppercase truncate">Atualmente em: {getCategoryName(p.category_id)}</p>
                    )}
                    {!p.category_id && (
                      <p className="text-[10px] text-emerald-500 uppercase font-black">Sem categoria</p>
                    )}
                  </div>
                </div>
              );
            });
          })()}
        </div>
        <DialogFooter className="pt-2 border-t">
          <Button className="w-full" onClick={() => { onClose(); setSearch(""); }}>Concluído</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ProductsPageProps {
  onBack: () => void;
}

export function ProductsPage({ onBack }: ProductsPageProps) {
  const { data: products = [], isLoading: loadingProducts, isError: errorProducts } = useProducts();
  const { data: addons = [], isLoading: loadingAddons } = useAddons();
  const { data: categories = [], isLoading: loadingCategories, isError: errorCategories } = useCategories();
  
  const addProduct = useAddProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  
  const addAddon = useAddAddon();
  const updateAddon = useUpdateAddon();
  const deleteAddon = useDeleteAddon();

  const addCategory = useAddCategory();
  const updateCategory = useUpdateCategory();
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

  const [assigningCategory, setAssigningCategory] = useState<string | null>(null);

  const { uploadImage, isUploading } = useStorage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await uploadImage(file);
    if (url) {
      if (isEdit) {
        setEditImageUrl(url);
      } else {
        setNewImageUrl(url);
      }
    }
  };

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

  const handleMoveCategory = (cat: any, direction: 'up' | 'down') => {
    const sorted = [...categories].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex(c => c.id === cat.id);
    if (direction === 'up' && idx > 0) {
      const prev = sorted[idx - 1];
      updateCategory.mutate({ id: cat.id, sort_order: prev.sort_order });
      updateCategory.mutate({ id: prev.id, sort_order: cat.sort_order });
    } else if (direction === 'down' && idx < sorted.length - 1) {
      const next = sorted[idx + 1];
      updateCategory.mutate({ id: cat.id, sort_order: next.sort_order });
      updateCategory.mutate({ id: next.id, sort_order: cat.sort_order });
    }
  };

  const handleMoveProduct = (prod: any, direction: 'up' | 'down') => {
    const catProducts = products
      .filter(p => p.category_id === prod.category_id)
      .sort((a, b) => a.sort_order - b.sort_order);
    
    const idx = catProducts.findIndex(p => p.id === prod.id);
    if (direction === 'up' && idx > 0) {
      const prev = catProducts[idx - 1];
      updateProduct.mutate({ id: prod.id, sort_order: prev.sort_order });
      updateProduct.mutate({ id: prev.id, sort_order: prod.sort_order });
    } else if (direction === 'down' && idx < catProducts.length - 1) {
      const next = catProducts[idx + 1];
      updateProduct.mutate({ id: prod.id, sort_order: next.sort_order });
      updateProduct.mutate({ id: next.id, sort_order: prod.sort_order });
    }
  };

  const handleDuplicateProduct = (p: any) => {
    addProduct.mutate({
      ...p,
      name: `${p.name} (Cópia)`,
      code: Math.floor(Math.random() * 9000) + 1000,
      sort_order: (products.length > 0 ? Math.max(...products.map(pr => pr.sort_order)) : 0) + 1
    });
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
            <TabsTrigger value="categories">Categorias ({categories.length})</TabsTrigger>
          </TabsList>

          {/* PRODUCTS TAB */}
          <TabsContent value="products" className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar produto por nome ou código..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
              <Button variant="outline" onClick={() => setShowNewCategory(!showNewCategory)} className="gap-1.5">
                <Plus className="h-4 w-4" /> Categoria
              </Button>
              <Button onClick={() => setShowNewProduct(!showNewProduct)} className="gap-1.5">
                <Plus className="h-4 w-4" /> Produto
              </Button>
            </div>

            {showNewCategory && (
              <Card className="border-dashed border-primary/40 bg-primary/5">
                <CardHeader className="pb-3"><CardTitle className="text-base text-primary">Nova Categoria</CardTitle></CardHeader>
                <CardContent className="flex gap-2 items-end">
                  <div className="space-y-1.5 flex-1">
                    <Label className="text-xs">Nome da Categoria</Label>
                    <Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Ex: Bebidas, Lanches..." onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()} />
                  </div>
                  <Button onClick={handleAddCategory} disabled={addCategory.isPending}>Salvar</Button>
                  <Button variant="ghost" size="icon" onClick={() => { setShowNewCategory(false); setNewCategoryName(""); }}><X className="h-4 w-4" /></Button>
                </CardContent>
              </Card>
            )}

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
                    <div className="space-y-1.5 flex-1">
                      <Label className="text-xs">Link da Imagem (ou clique na nuvem para subir)</Label>
                      <div className="flex gap-2">
                        <Input value={newImageUrl} onChange={(e) => setNewImageUrl(e.target.value)} placeholder="https://..." className="flex-1" />
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e)}
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          className="shrink-0 rounded-xl"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                        >
                          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudUpload className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleAddProduct} disabled={addProduct.isPending} className="w-full md:w-auto">Salvar Produto</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-6">
              {loadingProducts || loadingCategories ? (
                <div className="flex flex-col items-center justify-center py-20 bg-card rounded-2xl border border-dashed">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Organizando Cardápio...</p>
                </div>
              ) : errorProducts || errorCategories ? (
                <div className="flex flex-col items-center justify-center py-20 bg-destructive/5 rounded-2xl border border-destructive/20">
                  <X className="h-8 w-8 text-destructive mb-2" />
                  <p className="text-sm font-bold text-destructive uppercase">Erro ao carregar dados</p>
                  <p className="text-xs text-muted-foreground mt-1 text-center px-4">Verifique se as colunas 'sort_order' e 'is_visible' foram criadas no banco de dados.</p>
                </div>
              ) : (
                <>
                  {/* CATEGORIES WITH PRODUCTS */}
                  {[...categories].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).map((cat) => {
                    const catProducts = filteredProducts
                      .filter(p => p.category_id === cat.id)
                      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

                    if (catProducts.length === 0 && search) return null;

                    return (
                      <div key={cat.id} className="space-y-3">
                      <div className="flex items-center justify-between bg-muted/30 p-3 rounded-xl border border-border/40">
                        <div className="flex items-center gap-3">
                          <GripVertical className="h-4 w-4 text-muted-foreground/40" />
                          <h3 className="font-black text-sm uppercase italic tracking-tighter">{cat.name}</h3>
                          <Badge variant="outline" className="text-[10px] h-5">{catProducts.length}</Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleMoveCategory(cat, 'up')}><ChevronUp className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleMoveCategory(cat, 'down')}><ChevronDown className="h-4 w-4" /></Button>
                          <Button variant="outline" size="sm" onClick={() => setAssigningCategory(cat.id)} className="h-8 text-[10px] uppercase font-bold gap-1 ml-2" title="Vincular produtos existentes nesta categoria">
                            <Plus className="h-3 w-3" /> Existente
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => { setShowNewProduct(true); setNewProductCategoryId(cat.id); }} className="h-8 text-[10px] uppercase font-bold gap-1 ml-1" title="Criar novo produto">
                            <Plus className="h-3 w-3" /> Novo
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem className="text-destructive font-bold" onClick={() => deleteCategory.mutate(cat.id)}>Excluir Categoria</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      <div className="space-y-1">
                        {catProducts.map((p) => (
                          <div key={p.id} className={cn(
                            "group flex items-center justify-between bg-card p-3 rounded-xl border border-border/20 hover:border-primary/30 transition-all",
                            !p.is_visible && "opacity-50 grayscale bg-muted/10"
                          )}>
                            <div className="flex items-center gap-4 flex-1">
                              <GripVertical className="h-4 w-4 text-muted-foreground/20 group-hover:text-muted-foreground/40" />
                              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden border">
                                {p.image_url ? (
                                  <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                                ) : (
                                  <UtensilsCrossed className="h-4 w-4 text-muted-foreground/20" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                {editingProductId === p.id ? (
                                  <div className="space-y-2">
                                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8 font-bold text-xs" />
                                    <Input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="h-7 text-[10px]" />
                                  </div>
                                ) : (
                                  <div>
                                    <p className="font-bold text-xs uppercase truncate">{p.code ? `${p.code} - ` : ""}{p.name}</p>
                                    <p className="text-[10px] text-muted-foreground truncate">{p.description || "Sem descrição"}</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              {editingProductId === p.id ? (
                                <Input type="number" step="0.01" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="h-8 w-20 text-xs text-right" />
                              ) : (
                                <span className={cn("font-black text-sm italic", p.is_visible ? "text-rose-600" : "text-muted-foreground")}>
                                  R$ {Number(p.price).toFixed(2)}
                                </span>
                              )}

                              <div className="flex items-center gap-0.5 border-l pl-4 ml-2">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateProduct.mutate({ id: p.id, is_visible: !p.is_visible })}>
                                  {p.is_visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                                </Button>
                                
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="h-3.5 w-3.5" /></Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48">
                                    {editingProductId === p.id ? (
                                      <>
                                        <DropdownMenuItem onClick={() => handleSaveProduct(p.id)} className="font-bold text-primary gap-2"><Save className="h-4 w-4" /> Salvar</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setEditingProductId(null)} className="gap-2"><X className="h-4 w-4" /> Cancelar</DropdownMenuItem>
                                      </>
                                    ) : (
                                      <>
                                        <DropdownMenuItem onClick={() => {
                                          setEditingProductId(p.id); 
                                          setEditName(p.name); 
                                          setEditPrice(String(p.price)); 
                                          setEditDescription(p.description || "");
                                          setEditImageUrl(p.image_url || "");
                                          setEditProductCategoryId(p.category_id || "none");
                                        }} className="gap-2 font-bold"><Pencil className="h-4 w-4" /> Editar</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleMoveProduct(p, 'up')} className="gap-2"><ChevronUp className="h-4 w-4" /> Mover para Cima</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleMoveProduct(p, 'down')} className="gap-2"><ChevronDown className="h-4 w-4" /> Mover para Baixo</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleDuplicateProduct(p)} className="gap-2"><Copy className="h-4 w-4" /> Duplicar</DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive font-bold gap-2" onClick={() => deleteProduct.mutate(p.id)}><Trash2 className="h-4 w-4" /> Excluir</DropdownMenuItem>
                                      </>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </div>
                        ))}
                        {catProducts.length === 0 && (
                          <div className="text-center py-6 border border-dashed rounded-xl opacity-20">
                            <p className="text-[10px] font-black uppercase">Nenhum produto nesta categoria</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                  })}

                  {/* UNASSIGNED PRODUCTS */}
                  {(() => {
                    const unassignedProducts = filteredProducts
                      .filter(p => !p.category_id || !categories.some(c => c.id === p.category_id))
                      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
                    
                    if (unassignedProducts.length === 0) return null;

                    return (
                      <div className="space-y-3 pt-4 border-t border-dashed">
                        <div className="flex items-center justify-between bg-slate-100/50 p-3 rounded-xl border border-dashed">
                          <div className="flex items-center gap-3">
                            <h3 className="font-black text-sm uppercase italic tracking-tighter text-slate-400">Produtos Sem Categoria</h3>
                            <Badge variant="outline" className="text-[10px] h-5 bg-white">{unassignedProducts.length}</Badge>
                          </div>
                        </div>
                        <div className="space-y-1">
                          {unassignedProducts.map((p) => (
                            <div key={p.id} className={cn(
                              "group flex items-center justify-between bg-card p-3 rounded-xl border border-border/20 hover:border-primary/30 transition-all",
                              !p.is_visible && "opacity-50 grayscale bg-muted/10"
                            )}>
                              <div className="flex items-center gap-4 flex-1">
                                <GripVertical className="h-4 w-4 text-muted-foreground/20 group-hover:text-muted-foreground/40" />
                                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden border">
                                  {p.image_url ? (
                                    <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                                  ) : (
                                    <UtensilsCrossed className="h-4 w-4 text-muted-foreground/20" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  {editingProductId === p.id ? (
                                    <div className="space-y-2">
                                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8 font-bold text-xs" />
                                      <Input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="h-7 text-[10px]" />
                                    </div>
                                  ) : (
                                    <div>
                                      <p className="font-bold text-xs uppercase truncate">{p.code ? `${p.code} - ` : ""}{p.name}</p>
                                      <p className="text-[10px] text-muted-foreground truncate">{p.description || "Sem descrição"}</p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-4">
                                {editingProductId === p.id ? (
                                  <Input type="number" step="0.01" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="h-8 w-20 text-xs text-right" />
                                ) : (
                                  <span className={cn("font-black text-sm italic", p.is_visible ? "text-rose-600" : "text-muted-foreground")}>
                                    R$ {Number(p.price).toFixed(2)}
                                  </span>
                                )}

                                <div className="flex items-center gap-0.5 border-l pl-4 ml-2">
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateProduct.mutate({ id: p.id, is_visible: !p.is_visible })}>
                                    {p.is_visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                                  </Button>
                                  
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="h-3.5 w-3.5" /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                      {editingProductId === p.id ? (
                                        <>
                                          <DropdownMenuItem onClick={() => handleSaveProduct(p.id)} className="font-bold text-primary gap-2"><Save className="h-4 w-4" /> Salvar</DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => setEditingProductId(null)} className="gap-2"><X className="h-4 w-4" /> Cancelar</DropdownMenuItem>
                                        </>
                                      ) : (
                                        <>
                                          <DropdownMenuItem onClick={() => {
                                            setEditingProductId(p.id); 
                                            setEditName(p.name); 
                                            setEditPrice(String(p.price)); 
                                            setEditDescription(p.description || "");
                                            setEditImageUrl(p.image_url || "");
                                            setEditProductCategoryId(p.category_id || "none");
                                          }} className="gap-2 font-bold"><Pencil className="h-4 w-4" /> Editar</DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleMoveProduct(p, 'up')} className="gap-2"><ChevronUp className="h-4 w-4" /> Mover para Cima</DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleMoveProduct(p, 'down')} className="gap-2"><ChevronDown className="h-4 w-4" /> Mover para Baixo</DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleDuplicateProduct(p)} className="gap-2"><Copy className="h-4 w-4" /> Duplicar</DropdownMenuItem>
                                          <DropdownMenuItem className="text-destructive font-bold gap-2" onClick={() => deleteProduct.mutate(p.id)}><Trash2 className="h-4 w-4" /> Excluir</DropdownMenuItem>
                                        </>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })()}
                </>
              )}
            </div>
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

      {/* DIALOG DE ASSOCIAÇÃO DE PRODUTOS ISOLADA EM COMPONENTE */}
      <AssignProductsDialog 
        open={!!assigningCategory} 
        onClose={() => setAssigningCategory(null)} 
        categoryId={assigningCategory}
        products={products}
        updateProduct={updateProduct}
        getCategoryName={getCategoryName}
      />
    </div>
  );
}
