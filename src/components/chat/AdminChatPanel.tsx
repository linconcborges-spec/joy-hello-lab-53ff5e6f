import { useState, useEffect, useRef } from "react";
import { Send, ArrowLeft, MessageCircle, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  session_id: string;
  sender: "customer" | "admin";
  message: string;
  customer_name: string | null;
  customer_phone: string | null;
  created_at: string;
  read_by_admin: boolean;
};

type Session = {
  session_id: string;
  customer_name: string;
  customer_phone: string;
  last_message: string;
  last_at: string;
  unread: number;
};

interface AdminChatPanelProps {
  onUnreadChange?: (count: number) => void;
}

function whatsappLink(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const number = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${number}`;
}

export function AdminChatPanel({ onUnreadChange }: AdminChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase
      .from("chat_messages")
      .select("*")
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) setMessages(data as Message[]);
      });

    const channel = supabase
      .channel("admin-chat-all")
      .on("postgres_changes" as any, {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
      }, (payload: any) => {
        const msg = payload.new as Message;
        setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
      })
      .on("postgres_changes" as any, {
        event: "UPDATE",
        schema: "public",
        table: "chat_messages",
      }, (payload: any) => {
        setMessages(prev =>
          prev.map(m => m.id === payload.new.id ? { ...m, ...payload.new } : m)
        );
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    const unread = messages.filter(m => m.sender === "customer" && !m.read_by_admin).length;
    onUnreadChange?.(unread);
  }, [messages, onUnreadChange]);

  // Build session list from messages
  const sessionMap = new Map<string, Session>();
  for (const msg of messages) {
    const existing = sessionMap.get(msg.session_id);
    const isNewer = !existing || new Date(msg.created_at) > new Date(existing.last_at);
    sessionMap.set(msg.session_id, {
      session_id: msg.session_id,
      customer_name: msg.customer_name || existing?.customer_name || "Cliente",
      customer_phone: msg.customer_phone || existing?.customer_phone || "",
      last_message: isNewer ? msg.message : (existing?.last_message || ""),
      last_at: isNewer ? msg.created_at : (existing?.last_at || msg.created_at),
      unread: (existing?.unread || 0) + (msg.sender === "customer" && !msg.read_by_admin ? 1 : 0),
    });
  }
  const sessions = Array.from(sessionMap.values()).sort(
    (a, b) => new Date(b.last_at).getTime() - new Date(a.last_at).getTime()
  );

  const activeMessages = activeSession
    ? messages
        .filter(m => m.session_id === activeSession)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    : [];

  const openSession = async (sid: string) => {
    setActiveSession(sid);
    const unreadIds = messages
      .filter(m => m.session_id === sid && m.sender === "customer" && !m.read_by_admin)
      .map(m => m.id);
    if (unreadIds.length > 0) {
      await supabase
        .from("chat_messages")
        .update({ read_by_admin: true })
        .in("id", unreadIds);
      setMessages(prev =>
        prev.map(m => unreadIds.includes(m.id) ? { ...m, read_by_admin: true } : m)
      );
    }
  };

  useEffect(() => {
    if (activeSession) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    }
  }, [activeMessages.length, activeSession]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !activeSession || sending) return;

    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      session_id: activeSession,
      sender: "admin",
      message: text,
      customer_name: null,
      customer_phone: null,
      created_at: new Date().toISOString(),
      read_by_admin: true,
    };
    setMessages(prev => [...prev, optimistic]);
    setInput("");

    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        session_id: activeSession,
        sender: "admin",
        message: text,
        read_by_admin: true,
      })
      .select("*")
      .single();

    if (data) {
      setMessages(prev => prev.map(m => m.id === tempId ? data as Message : m));
    } else if (error) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  if (activeSession) {
    const session = sessions.find(s => s.session_id === activeSession);
    return (
      <div className="flex flex-col h-full">
        {/* Header da conversa */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40 shrink-0">
          <button
            onClick={() => setActiveSession(null)}
            className="h-8 w-8 rounded-full bg-muted flex items-center justify-center"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm shrink-0">
            {(session?.customer_name || "C")[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm leading-tight">{session?.customer_name || "Cliente"}</p>
            {session?.customer_phone && (
              <a
                href={whatsappLink(session.customer_phone)}
                target="_blank"
                rel="noreferrer"
                onClick={e => e.stopPropagation()}
                className="flex items-center gap-1 text-green-600 text-xs font-medium hover:underline mt-0.5"
              >
                <Phone className="h-3 w-3" />
                {session.customer_phone}
              </a>
            )}
          </div>
        </div>

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {activeMessages.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">Nenhuma mensagem ainda.</p>
          )}
          {activeMessages.map(msg => (
            <div
              key={msg.id}
              className={cn("flex", msg.sender === "admin" ? "justify-end" : "justify-start")}
            >
              <div className={cn(
                "max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                msg.sender === "admin"
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-muted text-foreground rounded-bl-sm"
              )}>
                {msg.message}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-border/40 flex gap-2 shrink-0">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSend()}
            placeholder="Responder..."
            className="flex-1 h-11 bg-muted border border-border/40 rounded-xl px-4 text-sm outline-none"
            autoFocus
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="h-11 w-11 bg-primary text-primary-foreground rounded-xl flex items-center justify-center shrink-0 disabled:opacity-40 active:scale-95 transition-all"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {sessions.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 opacity-20">
          <MessageCircle className="h-14 w-14" />
          <p className="text-xs font-black uppercase tracking-widest">Nenhuma conversa ainda</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto divide-y divide-border/30">
          {sessions.map(session => (
            <button
              key={session.session_id}
              onClick={() => openSession(session.session_id)}
              className="w-full flex items-center gap-3 px-4 py-4 hover:bg-muted/50 text-left transition-colors"
            >
              <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0 font-bold text-primary text-sm">
                {session.customer_name[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{session.customer_name}</p>
                {session.customer_phone ? (
                  <p className="text-xs text-green-600 font-medium mt-0.5">{session.customer_phone}</p>
                ) : (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{session.last_message}</p>
                )}
              </div>
              {session.unread > 0 && (
                <span className="h-5 min-w-5 px-1 bg-primary rounded-full text-[10px] font-bold text-primary-foreground flex items-center justify-center shrink-0">
                  {session.unread > 9 ? "9+" : session.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
