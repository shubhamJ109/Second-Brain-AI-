"""
app/services/rag_service.py
────────────────────────────
The RAG (Retrieval Augmented Generation) pipeline:

  1. Embed the user's query
  2. Similarity search — find the most relevant chunks in the vector DB
  3. Build a prompt with retrieved context
  4. Call the LLM and stream/return the answer

CONCEPT — What is RAG?
Without RAG, an LLM can only answer from its training data.
With RAG:
  • We store YOUR documents as embeddings in a vector database
  • When you ask a question, we find the most relevant text chunks
  • We inject those chunks into the LLM's prompt as "context"
  • The LLM answers based on YOUR documents, not just training data
  • We return source citations so you can verify the answer
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from langchain_openai import ChatOpenAI
from langchain.schema import SystemMessage, HumanMessage

from app.models.document import Document, DocumentChunk
from app.models.schemas import ChatRequest, ChatResponse, CitationSource
from app.services.embedding_service import embed_query
from app.core.config import get_settings

settings = get_settings()

# Singleton LLM client
_llm = ChatOpenAI(
    model=settings.llm_model,
    openai_api_key=settings.openai_api_key,
    temperature=0.2,  # lower = more factual, less creative
    streaming=False,
)

# ── System prompt ─────────────────────────────────────────────────────────────
# This tells the LLM how to behave. A good system prompt is crucial for
# keeping answers grounded in the retrieved context.
SYSTEM_PROMPT = """You are a helpful AI assistant that answers questions based \
on the provided document context.

Rules:
1. ONLY answer based on the provided context. Do not use prior knowledge.
2. If the context does not contain enough information to answer, say so clearly.
3. Be concise and precise. Quote the source when useful.
4. If multiple documents are relevant, synthesize their information.
5. Always maintain a helpful, professional tone."""


async def run_rag_pipeline(request: ChatRequest, db: AsyncSession) -> ChatResponse:
    """
    Full RAG pipeline: embed query → retrieve → prompt → answer.
    """

    # ── Step 1: Embed the user query ──────────────────────────────────────────
    query_vector = await embed_query(request.query)

    # ── Step 2: Vector similarity search ─────────────────────────────────────
    # pgvector's <=> operator computes cosine distance (lower = more similar).
    # We convert to similarity score: similarity = 1 - cosine_distance.
    #
    # We join with documents so we can include the filename in citations.
    relevant_chunks = await _similarity_search(
        db=db,
        query_vector=query_vector,
        top_k=settings.retrieval_top_k,
        document_ids=request.document_ids,  # None = search all docs
    )

    if not relevant_chunks:
        return ChatResponse(
            answer="I couldn't find relevant information in the uploaded documents.",
            sources=[],
            query=request.query,
        )

    # ── Step 3: Build prompt ──────────────────────────────────────────────────
    context_text = _format_context(relevant_chunks)

    user_message = f"""Context from documents:
{context_text}

Question: {request.query}

Please answer the question based on the context above."""

    # ── Step 4: LLM call ──────────────────────────────────────────────────────
    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=user_message),
    ]
    response = await _llm.ainvoke(messages)
    answer_text = response.content

    # ── Step 5: Build citation objects ────────────────────────────────────────
    sources = [
        CitationSource(
            document_id=chunk["document_id"],
            document_name=chunk["filename"],
            chunk_index=chunk["chunk_index"],
            content=chunk["content"],
            similarity=chunk["similarity"],
        )
        for chunk in relevant_chunks
    ]

    return ChatResponse(
        answer=answer_text,
        sources=sources,
        query=request.query,
    )


async def _similarity_search(
    db: AsyncSession,
    query_vector: list[float],
    top_k: int,
    document_ids: list[str] | None,
) -> list[dict]:
    """
    Run a pgvector cosine similarity search.

    The raw SQL uses pgvector's <=> (cosine distance) operator.
    We use SQLAlchemy's text() for this because pgvector operators
    aren't yet in SQLAlchemy's expression API.
    """
    # Build an optional WHERE clause to filter by specific document IDs
    doc_filter = ""
    params: dict = {
        "query_vector": str(query_vector),
        "top_k": top_k,
    }

    if document_ids:
        # Create parameterized placeholders like :id0, :id1, ...
        placeholders = ", ".join(f":id{i}" for i in range(len(document_ids)))
        doc_filter = f"AND dc.document_id IN ({placeholders})"
        for i, doc_id in enumerate(document_ids):
            params[f"id{i}"] = doc_id

    sql = text(f"""
        SELECT
            dc.id,
            dc.document_id,
            dc.content,
            dc.chunk_index,
            d.filename,
            1 - (dc.embedding <=> CAST(:query_vector AS vector)) AS similarity
        FROM document_chunks dc
        JOIN documents d ON d.id = dc.document_id
        WHERE dc.embedding IS NOT NULL
        {doc_filter}
        ORDER BY dc.embedding <=> CAST(:query_vector AS vector)
        LIMIT :top_k
    """)

    result = await db.execute(sql, params)
    rows = result.mappings().all()

    return [dict(row) for row in rows]


def _format_context(chunks: list[dict]) -> str:
    """
    Format retrieved chunks into a readable context block for the prompt.
    """
    parts = []
    for i, chunk in enumerate(chunks, 1):
        parts.append(
            f"[Source {i}: {chunk['filename']}, chunk {chunk['chunk_index']}]\n"
            f"{chunk['content']}"
        )
    return "\n\n---\n\n".join(parts)
