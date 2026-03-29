import React, { useRef } from "react";
import { UploadCloud, Loader2 } from "lucide-react";

interface Props {
  onUpload: (file: File) => Promise<any>;
  isUploading: boolean;
}

export const DocumentUpload: React.FC<Props> = ({ onUpload, isUploading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onUpload(file);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="relative group">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp"
        disabled={isUploading}
      />
      
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className={`
          w-full p-4 rounded-xl border border-dashed transition-all duration-300
          flex flex-col items-center justify-center gap-2
          ${isUploading 
            ? "border-emerald-500/20 bg-emerald-500/5 cursor-not-allowed" 
            : "border-white/10 hover:border-emerald-500/40 hover:bg-emerald-500/5 hover:emerald-glow"}
        `}
      >
        <div className="relative">
          {isUploading ? (
            <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
          ) : (
            <div className="bg-emerald-500/10 p-2 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
              <UploadCloud className="w-5 h-5 text-emerald-500" />
            </div>
          )}
        </div>

        <div className="text-center">
          <p className="text-xs font-semibold text-white/80">
            {isUploading ? "Reading Document..." : "Add to Library"}
          </p>
          <p className="text-[10px] text-white/30 font-medium">
            PDF, Image, or Word
          </p>
        </div>
      </button>

      {isUploading && (
        <div className="absolute inset-x-0 -bottom-1 h-0.5 px-3">
          <div className="h-full bg-emerald-500/20 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 animate-pulse w-full rounded-full" />
          </div>
        </div>
      )}
    </div>
  );
};
