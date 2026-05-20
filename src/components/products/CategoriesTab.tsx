import { useState, useEffect } from "react";
import { Plus, Search, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCategories, useAddCategory, useUpdateCategory, useDeleteCategory } from "@/hooks/useCategories";
import { ConfirmDelete } from "./ConfirmDelete";

interface CategoriesTabProps {
  newTrigger: number;
}

export function CategoriesTab({ newTrigger }: CategoriesTabProps) {
  const { data: categories = [], isLoading: loadingCategories } = useCategories();
  const addCategory = useAddCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [categorySearch, setCategorySearch] = useState("");
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  useEffect(() => {
    if (newTrigger > 0) setShowNewCategory(true);
  }, [newTrigger]);

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    addCategory.mutate(
      { name: newCategoryName.trim() },
      { onSuccess: () => { setNewCategoryName(""); setShowNewCategory(false); } }
    );
  };

  const handleSaveEdit = () => {
    if (!editingId || !editingName.trim()) return;
    updateCategory.mutate(
      { id: editingId, name: editingName.trim() },
      { onSuccess: () => setEditingId(null) }
    );
  };

  const filteredCategories = categories.filter(
    (c) => !categorySearch || c.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  return (
    <>
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
              <Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Ex: Bebidas, Lanches..." onKeyDown={(e) => e.key === "Enter" && handleAddCategory()} />
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
                  <TableHead className="w-28 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      {editingId === c.id ? (
                        <div className="flex items-center gap-1.5">
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveEdit();
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            className="h-7 text-xs font-bold uppercase flex-1 max-w-xs"
                            autoFocus
                          />
                          <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={handleSaveEdit} disabled={updateCategory.isPending}>
                            <svg className="h-3.5 w-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => setEditingId(null)}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <span className="font-medium">{c.name}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {editingId !== c.id && (
                          <Button
                            size="icon" variant="ghost"
                            className="h-7 w-7 text-muted-foreground/50 hover:text-foreground transition-colors"
                            onClick={() => { setEditingId(c.id); setEditingName(c.name); }}
                            title="Renomear"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <ConfirmDelete onConfirm={() => deleteCategory.mutate(c.id)} title="categoria" />
                      </div>
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
    </>
  );
}
