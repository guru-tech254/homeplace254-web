"use client";

import { useChat } from "@/lib/chat-context";
// ✅ Ensure this matches your actual export in ChatWidget.tsx
import ChatWidget from "./ChatWidget"; 

export default function GlobalChatWidget() {
  const { isOpen, activeListingId, activeLandlordId, closeChat } = useChat();

  // Only render if chat is open AND we have valid IDs
  if (!isOpen || !activeListingId || !activeLandlordId) return null;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* 
        pointer-events-auto allows interaction with the widget 
        while keeping the backdrop non-blocking 
      */}
      <div className="pointer-events-auto">
        <ChatWidget 
          listingId={activeListingId} 
          landlordId={activeLandlordId}
          onClose={closeChat} 
        />
      </div>
    </div>
  );
}