import { ChromaClient } from 'chromadb';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { OllamaEmbeddings } from '@langchain/ollama';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

const embeddings = new OllamaEmbeddings({ model: 'nomic-embed-text' });

const CHROMA_URL = 'http://localhost:8000';

export async function createVectorStoreFromText(
  text: string,
  collectionName: string
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
  return collections;
}
