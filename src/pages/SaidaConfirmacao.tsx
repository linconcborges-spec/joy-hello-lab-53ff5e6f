import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Loader2, XCircle, Truck, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toEmployeeEmail } from "@/lib/authUtils";

type State = "checking_auth" | "login" | "logging_in" | "confirming" | "success" | "already_done" | "error";

export default function SaidaConfirmacao() {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<State>("checking_auth");
  const [orderNumber, setOrderNumber] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    verificarSessaoEConfirmar();
  }, [id]);

  async function verificarSessaoEConfirmar() {
    setState("checking_auth");
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await confirmar();
    } else {
      setState("login");
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    setState("logging_in");

    const email = toEmployeeEmail(username.trim().toLowerCase());
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setErrorMsg("Usuário ou senha incorretos.");
      setState("login");
      return;
    }

    await confirmar();
  }

  async function confirmar() {
    if (!id) return;
    setState("confirming");

    const { data, error } = await supabase.rpc("confirm_order_departure", {
      p_order_id: id,
    });

    if (error) {
      setErrorMsg(error.message);
      setState("error");
      return;
    }

    const result = data as { ok: boolean; error?: string; number?: number; status?: string };

    if (!result.ok) {
      if (result.status === "delivering" || result.status === "completed") {
        setState("already_done");
      } else {
        setErrorMsg(result.error || "Erro desconhecido");
        setState("error");
      }
      return;
    }

    setOrderNumber(result.number ?? null);
    setState("success");
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center space-y-6">

        {(state === "checking_auth" || state === "confirming") && (
          <>
            <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
            <p className="text-lg font-bold uppercase tracking-wide">
              {state === "checking_auth" ? "Verificando acesso..." : "Confirmando saída..."}
            </p>
          </>
        )}

        {(state === "login" || state === "logging_in") && (
          <>
            <LogIn className="h-14 w-14 text-primary mx-auto" />
            <div className="space-y-1">
              <p className="text-xl font-black uppercase">Confirmar Saída</p>
              <p className="text-sm text-muted-foreground">Entre com suas credenciais para confirmar</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-3 text-left">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase">Usuário</Label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="seu.usuario"
                  autoCapitalize="none"
                  autoCorrect="off"
                  disabled={state === "logging_in"}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase">Senha</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={state === "logging_in"}
                />
              </div>
              {errorMsg && (
                <p className="text-sm text-destructive font-semibold">{errorMsg}</p>
              )}
              <Button
                type="submit"
                className="w-full font-black uppercase"
                disabled={state === "logging_in"}
              >
                {state === "logging_in"
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Entrando...</>
                  : "Entrar e Confirmar Saída"
                }
              </Button>
            </form>
          </>
        )}

        {state === "success" && (
          <>
            <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto" />
            <div className="space-y-1">
              <p className="text-2xl font-black uppercase tracking-wide text-green-600">
                Saiu para entrega!
              </p>
              {orderNumber && (
                <p className="text-muted-foreground font-semibold">
                  Pedido #{orderNumber} marcado como <strong>Em Entrega</strong>
                </p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">O sistema foi atualizado automaticamente.</p>
          </>
        )}

        {state === "already_done" && (
          <>
            <Truck className="h-16 w-16 text-blue-500 mx-auto" />
            <div className="space-y-1">
              <p className="text-xl font-black uppercase tracking-wide text-blue-600">Já em entrega</p>
              <p className="text-muted-foreground font-semibold">Este pedido já foi confirmado anteriormente.</p>
            </div>
          </>
        )}

        {state === "error" && (
          <>
            <XCircle className="h-16 w-16 text-destructive mx-auto" />
            <div className="space-y-1">
              <p className="text-xl font-black uppercase tracking-wide text-destructive">Erro ao confirmar</p>
              <p className="text-sm text-muted-foreground">{errorMsg}</p>
            </div>
            <Button onClick={() => setState("login")} variant="outline" className="w-full">
              Tentar novamente
            </Button>
          </>
        )}

      </div>
    </div>
  );
}
