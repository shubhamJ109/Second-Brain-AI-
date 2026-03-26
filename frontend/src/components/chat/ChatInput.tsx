// src/components/chat/ChatInput.tsx
// The message input bar at the bottom of the chat.

"use client";

import { useState, KeyboardEvent } from "react";

interface Props {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function ChatInput({ onSend, isLoading, disabled }: Props) {
  const [value, setValue] = useState("");

  function handleSend() {
    if (!value.trim() || isLoading || disabled) return;
    onSend(value.trim());
    setValue("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // Send on Enter, allow Shift+Enter for newlines
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      {disabled && (
        <p className="text-xs text-center text-amber-500 mb-2">
          ⚠️ Upload at least one document before chatting.
        </p>
      )}
      <div className="flex gap-3 items-end">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "Upload a document first…" : "Ask anything about your documents…"}
          disabled={isLoading || disabled}
          rows={1}
          className="
            flex-1 resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:opacity-50 disabled:bg-gray-50
            max-h-40 overflow-y-auto
          "
          style={{ minHeight: "48px" }}
        />
        <button
          onClick={handleSend}
          disabled={!value.trim() || isLoading || disabled}
          className="
            w-12 h-12 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300
            rounded-xl text-white flex items-center justify-center
            transition-colors duration-150 flex-shrink-0
          "
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-2 text-right">Enter to send · Shift+Enter for newline</p>
    </div>
  );
}
