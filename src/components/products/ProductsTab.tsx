import { useState, useRef, useEffect } from "react";
import { Plus, Pencil, Trash2, Save, X, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { CloudUpload, Loader2, GripVertical, ChevronUp, ChevronDown, ChevronRight, Eye, EyeOff, MoreVertical, Copy } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProducts, useAddProduct, useUpdateProduct, useDeleteProduct } from "@/hooks/useProducts";
import { useCategories, useAddCategory, useUpdateCategory, useDeleteCategory } from "@/hooks/useCategories";
import { useStorage } from "@/hooks/useStorage";
import { AssignProductsDialog } from "./AssignProductsDialog";

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

  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editProductCategoryIds, setEditProductCategoryIds] = useState<string[]>([]);

  const [assigningCategory, setAssigningCategory] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSaveProduct = (id: string) => {
    updateProduct.mutate(
      { id, name: editName, price: parseFloat(editPrice) || 0, description: editDescription, image_url: editImageUrl, category_ids: editProductCategoryIds },
      { onSuccess: () => setEditingProductId(null) }
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
              <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
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
                    <span className="text-[10px] font-bold uppercase">{c.name}</span>
                  </label>
                ))}
              </div>
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
                    setEditProductCategoryIds(p.category_ids ?? (p.category_id ? [p.category_id] : []));
                  }} className="gap-2 font-bold"><Pencil className="h-4 w-4" /> Editar</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDuplicateProduct(p)} className="gap-2"><Copy className="h-4 w-4" /> Duplicar</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive font-bold gap-2" onClick={() => deleteProduct.mutate(p.id)}><Trash2 className="h-4 w-4" /> Excluir</DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input placeholder="Buscar produto por nome ou código..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </span>
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
              <Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Ex: Bebidas, Lanches..." onKeyDown={(e) => e.key === "Enter" && handleAddCategory()} />
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
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                  <Button type="button" variant="secondary" size="icon" className="shrink-0 rounded-xl" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
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
            {[...categories].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).map((cat) => {
              const catProducts = filteredProducts
                .filter(p => (p.category_ids ?? [p.category_id].filter(Boolean)).includes(cat.id))
                .sort((a, b) => (Number(a.code) || 0) - (Number(b.code) || 0));

              if (catProducts.length === 0 && search) return null;

              return (
                <div key={cat.id} className="space-y-3">
                  <div className="flex items-center justify-between bg-muted/30 p-3 rounded-xl border border-border/40">
                    <div className="flex items-center gap-3 flex-1 cursor-pointer select-none group" onClick={() => toggleCategoryCollapse(cat.id)} title="Clique para expandir/recolher">
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground/40 hover:bg-muted/50 cursor-grab active:cursor-grabbing shrink-0" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                        <GripVertical className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center justify-center shrink-0 w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors">
                        {!expandedCategories[cat.id] ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                      <h3 className="font-black text-sm uppercase italic tracking-tighter shrink-0 group-hover:text-primary transition-colors">{cat.name}</h3>
                      <Badge variant="outline" className="text-[10px] h-5">{catProducts.length}</Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleMoveCategory(cat, "up")}><ChevronUp className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleMoveCategory(cat, "down")}><ChevronDown className="h-4 w-4" /></Button>
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

                  {expandedCategories[cat.id] && (
                    <div className="space-y-1 mt-2">
                      {catProducts.map(renderProductCard)}
                      {catProducts.length === 0 && (
                        <div className="text-center py-6 border border-dashed rounded-xl opacity-20">
                          <p className="text-[10px] font-black uppercase">Nenhum produto nesta categoria</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {(() => {
              const unassignedProducts = filteredProducts
                .filter(p => !p.category_id || !categories.some(c => c.id === p.category_id))
                .sort((a, b) => (Number(a.code) || 0) - (Number(b.code) || 0));

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
                    {unassignedProducts.map(renderProductCard)}
                  </div>
                </div>
              );
            })()}
          </>
        )}
      </div>

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
