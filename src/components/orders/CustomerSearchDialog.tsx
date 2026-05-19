import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CustomerSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customers: any[];
  onSelectCustomer: (customer: any) => void;
  query: string;
  onQueryChange: (query: string) => void;
}

export function CustomerSearchDialog({
  open,
  onOpenChange,
  customers,
  onSelectCustomer,
  query,
  onQueryChange,
}: CustomerSearchDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="p-6 bg-muted/30 border-b border-border/40">
          <DialogTitle className="uppercase font-black text-xl italic tracking-tighter">Buscar Cliente</DialogTitle>
        </DialogHeader>
        <div className="p-6 space-y-4">
          <input
            placeholder="Digite o nome ou telefone..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="w-full h-14 px-4 rounded-xl border border-border/50 bg-background font-medium text-lg outline-none focus:border-primary transition-colors"
            autoFocus
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-2">
            {customers
              .filter(
                (c) =>
                  !query ||
                  c.name.toLowerCase().includes(query.toLowerCase()) ||
                  (c.phone && c.phone.includes(query))
              )
              .slice(0, 30)
              .map((c) => (
                <div
                  key={c.id}
                  onClick={() => onSelectCustomer(c)}
                  className="flex flex-col p-4 bg-card border border-border/40 rounded-xl hover:border-primary/50 cursor-pointer active:scale-95 transition-all"
                >
                  <span className="font-black text-sm uppercase">{c.name}</span>
                  {c.phone && <span className="text-xs font-bold text-primary mt-1">{c.phone}</span>}
                </div>
              ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
