"use client";

import { useEffect, useState } from "react";
import { supabaseAuth } from "@/lib/supabase/auth-client";
import { Search, MessageSquare, User, ArrowLeft, Send } from "lucide-react";
import Link from "next/link";

interface Conversation {
  id: string;
  listing_id: string;
  seeker_id: string | null;
  seeker_visitor_id: string | null;
  created_at: string;
  listing: {
    title: string;
    primary_image_url: string;
  };
  lastMessage: {
    content: string;
    created_at: string;
    sender_id: string | null;
    sender_visitor_id: string | null;
  } | null;
}

export default function LandlordMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ FIX: Functions declared BEFORE useEffect
  const fetchConversations = async () => {
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return;

    try {
      // Fetch conversations with latest message preview
      const { data, error } = await supabaseAuth
        .from("conversations")
        .select(`
          id,
          listing_id,
          seeker_id,
          seeker_visitor_id,
          created_at,
          listing:listing_id (
            title,
            primary_image_url
          ),
          messages:messages(
            content,
            created_at,
            sender_id,
            sender_visitor_id
          )
        `)
        .eq("landlord_id", user.id)
        .order("created_at", { ascending: false });

      if (error) console.error(error);
      else {
        // Process to get only the last message
        const processed = (data || []).map((conv: any) => ({
          ...conv,
          lastMessage: conv.messages?.[0] || null, // Assuming order is desc or we take first if fetched correctly
        }));
        
        // Sort by last message time if available, else creation time
        processed.sort((a, b) => 
          new Date(b.lastMessage?.created_at || b.created_at).getTime() - 
          new Date(a.lastMessage?.created_at || a.created_at).getTime()
        );

        setConversations(processed);
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
    } finally {
      setLoading(false);
    }
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
    
    const { error } = await supabaseAuth.from("messages").insert({
      conversation_id: activeConvId,
      sender_id: user?.id,
      content: newMessage.trim(),
    });

    if (!error) {
      setNewMessage("");
      // Optimistic update or refetch
      fetchMessages(activeConvId);
      fetchConversations(); // Update preview in sidebar
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activeConvId) {
      fetchMessages(activeConvId);
    }
  }, [activeConvId]);

  const filteredConversations = conversations.filter(c => 
    c.listing?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeConversation = conversations.find(c => c.id === activeConvId);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-white rounded-xl shadow-sm border border-ocean-blue/10 overflow-hidden">
      {/* Header */}
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
        {/* Sidebar: Conversation List */}
        <div className={`w-full md:w-80 border-r border-ocean-blue/10 bg-white flex flex-col ${activeConvId ? 'hidden md:flex' : 'flex'}`}>
          {loading ? (
            <div className="p-4 text-center text-ink/50">Loading...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-ink/50 text-sm">No messages yet.</div>
          ) : (
            <div className="overflow-y-auto flex-1">
              {filteredConversations.map((conv) => (
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
                        {conv.lastMessage?.sender_id === conv.seeker_id || conv.lastMessage?.sender_visitor_id === conv.seeker_visitor_id 
                          ? "Seeker: " 
                          : "You: "}
                        {conv.lastMessage?.content || "Start a conversation..."}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Main Chat Area */}
        <div className={`flex-1 flex flex-col bg-mist-white ${!activeConvId ? 'hidden md:flex' : 'flex'}`}>
          {activeConvId && activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-ocean-blue/10 bg-white flex items-center gap-3">
                <button 
                  onClick={() => setActiveConvId(null)} 
                  className="md:hidden text-ink/60 hover:text-deep-navy"
                >
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h3 className="font-bold text-deep-navy text-sm">{activeConversation.listing?.title}</h3>
                  <p className="text-xs text-ink/50">Inquiry about this property</p>
                </div>
              </div>

              {/* Messages List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => {
                  // Determine if message is from landlord (current user)
                  // Note: In landlord view, landlord is always "me"
                  const isMe = msg.sender_id !== activeConversation.seeker_id && msg.sender_visitor_id !== activeConversation.seeker_visitor_id;
                  
                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm break-words ${
                        isMe 
                          ? "bg-deep-navy text-white rounded-br-none" 
                          : "bg-white border border-ocean-blue/10 text-deep-navy rounded-bl-none shadow-sm"
                      }`}>
                        {msg.content}
                        <div className={`text-[10px] mt-1 opacity-70 ${isMe ? "text-white/70" : "text-ink/50"}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Input Area */}
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