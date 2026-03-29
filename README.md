# 🧠 Second Brain AI — Chat With Your Documents

A production-grade RAG (Retrieval Augmented Generation) application built with:
- **Next.js 14** (App Router, TypeScript, TailwindCSS) — Frontend
- **FastAPI + Python** — Backend
- **LangChain + Google Gemini** — AI layer
- **PostgreSQL + pgvector** — Vector database

---

## 📁 Project Structure

```
second-brain-ai/
├── docker-compose.yml            ← runs everything with one command
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── .env.example              ← copy to .env and fill in values
│   └── app/
│       ├── main.py               ← FastAPI app entry point
│       ├── core/
│       │   ├── config.py         ← settings loaded from .env
│       │   └── database.py       ← async SQLAlchemy engine
│       ├── models/
│       │   ├── document.py       ← ORM: documents + document_chunks tables
│       │   └── schemas.py        ← Pydantic request/response shapes
│       ├── services/
│       │   ├── document_parser.py   ← PDF/DOCX/TXT → raw text
│       │   ├── embedding_service.py ← text → Gemini embeddings
│       │   ├── ingestion_service.py ← full upload pipeline
│       │   └── rag_service.py       ← full RAG query pipeline
│       └── api/
│           ├── documents.py      ← POST /upload, GET /documents, DELETE /{id}
│           └── chat.py           ← POST /chat
│
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── .env.local.example        ← copy to .env.local
    └── src/
        ├── app/
        │   ├── layout.tsx
        │   ├── page.tsx          ← main page (sidebar + chat)
        │   └── globals.css
        ├── components/
        │   ├── documents/
        │   │   ├── DocumentUpload.tsx   ← drag-and-drop uploader
        │   │   └── DocumentList.tsx     ← selectable document list
        │   └── chat/
        │       ├── ChatWindow.tsx       ← scrollable message list
        │       ├── ChatMessage.tsx      ← single message + citations
        │       └── ChatInput.tsx        ← message input bar
        ├── hooks/
        │   ├── useChat.ts         ← chat state management
        │   └── useDocuments.ts    ← document CRUD state
        ├── lib/
        │   └── api.ts             ← typed fetch client for all endpoints
        └── types/
            └── index.ts           ← TypeScript types mirroring backend schemas
```

---

## 🧠 Architecture: How RAG Works

```
User asks: "What are the main conclusions of my report?"
              │
              ▼
   1. EMBED QUERY
      Google Gemini converts the question → vector [0.02, -0.14, ...]

              │
              ▼
   2. SIMILARITY SEARCH (pgvector)
      Find the 5 most semantically similar chunks from your documents
      using cosine distance (<=> operator)

              │
              ▼
   3. BUILD PROMPT
      Inject the retrieved chunks as context into the LLM prompt:
      "Here are relevant excerpts: [chunk1] [chunk2] ...
       Now answer: What are the main conclusions?"

              │
              ▼
   4. LLM CALL (Gemini 1.5 Flash)
      Generate an answer GROUNDED IN YOUR DOCUMENTS

              │
              ▼
   5. RETURN ANSWER + CITATIONS
      Show the user which document chunks supported the answer
```

---

## 🚀 Quick Start (Docker — Recommended)

### Prerequisites
- Docker Desktop installed
- Google Gemini API key

### Steps

```bash
# 1. Clone and enter the project
git clone <your-repo>
cd second-brain-ai

# 2. Set your Gemini key as an environment variable
export GEMINI_API_KEY=AIza...

# 3. Start everything
docker compose up --build

# App is now running:
#   Frontend → http://localhost:3000
#   Backend  → http://localhost:8000
#   API docs → http://localhost:8000/docs
```

---

## 🛠 Local Development (No Docker)

### Step 1 — PostgreSQL with pgvector

Option A: Docker (easiest)
```bash
docker run -d \
  --name pgvector \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=secondbrain \
  -p 5432:5432 \
  pgvector/pgvector:pg16
```

Option B: Install locally
```bash
# macOS
brew install postgresql@16
# Then install pgvector extension — see https://github.com/pgvector/pgvector
```

### Step 2 — Backend

