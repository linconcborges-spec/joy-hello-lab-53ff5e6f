import { useState, useRef, useEffect, useCallback } from "react";
import { Plus, Trash2, UtensilsCrossed, CloudUpload, Loader2, GripVertical, ChevronRight, ChevronDown, Eye, EyeOff, Pencil, X, MoreVertical, PackageX } from "lucide-react";
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
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useProducts, useAddProduct, useUpdateProduct, useDeleteProduct } from "@/hooks/useProducts";
import { useCategories, useUpdateCategory, useDeleteCategory, useAddCategory } from "@/hooks/useCategories";
import { useStorage } from "@/hooks/useStorage";
import { useSettings } from "@/hooks/useSettings";
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
  const { settings, updateSettings } = useSettings();
  const outOfStockProducts: string[] = settings.outOfStockProducts ?? [];

  const toggleOutOfStock = (productId: string) => {
    const updated = outOfStockProducts.includes(productId)
      ? outOfStockProducts.filter(id => id !== productId)
      : [...outOfStockProducts, productId];
    updateSettings({ outOfStockProducts: updated });
  };

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
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");

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

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = useCallback((event: DragEndEvent, catProducts: any[]) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = catProducts.findIndex(p => p.id === active.id);
    const newIndex = catProducts.findIndex(p => p.id === over.id);
    const reordered = arrayMove(catProducts, oldIndex, newIndex);

    reordered.forEach((p, i) => {
      if (p.sort_order !== i) {
        updateProduct.mutate({ id: p.id, sort_order: i });
      }
    });
  }, [updateProduct]);

  const handleCategoryDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const sorted = [...categories].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    const oldIndex = sorted.findIndex(c => c.id === active.id);
    const newIndex = sorted.findIndex(c => c.id === over.id);
    const reordered = arrayMove(sorted, oldIndex, newIndex);

    reordered.forEach((c, i) => {
      updateCategory.mutate({ id: c.id, sort_order: i * 10 });
    });
  }, [categories, updateCategory]);

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
            {(() => {
              const sortedCats = [...categories].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
              return (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCategoryDragEnd}>
                  <SortableContext items={sortedCats.map(c => c.id)} strategy={verticalListSortingStrategy}>
                    {sortedCats.map((cat) => {
                      const catProducts = filteredProducts
                        .filter(p => (p.category_ids ?? [p.category_id].filter(Boolean)).includes(cat.id))
                        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
                      if (catProducts.length === 0 && search) return null;
                      return (
                        <SortableCategoryItem
                          key={cat.id}
                          cat={cat}
                          catProducts={catProducts}
                          sensors={sensors}
                          expandedCategories={expandedCategories}
                          toggleCategoryCollapse={toggleCategoryCollapse}
                          editingCategoryId={editingCategoryId}
                          editingCategoryName={editingCategoryName}
                          setEditingCategoryId={setEditingCategoryId}
                          setEditingCategoryName={setEditingCategoryName}
                          updateCategory={updateCategory}
                          setAssigningCategory={setAssigningCategory}
                          setShowNewProduct={setShowNewProduct}
                          setNewProductCategoryId={setNewProductCategoryId}
                          deleteCategory={deleteCategory}
                          openEditSheet={openEditSheet}
                          deleteProduct={deleteProduct}
                          updateProduct={updateProduct}
                          handleDragEnd={handleDragEnd}
                          outOfStockProducts={outOfStockProducts}
                          toggleOutOfStock={toggleOutOfStock}
                        />
                      );
                    })}
                  </SortableContext>
                </DndContext>
              );
            })()}

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
                    {unassigned.map(p => (
                      <div key={p.id} className="group flex items-center gap-3 bg-card px-3 py-2.5 rounded-xl border border-border/30 hover:border-border/60 transition-colors">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden border shrink-0">
                          {p.image_url ? <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" /> : <UtensilsCrossed className="h-4 w-4 text-muted-foreground/30" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-xs truncate">{p.code ? `${p.code} — ` : ""}{p.name}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{p.description || "Sem descrição"}</p>
                        </div>
                        <span className="font-bold text-sm text-rose-600 shrink-0">R$ {Number(p.price).toFixed(2)}</span>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditSheet(p)} title="Editar"><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteProduct.mutate(p.id)} title="Excluir"><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>
                    ))}
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

