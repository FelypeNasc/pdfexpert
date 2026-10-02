import { ollama } from './ollama';
import { getVectorStore } from './chroma';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnablePassthrough, RunnableSequence } from '@langchain/core/runnables';
import type { Document } from '@langchain/core/documents';

export const SYSTEM_PROMPT = `You are a knowledgeable assistant that answers questions strictly based on the provided document content.

Rules:
- Answer only from the context below. If the answer is not in the context, say so honestly.
- Be concise and precise.
- Do not speculate beyond what the documents state.

Context:
{context}

Question:
{input}

Answer:`;

export function buildRawPrompt(context: string, question: string): string {
  return SYSTEM_PROMPT
    .replace('{context}', context)
    .replace('{input}', question);
}

function formatDocs(docs: Document[]): string {
  return docs.map((d) => d.pageContent).join('\n\n');
}

function sanitizeAnswer(rawAnswer: string, fileName?: string) {
  const cleanAnswer = rawAnswer
    .replace(/<think>[\s\S]*?<\/think>/, '')
    .trim();

  if (!cleanAnswer && fileName) {
    return fileName
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .toLowerCase();
  }
  return cleanAnswer;
}

export async function askQuestion(question: string, collectionName: string) {
  const vectorStore = await getVectorStore(collectionName);
  const retriever = vectorStore.asRetriever({ k: 5 });

  const prompt = ChatPromptTemplate.fromTemplate(SYSTEM_PROMPT);

  const chain = RunnableSequence.from([
    {
      context: retriever.pipe(formatDocs),
      input: new RunnablePassthrough(),
    },
    prompt,
    ollama,
    new StringOutputParser(),
  ]);

  try {
    const answer = await chain.invoke(question);
    return { answer };
  } catch (error) {
    console.error('Error in askQuestion:', error);
    throw new Error('Error fetching answer');
  }
}

export async function generateCollectionName(fileName: string, text: string) {
  const prompt = `
You are a collection name generator for documents.

Your job is to generate a short, descriptive, and easy-to-identify name for a vector collection, based on the file name and the beginning of the document content.

Rules:
- The name must be short (maximum 5 words).
- Use hyphens or underscores to separate words.
- Use 3 hyphens to separate a title from a subtitle.
- Avoid accents, special characters, or spaces.
- Base the name on the file name and the first words of the document.
- Return only the collection name, no explanations, no extra text.
- If unsure, generate based only on the file name.

Examples:
- File: "annual-report-2023.pdf"
  Content: "This report summarizes the financial results of Acme Corp for fiscal year 2023..."
  ➝ "Acme-Corp---Annual-Report-2023"

- File: "python-tutorial.md"
  Content: "This guide introduces Python programming for beginners..."
  ➝ "Python---Beginners-Tutorial"

Now generate a name for:
- File: "${fileName}"
- Content: "${text.trim().split(/\s+/).slice(0, 50).join(' ')}"

Name:
`;
  const rawAnswer = await ollama.invoke(prompt);
  const raw = sanitizeAnswer(rawAnswer.content as string, fileName);
  // Enforce ChromaDB naming: [a-zA-Z0-9._-], 3-512 chars, start/end alphanumeric
  const answer = raw
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^[^a-zA-Z0-9]+/, '')
    .replace(/[^a-zA-Z0-9]+$/, '')
    .slice(0, 512) || 'collection';
  return answer.length >= 3 ? answer : answer.padEnd(3, '0');
}

const GREETING_PROMPT = `You are a helpful document assistant. A user has just uploaded a document and you need to welcome them with a brief, friendly greeting.

Your task is to write a short welcome message based on the document content below.

Rules:
- Be friendly and brief (2-3 sentences max).
- Always end by suggesting 2-3 specific questions the user might ask about this document.
- Do not say "I am an AI". Speak as a knowledgeable assistant familiar with this document.
- Keep it conversational and informal.

Context:
{context}

Greeting:
`;

export async function generateGreeting(collectionName: string) {
  const vectorStore = await getVectorStore(collectionName);
  const retriever = vectorStore.asRetriever({ k: 3 });

  const prompt = ChatPromptTemplate.fromTemplate(GREETING_PROMPT);

  const chain = RunnableSequence.from([
    {
      context: retriever.pipe(formatDocs),
      input: new RunnablePassthrough(),
    },
    prompt,
    ollama,
    new StringOutputParser(),
  ]);

  const raw = await chain.invoke('generate greeting');
  return sanitizeAnswer(raw);
}
