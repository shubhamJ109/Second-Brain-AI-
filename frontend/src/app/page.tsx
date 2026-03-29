"use client";

import { useState } from "react";
import { Brain, Sparkles, MessageSquare, Plus, Database } from "lucide-react";
import { DocumentUpload } from "@/components/documents/DocumentUpload";
import { DocumentList } from "@/components/documents/DocumentList";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ChatInput } from "@/components/chat/ChatInput";
import { useDocuments } from "@/hooks/useDocuments";
import { useChat } from "@/hooks/useChat";                                                                                                                                                                            

export default function Home() {
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const { documents, isLoading: docsLoading, isUploading, error: docsError, upload, remove } = useDocuments();
  const { messages, isLoading: chatLoading, error: chatError, sendMessage, clearChat } = useChat(activeDocId);

  const activeDoc = documents.find(d => d.id === activeDocId);

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden relative selection:bg-emerald-500/30">
      {/* ── Background Decoration ─────────────────────────────────────────── */}
      <div className="absolute inset-0 bg-emerald-gradient pointer-events-none opacity-50 z-0" />
      <div className="absolute inset-0 bg-dark-mesh opacity-[0.03] pointer-events-none z-0" />

      {/* ── Global Header (Integrated Project Name) ────────────────────────── */}
      <header className="h-14 flex-shrink-0 glass border-b border-white/5 flex items-center px-6 z-20 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
            <Brain className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-base font-black text-white tracking-widest leading-none flex items-center gap-1.5 uppercase">
              Second Brain <span className="text-emerald-500 italic font-black">AI</span>
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 glass px-3 py-1.5 rounded-full border-white/10">
            <div className={`w-1.5 h-1.5 rounded-full ${activeDocId ? "bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "bg-white/20"}`} />
            <span className="text-[9px] font-bold text-white/40 uppercase tracking-[0.2em]">
              {activeDoc ? `Session: ${activeDoc.filename}` : "Global Context"}
            </span>
          </div>
          <Sparkles className="w-4 h-4 text-emerald-500/40" />
        </div>
      </header>

      {/* ── Main Layout: Split Section ─────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden z-10 relative">
        
        {/* SIDEBAR: Upload & History (Left) */}
        <aside className="w-80 flex-shrink-0 glass border-r border-white/10 flex flex-col">
          {/* Section 1: Upload (Top) */}
          <section className="p-6 border-b border-white/5">
            <div className="flex items-center gap-2 mb-4 opacity-40">
              <Plus className="w-3.5 h-3.5" />
              <h2 className="text-[10px] uppercase tracking-[0.2em] font-black italic">Upload Area</h2>
            </div>
            <DocumentUpload onUpload={upload} isUploading={isUploading} />
          </section>

          {/* Section 2: Library History (Bottom) */}
          <section className="flex-1 flex flex-col overflow-hidden">
            <div className="p-6 pb-2 flex items-center gap-2 opacity-40">
              <Database className="w-3.5 h-3.5" />
              <h2 className="text-[10px] uppercase tracking-[0.2em] font-black italic">Library & Sessions</h2>
            </div>

            {docsError && (
              <div className="px-4 py-2 mx-6 mt-2 text-[10px] text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg animate-in">
                {docsError}
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-4 pb-6 scrollbar-hide mt-2">
              <DocumentList
                documents={documents}
                activeId={activeDocId}
                onSelect={setActiveDocId}
                onDelete={remove}
                isLoading={docsLoading}
              />
            </div>
          </section>
        </aside>

        {/* MAIN AREA: AI Conversation (Right) */}
        <main className="flex-1 flex flex-col overflow-hidden relative bg-white/[0.01]">
          {/* Section 3: Question Area (Top) */}
          <div className="p-8 pb-4 border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent z-10">
            <div className="max-w-4xl mx-auto w-full">
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-xs font-black text-white/20 uppercase tracking-[0.3em] flex items-center gap-2.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Ask individual session
                </h3>
                {messages.length > 0 && (
                  <button
                    onClick={clearChat}
                    className="text-[9px] uppercase tracking-[0.25em] font-black text-white/20 hover:text-red-400 transition-colors"
                  >
                    Reset Content
                  </button>
                )}
              </div>
              <ChatInput
                onSend={sendMessage}
                isLoading={chatLoading}
                disabled={documents.length === 0}
              />
            </div>
          </div>

          {chatError && (
            <div className="bg-red-500/10 border-b border-red-500/20 px-8 py-3 text-xs text-red-400 flex items-center gap-3 z-20">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="font-semibold tracking-tight">{chatError}</span>
            </div>
          )}

          {/* Section 4: AI Response Workspace (Bottom) */}
          <div className="flex-1 overflow-hidden flex flex-col relative">
            <ChatWindow messages={messages} isLoading={chatLoading} onSend={sendMessage} />
          </div>
        </main>

      </div>
    </div>
  );
}
