"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";

interface ChatContextType {
  isOpen: boolean;
  activeListingId: string | null;
  activeLandlordId: string | null;
  openChat: (listingId: string, landlordId: string) => void;
  closeChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeListingId, setActiveListingId] = useState<string | null>(null);
  const [activeLandlordId, setActiveLandlordId] = useState<string | null>(null);

  const openChat = useCallback((listingId: string, landlordId: string) => {
    setActiveListingId(listingId);
    setActiveLandlordId(landlordId);
    setIsOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Listen for custom events from listing cards
  useEffect(() => {
    const handleOpenChat = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.listingId && detail?.landlordId) {
        openChat(detail.listingId, detail.landlordId);
      }
    };

    window.addEventListener('open-chat', handleOpenChat);
    return () => window.removeEventListener('open-chat', handleOpenChat);
  }, [openChat]);

  return (
    <ChatContext.Provider value={{ isOpen, activeListingId, activeLandlordId, openChat, closeChat }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat must be used within ChatProvider");
  return context;
}