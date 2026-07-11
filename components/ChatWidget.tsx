"use client";

import { useState, useEffect, useRef } from "react";
import { supabaseAuth } from "@/lib/supabase/auth-client";
import { X, Send, User } from "lucide-react";

interface ChatWidgetProps {
  listingId: string | null | undefined;
  landlordId: string | null | undefined;
  onClose?: () => void;
}

export default function ChatWidget({ listingId, landlordId, onClose }: ChatWidgetProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUserRef = useRef<string | null>(null);
  const visitorIdRef = useRef<string>("");
  const initLockRef = useRef(false);

  // ✅ SAFETY NET: Force stop loading after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        console.warn("⏱️ Chat init timed out. Forcing load state clear.");
        setIsLoading(false);
        setError("Chat connection timed out. Please refresh and try again.");
      }
    }, 8000);
    return () => clearTimeout(timer);
  }, [isLoading]);

  // Initialize user IDs once
  useEffect(() => {
    const initIds = async () => {
      try {
        const { data } = await supabaseAuth.auth.getUser();
        currentUserRef.current = data.user?.id || null;

        let vid = localStorage.getItem("homeplace_visitor_id");
        if (!vid) {
          vid = crypto.randomUUID();
          localStorage.setItem("homeplace_visitor_id", vid);
        }
        visitorIdRef.current = vid;
      } catch (err) {
        console.error("ID init failed:", err);
      }
    };
    initIds();
  }, []);

  // Main initialization - runs ONCE when valid props AND IDs are present
  useEffect(() => {
    if (!listingId || !landlordId || typeof listingId !== 'string' || typeof landlordId !== 'string') {
      console.log("🚫 Invalid props received:", { listingId, landlordId });
      setIsLoading(false);
      setError("Missing property information. Please go back and select a listing.");
      return;
    }

    if (initLockRef.current) return;
    initLockRef.current = true;

    const runInit = async () => {
      console.log("✅ Valid props detected. Initializing chat...");
      
      let attempts = 0;
      while ((!currentUserRef.current && !visitorIdRef.current) && attempts < 20) {
        await new Promise(r => setTimeout(r, 100));
        attempts++;
      }

      if (!visitorIdRef.current) {
        setIsLoading(false);
        setError("Could not initialize session. Please refresh.");
        return;
      }

      try {
        const userId = currentUserRef.current;
        const vId = visitorIdRef.current;

        let query = supabaseAuth
          .from("conversations")
          .select("id")
          .eq("listing_id", listingId)
          .eq("landlord_id", landlordId);

        if (userId) {
          query = query.eq("seeker_id", userId);
        } else {
          query = query.eq("seeker_visitor_id", vId);
        }

        const { data: existingConv, error: fetchError } = await query.maybeSingle();

        if (fetchError) throw new Error(`Lookup failed: ${fetchError.message}`);

        if (existingConv) {
          console.log("✅ Found existing conversation:", existingConv.id);
          setConversationId(existingConv.id);
        } else {
          console.log("➕ Creating new conversation...");
          const { data: newConv, error: insertError } = await supabaseAuth
            .from("conversations")
            .insert({
              listing_id: listingId,
              landlord_id: landlordId,
              seeker_id: userId || null,
              seeker_visitor_id: userId ? null : vId,
            })
            .select("id")
            .single();

          if (insertError) throw new Error(`Create failed: ${insertError.message}`);
          if (newConv) setConversationId(newConv.id);
        }
      } catch (err: any) {
        console.error("❌ Chat init error:", err);
        setError(err.message);
      } finally {
        console.log("🏁 Loading cleared");
        setIsLoading(false);
      }
    };

    runInit();
  }, [listingId, landlordId]);

  // Fetch messages & subscribe to real-time updates
  useEffect(() => {
    if (!conversationId) return;

    const fetchMessages = async () => {
      const { data, error } = await supabaseAuth
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) console.error("Msg fetch error:", error);
      else if (data) setMessages(data);
    };

    fetchMessages();

    const channel = supabaseAuth
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => setMessages((prev) => [...prev, payload.new])
      )
      .subscribe();

    return () => supabaseAuth.removeChannel(channel);
  }, [conversationId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ OPTIMISTIC SEND with rollback on failure
  const handleSend = async () => {
    if (!newMessage.trim() || !conversationId) return;

    const userId = currentUserRef.current;
    const vId = visitorIdRef.current;
    const messageContent = newMessage.trim();

    // Add temporary message immediately
    const tempMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: userId,
      sender_visitor_id: userId ? null : vId,
      content: messageContent,
      created_at: new Date().toISOString(),
      is_read: false,
    };

    setMessages((prev) => [...prev, tempMessage]);
    setNewMessage("");

    try {
      const { data, error } = await supabaseAuth.from("messages").insert({
        conversation_id: conversationId,
        sender_id: userId || null,
        sender_visitor_id: userId ? null : vId,
        content: messageContent,
      }).select();

      if (error) {
        console.error("❌ Send failed:", error);
        // Rollback optimistic update
        setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
        alert(`Failed to send: ${error.message}`);
        setNewMessage(messageContent);
        return;
      }

      // Replace temp message with server-confirmed message
      if (data && data[0]) {
        setMessages((prev) => 
          prev.map((m) => m.id === tempMessage.id ? data[0] : m)
        );
      }
    } catch (err: any) {
      console.error("❌ Send exception:", err);
      setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
      setNewMessage(messageContent);
    }
  };

  // ✅ Helper defined BEFORE return statement to avoid ReferenceError
  const isMyMessage = (msg: any) => {
    const uid = currentUserRef.current;
    const vid = visitorIdRef.current;
    return (uid && msg.sender_id === uid) || (!uid && msg.sender_visitor_id === vid);
  };

  // Error State Render
  if (error) {
    return (
      <div className="fixed bottom-6 right-6 w-[350px] bg-white rounded-2xl shadow-2xl border border-red-200 p-6 z-50">
        <div className="flex justify-between mb-3">
          <h3 className="font-bold text-red-600">Chat Unavailable</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <p className="text-sm text-ink/70 mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="w-full bg-deep-navy text-white py-2 rounded-lg text-sm font-semibold hover:bg-ocean-blue">
          Refresh Page
        </button>
      </div>
    );
  }

  // Main Render
  return (
    <div className="fixed bottom-6 right-6 w-[350px] h-[500px] bg-white rounded-2xl shadow-2xl border border-ocean-blue/10 z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-deep-navy text-white p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-gold flex items-center justify-center"><User size={16} /></div>
          <div><p className="font-bold text-sm">Landlord</p><p className="text-xs text-white/70">Online</p></div>
        </div>
        <button onClick={onClose} className="text-white/70 hover:text-white"><X size={20} /></button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-mist-white">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-blue"></div>
            <p className="text-sm text-ink/60">Connecting...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-ink/50 text-sm mt-10">Start a conversation about this property...</div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${isMyMessage(msg) ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm break-words ${
                isMyMessage(msg) 
                  ? "bg-amber-gold text-white rounded-br-none" 
                  : "bg-white border border-ocean-blue/10 text-deep-navy rounded-bl-none shadow-sm"
              }`}>
                {msg.content}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white border-t border-ocean-blue/10 flex gap-2 shrink-0">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="Type a message..."
          disabled={isLoading || !!error}
          className="flex-1 px-4 py-2.5 rounded-full border border-ocean-blue/20 focus:outline-none focus:border-ocean-blue text-sm disabled:opacity-50"
        />
        <button onClick={handleSend} disabled={!newMessage.trim() || isLoading || !!error} className="bg-deep-navy text-white p-2.5 rounded-full hover:bg-ocean-blue disabled:opacity-40">
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}