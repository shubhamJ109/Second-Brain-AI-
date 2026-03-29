import React from "react";
import { FileText, Trash2, Loader2, CheckCircle2 } from "lucide-react";

interface Document {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
}

interface Props {
  documents: Document[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
  onDelete: (id: string) => void;
  isLoading: boolean;
}

export const DocumentList: React.FC<Props> = ({
  documents,
  activeId,
  onSelect,
  onDelete,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 opacity-40">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mb-2" />
        <p className="text-[10px] uppercase tracking-widest font-bold">Syncing Library...</p>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center border border-dashed border-white/5 rounded-xl bg-white/[0.01]">
        <FileText className="w-8 h-8 text-white/10 mb-3" />
        <p className="text-xs text-white/40 font-medium">Your library is empty.</p>
        <p className="text-[10px] text-white/20 mt-1">Upload a PDF or image to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 mt-4">
      {documents.map((doc) => {
        const isActive = doc.id === activeId;
        return (
          <div
            key={doc.id}
            onClick={() => onSelect(isActive ? null : doc.id)}
            className={`
              group relative p-3 rounded-xl border transition-all duration-300 cursor-pointer
              ${isActive 
                ? "bg-emerald-500/10 border-emerald-500/30 emerald-glow" 
                : "bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]"}
            `}
          >
            <div className="flex items-center gap-3">
              <div className={`
                p-2 rounded-lg transition-colors
                ${isActive ? "bg-emerald-500/20" : "bg-white/5 group-hover:bg-white/10"}
              `}>
                {isActive ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <FileText className="w-4 h-4 text-white/40 group-hover:text-white/60" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white/80 truncate pr-6">
                  {doc.filename}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[9px] uppercase font-bold text-white/20 tracking-wider">
                    {doc.file_type}
                  </span>
                  <span className="text-[9px] text-white/10">•</span>
                  <span className="text-[9px] text-white/20">
                    {(doc.file_size / 1024).toFixed(1)} KB
                  </span>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(doc.id);
                }}
                className="absolute right-2 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400 text-white/20 rounded-lg transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
