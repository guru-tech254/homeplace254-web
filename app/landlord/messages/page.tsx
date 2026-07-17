"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabaseAuth } from "@/lib/supabase/auth-client";
import { 
  Send, MessageCircle, User, Loader2, ArrowLeft, 
  Search, MoreVertical, CheckCheck 
} from "lucide-react";

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: string;
  content: string;
  created_at: string;
}

interface Contact {
  id: string;
  seeker_id: string;
  name: string;
  last_message: string;
  last_message_time: string;
  listing_id?: string;
}

export default function MessagesPage() {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabaseAuth.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }
      setUser(user);
      await fetchContacts(user.id);
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  const fetchContacts = async (currentUserId: string) => {
    try {
      const { data: convs, error: convError } = await supabaseAuth
        .from("conversations")
        .select("id, listing_id, seeker_session_id, created_at")
        .eq("landlord_id", currentUserId)
        .order("created_at", { ascending: false });

      if (convError) throw convError;

      const contactPromises = (convs || []).map(async (conv) => {
        const { data: msgs } = await supabaseAuth
          .from("messages")
          .select("content, created_at")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: false })
          .limit(1);

        const lastMsg = msgs?.[0];
        
        return {
          id: conv.id,
          seeker_id: conv.seeker_session_id,
          name: `Seeker ${conv.seeker_session_id.substring(0, 6)}`,
          last_message: lastMsg?.content || "No messages yet",
          last_message_time: lastMsg?.created_at || conv.created_at,
          listing_id: conv.listing_id,
        };
      });

      const resolvedContacts = await Promise.all(contactPromises);
      setContacts(resolvedContacts);
    } catch (err: any) {
      console.error("Failed to fetch contacts:", err);
    }
  };

  useEffect(() => {
    if (!activeContactId || !user) return;

    const fetchMessages = async () => {
      try {
        const { data, error } = await supabaseAuth
          .from("messages")
          .select("*")
          .eq("conversation_id", activeContactId)
          .order("created_at", { ascending: true });

        if (error) throw error;
        setMessages(data || []);
        
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      }
    };

    fetchMessages();
  }, [activeContactId, user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeContactId || !user) return;

    setSending(true);
    try {
      const { error } = await supabaseAuth.from("messages").insert({
        conversation_id: activeContactId,
        sender_id: user.id,
        sender_role: "landlord", // ✅ HARDCODED: Landlord portal ALWAYS sends as landlord
        content: newMessage.trim(),
      });

      if (error) throw error;

      setNewMessage("");
      
      const { data } = await supabaseAuth
        .from("messages")
        .select("*")
        .eq("conversation_id", activeContactId)
        .order("created_at", { ascending: true });
      
      setMessages(data || []);
      
      setContacts(prev => prev.map(c => 
        c.id === activeContactId 
          ? { ...c, last_message: newMessage.trim(), last_message_time: new Date().toISOString() } 
          : c
      ));

      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      
    } catch (err: any) {
      alert(`Failed to send: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-mist-white">
        <Loader2 className="animate-spin text-ocean-blue" size={40} />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] bg-mist-white">
      
      {/* LEFT SIDEBAR */}
      <div className={`w-full md:w-80 lg:w-96 bg-white border-r border-ocean-blue/10 flex flex-col ${activeContactId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-ocean-blue/10 bg-white">
          <h2 className="text-xl font-bold text-deep-navy mb-4 flex items-center gap-2">
            <MessageCircle size={24} className="text-amber-gold" />
            Messages
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 h-4 w-4" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-mist-white border border-ocean-blue/10 focus:outline-none focus:border-ocean-blue text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredContacts.length === 0 ? (
            <div className="text-center py-10 text-ink/50">
              <MessageCircle size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No conversations yet</p>
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => setActiveContactId(contact.id)}
                className={`w-full p-4 flex items-start gap-3 hover:bg-mist-white transition-colors border-b border-ocean-blue/5 text-left ${
                  activeContactId === contact.id ? 'bg-ocean-blue/5 border-l-4 border-l-amber-gold' : ''
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-ocean-blue/10 flex items-center justify-center shrink-0">
                  <User size={20} className="text-ocean-blue" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <p className="font-semibold text-deep-navy text-sm truncate">{contact.name}</p>
                    <span className="text-xs text-ink/40">
                      {new Date(contact.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-ink/60 truncate">{contact.last_message}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Chat Area */}
      <div className={`flex-1 flex flex-col bg-mist-white ${!activeContactId ? 'hidden md:flex' : 'flex'}`}>
        {activeContactId ? (
          <>
            <div className="p-4 bg-white border-b border-ocean-blue/10 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setActiveContactId(null)} 
                  className="md:hidden p-2 hover:bg-mist-white rounded-lg"
                >
                  <ArrowLeft size={20} className="text-deep-navy" />
                </button>
                <div className="w-10 h-10 rounded-full bg-ocean-blue/10 flex items-center justify-center">
                  <User size={20} className="text-ocean-blue" />
                </div>
                <div>
                  <h3 className="font-bold text-deep-navy text-sm">
                    {contacts.find(c => c.id === activeContactId)?.name || "Seeker"}
                  </h3>
                  <p className="text-xs text-signal-green">Online</p>
                </div>
              </div>
              <button className="p-2 hover:bg-mist-white rounded-lg text-ink/60">
                <MoreVertical size={20} />
              </button>
            </div>

            {/* ✅ MESSAGES WITH UNIVERSAL ROLE CHECK */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-10 text-ink/40">
                  <p className="text-sm">Start the conversation</p>
                </div>
              ) : (
                messages.map((msg) => {
                  // ✅ ONLY 'landlord' goes right. Null/empty/seeker all go left.
                  const isLandlord = msg.sender_role === 'landlord';
                  
                  return (
                    <div 
                      key={msg.id} 
                      className={`flex ${isLandlord ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                        isLandlord 
                          ? 'bg-amber-gold text-white rounded-br-none' 
                          : 'bg-white text-deep-navy border border-ocean-blue/10 rounded-bl-none'
                      }`}>
                        <p className="leading-relaxed">{msg.content}</p>
                        <p className={`text-[10px] mt-1.5 flex items-center gap-1 ${
                          isLandlord ? 'text-white/70' : 'text-ink/40'
                        }`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                          {isLandlord && <CheckCheck size={12} />}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-ocean-blue/10">
              <form onSubmit={handleSendMessage} className="flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 rounded-xl bg-mist-white border border-ocean-blue/10 focus:outline-none focus:border-ocean-blue focus:ring-2 focus:ring-ocean-blue/20 text-sm"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="bg-amber-gold text-white px-6 py-3 rounded-xl font-semibold hover:brightness-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  <span className="hidden sm:inline">Send</span>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-ink/40 bg-mist-white/50">
            <div className="bg-white p-6 rounded-full shadow-sm mb-4">
              <MessageCircle size={48} className="text-ocean-blue/30" />
            </div>
            <h3 className="text-lg font-bold text-deep-navy mb-1">Select a conversation</h3>
            <p className="text-sm">Choose a seeker from the sidebar to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}