// ── Categoria arrastável ───────────────────────────────────────────────────
function SortableCategoryItem({
  cat, catProducts, sensors, expandedCategories, toggleCategoryCollapse,
  editingCategoryId, editingCategoryName, setEditingCategoryId, setEditingCategoryName,
  updateCategory, setAssigningCategory, setShowNewProduct, setNewProductCategoryId,
  deleteCategory, openEditSheet, deleteProduct, updateProduct, handleDragEnd,
  outOfStockProducts, toggleOutOfStock,
}: {
  cat: any; catProducts: any[]; sensors: any; expandedCategories: Record<string, boolean>;
  toggleCategoryCollapse: (id: string) => void; editingCategoryId: string | null;
  editingCategoryName: string; setEditingCategoryId: (id: string | null) => void;
  setEditingCategoryName: (n: string) => void; updateCategory: any;
  setAssigningCategory: (id: string) => void; setShowNewProduct: (v: boolean) => void;
  setNewProductCategoryId: (id: string) => void; deleteCategory: any;
  openEditSheet: (p: any) => void; deleteProduct: any; updateProduct: any;
  handleDragEnd: (event: DragEndEvent, catProducts: any[]) => void;
  outOfStockProducts: string[]; toggleOutOfStock: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cat.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const isEditing = editingCategoryId === cat.id;

  return (
    <div ref={setNodeRef} style={style} className="space-y-2">
      <div className="flex items-center justify-between bg-muted/40 px-3 py-2 rounded-xl border border-border/30">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {!isEditing && (
            <button
              {...attributes} {...listeners}
              className="cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground/60 shrink-0 touch-none"
              tabIndex={-1}
            >
              <GripVertical className="h-4 w-4" />
            </button>
          )}
          {!isEditing && (
            <div className="text-muted-foreground/50 cursor-pointer shrink-0" onClick={() => toggleCategoryCollapse(cat.id)}>
              {!expandedCategories[cat.id] ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          )}

          {isEditing ? (
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <Input
                value={editingCategoryName}
                onChange={(e) => setEditingCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { updateCategory.mutate({ id: cat.id, name: editingCategoryName.trim() }); setEditingCategoryId(null); }
                  if (e.key === "Escape") setEditingCategoryId(null);
                }}
                className="h-7 text-xs font-bold uppercase flex-1"
                autoFocus
              />
              <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => { updateCategory.mutate({ id: cat.id, name: editingCategoryName.trim() }); setEditingCategoryId(null); }}>
                <svg className="h-3.5 w-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => setEditingCategoryId(null)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 cursor-pointer select-none flex-1 min-w-0" onClick={() => toggleCategoryCollapse(cat.id)}>
              <h3 className="font-bold text-sm uppercase tracking-tight truncate">{cat.name}</h3>
              <Badge variant="outline" className="text-[10px] h-5 px-1.5 shrink-0">{catProducts.length}</Badge>
              <Button
                size="icon" variant="ghost"
                className="h-6 w-6 shrink-0 text-muted-foreground/40 hover:text-foreground transition-colors"
                onClick={(e) => { e.stopPropagation(); setEditingCategoryId(cat.id); setEditingCategoryName(cat.name); }}
                title="Renomear categoria"
              >
                <Pencil className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {!isEditing && (
          <div className="flex items-center gap-1 shrink-0">
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
        )}
      </div>

      {expandedCategories[cat.id] && (
        <div className="space-y-1.5 pl-1">
          {catProducts.length === 0 ? (
            <div className="text-center py-5 border border-dashed rounded-xl opacity-30">
              <p className="text-xs font-bold uppercase">Nenhum produto nesta categoria</p>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, catProducts)}>
              <SortableContext items={catProducts.map(p => p.id)} strategy={verticalListSortingStrategy}>
                {catProducts.map(p => (
                  <SortableProductCard
                    key={p.id}
                    product={p}
                    onEdit={openEditSheet}
                    onDelete={(id) => deleteProduct.mutate(id)}
                    onToggleVisible={(p) => updateProduct.mutate({ id: p.id, is_visible: !p.is_visible })}
                    isOutOfStock={outOfStockProducts.includes(p.id)}
                    onToggleStock={() => toggleOutOfStock(p.id)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}
    </div>
  );
}

// ── Produto arrastável ─────────────────────────────────────────────────────
function SortableProductCard({
  product: p,
  onEdit,
  onDelete,
  onToggleVisible,
  isOutOfStock,
  onToggleStock,
}: {
  product: any;
  onEdit: (p: any) => void;
  onDelete: (id: string) => void;
  onToggleVisible: (p: any) => void;
  isOutOfStock: boolean;
  onToggleStock: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: p.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-3 bg-card px-3 py-2.5 rounded-xl border border-border/30 hover:border-border/60 transition-colors",
        !p.is_visible && "opacity-50",
        isOutOfStock && "border-orange-200 bg-orange-50/30"
      )}
    >
      {/* Handle de arrastar */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground/60 shrink-0 touch-none"
        tabIndex={-1}
      >
        <GripVertical className="h-4 w-4" />
      </button>

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
        <div className="flex items-center gap-1.5 mt-0.5">
          <p className="text-[11px] text-muted-foreground truncate">{p.description || "Sem descrição"}</p>
          {isOutOfStock && (
            <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded-full">Esgotado</span>
          )}
        </div>
      </div>

      {/* Preço */}
      <span className={cn("font-bold text-sm shrink-0", p.is_visible ? "text-rose-600" : "text-muted-foreground")}>
        R$ {Number(p.price).toFixed(2)}
      </span>

      {/* Ações no hover */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Button
          variant="ghost" size="icon" className={cn("h-7 w-7", isOutOfStock ? "text-orange-500 hover:text-orange-700" : "text-muted-foreground/50 hover:text-foreground")}
          onClick={onToggleStock} title={isOutOfStock ? "Marcar disponível" : "Marcar esgotado"}
        >
          <PackageX className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onToggleVisible(p)} title={p.is_visible ? "Ocultar" : "Exibir"}>
          {p.is_visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(p)} title="Editar">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(p.id)} title="Excluir">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
