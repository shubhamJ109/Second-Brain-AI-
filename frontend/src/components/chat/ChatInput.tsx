import React, { useState } from "react";
import { Send, Command } from "lucide-react";

interface Props {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled: boolean;
}

export const ChatInput: React.FC<Props> = ({ onSend, isLoading, disabled }) => {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading && !disabled) {
      onSend(input.trim());
      setInput("");
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full relative group">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <div className="absolute left-4 text-white/20 group-focus-within:text-emerald-500/40 transition-colors">
          <Command className="w-4 h-4" />
        </div>
        
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={disabled ? "Please upload a document first..." : "Ask your Second Brain anything..."}
          disabled={isLoading || disabled}
          className={`
            w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-16 
            text-sm font-medium placeholder:text-white/20 text-white/80
            focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40
            transition-all duration-300
            ${disabled ? "cursor-not-allowed opacity-50" : "hover:border-white/20"}
          `}
        />

        <div className="absolute right-2 flex items-center">
          <button
            type="submit"
            disabled={!input.trim() || isLoading || disabled}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-300
              ${!input.trim() || isLoading || disabled
                ? "bg-white/5 border-white/5 text-white/10"
                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20 hover:border-emerald-500/40 active:scale-95 shadow-lg shadow-emerald-500/5"}
            `}
          >
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline-block">Send</span>
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>

      <div className="mt-3 flex items-center justify-center gap-4">
        <p className="text-[10px] text-white/10 font-bold uppercase tracking-[0.2em]">
          Shift + Enter for new line
        </p>
      </div>
    </div>
  );
};
