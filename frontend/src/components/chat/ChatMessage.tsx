import React from "react";
import ReactMarkdown from "react-markdown";
import { User, Sparkles, FileText, ChevronRight } from "lucide-react";

interface CitationSource {
  document_id: string;
  document_name: string;
  chunk_index: number;
  content: string;
  similarity: number;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: CitationSource[];
  suggested_questions?: string[];
}

interface Props {
  message: Message;
  onSuggestClick: (question: string) => void;
}

export const ChatMessage: React.FC<Props> = ({ message, onSuggestClick }) => {
  const isAI = message.role === "assistant";

  return (
    <div className={`flex w-full px-8 py-6 transition-colors ${isAI ? "bg-emerald-500/[0.02]" : ""}`}>
      <div className="max-w-3xl mx-auto flex gap-6 w-full animate-in">
        {/* Avatar */}
        <div className={`
          w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center border
          ${isAI 
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" 
            : "bg-white/5 border-white/10 text-white/40"}
        `}>
          {isAI ? <Sparkles className="w-4 h-4" /> : <User className="w-4 h-4" />}
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-4 pt-1">
          <div className="prose prose-invert prose-sm max-w-none text-white/80 leading-relaxed font-medium">
            {isAI ? (
              <div className="markdown-content">
                <ReactMarkdown 
                  components={{
                    h3: ({...props}) => <h3 className="text-sm font-bold text-emerald-500 mt-6 mb-3 uppercase tracking-wider" {...props} />,
                    p: ({...props}) => <p className="mb-4 last:mb-0" {...props} />,
                    ul: ({...props}) => <ul className="list-disc list-inside space-y-2 mb-4" {...props} />,
                    li: ({...props}) => <li className="text-white/70" {...props} />,
                    strong: ({...props}) => <strong className="text-white font-bold" {...props} />,
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            ) : (
              <p>{message.content}</p>
            )}
          </div>

          {/* Suggested Questions */}
          {isAI && message.suggested_questions && message.suggested_questions.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 animate-in">
              {message.suggested_questions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => onSuggestClick(q)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/20 text-[10px] font-bold text-emerald-500/80 hover:bg-emerald-500/10 hover:border-emerald-500/40 transition-all group"
                >
                  {q}
                  <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -ml-1 transition-all" />
                </button>
              ))}
            </div>
          )}

          {/* Citations/Sources */}
          {isAI && message.sources && message.sources.length > 0 && (
            <div className="pt-4 border-t border-white/5 mt-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="text-[10px] uppercase font-bold tracking-widest text-emerald-500/60">
                  Contextual Sources
                </div>
                <div className="h-px flex-1 bg-white/5" />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {message.sources.map((source, idx) => (
                  <div 
                    key={idx}
                    className="p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:border-emerald-500/20 transition-all group"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <FileText className="w-3 h-3 text-emerald-500/40" />
                      <span className="text-[10px] font-bold text-white/40 truncate flex-1 uppercase tracking-tight">
                        {source.document_name}
                      </span>
                      <span className="text-[10px] text-white/10 font-mono">
                        {(source.similarity * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-[11px] text-white/30 truncate leading-relaxed group-hover:text-white/50 transition-colors">
                      {source.content.slice(0, 80)}...
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
