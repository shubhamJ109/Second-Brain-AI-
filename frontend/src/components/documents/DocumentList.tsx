// src/components/documents/DocumentList.tsx
// Displays uploaded documents with selection checkboxes and delete button.

"use client";

import type { Document } from "@/types";

interface Props {
  documents: Document[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  isLoading: boolean;
}

const FILE_ICONS: Record<string, string> = {
  pdf: "📕",
  docx: "📘",
  txt: "📄",
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentList({ documents, selectedIds, onToggle, onDelete, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="p-4 space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="p-6 text-center text-gray-400 text-sm">
        <p className="text-2xl mb-2">📭</p>
        <p>No documents yet. Upload one above.</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto max-h-[calc(100vh-280px)]">
      <p className="px-4 pb-2 text-xs text-gray-400 font-medium uppercase tracking-wide">
        {selectedIds.length > 0
          ? `${selectedIds.length} of ${documents.length} selected`
          : `${documents.length} document${documents.length !== 1 ? "s" : ""}`}
      </p>

      <ul className="px-2 space-y-1">
        {documents.map((doc) => {
          const isSelected = selectedIds.includes(doc.id);
          return (
            <li
              key={doc.id}
              className={`
                group flex items-center gap-3 p-3 rounded-lg cursor-pointer
                transition-colors duration-150
                ${isSelected ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50 border border-transparent"}
              `}
              onClick={() => onToggle(doc.id)}
            >
              {/* Checkbox */}
              <div
                className={`
                  w-4 h-4 rounded border flex items-center justify-center flex-shrink-0
                  ${isSelected ? "bg-blue-500 border-blue-500" : "border-gray-300"}
                `}
              >
                {isSelected && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                  </svg>
                )}
              </div>

              {/* Icon + info */}
              <span className="text-xl">{FILE_ICONS[doc.file_type] ?? "📄"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{doc.filename}</p>
                <p className="text-xs text-gray-400">
                  {formatSize(doc.file_size)} · {doc.chunk_count} chunks
                </p>
              </div>

              {/* Delete button */}
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(doc.id); }}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-1 rounded"
                title="Delete document"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </li>
          );
        })}
      </ul>

      {selectedIds.length === 0 && documents.length > 0 && (
        <p className="px-4 pt-3 pb-2 text-xs text-gray-400 italic">
          ✓ Select documents to restrict search, or leave all unchecked to search everything.
        </p>
      )}
    </div>
  );
}
