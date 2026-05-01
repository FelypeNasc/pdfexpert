import { getVectorStore } from '@/libs/chroma';
import { buildRawPrompt } from '@/libs/rag';
import { ollama } from '@/libs/ollama';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const { question, collectionName } = await req.json();

  if (!question || !collectionName) {
    return Response.json(
      { error: 'Question and collectionName are required' },
      { status: 400 }
    );
  }

  // Retrieve docs (fast, not streamable)
  const vectorStore = await getVectorStore(collectionName);
  const retriever = vectorStore.asRetriever({ k: 5 });
  const docs = await retriever.invoke(question);
  const context = docs.map((d) => d.pageContent).join('\n\n');
  const prompt = buildRawPrompt(context, question);

  // Stream LLM generation
  const llmStream = await ollama.stream(prompt);

  const encoder = new TextEncoder();
  const MAX_THINK_BUFFER = 10 * 1024; // 10KB safety limit

  const readable = new ReadableStream({
    async start(controller) {
      let buffer = '';
      let thinkStripped = false;

      for await (const chunk of llmStream) {
        const text = chunk.content as string;

        if (!thinkStripped) {
          buffer += text;
          const closeIdx = buffer.indexOf('</think>');

          if (closeIdx !== -1) {
            thinkStripped = true;
            const afterThink = buffer.slice(closeIdx + '</think>'.length).trimStart();
            if (afterThink) {
              controller.enqueue(encoder.encode(afterThink));
            }
          } else if (buffer.length > MAX_THINK_BUFFER) {
            // No <think> tag found after 10KB — flush buffer as-is
            thinkStripped = true;
            controller.enqueue(encoder.encode(buffer));
            buffer = '';
          }
          // If buffer starts with content (no opening <think>), flush immediately
          else if (!buffer.trimStart().startsWith('<think>') && buffer.length > 0 && !buffer.includes('<think>')) {
            thinkStripped = true;
            controller.enqueue(encoder.encode(buffer));
            buffer = '';
          }
        } else {
          controller.enqueue(encoder.encode(text));
        }
      }

      // Flush remaining buffer if think tag was never closed
      if (!thinkStripped && buffer) {
        const clean = buffer.replace(/<think>[\s\S]*$/, '').trim();
        if (clean) controller.enqueue(encoder.encode(clean));
      }

      controller.close();
    },
  });

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
