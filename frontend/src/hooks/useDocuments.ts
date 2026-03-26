// src/hooks/useDocuments.ts

"use client";

import { useState, useEffect, useCallback } from "react";
import { listDocuments, uploadDocument, deleteDocument } from "@/lib/api";
import type { Document } from "@/types";

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch documents on mount
  const fetchDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await listDocuments();
      setDocuments(data.documents);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const upload = useCallback(async (file: File) => {
    try {
      setIsUploading(true);
      setError(null);
      const response = await uploadDocument(file);
      // Add the new document to the top of the list
      setDocuments((prev) => [response.document, ...prev]);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    try {
      await deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }, []);

  return { documents, isLoading, isUploading, error, upload, remove, refetch: fetchDocuments };
}
