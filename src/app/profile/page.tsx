import Link from 'next/link';
import { headers } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import ApiKeysManager from '@/components/ApiKeysManager';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  const h = await headers();
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const host = h.get('host') ?? 'localhost:3000';
  const origin = `${proto}://${host}`;

  const user = session?.user;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-10">
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <div>
          <Link
            href="/"
            className="text-sm text-gray-500 dark:text-gray-400 hover:underline"
          >
            ← Назад
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">Профиль</h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Аккаунт</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Имя</dt>
              <dd className="text-gray-900 dark:text-gray-100">{user?.name || '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Email</dt>
              <dd className="text-gray-900 dark:text-gray-100">{user?.email || '—'}</dd>
            </div>
          </dl>
        </div>

        <ApiKeysManager origin={origin} serverName="learning-tracker" />
      </div>
    </div>
  );
}
