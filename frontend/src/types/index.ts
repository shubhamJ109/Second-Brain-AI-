// src/types/index.ts
// These types mirror the Pydantic schemas in the Python backend.
// If you change the backend schemas, update these too.

export interface Document {
  id: string;
  filename: string;
  file_type: "pdf" | "docx" | "txt";
  file_size: number; // bytes
  chunk_count: number;
  created_at: string; // ISO datetime string
}

export interface CitationSource {
  document_id: string;
  document_name: string;
  chunk_index: number;
  content: string;
  similarity: number; // 0–1
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: CitationSource[];
  suggested_questions?: string[];
  timestamp: Date;
}

export interface ChatRequest {
  query: string;
  document_ids?: string[]; // undefined = search all docs
}

export interface ChatResponse {
  answer: string;
  sources: CitationSource[];
  suggested_questions: string[];
  query: string;
}

export interface UploadResponse {
  message: string;
  document: Document;
}

export interface DocumentListResponse {
  documents: Document[];
  total: number;
}
