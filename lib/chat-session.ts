// src/lib/chat-session.ts
import { supabaseAuth } from "./supabase/auth-client";

export function getOrCreateSeekerSession(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionId = localStorage.getItem('chat_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('chat_session_id', sessionId);
  }
  return sessionId;
}

export function initChatSession() {
  const sessionId = getOrCreateSeekerSession();
  
  // Patch REST client to inject session header on EVERY request
  const restClient = (supabaseAuth as any).rest;
  if (restClient && restClient.fetch) {
    const originalFetch = restClient.fetch.bind(restClient);
    restClient.fetch = async (url: RequestInfo | URL, options: RequestInit = {}) => {
      options.headers = {
        ...options.headers,
        'x-chat-session-id': sessionId,
      };
      return originalFetch(url, options);
    };
  }

  console.log("🔗 Chat session initialized:", sessionId.slice(0, 8) + '...');
  return sessionId;
}