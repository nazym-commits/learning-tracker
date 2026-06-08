import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { listApiKeys, createApiKey } from '@/lib/api-keys';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }
  const keys = await listApiKeys(session.user.id);
  return NextResponse.json(keys);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  const { name } = await req.json().catch(() => ({ name: '' }));
  const trimmed = typeof name === 'string' ? name.trim() : '';
  if (!trimmed) {
    return NextResponse.json({ error: 'Укажи имя ключа' }, { status: 400 });
  }

  const { row, key } = await createApiKey(session.user.id, trimmed);
  // Full key returned ONLY in this response — never stored or shown again.
  return NextResponse.json({ ...row, key }, { status: 201 });
}
