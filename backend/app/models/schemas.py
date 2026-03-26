"""
app/models/schemas.py
──────────────────────
Pydantic models define the shape of data going IN and OUT of the API.
They are separate from ORM models (SQLAlchemy) — ORM talks to the DB,
Pydantic talks to the client.
"""

from pydantic import BaseModel
from datetime import datetime


# ── Document Schemas ──────────────────────────────────────────────────────────

class DocumentResponse(BaseModel):
    """Returned when listing or uploading a document."""
    id: str
    filename: str
    file_type: str
    file_size: int
    chunk_count: int
    created_at: datetime

    model_config = {"from_attributes": True}  # allow creating from ORM objects


class DocumentListResponse(BaseModel):
    documents: list[DocumentResponse]
    total: int


# ── Chat Schemas ──────────────────────────────────────────────────────────────

class CitationSource(BaseModel):
    """A single chunk of source text shown below an answer."""
    document_id: str
    document_name: str
    chunk_index: int
    content: str          # the raw chunk text
    similarity: float     # cosine similarity score (0–1)


class ChatRequest(BaseModel):
    """Body sent by the frontend when the user asks a question."""
    query: str
    document_ids: list[str] | None = None  # None = search ALL documents


class ChatResponse(BaseModel):
    """Full response including the answer and supporting sources."""
    answer: str
    sources: list[CitationSource]
    query: str


# ── Upload Response ───────────────────────────────────────────────────────────

class UploadResponse(BaseModel):
    message: str
    document: DocumentResponse
