import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { decodeJwt } from 'jose';
import crypto from 'crypto';
import { addDocument } from '@/lib/rag/retriever';
import { permifyClient } from '@/lib/permify';

const ORG_ID = 'acme';

// Permify entity IDs must match: ^([a-zA-Z0-9_\-@.:+]{1,128}|\*)$
const PERMIFY_ID_REGEX = /^[a-zA-Z0-9_\-@.:+]{1,128}$/;

function generateDocId(): string {
  return `doc-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

function sanitizeDocId(raw: string): string {
  // Replace any character not allowed by Permify with a dash, then truncate
  return raw.replace(/[^a-zA-Z0-9_\-@.:+]/g, '-').slice(0, 128);
}

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

  const { documentId: rawDocId, content, public: isPublic } = await req.json();
  if (!content) {
    return NextResponse.json(
      { error: 'content required' },
      { status: 400 }
    );
  }

  // Auto-generate an ID if none provided, otherwise sanitize the user-supplied one
  let documentId: string;
  if (rawDocId && typeof rawDocId === 'string' && rawDocId.trim()) {
    documentId = sanitizeDocId(rawDocId.trim());
  } else {
    documentId = generateDocId();
  }

  if (!PERMIFY_ID_REGEX.test(documentId)) {
    return NextResponse.json(
      { error: 'invalid documentId — only a-zA-Z0-9_-@.:+ allowed, max 128 chars' },
      { status: 400 }
    );
  }

  await addDocument(documentId, content, userId, !!isPublic);

  // Link document to the organization
  await permifyClient.writeRelationships([
    {
      entity: { type: 'doc', id: documentId },
      relation: 'org',
      subject: { type: 'organization', id: ORG_ID },
    },
  ]);

  return NextResponse.json({ ok: true, documentId });
}
