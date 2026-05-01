'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push('/');
    } else {
      setError('Senha incorreta.');
    }

    setLoading(false);
  };

  return (
    <div className="flex h-screen items-center justify-center bg-zinc-950">
      <form
        onSubmit={handleLogin}
        className="bg-zinc-900 p-8 rounded-xl shadow-lg w-full max-w-sm flex flex-col gap-4"
      >
        <h1 className="text-white text-2xl font-bold text-center">PDF Expert</h1>
        <p className="text-zinc-400 text-sm text-center">Digite a senha para continuar</p>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha"
          className="px-4 py-2 rounded-lg bg-zinc-800 text-white border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-500"
          autoFocus
        />

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <button
          type="submit"
          disabled={loading || !password}
          className="bg-white text-zinc-900 font-semibold py-2 rounded-lg hover:bg-zinc-200 disabled:opacity-50"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
