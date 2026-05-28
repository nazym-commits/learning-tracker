'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { LearningItem, FilterType, SortOrder } from '@/types/learning';
import StatsPanel from './StatsPanel';
import FilterBar from './FilterBar';
import ItemCard from './ItemCard';
import AddItemModal from './AddItemModal';

const THEME_KEY = 'learning-tracker-theme';

export default function LearningTracker() {
  const { data: session } = useSession();

  const [items, setItems]       = useState<LearningItem[]>([]);
  const [mounted, setMounted]   = useState(false);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<FilterType>('all');
  const [sort, setSort]         = useState<SortOrder>('newest');
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch]     = useState('');
  const [dark, setDark]         = useState(false);

  // Theme
  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY);
    const isDark = saved === 'dark';
    setDark(isDark);
    document.documentElement.classList.toggle('dark', isDark);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
  };

  // Load items from API
  useEffect(() => {
    if (!session?.user?.id) return;
    setLoading(true);
    fetch('/api/items')
      .then(r => r.json())
      .then(data => {
        setItems(Array.isArray(data) ? data.map(normalizeItem) : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [session?.user?.id]);

  const addItem = async (data: Omit<LearningItem, 'id' | 'createdAt'>) => {
    const res  = await fetch('/api/items', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
    });
    const item = await res.json();
    setItems(prev => [normalizeItem(item), ...prev]);
  };

  const updateProgress = async (id: string, progress: number) => {
    // Optimistic update
    setItems(prev => prev.map(i => i.id === id ? { ...i, progress } : i));
    await fetch(`/api/items/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ progress }),
    });
  };

  const deleteItem = async (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    await fetch(`/api/items/${id}`, { method: 'DELETE' });
  };

  const filteredAndSorted = useMemo(() => {
    let result = filter !== 'all' ? items.filter(i => i.type === filter) : items;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        i => i.title.toLowerCase().includes(q) || i.author.toLowerCase().includes(q)
      );
    }
    return [...result].sort((a, b) => {
      if (sort === 'progress-desc') return b.progress - a.progress;
      if (sort === 'progress-asc')  return a.progress - b.progress;
      if (sort === 'oldest')        return a.createdAt - b.createdAt;
      return b.createdAt - a.createdAt;
    });
  }, [items, filter, sort, search]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 py-5 sm:px-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              Learning Tracker
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">
              {session?.user?.name
                ? `Привет, ${session.user.name} 👋`
                : 'Привет!'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Theme */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all"
              title={dark ? 'Светлая тема' : 'Тёмная тема'}
            >
              {dark ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Add */}
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium text-sm hover:bg-gray-700 dark:hover:bg-gray-100 active:scale-[0.97] transition-all shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Добавить</span>
            </button>

            {/* Sign out */}
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 transition-all"
              title="Выйти"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          {/* Sidebar */}
          <div className="lg:w-56 shrink-0">
            <StatsPanel items={items} />
          </div>

          {/* Main */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Search */}
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Поиск по названию или автору..."
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none focus:border-gray-400 transition-colors"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <FilterBar filter={filter} sort={sort} onFilterChange={setFilter} onSortChange={setSort} />

            {loading ? (
              <div className="flex justify-center py-16">
                <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
              </div>
            ) : filteredAndSorted.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="text-5xl mb-4">
                  {search ? '🔍' : items.length === 0 ? '📖' : '🗂️'}
                </div>
                <p className="text-gray-700 dark:text-gray-300 font-medium">
                  {search ? 'Ничего не найдено' : items.length === 0 ? 'Библиотека пуста' : 'Нет материалов в этой категории'}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {search ? 'Попробуй другой запрос' : 'Нажми «Добавить», чтобы начать'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredAndSorted.map(item => (
                  <ItemCard key={item.id} item={item} onUpdateProgress={updateProgress} onDelete={deleteItem} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && <AddItemModal onAdd={addItem} onClose={() => setShowModal(false)} />}
    </div>
  );
}

// Normalize item from API (createdAt comes as float from DB)
function normalizeItem(item: Record<string, unknown>): LearningItem {
  return {
    id:        item.id as string,
    title:     item.title as string,
    author:    (item.author as string) ?? '',
    type:      item.type as LearningItem['type'],
    progress:  Number(item.progress),
    createdAt: Math.round(Number(item.createdAt)),
  };
}

function declension(n: number, forms: [string, string, string]): string {
  const abs = Math.abs(n) % 100;
  const mod = abs % 10;
  if (abs > 10 && abs < 20) return forms[2];
  if (mod > 1 && mod < 5)   return forms[1];
  if (mod === 1)             return forms[0];
  return forms[2];
}

// Used in subtitle
void declension;
