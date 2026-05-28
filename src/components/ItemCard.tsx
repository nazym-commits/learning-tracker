'use client';

import { useState } from 'react';
import { LearningItem } from '@/types/learning';

interface ItemCardProps {
  item: LearningItem;
  onUpdateProgress: (id: string, progress: number) => void;
  onDelete: (id: string) => void;
}

const typeConfig: Record<string, { label: string; emoji: string; lightColor: string; lightBg: string; darkColor: string; darkBg: string }> = {
  course: { label: 'Курс', emoji: '🎓', lightColor: 'text-blue-700', lightBg: 'bg-blue-50', darkColor: 'dark:text-blue-400', darkBg: 'dark:bg-blue-950' },
  book: { label: 'Книга', emoji: '📚', lightColor: 'text-amber-700', lightBg: 'bg-amber-50', darkColor: 'dark:text-amber-400', darkBg: 'dark:bg-amber-950' },
  video: { label: 'Видео', emoji: '🎬', lightColor: 'text-rose-700', lightBg: 'bg-rose-50', darkColor: 'dark:text-rose-400', darkBg: 'dark:bg-rose-950' },
  podcast: { label: 'Подкаст', emoji: '🎙️', lightColor: 'text-violet-700', lightBg: 'bg-violet-50', darkColor: 'dark:text-violet-400', darkBg: 'dark:bg-violet-950' },
};

export default function ItemCard({ item, onUpdateProgress, onDelete }: ItemCardProps) {
  const [editing, setEditing] = useState(false);
  const [tempProgress, setTempProgress] = useState(item.progress);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const config = typeConfig[item.type];
  const isComplete = item.progress === 100;

  const handleSave = () => {
    onUpdateProgress(item.id, tempProgress);
    setEditing(false);
  };

  const handleCancel = () => {
    setTempProgress(item.progress);
    setEditing(false);
  };

  const progressColor =
    item.progress === 100
      ? 'bg-emerald-500'
      : item.progress >= 50
      ? 'bg-blue-500'
      : item.progress > 0
      ? 'bg-amber-400'
      : 'bg-gray-200 dark:bg-gray-600';

  return (
    <div
      className={`group bg-white dark:bg-gray-800 rounded-xl border transition-all duration-200 p-3.5 hover:shadow-md dark:hover:shadow-gray-900/50 ${
        isComplete
          ? 'border-emerald-200 dark:border-emerald-800'
          : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${config.lightBg} ${config.lightColor} ${config.darkBg} ${config.darkColor}`}>
              {config.emoji} {config.label}
            </span>
            {isComplete && (
              <span className="text-xs font-medium px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                ✓ Готово
              </span>
            )}
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate text-sm">{item.title}</h3>
          {item.author && <p className="text-xs text-gray-500 dark:text-gray-400">{item.author}</p>}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Редактировать прогресс"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          )}
          {confirmDelete ? (
            <>
              <button
                onClick={() => onDelete(item.id)}
                className="text-xs px-2 py-1 rounded-lg bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900 transition-colors font-medium"
              >
                Удалить
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Отмена
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
              title="Удалить"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="mt-3">
        {editing ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Прогресс</span>
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{tempProgress}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={tempProgress}
              onChange={(e) => setTempProgress(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
            />
            <div className="flex gap-1.5">
              {[0, 25, 50, 75, 100].map((v) => (
                <button
                  key={v}
                  onClick={() => setTempProgress(v)}
                  className={`flex-1 text-xs py-0.5 rounded-md transition-colors ${
                    tempProgress === v
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {v}%
                </button>
              ))}
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={handleSave}
                className="flex-1 text-xs py-1.5 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors font-medium"
              >
                Сохранить
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 text-xs py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400 dark:text-gray-500">Прогресс</span>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{item.progress}%</span>
            </div>
            <div className="h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                style={{ width: `${item.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
