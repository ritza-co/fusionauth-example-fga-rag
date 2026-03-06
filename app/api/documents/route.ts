import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { decodeJwt } from 'jose';
import { permifyClient } from '@/lib/permify';
import { listAllDocuments } from '@/lib/rag/retriever';

export async function GET() {
  const session = await auth();
  if (!session?.id_token) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const user = decodeJwt(session.id_token);
  const userId = user.sub as string;

  // Use lookupEntity to find all docs this user can view
  const permittedDocIds = await permifyClient.lookupEntity({
    entityType: 'doc',
    permission: 'view',
    subjectType: 'user',
    subjectId: userId,
  });

  const allDocs = await listAllDocuments();
  const permitted = allDocs.filter((d) =>
    permittedDocIds.includes(d.documentId)
  );

  return NextResponse.json({
    documents: permitted.map((d) => ({
      id: d.documentId,
      contentPreview: d.content,
      owner: d.metadata.owner,
    })),
  });
}
