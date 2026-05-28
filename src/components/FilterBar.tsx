'use client';

import { FilterType, SortOrder } from '@/types/learning';

interface FilterBarProps {
  filter: FilterType;
  sort: SortOrder;
  onFilterChange: (f: FilterType) => void;
  onSortChange: (s: SortOrder) => void;
}

const filters: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'course', label: 'Курсы' },
  { value: 'book', label: 'Книги' },
  { value: 'video', label: 'Видео' },
  { value: 'podcast', label: 'Подкасты' },
];

const sorts: { value: SortOrder; label: string }[] = [
  { value: 'newest', label: 'Сначала новые' },
  { value: 'oldest', label: 'Сначала старые' },
  { value: 'progress-desc', label: 'Прогресс ↓' },
  { value: 'progress-asc', label: 'Прогресс ↑' },
];

export default function FilterBar({ filter, sort, onFilterChange, onSortChange }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap gap-1">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => onFilterChange(f.value)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
              filter === f.value
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <select
        value={sort}
        onChange={(e) => onSortChange(e.target.value as SortOrder)}
        className="text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1 outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors cursor-pointer"
      >
        {sorts.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}
