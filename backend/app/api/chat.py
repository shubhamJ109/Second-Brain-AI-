"""
app/api/chat.py
────────────────
Chat endpoint — the main RAG query interface.
  POST /chat  — send a question, receive an answer + citations
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.schemas import ChatRequest, ChatResponse
from app.services.rag_service import run_rag_pipeline

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    """
    Run the full RAG pipeline for a user query.

    Body:
      query        — the user's question (required)
      document_ids — optional list of document IDs to restrict search to.
                     If omitted, searches across ALL uploaded documents.

    Returns:
      answer  — LLM-generated response grounded in retrieved context
      sources — list of source chunks with similarity scores
    """
    return await run_rag_pipeline(request, db)
