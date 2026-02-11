import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { decodeJwt } from 'jose';
import { addDocument } from '@/lib/rag/retriever';

export async function POST(req: NextRequest) {
  let userId: string | null = null;

  // Support x-user-id header for seed scripts
  const headerUserId = req.headers.get('x-user-id');
  if (headerUserId) {
    userId = headerUserId;
  } else {
    const session = await auth();
    if (session?.id_token) {
      const user = decodeJwt(session.id_token);
      userId = user.sub as string;
    }
  }

  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { documentId, content, public: isPublic } = await req.json();
  if (!documentId || !content) {
    return NextResponse.json(
      { error: 'documentId and content required' },
      { status: 400 }
    );
  }

  await addDocument(documentId, content, userId, !!isPublic);
  return NextResponse.json({ ok: true, documentId });
}
