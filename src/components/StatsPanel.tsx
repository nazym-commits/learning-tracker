'use client';

import { LearningItem } from '@/types/learning';

interface StatsPanelProps {
  items: LearningItem[];
}

const typeLabels: Record<string, string> = {
  course: 'Курс',
  book: 'Книга',
  video: 'Видео',
  podcast: 'Подкаст',
};

export default function StatsPanel({ items }: StatsPanelProps) {
  const completed = items.filter((i) => i.progress === 100).length;
  const inProgress = items.filter((i) => i.progress > 0 && i.progress < 100).length;
  const notStarted = items.filter((i) => i.progress === 0).length;
  const avgProgress =
    items.length > 0
      ? Math.round(items.reduce((sum, i) => sum + i.progress, 0) / items.length)
      : 0;

  const byType = ['course', 'book', 'video', 'podcast'].map((type) => ({
    type,
    count: items.filter((i) => i.type === type).length,
  }));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4">
      <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
        Статистика
      </h2>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <StatCard label="Завершено" value={completed} lightColor="text-emerald-600" lightBg="bg-emerald-50" darkColor="dark:text-emerald-400" darkBg="dark:bg-emerald-950" />
        <StatCard label="В процессе" value={inProgress} lightColor="text-blue-600" lightBg="bg-blue-50" darkColor="dark:text-blue-400" darkBg="dark:bg-blue-950" />
        <StatCard label="Не начато" value={notStarted} lightColor="text-gray-500" lightBg="bg-gray-50" darkColor="dark:text-gray-400" darkBg="dark:bg-gray-700" />
        <StatCard label="Средний прогресс" value={`${avgProgress}%`} lightColor="text-violet-600" lightBg="bg-violet-50" darkColor="dark:text-violet-400" darkBg="dark:bg-violet-950" />
      </div>

      <div className="space-y-1.5">
        <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">По типам</p>
        {byType.map(({ type, count }) => (
          <div key={type} className="flex items-center justify-between text-xs">
            <span className="text-gray-600 dark:text-gray-400">{typeLabels[type]}</span>
            <span className="font-medium text-gray-800 dark:text-gray-200">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  lightColor,
  lightBg,
  darkColor,
  darkBg,
}: {
  label: string;
  value: string | number;
  lightColor: string;
  lightBg: string;
  darkColor: string;
  darkBg: string;
}) {
  return (
    <div className={`${lightBg} ${darkBg} rounded-xl p-2.5`}>
      <p className={`text-lg font-bold ${lightColor} ${darkColor}`}>{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}
