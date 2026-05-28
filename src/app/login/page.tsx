'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError('Неверный email или пароль');
    } else {
      router.push('/');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Learning Tracker</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Войди в свой аккаунт</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Пароль
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors"
              />
            </div>

            {error && (
              <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium text-sm hover:bg-gray-700 dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              {loading ? 'Входим...' : 'Войти'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
          Нет аккаунта?{' '}
          <Link href="/register" className="font-medium text-gray-900 dark:text-white hover:underline">
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </div>
  );
}
