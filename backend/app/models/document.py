"""
app/models/document.py
───────────────────────
ORM table definitions.

  documents        → one row per uploaded file
  document_chunks  → many rows per document (one per text chunk)

The `embedding` column uses pgvector's VECTOR type to store 1536-dimensional
float arrays (OpenAI text-embedding-3-small outputs 1536 dimensions).
"""

import uuid
from datetime import datetime

from sqlalchemy import String, Text, Integer, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pgvector.sqlalchemy import Vector

from app.core.database import Base


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_type: Mapped[str] = mapped_column(String(10), nullable=False)  # pdf, docx, txt
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)      # bytes
    chunk_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # One document → many chunks (cascade delete removes chunks when doc is deleted)
    chunks: Mapped[list["DocumentChunk"]] = relationship(
        "DocumentChunk", back_populates="document", cascade="all, delete-orphan"
    )


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    document_id: Mapped[str] = mapped_column(
        String, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False
    )
    # The actual text content of this chunk
    content: Mapped[str] = mapped_column(Text, nullable=False)

    # Position of this chunk within the document (for ordering citations)
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)

    # The embedding vector — 1536 dims for text-embedding-3-small
    # pgvector stores this as a compact binary array and indexes it for fast search
    embedding: Mapped[list[float]] = mapped_column(Vector(1536), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    document: Mapped["Document"] = relationship("Document", back_populates="chunks")
