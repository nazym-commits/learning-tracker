import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sql from '@/lib/db';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  const { id } = await params;
  const { progress } = await req.json();

  const rows = await sql`
    UPDATE learning_items
    SET progress = ${progress}
    WHERE id = ${id} AND user_id = ${session.user.id}
    RETURNING id, title, author, type, progress,
              EXTRACT(EPOCH FROM created_at) * 1000 AS "createdAt"
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Не найдено' }, { status: 404 });
  }
  return NextResponse.json(rows[0]);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  const { id } = await params;

  await sql`
    DELETE FROM learning_items
    WHERE id = ${id} AND user_id = ${session.user.id}
  `;

  return new NextResponse(null, { status: 204 });
}
