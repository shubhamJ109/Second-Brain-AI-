// src/components/documents/DocumentUpload.tsx
// Drag-and-drop + click-to-browse file upload component.

"use client";

import { useRef, useState, DragEvent, ChangeEvent } from "react";

interface Props {
  onUpload: (file: File) => Promise<unknown>;
  isUploading: boolean;
}

const ACCEPTED = ".pdf,.docx,.txt";
const MAX_SIZE_MB = 20;

export function DocumentUpload({ onUpload, isUploading }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  function validateAndUpload(file: File) {
    setLocalError(null);
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx", "txt"].includes(ext ?? "")) {
      setLocalError("Only PDF, DOCX, and TXT files are supported.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setLocalError(`File must be under ${MAX_SIZE_MB}MB.`);
      return;
    }
    onUpload(file).catch(() => {}); // errors are handled in the hook
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) validateAndUpload(file);
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) validateAndUpload(file);
    e.target.value = ""; // reset so same file can be re-uploaded
  }

  return (
    <div className="p-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !isUploading && inputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
          transition-all duration-200
          ${isDragOver ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"}
          ${isUploading ? "opacity-60 cursor-not-allowed" : ""}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          onChange={handleChange}
          className="hidden"
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Processing document…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="text-3xl">📄</div>
            <p className="text-sm font-medium text-gray-700">
              Drop a file or click to browse
            </p>
            <p className="text-xs text-gray-400">PDF · DOCX · TXT · up to {MAX_SIZE_MB}MB</p>
          </div>
        )}
      </div>

      {localError && (
        <p className="mt-2 text-xs text-red-500">{localError}</p>
      )}
    </div>
  );
}
