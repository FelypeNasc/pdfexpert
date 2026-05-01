import { ChatOllama } from '@langchain/ollama';

export const SYSTEM_BASE_MODEL = 'qwen3:4b';

export const ollama = new ChatOllama({
  baseUrl: 'http://localhost:11434',
  model: 'qwen3:0.6b',
});
