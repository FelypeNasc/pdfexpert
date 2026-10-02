# NotebookRAG

RAG-powered document chat app. Upload PDFs, Markdown files, Word documents, and plain text to chat with your documents using a local LLM — no cloud, no API keys, fully private.

Built with Next.js 15, Ollama, ChromaDB, and LangChain.

## Features

- **Multi-format upload & indexing** — PDF, TXT, MD, DOCX — extract text, chunk, and embed into ChromaDB
- **RAG chat** — ask questions answered by a local LLM using relevant document chunks
- **Streaming responses** — token-by-token output for real-time feel
- **Source citations** — see which chunks informed each answer
- **Source viewer** — click a citation to read the full chunk in a side panel
- **Chat persistence** — messages saved to localStorage across sessions
- **Chat export** — download conversations as Markdown
- **Collection management** — list, select, delete document collections
- **Collection metadata** — filename, page count, upload date shown in sidebar
- **Responsive design** — mobile-friendly sidebar with slide-in toggle
- **Optional auth** — password protection via environment variable

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Ollama](https://ollama.com/) running locally
- [ChromaDB](https://www.trychroma.com/) running locally

## Setup

```bash
# Clone the repo
git clone https://github.com/felype-nascimento/pdfexpert.git
cd pdfexpert

# Install dependencies
yarn install

# Copy env file and adjust if needed
cp .env.example .env

# Start Ollama + ChromaDB
docker compose up -d

# Pull models (first time only)
docker compose exec ollama ollama pull qwen3:0.6b
docker compose exec ollama ollama pull nomic-embed-text

# Start dev server
yarn dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Without Docker:** You can also run [Ollama](https://ollama.com/) and [ChromaDB](https://www.trychroma.com/) natively if preferred. Just ensure they're accessible at the URLs in `.env`.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama API URL |
| `OLLAMA_CHAT_MODEL` | `qwen3:0.6b` | LLM for chat responses |
| `OLLAMA_EMBEDDING_MODEL` | `nomic-embed-text` | Model for text embeddings |
| `OLLAMA_SYSTEM_MODEL` | `qwen3:4b` | Model for system tasks (collection naming) |
| `CHROMA_URL` | `http://localhost:8000` | ChromaDB server URL |
| `APP_PASSWORD` | _(empty)_ | Optional password to protect the app. Leave empty to disable auth. |

## Architecture

```
Upload: PDF/TXT/MD/DOCX -> extract text -> generate collection name (LLM)
             -> chunk & embed into ChromaDB
             -> generate greeting (RAG)

Chat:   question + collection -> retrieve top-5 chunks
             -> stuff into prompt -> stream LLM answer
             -> append source citations
```

### Project structure

```
app/
  page.tsx                # Main single-page UI
  api/
    upload/route.ts       # Document processing endpoint (PDF, TXT, MD, DOCX)
    chat/stream/route.ts  # Streaming RAG chat
    collections/          # List & delete collections
    auth/                 # Login/logout
  components/             # Toast, TypingSkeleton, SourcePanel
  login/page.tsx          # Login page
libs/
  pdf.ts                  # Multi-format text extraction (PDF, DOCX, TXT, MD)
  chroma.ts               # ChromaDB operations
  ollama.ts               # Ollama client config
  rag.ts                  # RAG chains and prompts
  chatStorage.ts          # localStorage persistence
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE) - Felype Nascimento
