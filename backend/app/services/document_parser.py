"""
app/services/document_parser.py
────────────────────────────────
Extracts plain text from uploaded files.

Supports:
  • PDF  — via Gemini Vision
  • Images (PNG, JPG, WEBP) — via Gemini Vision
  • DOCX — via python-docx
  • TXT  — plain read

Why a separate service?  Parsing logic is complex and format-specific.
Isolating it here means we can add new formats (e.g. PPTX, HTML) without
touching the ingestion or API code.
"""

import io
import os
import time
import tempfile
import asyncio
from fastapi import UploadFile, HTTPException
import google.generativeai as genai
import docx
from app.core.config import get_settings

# --- Multimodal Support (Gemini Vision) ---
# Supported directly by Gemini for vision-to-text
SUPPORTED_MULTIMODAL = {"pdf", "png", "jpg", "jpeg", "webp"}
SUPPORTED_TEXTUAL = {"docx", "txt"}
SUPPORTED_TYPES = SUPPORTED_MULTIMODAL | SUPPORTED_TEXTUAL

settings = get_settings()
genai.configure(api_key=settings.gemini_api_key)


def get_file_extension(filename: str) -> str:
    """Extract lowercase extension, e.g. 'report.PDF' → 'pdf'."""
    return filename.rsplit(".", 1)[-1].lower()


async def parse_document(file: UploadFile) -> tuple[str, str]:
    """
    Read an UploadFile and return (extracted_text, file_extension).
    Uses Gemini Vision for PDFs and Images for maximum semantic extraction.
    """
    ext = get_file_extension(file.filename or "")

    if ext not in SUPPORTED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '.{ext}'. Supported: {SUPPORTED_TYPES}",
        )

    # Read the raw bytes once
    raw_bytes = await file.read()

    # Routing
    if ext in SUPPORTED_MULTIMODAL:
        # Multimodal parsing (Vision)
        text = await _parse_multimodal(raw_bytes, ext)
    elif ext == "docx":
        text = _parse_docx(raw_bytes)
    else:
        text = _parse_txt(raw_bytes)

    if not text.strip():
        raise HTTPException(
            status_code=422,
            detail="Document appears to be empty or unreadable.",
        )

    return text, ext


async def _parse_multimodal(data: bytes, ext: str) -> str:
    """
    Uses the Google AI File API and Gemini Vision to 'read' the document.
    This handles images, scanned text, and complex layouts using AI.
    """
    # 1. Determine mime type
    mime_type = "application/pdf" if ext == "pdf" else f"image/{ext}"
    if ext == "jpg":
        mime_type = "image/jpeg"

    # 2. Run in thread because genai library is synchronous
    return await asyncio.to_thread(_multimodal_worker, data, mime_type)


def _multimodal_worker(data: bytes, mime_type: str) -> str:
    """Synchronous worker that talks to the Google AI File API."""
    # Use the specific LLM model version allowed for this API key
    model = genai.GenerativeModel(settings.llm_model)
    
    # Save bytes to a temp file for the Google AI SDK to upload
    with tempfile.NamedTemporaryFile(delete=False, suffix=".tmp") as tmp:
        tmp.write(data)
        tmp_path = tmp.name

    try:
        # 3. Upload to Google AI File API
        print(f"🔼 Uploading {mime_type} to Google AI (Vision Mode)...")
        uploaded_file = genai.upload_file(path=tmp_path, mime_type=mime_type)

        # 4. Wait for processing (Usually instant for images, seconds for multi-page PDFs)
        while uploaded_file.state.name == "PROCESSING":
            time.sleep(1)
            uploaded_file = genai.get_file(uploaded_file.name)

        if uploaded_file.state.name == "FAILED":
            raise Exception("Google AI File API failed to process the document.")

        # 5. Semantic Extraction Prompt
        prompt = (
            "Act as a professional document digitizer. Convert this file to clear, high-quality Markdown. "
            "IMPORTANT: If there are photos, charts, or maps, provide a detailed textual description of "
            "what they show so the content can be searched later. Maintain page dividers for PDFs."
        )

        print("🧠 Gemini Vision is reading the document...")
        response = model.generate_content([prompt, uploaded_file])
        
        # Cleanup file from Google's cloud after parsing
        genai.delete_file(uploaded_file.name)
        
        return response.text

    finally:
        # Cleanup local temp file
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


def _parse_docx(data: bytes) -> str:
    """Extract paragraph text from a Word document."""
    doc = docx.Document(io.BytesIO(data))
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    return "\n\n".join(paragraphs)


def _parse_txt(data: bytes) -> str:
    """Decode a plain-text file."""
    try:
        return data.decode("utf-8")
    except UnicodeDecodeError:
        return data.decode("latin-1")
