// src/components/chat/ChatMessage.tsx
// Renders a single chat message (user or assistant).
// Assistant messages include collapsible source citations.

"use client";

import { useState } from "react";
import type { ChatMessage as ChatMessageType } from "@/types";

interface Props {
  message: ChatMessageType;
}

export function ChatMessage({ message }: Props) {
  const [showSources, setShowSources] = useState(false);
  const isUser = message.role === "user";
  const hasSources = (message.sources?.length ?? 0) > 0;

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div
        className={`
          w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold
          ${isUser ? "bg-blue-500 text-white" : "bg-gray-800 text-white"}
        `}
      >
        {isUser ? "U" : "AI"}
      </div>

      {/* Bubble */}
      <div className={`max-w-[75%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
        <div
          className={`
            px-4 py-3 rounded-2xl text-sm leading-relaxed
            ${isUser
              ? "bg-blue-500 text-white rounded-tr-sm"
              : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm"}
          `}
        >
          {message.content}
        </div>

        {/* Sources toggle */}
        {hasSources && (
          <div className="w-full">
            <button
              onClick={() => setShowSources((v) => !v)}
              className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1 mt-1"
            >
              <svg
                className={`w-3 h-3 transition-transform ${showSources ? "rotate-90" : ""}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              {showSources ? "Hide" : "Show"} {message.sources!.length} source
              {message.sources!.length !== 1 ? "s" : ""}
            </button>

            {showSources && (
              <div className="mt-2 space-y-2">
                {message.sources!.map((source, i) => (
                  <div
                    key={i}
                    className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-amber-800 truncate">
                        📄 {source.document_name}
                      </span>
                      <span className="text-amber-500 ml-2 flex-shrink-0">
                        {(source.similarity * 100).toFixed(0)}% match
                      </span>
                    </div>
                    <p className="text-gray-600 line-clamp-3">{source.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Timestamp */}
        <span className="text-xs text-gray-400">
          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </div>
  );
}
