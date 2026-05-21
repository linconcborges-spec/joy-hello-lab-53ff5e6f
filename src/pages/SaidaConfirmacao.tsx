import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Loader2, XCircle, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";

type State = "idle" | "loading" | "success" | "error" | "already_done";

export default function SaidaConfirmacao() {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<State>("idle");
  const [orderNumber, setOrderNumber] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  async function confirmar() {
    if (!id) return;
    setState("loading");

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

  // Auto-confirma ao abrir a página (scan direto → ação imediata)
  useEffect(() => {
    confirmar();
  }, [id]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center space-y-6">

        {state === "loading" && (
          <>
            <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
            <p className="text-lg font-bold uppercase tracking-wide">Confirmando saída...</p>
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
            <p className="text-xs text-muted-foreground">
              O sistema foi atualizado automaticamente.
            </p>
          </>
        )}

        {state === "already_done" && (
          <>
            <Truck className="h-16 w-16 text-blue-500 mx-auto" />
            <div className="space-y-1">
              <p className="text-xl font-black uppercase tracking-wide text-blue-600">
                Já em entrega
              </p>
              <p className="text-muted-foreground font-semibold">
                Este pedido já foi confirmado anteriormente.
              </p>
            </div>
          </>
        )}

        {state === "error" && (
          <>
            <XCircle className="h-16 w-16 text-destructive mx-auto" />
            <div className="space-y-1">
              <p className="text-xl font-black uppercase tracking-wide text-destructive">
                Erro ao confirmar
              </p>
              <p className="text-sm text-muted-foreground">{errorMsg}</p>
            </div>
            <Button onClick={confirmar} variant="outline" className="w-full">
              Tentar novamente
            </Button>
          </>
        )}

        {state === "idle" && (
          <>
            <Truck className="h-16 w-16 text-primary mx-auto" />
            <Button onClick={confirmar} size="lg" className="w-full font-black uppercase">
              Confirmar Saída para Entrega
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
