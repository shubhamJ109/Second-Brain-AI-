"""
app/services/embedding_service.py
───────────────────────────────────
Generates vector embeddings using OpenAI's embedding API.

CONCEPT — What is an embedding?
An embedding is a list of ~1536 floating-point numbers that represent
the *semantic meaning* of a piece of text in a high-dimensional space.
Two texts that mean similar things will have vectors that are "close"
to each other — this is what makes semantic search possible.

Example:
  "How do I reset my password?" → [0.023, -0.14, 0.87, ...]  (1536 numbers)
  "Steps to change my login credentials" → [0.021, -0.13, 0.85, ...]  (very similar!)
  "Recipe for chocolate cake" → [0.91, 0.04, -0.32, ...]  (very different)
"""

from langchain_openai import OpenAIEmbeddings
from app.core.config import get_settings

settings = get_settings()

# Singleton — creating the client once avoids repeated auth overhead
_embeddings_client = OpenAIEmbeddings(
    model=settings.embedding_model,
    openai_api_key=settings.openai_api_key,
)


async def embed_texts(texts: list[str]) -> list[list[float]]:
    """
    Generate embeddings for a list of text strings.
    Returns a list of vectors (one per input text).

    LangChain's embed_documents handles batching automatically —
    OpenAI's API has a limit on tokens per request, so large lists
    are split into smaller batches under the hood.
    """
    # embed_documents is synchronous in LangChain; we run it directly.
    # For true async, wrap in asyncio.to_thread() if needed under load.
    return _embeddings_client.embed_documents(texts)


async def embed_query(text: str) -> list[float]:
    """
    Generate an embedding for a single query string.
    OpenAI uses a slightly different prompt internally for queries
    vs documents — embed_query applies that optimization automatically.
    """
    return _embeddings_client.embed_query(text)
