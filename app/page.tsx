'use client';

import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useRouter } from 'next/navigation';
import { useToast } from './components/Toast';
import { saveMessages, loadMessages, deleteMessages } from '@/libs/chatStorage';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type Collection = { name: string };

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [collections, setCollections] = useState<string[]>([]);
  const [activeCollection, setActiveCollection] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lastFailedQuestion, setLastFailedQuestion] = useState<string | null>(null);

  const { showToast, ToastContainer } = useToast();
  const router = useRouter();
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCollections();
  }, []);

  useEffect(() => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  useEffect(() => {
    if (!activeCollection || messages.length === 0) return;
    try {
      saveMessages(activeCollection, messages);
    } catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        showToast('Armazenamento local cheio. Histórico não salvo.', 'error');
      }
    }
  }, [messages, activeCollection]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCollections = async () => {
    try {
      const res = await fetch('/api/collections');
      const data = await res.json();
      setCollections(data.collections.map((c: Collection) => c.name));
    } catch {
      showToast('Erro ao carregar coleções. Verifique se o ChromaDB está rodando.', 'error');
    }
  };

  const handleDeleteCollection = async (col: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir "${col}"?`)) return;
    try {
      const res = await fetch(`/api/collections/${encodeURIComponent(col)}`, { method: 'DELETE' });
      if (res.ok) {
        deleteMessages(col);
        setCollections((prev) => prev.filter((c) => c !== col));
        if (activeCollection === col) {
          setActiveCollection(null);
          setMessages([]);
        }
        showToast(`Coleção "${col}" excluída.`, 'success');
      } else {
        showToast('Erro ao excluir coleção.', 'error');
      }
    } catch {
      showToast('Erro de conexão ao excluir coleção.', 'error');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setCollections((prev) => [...prev, data.collectionName]);
        setActiveCollection(data.collectionName);

        const greeting: Message = {
          role: 'assistant',
          content: data.greeting,
        };

        setMessages([greeting]);
      } else {
        showToast('Erro ao processar o PDF. Tente novamente.', 'error');
      }
    } catch {
      showToast('Erro de conexão. Verifique se o Ollama e o ChromaDB estão rodando.', 'error');
    }

    setUploading(false);
  };

  const sendQuestion = async (question: string) => {
    if (!activeCollection) return;

    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setLoading(true);
    setLastFailedQuestion(null);

    try {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        body: JSON.stringify({ question, collectionName: activeCollection }),
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }

      // Add empty assistant message to append tokens into
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);
      setLoading(false);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          updated[updated.length - 1] = { ...last, content: last.content + text };
          return updated;
        });
      }
    } catch {
      showToast('Erro ao obter resposta. Verifique se o Ollama está rodando.', 'error');
      setLastFailedQuestion(question);
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !activeCollection) return;
    const question = input;
    setInput('');
    await sendQuestion(question);
  };

  return (
    <div className="flex h-screen relative">
      <ToastContainer />
      {/* Loading Overlay */}
      {uploading && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-50 transition-opacity">
          <div className="flex space-x-2">
            <div className="w-4 h-4 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-4 h-4 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-4 h-4 bg-white rounded-full animate-bounce"></div>
          </div>
          <p className="text-white mt-4">
            Processando PDF, preparando seus grimórios...
          </p>
        </div>
      )}

      {/* Sidebar */}
      <div className="w-64 bg-zinc-900 text-white p-4 flex flex-col">
        <h2 className="text-lg font-bold mb-4">Conversas</h2>

        <div className="flex-1 overflow-y-auto space-y-2">
          {collections.map((col) => (
            <div key={col} className="flex items-center group">
              <button
                onClick={() => {
                  setActiveCollection(col);
                  setMessages(loadMessages(col));
                }}
                className={`flex-1 text-left px-2 py-1 rounded truncate ${
                  activeCollection === col ? 'bg-zinc-700' : 'hover:bg-zinc-800'
                }`}
              >
                {col}
              </button>
              <button
                onClick={() => handleDeleteCollection(col)}
                className="ml-1 p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-zinc-800 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Excluir coleção"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="mb-2"
          />
          <button
            onClick={handleUpload}
            className="bg-white text-zinc-900 px-3 py-1 rounded w-full font-medium hover:bg-zinc-200 disabled:opacity-50"
            disabled={uploading}
          >
            Enviar PDF
          </button>
        </div>

        <button
          onClick={async () => {
            await fetch('/api/auth', { method: 'DELETE' });
            router.push('/login');
          }}
          className="mt-3 text-xs text-zinc-500 hover:text-zinc-300 text-center w-full"
        >
          Sair
        </button>
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1">
        {/* Header */}
        <header className="p-4 bg-zinc-800 text-white flex items-center justify-between">
          <h1 className="text-xl font-bold">
            {activeCollection
              ? `Chat: ${activeCollection}`
              : 'Selecione uma conversa'}
          </h1>
        </header>

        {/* Chat */}
        <main
          className="flex-1 overflow-auto bg-zinc-950 p-4"
          ref={chatContainerRef}
        >
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`p-3 rounded-lg max-w-xl prose prose-invert ${
                    msg.role === 'user'
                      ? 'bg-zinc-500 text-white'
                      : 'bg-zinc-200 text-zinc-900'
                  }`}
                >
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="p-3 rounded-lg max-w-xs bg-zinc-400 text-zinc-900">
                  Digitando...
                </div>
              </div>
            )}
            {lastFailedQuestion && !loading && (
              <div className="flex justify-start">
                <button
                  onClick={() => sendQuestion(lastFailedQuestion)}
                  className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700"
                >
                  Tentar novamente
                </button>
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="p-4 bg-zinc-800 border-t flex">
          <input
            type="text"
            placeholder={
              activeCollection
                ? 'Digite sua pergunta...'
                : 'Selecione uma conversa para começar'
            }
            className="flex-1 border border-zinc-300 rounded-lg px-4 py-2 mr-2 focus:outline-none focus:ring-2 focus:ring-zinc-500"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={!activeCollection || loading}
          />
          <button
            onClick={handleSend}
            disabled={!activeCollection || loading}
            className={`px-4 py-2 rounded-lg ${
              activeCollection
                ? 'bg-zinc-600 text-white hover:bg-zinc-700'
                : 'bg-zinc-500 text-zinc-300 cursor-not-allowed'
            }`}
          >
            Enviar
          </button>
        </footer>
      </div>
    </div>
  );
}
