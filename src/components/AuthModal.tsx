import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthorize: (authorizedBy: string) => void;
  title?: string;
  description?: string;
}

export function AuthModal({ open, onOpenChange, onAuthorize, title = "Autorização Necessária", description = "Por favor, confirme sua identidade para realizar esta alteração." }: AuthModalProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const { login } = useAuth();

  const handleVerify = async () => {
    if (!username || !password) {
      toast.error("Preencha usuário e senha");
      return;
    }

    setIsVerifying(true);
    try {
      // Usamos a função de login apenas para validar as credenciais sem necessariamente trocar o usuário logado permanentemente
      // No entanto, para simplificar e garantir que pegamos o nome correto, vamos buscar o funcionário
      const success = await login(username, password);
      if (success) {
        // Buscamos o usuário no sessionStorage para pegar o NOME completo (ex: João Silva)
        const stored = sessionStorage.getItem("imperio-auth-user");
        const authorizedName = stored ? JSON.parse(stored).name : username;
        
        onAuthorize(authorizedName);
        onOpenChange(false);
        setUsername("");
        setPassword("");
      } else {
        toast.error("Usuário ou senha incorretos");
      }
    } catch (error) {
      toast.error("Erro ao validar autorização");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] rounded-[2rem]">
        <DialogHeader className="flex flex-col items-center gap-2">
          <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-xl font-black uppercase text-center">{title}</DialogTitle>
          <p className="text-xs text-muted-foreground text-center px-4">{description}</p>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="auth-username" className="text-[10px] uppercase font-black ml-2 opacity-60">Usuário</Label>
            <Input
              id="auth-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Digite seu usuário"
              className="rounded-xl"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="auth-password" className="text-[10px] uppercase font-black ml-2 opacity-60">Senha</Label>
            <Input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              className="rounded-xl"
            />
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="rounded-xl font-bold uppercase text-[10px]"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleVerify} 
            disabled={isVerifying}
            className="rounded-xl font-black uppercase text-[10px] px-8"
          >
            {isVerifying ? "Verificando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
