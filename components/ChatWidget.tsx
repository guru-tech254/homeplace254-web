interface
"use client";

import { useEffect, useState, useRef } from "react";
import { supabaseAuth } from "@/lib/supabase/auth-client";
import { X, MessageCircle, Send, Loader2 } from "lucide-react";

const getAnonymousId = () => {
  if (typeof window === "undefined") return null;
  let anonId = localStorage.getItem("homeplace_anon_id");
  if (!anonId) {
    anonId = crypto.randomUUID();
    localStorage.setItem("homeplace_anon_id", anonId);
  }
  return anonId;
};

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [listingId, setListingId] = useState<string | null>(null);
  const [landlordId, setLandlordId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUserRef = useRef<string | null>(null);

  useEffect(() => {
    const initUser = async () => {
      const { data: { user } } = await supabaseAuth.auth.getUser();
      currentUserRef.current = user?.id || getAnonymousId();
    };
    initUser();
  }, []);

  useEffect(() => {
    const handleOpenChat = async (event: Event) => {
      const customEvent = event as CustomEvent;
      if (!customEvent.detail?.listingId || !customEvent.detail?.landlordId) return;

      setListingId(customEvent.detail.listingId);
      setLandlordId(customEvent.detail.landlordId);
      setIsOpen(true);
      setLoading(true);

      try {
        const userId = currentUserRef.current;
        if (!userId) throw new Error("Could not identify user");

        const { data: existing } = await supabaseAuth
          .from("conversations")
          .select("id")
          .eq("listing_id", customEvent.detail.listingId)
          .eq("landlord_id", customEvent.detail.landlordId)
          .eq("seeker_session_id", userId)
          .single();

        let convId = existing?.id;

        if (!convId) {
          const { data: newConv, error } = await supabaseAuth
            .from("conversations")
            .insert({
              listing_id: customEvent.detail.listingId,
              landlord_id: customEvent.detail.landlordId,
              seeker_session_id: userId,
            })
            .select()
            .single();

          if (error) throw error;
          convId = newConv.id;
        }

        setConversationId(convId);

        const { data: msgs } = await supabaseAuth
          .from("messages")
          .select("*")
          .eq("conversation_id", convId)
          .order("created_at", { ascending: true });

        setMessages(msgs || []);
      } catch (err: any) {
        console.error("Chat initialization failed:", err);
        alert("Could not open chat: " + (err.message || "Unknown error"));
        setIsOpen(false);
      } finally {
        setLoading(false);
      }
    };

    const listener = (e: Event) => handleOpenChat(e as CustomEvent);
    window.addEventListener("open-chat", listener);
    return () => window.removeEventListener("open-chat", listener);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !conversationId) return;

    setSending(true);
    try {
      const userId = currentUserRef.current;
      if (!userId) throw new Error("Not identified");

      // ✅ HARDCODED: Public widget ALWAYS sends as seeker
      const { error } = await supabaseAuth.from("messages").insert({
        conversation_id: conversationId,
        sender_id: userId,
        sender_role: "seeker", 
        content: message.trim(),
      });

      if (error) throw error;

      const { data: updated } = await supabaseAuth
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      setMessages(updated || []);
      setMessage("");
    } catch (err: any) {
      console.error("Send failed:", err);
      alert("Failed to send: " + (err.message || "Check permissions"));
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col h-[70vh]">
        
        <div className="bg-deep-navy text-white p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="bg-amber-gold p-2 rounded-full shrink-0">
              <MessageCircle size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm truncate">Chat with Landlord</h3>
              <p className="text-xs text-white/70 truncate">
                Listing: {listingId ? `${listingId.slice(0, 8)}...` : "Loading..."}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-mist-white">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-ocean-blue" size={24} />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-ink/50 py-10">
              <p className="text-sm font-medium">No messages yet</p>
              <p className="text-xs mt-1">Start the conversation below</p>
            </div>
          ) : (
            messages.map((msg) => {
              // ✅ UNIVERSAL RULE: Only 'landlord' goes right. Everything else (including null/empty) goes left.
              const isLandlord = msg.sender_role === 'landlord';
              
              return (
                <div key={msg.id} className={`flex ${isLandlord ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm break-words shadow-sm ${
                      isLandlord
                        ? "bg-amber-gold text-white rounded-br-none"
                        : "bg-white border border-ocean-blue/10 text-deep-navy rounded-bl-none"
                    }`}
                  >
                    <p className="leading-relaxed">{msg.content}</p>
                    <p className={`text-[10px] mt-1.5 opacity-70`}>
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-ocean-blue/10 bg-white shrink-0">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2.5 rounded-lg border border-ocean-blue/20 focus:outline-none focus:border-ocean-blue text-sm"
              autoFocus
              disabled={sending || loading}
            />
            <button
              type="submit"
              disabled={sending || !message.trim() || loading}
              className="bg-amber-gold text-white p-2.5 rounded-lg hover:brightness-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}