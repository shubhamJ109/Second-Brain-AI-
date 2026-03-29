// src/hooks/useChat.ts
// Custom hook that manages the entire chat session state.
// Separating this from the UI component keeps components clean and testable.

"use client";

import { useState, useCallback, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { sendChatMessage } from "@/lib/api";
import type { ChatMessage } from "@/types";

const STORAGE_KEY = "second_brain_chat_sessions";

export function useChat(activeDocId: string | null) {
  const sessionId = activeDocId || "global";
  
  // State for all sessions
  const [sessions, setSessions] = useState<Record<string, ChatMessage[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setSessions(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load sessions", e);
      }
    }
  }, []);

  // Save to localStorage when sessions change
  useEffect(() => {
    if (Object.keys(sessions).length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }
  }, [sessions]);

  const messages = sessions[sessionId] || [];

  const sendMessage = useCallback(
    async (query: string) => {
      if (!query.trim() || isLoading) return;

      const userMessage: ChatMessage = {
        id: uuidv4(),
        role: "user",
        content: query,
        timestamp: new Date(),
      };

      setSessions((prev) => ({
        ...prev,
        [sessionId]: [...(prev[sessionId] || []), userMessage],
      }));
      
      setIsLoading(true);
      setError(null);

      try {
        const response = await sendChatMessage({
          query,
          document_ids: activeDocId ? [activeDocId] : undefined,
        });

        const assistantMessage: ChatMessage = {
          id: uuidv4(),
          role: "assistant",
          content: response.answer,
          sources: response.sources,
          suggested_questions: response.suggested_questions,
          timestamp: new Date(),
        };

        setSessions((prev) => ({
          ...prev,
          [sessionId]: [...(prev[sessionId] || []), assistantMessage],
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        // We could also remove the user message here if we want to be strict
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, activeDocId, sessionId]
  );

  const clearChat = useCallback(() => {
    setSessions((prev) => ({
      ...prev,
      [sessionId]: [],
    }));
    setError(null);
  }, [sessionId]);

  return { messages, isLoading, error, sendMessage, clearChat };
}
