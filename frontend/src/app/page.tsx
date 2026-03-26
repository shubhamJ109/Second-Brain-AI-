// src/app/page.tsx
// Main page — two-column layout: document sidebar + chat panel.

"use client";

import { useState } from "react";
import { DocumentUpload } from "@/components/documents/DocumentUpload";
import { DocumentList } from "@/components/documents/DocumentList";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ChatInput } from "@/components/chat/ChatInput";
import { useDocuments } from "@/hooks/useDocuments";
import { useChat } from "@/hooks/useChat";

export default function Home() {
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const { documents, isLoading: docsLoading, isUploading, error: docsError, upload, remove } = useDocuments();
  const { messages, isLoading: chatLoading, error: chatError, sendMessage, clearChat } = useChat(selectedDocIds);

  function toggleDocument(id: string) {
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  }

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className="w-80 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧠</span>
            <div>
              <h1 className="font-bold text-gray-900 leading-tight">Second Brain AI</h1>
              <p className="text-xs text-gray-400">Chat with your documents</p>
            </div>
          </div>
        </div>

        {/* Upload area */}
        <DocumentUpload onUpload={upload} isUploading={isUploading} />

        {docsError && (
          <p className="px-4 py-1 text-xs text-red-500 bg-red-50">{docsError}</p>
        )}

        {/* Document list */}
        <DocumentList
          documents={documents}
          selectedIds={selectedDocIds}
          onToggle={toggleDocument}
          onDelete={remove}
          isLoading={docsLoading}
        />
      </aside>

      {/* ── Main Chat Panel ──────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {selectedDocIds.length > 0 ? (
              <>
                <span className="w-2 h-2 bg-blue-500 rounded-full" />
                Searching {selectedDocIds.length} selected document{selectedDocIds.length !== 1 ? "s" : ""}
              </>
            ) : (
              <>
                <span className="w-2 h-2 bg-green-400 rounded-full" />
                Searching all {documents.length} document{documents.length !== 1 ? "s" : ""}
              </>
            )}
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Clear chat
            </button>
          )}
        </header>

        {/* Error banner */}
        {chatError && (
          <div className="bg-red-50 border-b border-red-200 px-6 py-2 text-sm text-red-600">
            ⚠️ {chatError}
          </div>
        )}

        {/* Messages */}
        <ChatWindow messages={messages} isLoading={chatLoading} />

        {/* Input */}
        <ChatInput
          onSend={sendMessage}
          isLoading={chatLoading}
          disabled={documents.length === 0}
        />
      </main>
    </div>
  );
}
