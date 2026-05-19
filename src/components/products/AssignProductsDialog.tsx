import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

interface AssignProductsDialogProps {
  open: boolean;
  onClose: () => void;
  categoryId: string | null;
  products: any[];
  updateProduct: any;
  getCategoryName: (id: string | null | undefined) => string;
}

export function AssignProductsDialog({ open, onClose, categoryId, products, updateProduct, getCategoryName }: AssignProductsDialogProps) {
  const [search, setSearch] = useState("");

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) { onClose(); setSearch(""); }
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
