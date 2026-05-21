import { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, ChevronDown } from "lucide-react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const SESSION_KEY = "joy_chat_session_id";
const NAME_KEY = "joy_chat_customer_name";

type Message = {
  id: string;
  sender: "customer" | "admin";
  message: string;
  created_at: string;
};

interface CustomerChatDrawerProps {
  storeName: string;
  logoUrl?: string;
}

export function CustomerChatDrawer({ storeName, logoUrl }: CustomerChatDrawerProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let sid = localStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, sid);
    }
    setSessionId(sid);

    const name = localStorage.getItem(NAME_KEY);
    if (name) setCustomerName(name);
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    supabase
      .from("chat_messages")
      .select("id, sender, message, created_at")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) setMessages(data as Message[]);
      });

    const channel = supabase
      .channel(`chat-customer-${sessionId}`)
      .on("postgres_changes" as any, {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
        filter: `session_id=eq.${sessionId}`,
      }, (payload: any) => {
        const msg = payload.new as Message;
        setMessages(prev => [...prev, msg]);
        if (msg.sender === "admin") {
          setUnreadCount(c => c + 1);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);

  useEffect(() => {
    if (open) {
      setUnreadCount(0);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }, [messages.length]);

  const handleSetName = () => {
    const name = nameInput.trim();
    if (!name) return;
    localStorage.setItem(NAME_KEY, name);
    setCustomerName(name);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !sessionId || !customerName || sending) return;
    setSending(true);
    setInput("");
    await supabase.from("chat_messages").insert({
      session_id: sessionId,
      sender: "customer",
      message: text,
      customer_name: customerName,
    });
    setSending(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 z-40 h-14 w-14 bg-red-600 text-white rounded-full shadow-2xl shadow-red-900/30 flex items-center justify-center active:scale-95 transition-all"
      >
        <MessageCircle className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-green-500 rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="bg-white border-0 h-[85vh] outline-none rounded-t-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt={storeName} className="h-9 w-9 rounded-xl object-cover shrink-0" />
            ) : (
              <div className="h-9 w-9 rounded-xl bg-red-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                {storeName[0]}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{storeName}</p>
              <p className="text-xs text-green-600 font-medium">Chat com a loja</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0"
            >
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </button>
          </div>

          {!customerName ? (
            <div className="flex-1 flex flex-col items-center justify-center px-6 gap-5">
              <div className="text-center">
                <p className="text-2xl mb-1">👋</p>
                <p className="text-base font-bold text-gray-900">Olá! Como você se chama?</p>
                <p className="text-sm text-gray-400 mt-1">Assim fica mais fácil te atender.</p>
              </div>
              <input
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSetName()}
                placeholder="Seu nome"
                className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm outline-none focus:border-red-400"
                autoFocus
              />
              <button
                onClick={handleSetName}
                disabled={!nameInput.trim()}
                className="w-full h-12 bg-red-600 text-white rounded-xl font-bold text-sm disabled:opacity-50 active:scale-95 transition-all"
              >
                Começar conversa
              </button>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center py-10">
                    <p className="text-sm text-gray-400">Envie uma mensagem e responderemos em breve!</p>
                  </div>
                )}
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={cn("flex", msg.sender === "customer" ? "justify-end" : "justify-start")}
                  >
                    <div className={cn(
                      "max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                      msg.sender === "customer"
                        ? "bg-red-600 text-white rounded-br-sm"
                        : "bg-gray-100 text-gray-900 rounded-bl-sm"
                    )}>
                      {msg.message}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="px-4 py-3 pb-8 border-t border-gray-100 flex gap-2 shrink-0 bg-white">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSend()}
                  placeholder="Escreva uma mensagem..."
                  className="flex-1 h-11 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm outline-none focus:border-gray-300"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  className="h-11 w-11 bg-red-600 text-white rounded-xl flex items-center justify-center shrink-0 disabled:opacity-40 active:scale-95 transition-all"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </>
  );
}
