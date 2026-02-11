import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { decodeJwt } from 'jose';
import { conversations } from '@/lib/conversations';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.id_token) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const user = decodeJwt(session.id_token);
  const userId = user.sub as string;
  const { id } = await params;

  const conv = conversations.find(
    (c) => c.id === id && c.userId === userId
  );
  if (!conv) {
    return NextResponse.json(
      { error: 'conversation not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, conversation: conv });
}
