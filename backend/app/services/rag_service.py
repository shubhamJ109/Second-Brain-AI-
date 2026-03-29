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
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.schema import SystemMessage, HumanMessage

from app.models.document import Document, DocumentChunk
from app.models.schemas import ChatRequest, ChatResponse, CitationSource
from app.services.embedding_service import embed_query
from app.core.config import get_settings

settings = get_settings()

# Singleton LLM client
_llm = ChatGoogleGenerativeAI(
    model=settings.llm_model,
    google_api_key=settings.gemini_api_key,
    temperature=0.2,  # lower = more factual, less creative
)

# ── System prompt ─────────────────────────────────────────────────────────────
# This tells the LLM how to behave. A good system prompt is crucial for
# keeping answers grounded in the retrieved context.
SYSTEM_PROMPT = """You are a highly sophisticated Research Assistant inspired by systems like NotebookLM. \
Your goal is to provide deep, contextual insights based on the provided documents.

Rules:
1. **Synthesize & Structure**: Do not just repeat facts. Synthesize information across all provided sources. Use a clear Markdown hierarchy with headers (###), bolding, and bullet points.
2. **Context-Only**: Your knowledge is strictly limited to the provided document context. If the answer isn't there, say you don't know based on the current context.
3. **Citations**: Be specific and professional. Mention the sources implicitly in your narrative when possible.
4. **Follow-up Interaction**: At the very end of your response, you MUST provide exactly 3 suggested follow-up questions that would help the user explore the topic deeper.

Your response MUST follow this exact format:
[ANSWER]
(Your detailed, structured markdown response here...)

[QUESTIONS]
- (Question 1)
- (Question 2)
- (Question 3)
"""


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
    raw_content = response.content

    # ── Step 5: Parse Answer & Questions ──────────────────────────────────────
    answer_text = raw_content
    suggested_questions = []

    if "[QUESTIONS]" in raw_content:
        parts = raw_content.split("[QUESTIONS]")
        # Take everything before the [QUESTIONS] tag as the answer
        answer_text = parts[0].replace("[ANSWER]", "").strip()
        
        # Extract questions from the second part
        questions_block = parts[1].strip()
        suggested_questions = [
            q.strip("- ").strip() 
            for q in questions_block.split("\n") 
            if q.strip().startswith("-") or q.strip().startswith("1.") or q.strip().startswith("2.") or q.strip().startswith("3.")
        ][:3]
    else:
        # Fallback if the tag is missing but formatting is present
        answer_text = raw_content.replace("[ANSWER]", "").strip()

    # ── Step 6: Build citation objects ────────────────────────────────────────
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
        suggested_questions=suggested_questions,
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
