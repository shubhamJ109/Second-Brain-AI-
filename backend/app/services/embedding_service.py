"""
app/services/embedding_service.py
───────────────────────────────────
Generates vector embeddings using Google's Gemini embedding API.

CONCEPT — What is an embedding?
An embedding is a list of floating-point numbers that represent
the *semantic meaning* of a piece of text in a high-dimensional space.
Two texts that mean similar things will have vectors that are "close"
to each other — this is what makes semantic search possible.

Example:
  "How do I reset my password?" → [0.023, -0.14, 0.87, ...]
  "Steps to change my login credentials" → [0.021, -0.13, 0.85, ...]  (very similar!)
  "Recipe for chocolate cake" → [0.91, 0.04, -0.32, ...]  (very different)
"""

import asyncio
import google.generativeai as genai
from tenacity import retry, stop_after_attempt, wait_exponential
from app.core.config import get_settings

settings = get_settings()

# Configure the native Google SDK
genai.configure(api_key=settings.gemini_api_key)


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
)
def _embed_batch_with_retry(batch: list[str]) -> list[list[float]]:
    """
    Call the native Google Gemini embedding API with a massive 10-minute timeout.
    This guarantees that slow network connections won't drop the request.
    """
    # Use the native embed_content instead of a wrapper
    result = genai.embed_content(
        model=settings.embedding_model,
        content=batch,
        task_type="retrieval_document",
        request_options={"timeout": 600}  # 10 minutes timeout per request
    )
    
    # Extract the vector(s). genai returns a single list for one string,
    # or a list of lists for multiple strings.
    embeddings = result["embedding"]
    if isinstance(embeddings[0], (int, float)):
        return [embeddings]
    return embeddings


async def embed_texts(texts: list[str]) -> list[list[float]]:
    """
    Generate embeddings for a list of text strings.
    Native implementation: individual chunks, 10-min timeout, and retries.
    """
    all_embeddings = []
    batch_size = settings.embedding_batch_size
    
    total_batches = (len(texts) + batch_size - 1) // batch_size
    
    # Process chunks individually (batch_size=1) for maximum stability
    for i in range(0, len(texts), batch_size):
        batch = texts[i : i + batch_size]
        current_batch_num = i // batch_size + 1
        print(f"📊 Processing chunk {current_batch_num}/{total_batches} (Timeout: 600s)...")
        
        # Call the native API in a thread pool
        batch_embeddings = await asyncio.to_thread(_embed_batch_with_retry, batch)
        all_embeddings.extend(batch_embeddings)
        
        # Tiny breather between chunks
        await asyncio.sleep(0.05)
        
    return all_embeddings


async def embed_query(text: str) -> list[float]:
    """Generate a single embedding for a user chat query."""
    result = await embed_texts([text])
    return result[0]
