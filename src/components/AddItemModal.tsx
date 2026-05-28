'use client';

import { useState } from 'react';
import { ItemType, LearningItem } from '@/types/learning';

interface AddItemModalProps {
  onAdd: (item: Omit<LearningItem, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}

const typeOptions: { value: ItemType; label: string; emoji: string }[] = [
  { value: 'course', label: 'Курс', emoji: '🎓' },
  { value: 'book', label: 'Книга', emoji: '📚' },
  { value: 'video', label: 'Видео', emoji: '🎬' },
  { value: 'podcast', label: 'Подкаст', emoji: '🎙️' },
];

export default function AddItemModal({ onAdd, onClose }: AddItemModalProps) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [type, setType] = useState<ItemType>('course');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Введите название');
      return;
    }
    onAdd({ title: title.trim(), author: author.trim(), type, progress });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-md animate-in slide-in-from-bottom-4 duration-300 border border-transparent dark:border-gray-700">
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Добавить материал</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Тип</label>
            <div className="grid grid-cols-4 gap-2">
              {typeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                    type === opt.value
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
                      : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  <span className="text-lg">{opt.emoji}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Название <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setError(''); }}
              placeholder="Например: JavaScript: Хороший код"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 ${
                error
                  ? 'border-red-300 dark:border-red-700 focus:border-red-400'
                  : 'border-gray-200 dark:border-gray-600 focus:border-gray-400 dark:focus:border-gray-500'
              }`}
              autoFocus
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Автор / Источник</label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Имя автора или канала"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 focus:border-gray-400 dark:focus:border-gray-500 text-sm outline-none transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Начальный прогресс</label>
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{progress}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium hover:bg-gray-700 dark:hover:bg-gray-100 active:scale-[0.98] transition-all duration-150"
          >
            Добавить
          </button>
        </form>
      </div>
    </div>
  );
}
