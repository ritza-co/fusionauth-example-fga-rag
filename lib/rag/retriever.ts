import { permifyClient } from '@/lib/permify';
import { ollamaClient } from '@/lib/ollama';

type StoredDoc = {
  documentId: string;
  content: string;
  metadata: Record<string, any>;
  embedding: number[];
};

const memoryStore: StoredDoc[] = [];

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

export async function addDocument(
  documentId: string,
  content: string,
  ownerId: string,
  makePublic = false
) {
  const embedding = await ollamaClient.embed(content);

  memoryStore.push({
    documentId,
    content,
    metadata: { owner: ownerId },
    embedding,
  });

  await permifyClient.writeRelationships([
    {
      entity: { type: 'doc', id: documentId },
      relation: 'owner',
      subject: { type: 'user', id: ownerId },
    },
  ]);

  if (makePublic) {
    await permifyClient.writeRelationships([
      {
        entity: { type: 'doc', id: documentId },
        relation: 'viewer',
        subject: { type: 'user', id: '*' },
      },
    ]);
  }
}

export async function retrieveWithPermify(
  query: string,
  userId: string,
  topK = 5
) {
  const queryEmbedding = await ollamaClient.embed(query);

  const candidates = memoryStore
    .map((d) => ({
      doc: d,
      score: cosineSimilarity(queryEmbedding, d.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(10, topK));

  console.log('Candidates', candidates);

  const permitted: StoredDoc[] = [];

  for (const c of candidates) {
    try {
      const allowed = await permifyClient.checkPermission({
        entityType: 'doc',
        entityId: c.doc.documentId,
        permission: 'view',
        subjectType: 'user',
        subjectId: userId,
      });

      if (allowed) permitted.push(c.doc);
    } catch (err) {
      // skip on error
    }
  }

  return permitted.slice(0, topK);
}
