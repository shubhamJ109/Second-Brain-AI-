"""
app/services/document_parser.py
────────────────────────────────
Extracts plain text from uploaded files.

Supports:
  • PDF  — via pypdf
  • DOCX — via python-docx
  • TXT  — plain read

Why a separate service?  Parsing logic is complex and format-specific.
Isolating it here means we can add new formats (e.g. PPTX, HTML) without
touching the ingestion or API code.
"""

import io
from fastapi import UploadFile, HTTPException
import pypdf
import docx


SUPPORTED_TYPES = {"pdf", "docx", "txt"}


def get_file_extension(filename: str) -> str:
    """Extract lowercase extension, e.g. 'report.PDF' → 'pdf'."""
    return filename.rsplit(".", 1)[-1].lower()


async def parse_document(file: UploadFile) -> tuple[str, str]:
    """
    Read an UploadFile and return (extracted_text, file_extension).

    Raises HTTPException(400) for unsupported types.
    """
    ext = get_file_extension(file.filename or "")

    if ext not in SUPPORTED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '.{ext}'. Supported: {SUPPORTED_TYPES}",
        )

    # Read the raw bytes once — UploadFile is a stream, so we buffer it.
    raw_bytes = await file.read()

    if ext == "pdf":
        text = _parse_pdf(raw_bytes)
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


def _parse_pdf(data: bytes) -> str:
    """Extract all text from a PDF using pypdf."""
    reader = pypdf.PdfReader(io.BytesIO(data))
    pages = []
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            pages.append(page_text)
    return "\n\n".join(pages)


def _parse_docx(data: bytes) -> str:
    """Extract paragraph text from a Word document."""
    doc = docx.Document(io.BytesIO(data))
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    return "\n\n".join(paragraphs)


def _parse_txt(data: bytes) -> str:
    """Decode a plain-text file (tries UTF-8, falls back to latin-1)."""
    try:
        return data.decode("utf-8")
    except UnicodeDecodeError:
        return data.decode("latin-1")
