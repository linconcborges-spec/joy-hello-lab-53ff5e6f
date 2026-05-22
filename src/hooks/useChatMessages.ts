import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ChatMessage = {
  id: string;
  session_id: string;
  sender: "customer" | "admin";
  message: string;
  customer_name: string | null;
  customer_phone: string | null;
  created_at: string;
  read_by_admin: boolean;
};

export function useChatMessages() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase
      .from("chat_messages")
      .select("*")
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) setMessages(data as ChatMessage[]);
        setLoaded(true);
      });

    const channel = supabase
      .channel("admin-chat-global")
      .on("postgres_changes" as any, {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
      }, (payload: any) => {
        const msg = payload.new as ChatMessage;
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

  const unreadCount = messages.filter(m => m.sender === "customer" && !m.read_by_admin).length;

  const markSessionAsRead = useCallback(async (sessionId: string) => {
    const unreadIds = messages
      .filter(m => m.session_id === sessionId && m.sender === "customer" && !m.read_by_admin)
      .map(m => m.id);
    if (unreadIds.length === 0) return;
    await supabase
      .from("chat_messages")
      .update({ read_by_admin: true })
      .in("id", unreadIds);
    setMessages(prev =>
      prev.map(m => unreadIds.includes(m.id) ? { ...m, read_by_admin: true } : m)
    );
  }, [messages]);

  const addOptimistic = useCallback((msg: ChatMessage) => {
    setMessages(prev => [...prev, msg]);
  }, []);

  const replaceOptimistic = useCallback((tempId: string, real: ChatMessage) => {
    setMessages(prev => prev.map(m => m.id === tempId ? real : m));
  }, []);

  const removeOptimistic = useCallback((tempId: string) => {
    setMessages(prev => prev.filter(m => m.id !== tempId));
  }, []);

  return { messages, loaded, unreadCount, markSessionAsRead, addOptimistic, replaceOptimistic, removeOptimistic };
}
