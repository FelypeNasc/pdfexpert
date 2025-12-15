'use client';

import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';

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
  const [uploading, setUploading] = useState(false); // <- novo estado

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

  const fetchCollections = async () => {
    const res = await fetch('/api/collections');
    const data = await res.json();
    setCollections(data.collections.map((c: Collection) => c.name));
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      setCollections((prev) => [...prev, data.collectionName]);
      setActiveCollection(data.collectionName);
      setMessages([]);

      const greeting: Message = {
        role: 'assistant',
        content: data.greeting,
      };

      setMessages([greeting]);
    } else {
      alert('Erro ao processar o PDF');
    }

    setUploading(false);
  };

  const handleSend = async () => {
    if (!input.trim() || !activeCollection) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    const res = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        question: input,
        collectionName: activeCollection,
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await res.json();

    const rawAnswer = data.answer.answer as string;
    const cleanAnswer = rawAnswer
      .replace(/<think>[\s\S]*?<\/think>/, '')
      .trim();

    const assistantMessage: Message = {
      role: 'assistant',
      content: cleanAnswer,
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setLoading(false);
  };

  return (
    <div className="flex h-screen relative">
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
            <button
              key={col}
              onClick={() => {
                setActiveCollection(col);
                setMessages([]);
              }}
              className={`w-full text-left px-2 py-1 rounded ${
                activeCollection === col ? 'bg-zinc-700' : 'hover:bg-zinc-800'
              }`}
            >
              {col}
            </button>
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