```bash
cd backend

# Create a Python virtual environment (isolates dependencies)
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

# Install all Python dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Start the backend server
uvicorn app.main:app --reload --port 8000
```

The backend will:
- Connect to PostgreSQL on startup
- Auto-create the `documents` and `document_chunks` tables
- Be available at http://localhost:8000
- Show interactive API docs at http://localhost:8000/docs ← try it here!

### Step 3 — Frontend

```bash
cd frontend

# Install Node dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Default: NEXT_PUBLIC_API_URL=http://localhost:8000/api (no changes needed for local dev)

# Start Next.js dev server
npm run dev
```

App is now at http://localhost:3000

---

## 📡 API Reference

### Upload a document
```
POST /api/documents/upload
Content-Type: multipart/form-data
Body: file=<PDF|DOCX|TXT>

Response:
{
  "message": "Document 'report.pdf' ingested successfully (42 chunks created).",
  "document": { "id": "...", "filename": "report.pdf", ... }
}
```

### List documents
```
GET /api/documents

Response:
{
  "documents": [ { "id": "...", "filename": "...", "chunk_count": 42, ... } ],
  "total": 1
}
```

### Chat / Query
```
POST /api/chat
Content-Type: application/json
Body:
{
  "query": "What are the key findings?",
  "document_ids": ["abc123"]    // optional — omit to search ALL docs
}

Response:
{
  "answer": "The key findings are...",
  "sources": [
    {
      "document_name": "report.pdf",
      "content": "...relevant chunk text...",
      "similarity": 0.87,
      "chunk_index": 12
    }
  ],
  "query": "What are the key findings?"
}
```

### Delete a document
```
DELETE /api/documents/{id}
```

---

## ⚙️ Configuration

### Backend `.env`
| Variable | Description | Default |
|---|---|---|
| `GEMINI_API_KEY` | Your Google Gemini API key | required |
| `DATABASE_URL` | PostgreSQL connection string | required |
| `CHUNK_SIZE` | Characters per text chunk | 1000 |
| `CHUNK_OVERLAP` | Overlap between chunks | 200 |
| `RETRIEVAL_TOP_K` | Chunks retrieved per query | 5 |
| `EMBEDDING_MODEL` | Gemini embedding model | models/text-embedding-004 |
| `LLM_MODEL` | Gemini chat model | gemini-1.5-flash |

### Frontend `.env.local`
| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL |

---

## 🔧 Tuning the RAG Pipeline

**Getting irrelevant answers?**
- Decrease `CHUNK_SIZE` (smaller, more precise chunks)
- Increase `RETRIEVAL_TOP_K` (retrieve more candidates)

**Answers cut off mid-sentence?**
- Increase `CHUNK_OVERLAP` to prevent context splitting at boundaries

**Too slow?**
- Use `gemini-1.5-flash` (already default — fast and cheap)
- Decrease `RETRIEVAL_TOP_K`

**Want better quality?**
- Switch `LLM_MODEL` to `gemini-1.5-pro` for complex reasoning

---

## 🗺 What to Build Next

1. **Chat history** — Store conversations in a `chat_sessions` table
2. **Streaming** — Use FastAPI's `StreamingResponse` + `useEffect` EventSource in the frontend  
3. **Auth** — Add NextAuth.js (frontend) + JWT middleware (backend)
4. **Multi-modal** — Add image extraction from PDFs using `pdfplumber`
5. **Re-ranking** — Add a cross-encoder re-ranker after retrieval for better results
6. **Hybrid search** — Combine vector search with keyword (BM25) search

---

## 💡 Key Concepts Glossary

| Term | What it means |
|---|---|
| **RAG** | Retrieval Augmented Generation — grounding LLM answers in your own documents |
| **Embedding** | A list of numbers representing the semantic meaning of text |
| **Vector DB** | Database optimized for storing and searching embeddings by similarity |
| **pgvector** | PostgreSQL extension that adds vector storage + cosine similarity search |
| **Chunking** | Splitting long documents into smaller pieces for precise retrieval |
| **Cosine similarity** | How "close" two vectors are in meaning (1 = identical, 0 = unrelated) |
| **Context window** | Maximum tokens an LLM can process in one call |
| **Top-K retrieval** | Returning the K most similar chunks to a query |
