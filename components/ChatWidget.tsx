"use client";

import { useState, useEffect, useRef } from "react";
import { supabaseAuth } from "@/lib/supabase/auth-client";
import { initChatSession } from "@/lib/chat-session";
import { X, Send, User, Loader2 } from "lucide-react";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef<string>("");

  useEffect(() => {
    sessionIdRef.current = initChatSession();
  }, []);

  // Get or create conversation (handles duplicates safely)
  useEffect(() => {
    if (!listingId || !landlordId || !sessionIdRef.current) return;

    const setup = async () => {
      try {
        // ✅ Use limit(1) instead of maybeSingle() to handle duplicate rows
        const { data: existingRows, error: fetchError } = await supabaseAuth
          .from("conversations")
          .select("id")
          .eq("listing_id", listingId)
          .eq("landlord_id", landlordId)
          .eq("seeker_session_id", sessionIdRef.current)
          .order("created_at", { ascending: false })
          .limit(1);

        if (fetchError) {
          console.error("❌ Conversation fetch failed:", fetchError);
          setIsLoading(false);
          return;
        }

        if (existingRows && existingRows.length > 0) {
          setConversationId(existingRows[0].id);
        } else {
          const { data: newConv, error: insertError } = await supabaseAuth
            .from("conversations")
            .insert({ 
              listing_id: listingId, 
              landlord_id: landlordId, 
              seeker_session_id: sessionIdRef.current 
            })
            .select("id")
            .single();
          
          if (insertError) {
            console.error("❌ Conversation creation failed:", insertError);
          } else if (newConv) {
            setConversationId(newConv.id);
          }
        }
      } catch (err) {
        console.error("💥 Unexpected setup error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    setup();
  }, [listingId, landlordId]);

  // Dedicated fetch helper
  const fetchMessages = async (convId: string) => {
    const { data, error } = await supabaseAuth
      .from("messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });
    
    if (!error && data) setMessages(data);
  };

  // Poll every 2 seconds
  useEffect(() => {
    if (!conversationId) return;
    fetchMessages(conversationId);
    const interval = setInterval(() => fetchMessages(conversationId), 2000);
    return () => clearInterval(interval);
  }, [conversationId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async () => {
    if (!newMessage.trim() || !conversationId) return;

    const content = newMessage.trim();
    
    // Optimistic add
    const tempMsg = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId,
      sender_role: 'seeker',
      content,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);
    setNewMessage("");

    // ✅ CRITICAL: .select() forces Supabase to return inserted row
    const { data, error } = await supabaseAuth
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_role: 'seeker',
        content,
      })
      .select()
      .single();

    if (error || !data) {
      // Rollback on failure
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
      setNewMessage(content);
      if (error) alert(`Failed to send: ${error.message}`);
    } else {
      // Force immediate refresh
      fetchMessages(conversationId);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed bottom-6 right-6 w-[350px] h-[500px] bg-white rounded-2xl shadow-2xl flex items-center justify-center z-[9999]">
        <Loader2 className="animate-spin text-ocean-blue" size={32} />
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[350px] h-[500px] bg-white rounded-2xl shadow-2xl border border-ocean-blue/10 z-[9999] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-deep-navy text-white p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-gold flex items-center justify-center">
            <User size={16} />
          </div>
          <div>
            <p className="font-bold text-sm">Landlord</p>
            <p className="text-xs text-white/70">Online</p>
          </div>
        </div>
        <button onClick={onClose}><X size={20} /></button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-mist-white">
        {messages.length === 0 ? (
          <p className="text-center text-ink/50 text-sm mt-10">No messages yet.</p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender_role === 'seeker' ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm break-words ${
                msg.sender_role === 'seeker' 
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

      {/* Input */}
      <div className="p-3 bg-white border-t border-ocean-blue/10 flex gap-2 shrink-0">
        <input 
          type="text" 
          value={newMessage} 
          onChange={(e) => setNewMessage(e.target.value)} 
          onKeyDown={(e) => e.key === "Enter" && handleSend()} 
          placeholder="Type a message..." 
          className="flex-1 px-4 py-2.5 rounded-full border border-ocean-blue/20 focus:outline-none text-sm"
        />
        <button 
          onClick={handleSend} 
          disabled={!newMessage.trim()} 
          className="bg-deep-navy text-white p-2.5 rounded-full disabled:opacity-40"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}