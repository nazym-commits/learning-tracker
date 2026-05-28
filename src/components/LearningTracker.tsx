'use client';

import { useState, useEffect, useMemo } from 'react';
import { LearningItem, FilterType, SortOrder } from '@/types/learning';
import StatsPanel from './StatsPanel';
import FilterBar from './FilterBar';
import ItemCard from './ItemCard';
import AddItemModal from './AddItemModal';

const STORAGE_KEY = 'learning-tracker-items';
const THEME_KEY = 'learning-tracker-theme';

const SAMPLE_ITEMS: LearningItem[] = [
  { id: '1', title: 'Next.js 15 Complete Course', author: 'Vercel', type: 'course', progress: 65, createdAt: Date.now() - 86400000 * 5 },
  { id: '2', title: 'Clean Code', author: 'Robert C. Martin', type: 'book', progress: 100, createdAt: Date.now() - 86400000 * 10 },
  { id: '3', title: 'TypeScript Deep Dive', author: 'Basarat Ali', type: 'book', progress: 30, createdAt: Date.now() - 86400000 * 3 },
  { id: '4', title: 'React Hooks Explained', author: 'Fireship', type: 'video', progress: 0, createdAt: Date.now() - 86400000 },
  { id: '5', title: 'Syntax FM - CSS in 2025', author: 'Wes Bos & Scott', type: 'podcast', progress: 80, createdAt: Date.now() - 86400000 * 2 },
];

export default function LearningTracker() {
  const [items, setItems] = useState<LearningItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortOrder>('newest');
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { setItems(JSON.parse(stored)); } catch { setItems(SAMPLE_ITEMS); }
    } else {
      setItems(SAMPLE_ITEMS);
    }

    const savedTheme = localStorage.getItem(THEME_KEY);
    const isDark = savedTheme === 'dark';
    setDark(isDark);
    document.documentElement.classList.toggle('dark', isDark);

    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, mounted]);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
  };

  const addItem = (data: Omit<LearningItem, 'id' | 'createdAt'>) => {
    setItems((prev) => [{ ...data, id: crypto.randomUUID(), createdAt: Date.now() }, ...prev]);
  };

  const updateProgress = (id: string, progress: number) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, progress } : item)));
  };

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const filteredAndSorted = useMemo(() => {
    let result = filter !== 'all' ? items.filter((i) => i.type === filter) : items;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((i) => i.title.toLowerCase().includes(q) || i.author.toLowerCase().includes(q));
    }
    return [...result].sort((a, b) => {
      if (sort === 'progress-desc') return b.progress - a.progress;
      if (sort === 'progress-asc') return a.progress - b.progress;
      if (sort === 'oldest') return a.createdAt - b.createdAt;
      return b.createdAt - a.createdAt;
    });
  }, [items, filter, sort, search]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-800 dark:border-gray-700 dark:border-t-gray-200 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 py-5 sm:px-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              Learning Tracker
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">
              {items.length === 0
                ? 'Начни отслеживать своё обучение'
                : `${items.length} ${declension(items.length, ['материал', 'материала', 'материалов'])} в библиотеке`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200"
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
            {/* Add button */}
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium text-sm hover:bg-gray-700 dark:hover:bg-gray-100 active:scale-[0.97] transition-all duration-150 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Добавить</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          {/* Sidebar */}
          <div className="lg:w-56 shrink-0">
            <StatsPanel items={items} />
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Search */}
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск по названию или автору..."
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <FilterBar filter={filter} sort={sort} onFilterChange={setFilter} onSortChange={setSort} />

            {filteredAndSorted.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="text-5xl mb-4">
                  {search ? '🔍' : items.length === 0 ? '📖' : '🗂️'}
                </div>
                <p className="text-gray-700 dark:text-gray-300 font-medium">
                  {search ? 'Ничего не найдено' : items.length === 0 ? 'Библиотека пуста' : 'Нет материалов в этой категории'}
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  {search ? 'Попробуй другой запрос' : 'Нажми «Добавить», чтобы начать'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredAndSorted.map((item) => (
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

function declension(n: number, forms: [string, string, string]): string {
  const abs = Math.abs(n) % 100;
  const mod10 = abs % 10;
  if (abs > 10 && abs < 20) return forms[2];
  if (mod10 > 1 && mod10 < 5) return forms[1];
  if (mod10 === 1) return forms[0];
  return forms[2];
}
