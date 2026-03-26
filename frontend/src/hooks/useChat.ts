// src/hooks/useChat.ts
// Custom hook that manages the entire chat session state.
// Separating this from the UI component keeps components clean and testable.

"use client";

import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { sendChatMessage } from "@/lib/api";
import type { ChatMessage } from "@/types";

export function useChat(selectedDocIds: string[]) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (query: string) => {
      if (!query.trim() || isLoading) return;

      // Optimistically add the user message to the UI immediately
      const userMessage: ChatMessage = {
        id: uuidv4(),
        role: "user",
        content: query,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        const response = await sendChatMessage({
          query,
          document_ids: selectedDocIds.length > 0 ? selectedDocIds : undefined,
        });

        const assistantMessage: ChatMessage = {
          id: uuidv4(),
          role: "assistant",
          content: response.answer,
          sources: response.sources,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        // Remove the user message if the request failed
        setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, selectedDocIds]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isLoading, error, sendMessage, clearChat };
}
