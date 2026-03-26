// src/lib/api.ts
// Centralized API client. All backend calls go through here.
// Using native fetch (built into Next.js) — no axios needed.

import type {
  ChatRequest,
  ChatResponse,
  DocumentListResponse,
  UploadResponse,
} from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

// ── Generic request helper ────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    // Try to parse error detail from FastAPI's standard error response
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "An unknown error occurred");
  }

  return res.json() as Promise<T>;
}

// ── Document APIs ─────────────────────────────────────────────────────────────

export async function uploadDocument(file: File): Promise<UploadResponse> {
  // File uploads use multipart/form-data — don't set Content-Type header
  // (the browser sets it automatically with the correct boundary).
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${BASE_URL}/documents/upload`, {
    method: "POST",
    body: form,
    // Note: no Content-Type header here — let browser set it for multipart
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Upload failed");
  }

  return res.json();
}

export async function listDocuments(): Promise<DocumentListResponse> {
  return request<DocumentListResponse>("/documents");
}

export async function deleteDocument(id: string): Promise<void> {
  await request(`/documents/${id}`, { method: "DELETE" });
}

// ── Chat API ──────────────────────────────────────────────────────────────────

export async function sendChatMessage(payload: ChatRequest): Promise<ChatResponse> {
  return request<ChatResponse>("/chat", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
