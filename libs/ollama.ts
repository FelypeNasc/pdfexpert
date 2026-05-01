import { ChatOllama } from '@langchain/ollama';

export const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
export const SYSTEM_BASE_MODEL =
  process.env.OLLAMA_SYSTEM_MODEL || 'qwen3:4b';

export const ollama = new ChatOllama({
  baseUrl: OLLAMA_BASE_URL,
  model: process.env.OLLAMA_CHAT_MODEL || 'qwen3:0.6b',
});
