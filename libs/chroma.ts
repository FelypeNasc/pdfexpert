import { ChromaClient } from 'chromadb';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { OllamaEmbeddings } from '@langchain/ollama';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

const embeddings = new OllamaEmbeddings({
  model: process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text',
  baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
});

const CHROMA_URL = process.env.CHROMA_URL || 'http://localhost:8000';

export type CollectionMetadata = {
  filename?: string;
  pageCount?: number;
  uploadDate?: string;
};

export async function createVectorStoreFromText(
  text: string,
  collectionName: string,
  metadata?: CollectionMetadata
) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const docs = await splitter.createDocuments([text]);

  const store = await Chroma.fromDocuments(docs, embeddings, {
    collectionName,
    url: CHROMA_URL,
  });

  if (metadata) {
    const client = new ChromaClient({ path: CHROMA_URL });
    const collection = await client.getCollection({ name: collectionName });
    await collection.modify({ metadata: metadata as Record<string, string | number> });
  }

  return store;
}

export async function getVectorStore(collectionName: string) {
  const store = await Chroma.fromExistingCollection(embeddings, {
    collectionName,
    url: CHROMA_URL,
  });

  return store;
}

export async function deleteCollection(collectionName: string) {
  const client = new ChromaClient({ path: CHROMA_URL });
  await client.deleteCollection({ name: collectionName });
}

export async function listCollections() {
  const client = new ChromaClient({ path: CHROMA_URL });
  const collections = await client.listCollections();
  const enriched = await Promise.all(
    collections.map(async (col) => {
      const name = typeof col === 'string' ? col : col.name;
      try {
        const collection = await client.getCollection({ name });
        return { name, metadata: collection.metadata || {} };
      } catch {
        return { name, metadata: {} };
      }
    })
  );
  return enriched;
}
