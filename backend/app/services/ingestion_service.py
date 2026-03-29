"""
app/services/ingestion_service.py
───────────────────────────────────
Orchestrates the full Document Ingestion Pipeline:

  1. Parse   — extract raw text from the uploaded file
  2. Chunk   — split text into overlapping segments
  3. Embed   — convert each chunk to a vector
  4. Store   — save document metadata + chunks to PostgreSQL

CONCEPT — Why chunk documents?
LLMs have a limited context window (e.g. 1 million+ tokens for Gemini 1.5).
A 200-page PDF might have 150,000 tokens — far too large to pass in one go.
Chunking splits the document into manageable pieces so we can:
  • Store each piece with its embedding
  • Retrieve only the RELEVANT pieces for a given query
  • Stay within the LLM's context limit
"""

from pathlib import Path
from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from langchain.text_splitter import RecursiveCharacterTextSplitter

from app.models.document import Document, DocumentChunk
from app.models.schemas import DocumentResponse
from app.services.document_parser import parse_document
from app.services.embedding_service import embed_texts
from app.core.config import get_settings

settings = get_settings()


async def ingest_document(file: UploadFile, db: AsyncSession) -> DocumentResponse:
    """
    Full ingestion pipeline for a single uploaded file.
    Returns a DocumentResponse once everything is stored in the DB.
    """

    # ── Step 1: Parse ─────────────────────────────────────────────────────────
    raw_text, file_ext = await parse_document(file)

    # ── Step 2: Chunk ─────────────────────────────────────────────────────────
    # RecursiveCharacterTextSplitter tries to split on paragraph breaks (\n\n),
    # then sentences (\n), then words — preserving natural language boundaries.
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    chunks: list[str] = splitter.split_text(raw_text)

    if not chunks:
        raise ValueError("Document produced no text chunks after splitting.")

    # ── Step 3: Embed ─────────────────────────────────────────────────────────
    # embed_texts sends all chunks to Google Gemini in one (batched) API call.
    # Each chunk becomes a list[float] of length 3072 (text-embedding-004).
    embeddings: list[list[float]] = await embed_texts(chunks)

    # ── Step 4: Store ─────────────────────────────────────────────────────────
    # Create the parent Document record
    doc = Document(
        filename=file.filename or "untitled",
        file_type=file_ext,
        file_size=file.size or 0,
        chunk_count=len(chunks),
    )
    db.add(doc)
    await db.flush()  # flush to get doc.id without committing yet

    # ── Step 4: Save Original File to Disk ────────────────────────────────────
    # Save the original binary file content to the local uploads/ folder.
    # This allows you to see the actual document in your filesystem.
    upload_path = Path(settings.upload_dir) / f"{doc.id}.{file_ext}"
    
    # Reset the file pointer to the beginning since parse_document might have read it
    await file.seek(0)
    file_content = await file.read()
    
    with open(upload_path, "wb") as f:
        f.write(file_content)
    print(f"✅ Local file saved: {upload_path}")

    # Create one DocumentChunk row per chunk
    chunk_objects = [
        DocumentChunk(
            document_id=doc.id,
            content=chunk_text,
            chunk_index=i,
            embedding=embedding,
        )
        for i, (chunk_text, embedding) in enumerate(zip(chunks, embeddings))
    ]
    db.add_all(chunk_objects)

    # The session commits at the end of the request (see database.py get_db)
    await db.flush()

    return DocumentResponse.model_validate(doc)
