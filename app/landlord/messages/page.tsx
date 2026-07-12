"use client";

import { useEffect, useState, useRef } from "react";
import { supabaseAuth } from "@/lib/supabase/auth-client";
import { initChatSession } from "@/lib/chat-session";
import { Search, MessageSquare, User, ArrowLeft, Send, Loader2 } from "lucide-react";

interface Conversation {
  id: string;
  listing_id: string;
  seeker_session_id: string;
  created_at: string;
  listing: { title: string; primary_image_url: string };
  lastMessage: { content: string; created_at: string; sender_role: string } | null;
}

export default function LandlordMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ✅ REQUIRED: Initialize session header for RLS
  useEffect(() => {
    initChatSession();
  }, []);

  const fetchConversations = async () => {
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return;

    const { data, error } = await supabaseAuth
      .from("conversations")
      .select(`
        id, listing_id, seeker_session_id, created_at,
        listing:listing_id (title, primary_image_url),
        messages:messages(content, created_at, sender_role)
      `)
      .eq("landlord_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      const processed = data.map((conv: any) => ({
        ...conv,
        lastMessage: conv.messages?.[conv.messages.length - 1] || null,
      })).sort((a: any, b: any) => 
        new Date(b.lastMessage?.created_at || b.created_at).getTime() - 
        new Date(a.lastMessage?.created_at || a.created_at).getTime()
      );
      setConversations(processed);
    }
    setLoading(false);
  };

  const fetchMessages = async (convId: string) => {
    const { data } = await supabaseAuth
      .from("messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });
    if (data) setMessages(data);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !activeConvId) return;

    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return;

    const content = newMessage.trim();
    const tempMsg = {
      id: `temp-${Date.now()}`,
      conversation_id: activeConvId,
      sender_role: 'landlord',
      content,
      created_at: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, tempMsg]);
    setNewMessage("");

    const { error } = await supabaseAuth.from("messages").insert({
      conversation_id: activeConvId,
      sender_role: 'landlord',
      content,
    });

    if (error) {
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
      setNewMessage(content);
      alert(`Failed to send: ${error.message}`);
    } else {
      fetchConversations();
    }
  };

  useEffect(() => { fetchConversations(); }, []);
  useEffect(() => { 
    if (activeConvId) fetchMessages(activeConvId); 
  }, [activeConvId]);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const filtered = conversations.filter(c => 
    c.listing?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const active = conversations.find(c => c.id === activeConvId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="animate-spin text-ocean-blue" size={32} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-white rounded-xl shadow-sm border border-ocean-blue/10 overflow-hidden">
      <div className="p-4 border-b border-ocean-blue/10 flex items-center justify-between bg-mist-white">
        <h1 className="text-xl font-bold text-deep-navy flex items-center gap-2">
          <MessageSquare size={20} /> Messages
        </h1>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 h-4 w-4" />
          <input 
            type="text" 
            placeholder="Search listings..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-ocean-blue/20 text-sm focus:outline-none focus:border-ocean-blue"
          />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className={`w-full md:w-80 border-r border-ocean-blue/10 bg-white flex flex-col ${activeConvId ? 'hidden md:flex' : 'flex'}`}>
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-ink/50 text-sm">No messages yet.</div>
          ) : (
            <div className="overflow-y-auto flex-1">
              {filtered.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={`w-full p-4 border-b border-ocean-blue/5 text-left hover:bg-mist-white transition-colors ${
                    activeConvId === conv.id ? 'bg-ocean-blue/5 border-l-4 border-l-ocean-blue' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gray-200 overflow-hidden shrink-0">
                      {conv.listing?.primary_image_url ? (
                        <img src={conv.listing.primary_image_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-ocean-blue/10 text-ocean-blue"><User size={16}/></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-deep-navy text-sm truncate">{conv.listing?.title}</p>
                      <p className="text-xs text-ink/60 truncate mt-1">
                        {conv.lastMessage?.sender_role === 'seeker' ? "Seeker: " : "You: "}
                        {conv.lastMessage?.content || "Start a conversation..."}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={`flex-1 flex flex-col bg-mist-white ${!activeConvId ? 'hidden md:flex' : 'flex'}`}>
          {activeConvId && active ? (
            <>
              <div className="p-4 border-b border-ocean-blue/10 bg-white flex items-center gap-3">
                <button onClick={() => setActiveConvId(null)} className="md:hidden text-ink/60 hover:text-deep-navy">
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h3 className="font-bold text-deep-navy text-sm">{active.listing?.title}</h3>
                  <p className="text-xs text-ink/50">Inquiry about this property</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender_role === 'landlord' ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm break-words ${
                      msg.sender_role === 'landlord' 
                        ? "bg-deep-navy text-white rounded-br-none" 
                        : "bg-white border border-ocean-blue/10 text-deep-navy rounded-bl-none shadow-sm"
                    }`}>
                      {msg.content}
                      <div className={`text-[10px] mt-1 opacity-70 ${msg.sender_role === 'landlord' ? "text-white/70" : "text-ink/50"}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 bg-white border-t border-ocean-blue/10 flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Type your reply..."
                  className="flex-1 px-4 py-2.5 rounded-full border border-ocean-blue/20 focus:outline-none focus:border-ocean-blue text-sm"
                />
                <button
                  onClick={handleSend}
                  disabled={!newMessage.trim()}
                  className="bg-amber-gold text-white p-2.5 rounded-full hover:brightness-90 disabled:opacity-50 transition-all"
                >
                  <Send size={18} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-ink/40">
              <MessageSquare size={48} className="mb-4 opacity-20" />
              <p>Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}