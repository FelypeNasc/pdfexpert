# PDF Expert

A modern AI-powered PDF document assistant that uses Retrieval-Augmented Generation (RAG) to enable intelligent conversations with your PDF documents. Built with Next.js, LangChain, and Ollama.

## Features

- **PDF Processing**: Upload and automatically extract text from PDF files
- **Intelligent Indexing**: Vector embeddings using ChromaDB for semantic search
- **AI-Powered Chat**: Ask questions about your documents using local LLMs via Ollama
- **Multi-Document Support**: Organize and manage multiple document collections
- **Real-time Conversations**: Stream responses from your local AI model
- **Collection Management**: Automatically generates collection names and contextual greetings

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **AI/ML**: 
  - LangChain for RAG orchestration
  - Ollama for local LLM inference
  - ChromaDB for vector storage
  - PDF Parse for document extraction
- **Styling**: Tailwind CSS, React Markdown

## Getting Started

### Prerequisites

- Node.js 18+
- Ollama installed and running locally

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd pdfexpert
```

2. Install dependencies:
```bash
npm install
```

3. Ensure Ollama is running:
```bash
ollama serve
```

### Development

Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build & Production

Build for production:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

## Project Structure

```
app/
├── api/
│   ├── chat/         # Chat message handling
│   ├── collections/  # Collection management
│   └── upload/       # PDF upload and processing
├── layout.tsx        # Root layout
├── page.tsx          # Main chat interface
└── globals.css       # Global styles

libs/
├── chroma.ts         # Vector store operations
├── ollama.ts         # LLM integration
├── pdf.ts            # PDF text extraction
└── rag.ts            # RAG pipeline and prompts
```

## API Routes

### POST `/api/upload`
Upload a PDF file for processing.
- Extracts text from PDF
- Creates vector embeddings
- Generates collection name and greeting

### GET `/api/collections`
Retrieve all available document collections.

### POST `/api/chat`
Send a message and get a response based on the selected collection.

## How It Works

1. **PDF Upload**: Users select a PDF file through the web interface
2. **Text Extraction**: The PDF is parsed to extract text content
3. **Vector Indexing**: Text is split into chunks and embedded using Ollama
4. **Collection Storage**: Vectors are stored in ChromaDB with a generated collection name
5. **Smart Chat**: When users ask questions, the system retrieves relevant document chunks and uses the LLM to generate contextual answers

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT
