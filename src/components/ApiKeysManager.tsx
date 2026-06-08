'use client';

import { useState, useEffect } from 'react';

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  last_used_at: string | null;
  created_at: string;
}

interface NewKey extends ApiKey {
  key: string;
}

function fmtDate(s: string | null): string {
  if (!s) return '—';
  return new Date(s).toLocaleString();
}

export default function ApiKeysManager({
  origin,
  serverName,
}: {
  origin: string;
  serverName: string;
}) {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<NewKey | null>(null);
  const [copied, setCopied] = useState<'key' | 'config' | null>(null);

  const load = () => {
    return fetch('/api/api-keys')
      .then(r => r.json())
      .then(data => setKeys(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const snippet = (key: string) =>
    `"${serverName}": {\n  "type": "http",\n  "url": "${origin}/mcp",\n  "headers": { "x-api-key": "${key}" }\n}`;

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Укажи имя ключа');
      return;
    }
    setCreating(true);
    const res = await fetch('/api/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    });
    setCreating(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Не удалось создать ключ');
      return;
    }
    const data: NewKey = await res.json();
    setCreated(data);
    setName('');
    load();
  };

  const revoke = async (id: string) => {
    if (!confirm('Отозвать этот ключ? Подключения с ним перестанут работать.')) return;
    const res = await fetch(`/api/api-keys/${id}`, { method: 'DELETE' });
    if (res.ok) setKeys(prev => prev.filter(k => k.id !== id));
  };

  const copy = async (text: string, what: 'key' | 'config') => {
    await navigator.clipboard.writeText(text);
    setCopied(what);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">API-ключи (MCP)</h2>
      </div>

      <form onSubmit={create} className="flex gap-2 mb-5">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Название ключа (напр. «Claude Desktop»)"
          className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors"
        />
        <button
          type="submit"
          disabled={creating}
          className="px-4 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium text-sm hover:bg-gray-700 dark:hover:bg-gray-100 disabled:opacity-50 transition-all active:scale-[0.98] whitespace-nowrap"
        >
          {creating ? 'Создаём...' : 'Создать ключ'}
        </button>
      </form>

      {error && (
        <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950 px-3 py-2 rounded-lg mb-4">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">Загрузка...</p>
      ) : keys.length === 0 ? (
        <p className="text-sm text-gray-400">Ключей пока нет.</p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
          {keys.map(k => (
            <li key={k.id} className="flex items-center justify-between py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {k.name}
                </p>
                <p className="text-xs text-gray-400 font-mono">{k.key_prefix}…••••</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Создан {fmtDate(k.created_at)} · использован {fmtDate(k.last_used_at)}
                </p>
              </div>
              <button
                onClick={() => revoke(k.id)}
                className="text-xs font-medium text-red-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors whitespace-nowrap"
              >
                Отозвать
              </button>
            </li>
          ))}
        </ul>
      )}

      {created && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg p-6">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Ключ «{created.name}» создан
            </h3>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 mb-4">
              Скопируй ключ сейчас — он показывается только один раз и больше не будет доступен.
            </p>

            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Ключ
            </label>
            <div className="flex gap-2 mb-4">
              <code className="flex-1 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-xs font-mono break-all">
                {created.key}
              </code>
              <button
                onClick={() => copy(created.key, 'key')}
                className="px-3 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-medium whitespace-nowrap"
              >
                {copied === 'key' ? 'Скопировано' : 'Скопировать ключ'}
              </button>
            </div>

            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              MCP-конфиг
            </label>
            <pre className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-xs font-mono overflow-x-auto mb-2">
              {snippet(created.key)}
            </pre>
            <button
              onClick={() => copy(snippet(created.key), 'config')}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-xs font-medium mb-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {copied === 'config' ? 'Скопировано' : 'Скопировать конфиг'}
            </button>

            <button
              onClick={() => setCreated(null)}
              className="w-full py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium text-sm hover:bg-gray-700 dark:hover:bg-gray-100 transition-all"
            >
              Готово
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
