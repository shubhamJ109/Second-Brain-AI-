"""
app/api/documents.py
──────────────────────
Document-related API endpoints:
  POST /documents/upload  — upload and ingest a document
  GET  /documents         — list all documents
  DELETE /documents/{id}  — delete a document and its chunks
"""

import os
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.document import Document
from app.models.schemas import UploadResponse, DocumentListResponse, DocumentResponse
from app.services.ingestion_service import ingest_document
from app.core.config import get_settings

router = APIRouter(prefix="/documents", tags=["documents"])
settings = get_settings()


@router.post("/upload", response_model=UploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload a PDF, DOCX, or TXT file.
    The backend will parse, chunk, embed, and store it automatically.
    """
    doc_response = await ingest_document(file, db)
    return UploadResponse(
        message=f"Document '{doc_response.filename}' ingested successfully "
                f"({doc_response.chunk_count} chunks created).",
        document=doc_response,
    )


@router.get("", response_model=DocumentListResponse)
async def list_documents(db: AsyncSession = Depends(get_db)):
    """Return all uploaded documents, newest first."""
    result = await db.execute(
        select(Document).order_by(Document.created_at.desc())
    )
    docs = result.scalars().all()
    return DocumentListResponse(
        documents=[DocumentResponse.model_validate(d) for d in docs],
        total=len(docs),
    )


@router.delete("/{document_id}", status_code=204)
async def delete_document(document_id: str, db: AsyncSession = Depends(get_db)):
    """
    Delete a document and all its chunks.
    Also removes the original file from the local uploads/ directory.
    """
    result = await db.execute(select(Document).where(Document.id == document_id))
    doc = result.scalar_one_or_none()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    # 1. Attempt to delete from filesystem first
    if settings.upload_dir:
        try:
            # Try new format first: "uuid.ext"
            file_path = os.path.join(settings.upload_dir, f"{doc.id}.{doc.file_type}")
            
            # Fallback to old format: "uuidext"
            if not os.path.exists(file_path):
                old_format_path = os.path.join(settings.upload_dir, f"{doc.id}{doc.file_type}")
                if os.path.exists(old_format_path):
                    file_path = old_format_path

            if os.path.exists(file_path):
                os.remove(file_path)
                print(f"🗑️ Deleted file from disk: {file_path}")
            else:
                print(f"ℹ️ File not found on disk, skipping cleanup.")
        except Exception as e:
            # We don't want to block the DB delete if disk cleanup fails
            print(f"⚠️ Warning: Could not delete file from disk: {e}")

    # 2. Delete from database (with cascade delete for DocumentChunk)
    await db.delete(doc)
    # Commit is handled by the get_db context manager in core/database.py
