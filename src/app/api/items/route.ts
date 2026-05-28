import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  const sql = getDb();
  const items = await sql`
    SELECT id, title, author, type, progress,
           EXTRACT(EPOCH FROM created_at) * 1000 AS "createdAt"
    FROM learning_items
    WHERE user_id = ${session.user.id}
    ORDER BY created_at DESC
  `;

  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  const { title, author, type, progress } = await req.json();
  const sql = getDb();

  const rows = await sql`
    INSERT INTO learning_items (user_id, title, author, type, progress)
    VALUES (${session.user.id}, ${title}, ${author ?? ''}, ${type}, ${progress ?? 0})
    RETURNING id, title, author, type, progress,
              EXTRACT(EPOCH FROM created_at) * 1000 AS "createdAt"
  `;

  return NextResponse.json(rows[0], { status: 201 });
}
