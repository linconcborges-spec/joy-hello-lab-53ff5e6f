import { useState, useRef, useEffect } from "react";
import { Plus, Trash2, UtensilsCrossed, CloudUpload, Loader2, GripVertical, ChevronRight, ChevronDown, ChevronUp, Eye, EyeOff, Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useProducts, useAddProduct, useUpdateProduct, useDeleteProduct } from "@/hooks/useProducts";
import { useCategories, useUpdateCategory, useDeleteCategory } from "@/hooks/useCategories";
import { useAddCategory } from "@/hooks/useCategories";
import { useStorage } from "@/hooks/useStorage";
import { AssignProductsDialog } from "./AssignProductsDialog";
import { MoreVertical } from "lucide-react";

interface ProductsTabProps {
  newTrigger: number;
}

export function ProductsTab({ newTrigger }: ProductsTabProps) {
  const { data: products = [], isLoading: loadingProducts, isError: errorProducts } = useProducts();
  const { data: categories = [], isLoading: loadingCategories, isError: errorCategories } = useCategories();
  const addProduct = useAddProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const addCategory = useAddCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const { uploadImage, isUploading } = useStorage();

  const [search, setSearch] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newProductCategoryId, setNewProductCategoryId] = useState("none");

  // Sheet de edição
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editProductCategoryIds, setEditProductCategoryIds] = useState<string[]>([]);

  const [assigningCategory, setAssigningCategory] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (newTrigger > 0) setShowNewProduct(true);
  }, [newTrigger]);

  const toggleCategoryCollapse = (id: string) => {
    setExpandedCategories(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage(file);
    if (url) setNewImageUrl(url);
  };

  const handleEditFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage(file);
    if (url) setEditImageUrl(url);
  };

  const getCategoryName = (id: string | null | undefined) => {
    if (!id) return "Sem categoria";
    const cat = categories.find(c => c.id === id);
    return cat ? cat.name : "Desconhecida";
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
        category_ids: newProductCategoryId === "none" ? [] : [newProductCategoryId],
      },
      {
        onSuccess: () => {
          setNewCode(""); setNewName(""); setNewPrice(""); setNewDescription("");
          setNewImageUrl(""); setNewProductCategoryId("none"); setShowNewProduct(false);
        },
      }
    );
  };

  const openEditSheet = (p: any) => {
    setEditingProduct(p);
    setEditName(p.name);
    setEditPrice(String(p.price));
    setEditDescription(p.description || "");
    setEditImageUrl(p.image_url || "");
    setEditProductCategoryIds(p.category_ids ?? (p.category_id ? [p.category_id] : []));
  };

  const handleSaveProduct = () => {
    if (!editingProduct) return;
    updateProduct.mutate(
      { id: editingProduct.id, name: editName, price: parseFloat(editPrice) || 0, description: editDescription, image_url: editImageUrl, category_ids: editProductCategoryIds },
      { onSuccess: () => setEditingProduct(null) }
    );
  };

  const handleMoveCategory = async (cat: any, direction: "up" | "down") => {
    const sorted = categories.map(c => ({ ...c })).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    const needsNormalization = new Set(sorted.map(c => c.sort_order)).size !== sorted.length || sorted.some(c => c.sort_order == null);
    if (needsNormalization) sorted.forEach((c, i) => { c.sort_order = i * 10; });
    const idx = sorted.findIndex(c => c.id === cat.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx >= 0 && swapIdx < sorted.length) {
      const current = sorted[idx];
      const target = sorted[swapIdx];
      const temp = current.sort_order;
      current.sort_order = target.sort_order;
      target.sort_order = temp;
      try {
        if (needsNormalization) {
          await Promise.all(sorted.map(c => updateCategory.mutateAsync({ id: c.id, sort_order: c.sort_order })));
        } else {
          await Promise.all([
            updateCategory.mutateAsync({ id: current.id, sort_order: current.sort_order }),
            updateCategory.mutateAsync({ id: target.id, sort_order: target.sort_order }),
          ]);
        }
      } catch (err) {
        console.error("Move error:", err);
      }
    }
  };

  const handleDuplicateProduct = (p: any) => {
    addProduct.mutate({
      ...p,
      name: `${p.name} (Cópia)`,
      code: Math.floor(Math.random() * 9000) + 1000,
      sort_order: (products.length > 0 ? Math.max(...products.map(pr => pr.sort_order)) : 0) + 1,
    });
  };

  const filteredProducts = products.filter(
    (p) => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toString().includes(search)
  );

  const renderProductCard = (p: any) => (
    <div key={p.id} className={cn(
      "group flex items-center gap-3 bg-card px-3 py-2.5 rounded-xl border border-border/30 hover:border-border/60 transition-all",
      !p.is_visible && "opacity-50"
    )}>
      {/* Thumbnail */}
      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden border shrink-0">
        {p.image_url ? (
          <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
        ) : (
          <UtensilsCrossed className="h-4 w-4 text-muted-foreground/30" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-xs truncate">{p.code ? `${p.code} — ` : ""}{p.name}</p>
        <p className="text-[11px] text-muted-foreground truncate">{p.description || "Sem descrição"}</p>
      </div>

      {/* Preço */}
      <span className={cn("font-bold text-sm shrink-0", p.is_visible ? "text-rose-600" : "text-muted-foreground")}>
        R$ {Number(p.price).toFixed(2)}
      </span>

      {/* Ações — aparecem no hover */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateProduct.mutate({ id: p.id, is_visible: !p.is_visible })} title={p.is_visible ? "Ocultar" : "Exibir"}>
          {p.is_visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditSheet(p)} title="Editar">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteProduct.mutate(p.id)} title="Excluir">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Barra de busca + botões */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input placeholder="Buscar produto..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </span>
        </div>
        <Button variant="outline" onClick={() => setShowNewCategory(!showNewCategory)} className="gap-1.5 shrink-0">
          <Plus className="h-4 w-4" /> Categoria
        </Button>
        <Button onClick={() => setShowNewProduct(!showNewProduct)} className="gap-1.5 shrink-0">
          <Plus className="h-4 w-4" /> Produto
        </Button>
      </div>

      {/* Formulário nova categoria */}
      {showNewCategory && (
        <Card className="border-dashed border-primary/40 bg-primary/5">
          <CardHeader className="pb-3"><CardTitle className="text-sm text-primary">Nova Categoria</CardTitle></CardHeader>
          <CardContent className="flex gap-2 items-end">
            <div className="space-y-1.5 flex-1">
              <Label className="text-xs">Nome</Label>
              <Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Ex: Bebidas, Lanches..." onKeyDown={(e) => e.key === "Enter" && handleAddCategory()} />
            </div>
            <Button onClick={handleAddCategory} disabled={addCategory.isPending}>Salvar</Button>
            <Button variant="ghost" size="icon" onClick={() => { setShowNewCategory(false); setNewCategoryName(""); }}><X className="h-4 w-4" /></Button>
          </CardContent>
        </Card>
      )}

      {/* Formulário novo produto */}
      {showNewProduct && (
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Novo Produto</CardTitle>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowNewProduct(false)}><X className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="space-y-1.5">
                <Label className="text-xs">Código</Label>
                <Input value={newCode} onChange={(e) => setNewCode(e.target.value)} placeholder="Cód." className="w-20" />
              </div>
              <div className="space-y-1.5 flex-1 min-w-[180px]">
                <Label className="text-xs">Nome</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nome do produto" />
              </div>
              <div className="space-y-1.5 w-36">
                <Label className="text-xs">Categoria</Label>
                <Select value={newProductCategoryId} onValueChange={setNewProductCategoryId}>
                  <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Preço (R$)</Label>
                <Input type="number" step="0.01" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="0.00" className="w-28" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Descrição</Label>
                <Input value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="Ex: Hambúrguer, Presunto, Mussarela..." />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Imagem</Label>
                <div className="flex gap-2 items-center">
                  {newImageUrl && (
                    <img src={newImageUrl} alt="preview" className="h-9 w-9 rounded-lg object-cover border shrink-0" />
                  )}
                  <Input value={newImageUrl} onChange={(e) => setNewImageUrl(e.target.value)} placeholder="https://..." className="flex-1" />
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                  <Button type="button" variant="secondary" size="icon" className="shrink-0 rounded-xl" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudUpload className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleAddProduct} disabled={addProduct.isPending}>Salvar Produto</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista por categoria */}
      <div className="space-y-4">
        {loadingProducts || loadingCategories ? (
          <div className="flex flex-col items-center justify-center py-16 bg-card rounded-2xl border border-dashed">
            <Loader2 className="h-6 w-6 animate-spin text-primary mb-3" />
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Carregando cardápio...</p>
          </div>
        ) : errorProducts || errorCategories ? (
          <div className="flex flex-col items-center justify-center py-16 bg-destructive/5 rounded-2xl border border-destructive/20">
            <X className="h-6 w-6 text-destructive mb-2" />
            <p className="text-sm font-bold text-destructive">Erro ao carregar dados</p>
          </div>
        ) : (
          <>
            {[...categories].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).map((cat) => {
              const catProducts = filteredProducts
                .filter(p => (p.category_ids ?? [p.category_id].filter(Boolean)).includes(cat.id))
                .sort((a, b) => (Number(a.code) || 0) - (Number(b.code) || 0));

              if (catProducts.length === 0 && search) return null;

              return (
                <div key={cat.id} className="space-y-2">
                  {/* Cabeçalho categoria */}
                  <div className="flex items-center justify-between bg-muted/40 px-3 py-2 rounded-xl border border-border/30">
                    <div className="flex items-center gap-2 flex-1 cursor-pointer select-none" onClick={() => toggleCategoryCollapse(cat.id)}>
                      <div className="text-muted-foreground/50">
                        {!expandedCategories[cat.id] ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                      <h3 className="font-bold text-sm uppercase tracking-tight">{cat.name}</h3>
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5">{catProducts.length}</Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleMoveCategory(cat, "up")}><ChevronUp className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleMoveCategory(cat, "down")}><ChevronDown className="h-3.5 w-3.5" /></Button>
                      <Button variant="outline" size="sm" onClick={() => setAssigningCategory(cat.id)} className="h-7 text-[10px] uppercase font-bold gap-1 ml-1">
                        <Plus className="h-3 w-3" /> Existente
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => { setShowNewProduct(true); setNewProductCategoryId(cat.id); }} className="h-7 text-[10px] uppercase font-bold gap-1">
                        <Plus className="h-3 w-3" /> Novo
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="h-3.5 w-3.5" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="text-destructive font-bold text-xs" onClick={() => deleteCategory.mutate(cat.id)}>Excluir Categoria</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {expandedCategories[cat.id] && (
                    <div className="space-y-1.5 pl-1">
                      {catProducts.map(renderProductCard)}
                      {catProducts.length === 0 && (
                        <div className="text-center py-5 border border-dashed rounded-xl opacity-30">
                          <p className="text-xs font-bold uppercase">Nenhum produto nesta categoria</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Sem categoria */}
            {(() => {
              const unassigned = filteredProducts
                .filter(p => !p.category_id || !categories.some(c => c.id === p.category_id))
                .sort((a, b) => (Number(a.code) || 0) - (Number(b.code) || 0));
              if (unassigned.length === 0) return null;
              return (
                <div className="space-y-2 pt-2 border-t border-dashed">
                  <div className="flex items-center gap-2 px-3 py-2">
                    <h3 className="font-bold text-xs uppercase text-muted-foreground">Sem Categoria</h3>
                    <Badge variant="outline" className="text-[10px] h-5 px-1.5">{unassigned.length}</Badge>
                  </div>
                  <div className="space-y-1.5">
                    {unassigned.map(renderProductCard)}
                  </div>
                </div>
              );
            })()}
          </>
        )}
      </div>

      {/* Sheet de edição */}
      <Sheet open={!!editingProduct} onOpenChange={(o) => !o && setEditingProduct(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-5">
            <SheetTitle className="text-base font-bold">Editar produto</SheetTitle>
          </SheetHeader>

          {editingProduct && (
            <div className="space-y-4">
              {/* Preview da imagem */}
              <div className="flex items-center justify-center">
                <div className="h-32 w-32 rounded-2xl bg-muted border overflow-hidden">
                  {editImageUrl ? (
                    <img src={editImageUrl} alt="preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <UtensilsCrossed className="h-10 w-10 text-muted-foreground/20" />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Imagem</Label>
                <div className="flex gap-2 items-center">
                  <Input value={editImageUrl} onChange={(e) => setEditImageUrl(e.target.value)} placeholder="https://..." className="flex-1 text-xs" />
                  <input type="file" ref={editFileInputRef} className="hidden" accept="image/*" onChange={handleEditFileUpload} />
                  <Button type="button" variant="secondary" size="icon" className="shrink-0 rounded-xl" onClick={() => editFileInputRef.current?.click()} disabled={isUploading}>
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudUpload className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Nome</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Preço (R$)</Label>
                <Input type="number" step="0.01" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Descrição</Label>
                <Input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Ingredientes, detalhes..." />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Categorias</Label>
                <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
                  {categories.map(c => (
                    <label key={c.id} className="flex items-center gap-1.5 cursor-pointer">
                      <Checkbox
                        checked={editProductCategoryIds.includes(c.id)}
                        onCheckedChange={(checked) =>
                          setEditProductCategoryIds(prev =>
                            checked ? [...prev, c.id] : prev.filter(id => id !== c.id)
                          )
                        }
                      />
                      <span className="text-xs font-semibold uppercase">{c.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setEditingProduct(null)}>Cancelar</Button>
                <Button className="flex-1" onClick={handleSaveProduct} disabled={updateProduct.isPending}>
                  {updateProduct.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AssignProductsDialog
        open={!!assigningCategory}
        onClose={() => setAssigningCategory(null)}
        categoryId={assigningCategory}
        products={products}
        updateProduct={updateProduct}
        getCategoryName={getCategoryName}
      />
    </>
  );
}
