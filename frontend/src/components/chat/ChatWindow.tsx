import React, { useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";
import { Brain, Sparkles, Loader2 } from "lucide-react";

interface Props {
  messages: any[];
  isLoading: boolean;
  onSend: (message: string) => void;
}

export const ChatWindow: React.FC<Props> = ({ messages, isLoading, onSend }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center animate-in">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/5 flex items-center justify-center border border-emerald-500/10 mb-6">
          <Sparkles className="w-8 h-8 text-emerald-500/40" />
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight mb-2">How can I help you today?</h2>
        <p className="text-sm text-white/40 max-w-sm font-medium leading-relaxed">
          Ask a question about your uploaded documents or explore your library with high-precision RAG.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden">
      <div className="flex flex-col min-h-full">
        {messages.map((m: any) => (
          <ChatMessage key={m.id} message={m} onSuggestClick={onSend} />
        ))}
        {isLoading && (
          <div className="flex w-full px-8 py-6 bg-emerald-500/[0.02]">
            <div className="max-w-3xl mx-auto flex gap-6 w-full">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
              <div className="flex items-center gap-1.5 py-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-500/40">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} className="h-8" />
      </div>
    </div>
  );
};
