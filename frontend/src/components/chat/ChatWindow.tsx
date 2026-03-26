// src/components/chat/ChatWindow.tsx
// Scrollable list of chat messages with auto-scroll to bottom.

"use client";

import { useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";
import type { ChatMessage as ChatMessageType } from "@/types";

interface Props {
  messages: ChatMessageType[];
  isLoading: boolean;
}

export function ChatWindow({ messages, isLoading }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-400">
        <div className="text-5xl mb-4">🧠</div>
        <h3 className="text-lg font-semibold text-gray-600 mb-2">Second Brain AI</h3>
        <p className="text-sm max-w-xs">
          Upload documents on the left, then ask questions here.
          The AI will answer using only your documents.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}

      {/* Typing indicator */}
      {isLoading && (
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            AI
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
            <div className="flex gap-1 items-center h-4">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
