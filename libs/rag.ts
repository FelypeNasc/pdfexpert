import { ollama } from './ollama';
import { getVectorStore } from './chroma';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnablePassthrough, RunnableSequence } from '@langchain/core/runnables';
import type { Document } from '@langchain/core/documents';

export const RPG_SYSTEM_PROMPT = `Você é um especialista em jogos de RPG de mesa, atuando como um consultor e guia para Mestres e Jogadores.
Seu papel é responder perguntas com base nas regras, mecânicas, lore e sistemas do conteúdo abaixo, que foi extraído de livros, manuais, fichas ou suplementos de RPG.

Use exclusivamente as informações do contexto para fornecer respostas precisas, claras e úteis.
Se a pergunta não estiver relacionada ao conteúdo, ou se não houver informação suficiente, diga honestamente que não sabe.

Regras:
- Não faça perguntas sobre o conteúdo que não está no contexto.
- Explique as regras e mecânicas do sistema de RPG de forma clara e concisa.
- Forneça exemplos de como aplicar as regras em situações específicas.
- Não se estenda em detalhes que não estejam relacionados à pergunta.
- Se a pergunta não está relacionada ao conteúdo, ou se não há informação suficiente, diga honestamente que não sabe.

Contexto do sistema de RPG:
{context}

Pergunta:
{input}

Resposta detalhada e precisa:`;

export function buildRawPrompt(context: string, question: string): string {
  return RPG_SYSTEM_PROMPT
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

  const prompt = ChatPromptTemplate.fromTemplate(RPG_SYSTEM_PROMPT);

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
    console.error('Erro ao executar o askQuestion:', error);
    throw new Error('Erro ao buscar resposta');
  }
}

export async function generateCollectionName(fileName: string, text: string) {
  const prompt = `
Você é um gerador de nomes de coleções para documentos.

Seu trabalho é gerar um nome curto, descritivo e fácil de identificar para uma coleção de vetores, baseado no nome do arquivo e no início do conteúdo do documento.

Regras:
- O nome deve ser curto (máximo 5 palavras).
- Deve usar hífens ou sublinhados para separar palavras soltas.
- Deve usar 3 hífens para separar o título do subtítulo.
- Evite acentos, caracteres especiais ou espaços.
- Baseie-se no nome do arquivo e nas primeiras palavras do documento.
- A resposta deve ser apenas  o nome da coleção.
- Retorne apenas o nome, sem explicações, sem texto adicional.
- Se não souber, gere baseado apenas no nome do arquivo.


Exemplos:
- Arquivo: "a-tumba-de-rasputim.pdf"
  Conteúdo: "A tumba de Rasputim é uma campanha de RPG de DND 5ª edição..."
  ➝ "DND-5e---A-tumba-de-Rasputim"

- Arquivo: "a-mina-de-phandelver.pdf"
  Conteúdo: "Este manual descreve procedimentos de segurança..."
  ➝ "DND-5e---A-mina-de-Phandelver"

Agora gere um nome para:
- Arquivo: "${fileName}"
- Conteúdo: "${text.trim().split(/\s+/).slice(0, 50).join(' ')}"

Nome:
`;
  const rawAnswer = await ollama.invoke(prompt);
  const raw = sanitizeAnswer(rawAnswer.content as string, fileName);
  // Enforce ChromaDB naming: [a-zA-Z0-9._-], 3-512 chars, start/end alphanumeric
  const answer = raw
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^[^a-zA-Z0-9]+/, '')
    .replace(/[^a-zA-Z0-9]+$/, '')
    .slice(0, 512) || 'colecao';
  return answer.length >= 3 ? answer : answer.padEnd(3, '0');
}

const GREETING_PROMPT = `Você é um narrador de RPG, especializado no sistema representado no seguinte contexto.

Sua tarefa é criar uma **saudação breve, imersiva e temática**, como se desse as boas-vindas a um mestre ou jogador que acaba de abrir este livro ou manual.

**Regras para a saudação:**
- Seja amigável numa saudação breve.
- **Sempre termine perguntando como pode ajudar e dando 2 ou 3 sugestões do que o usuário pode perguntar.**
- Não use textos genéricos como "Sou uma IA". Fale como se fosse um especialista ou narrador do universo do sistema.
- Fale de forma informal, como se estivesse conversando com o usuário.

**Exemplos de sugestões:**
- "Quer que eu explique uma regra?"
- "Deseja detalhes sobre uma magia ou classe?"
- "Precisa de ajuda para criar um personagem?"
- "Quer entender como funciona um combate?"

Exemplos:
- Contexto: "Manual de jogador de D&D 5ª edição"
- Saudação: "Olá, jogador! Vejo que está começando a jogar D&D 5ª edição, estou aqui para te auxiliar no que precisar. Quer saber sobre o combate? Quer detalhes sobre a classe de guerreiro? Ou quer detalhes sobre um monstro específico? Manda aí!"

**Contexto:**
{context}

Saudação:
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

  const raw = await chain.invoke('gerar saudação');
  return sanitizeAnswer(raw);
}
