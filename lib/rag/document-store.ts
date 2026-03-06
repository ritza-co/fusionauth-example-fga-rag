import { Pool } from 'pg';

export type StoredDocRecord = {
  documentId: string;
  content: string;
  ownerId: string;
  embedding: number[];
};

const DOCUMENTS_DATABASE_URL = process.env.DOCUMENTS_DATABASE_URL?.trim();

let pool: Pool | null = null;
let initPromise: Promise<void> | null = null;

function getPool(): Pool | null {
  if (!DOCUMENTS_DATABASE_URL) return null;
  if (!pool) {
    pool = new Pool({
      connectionString: DOCUMENTS_DATABASE_URL,
      ssl: DOCUMENTS_DATABASE_URL.includes('localhost')
        ? undefined
        : { rejectUnauthorized: false },
    });
  }
  return pool;
}

async function ensureInitialized() {
  const p = getPool();
  if (!p) return;
  if (!initPromise) {
    initPromise = p
      .query(`
        CREATE TABLE IF NOT EXISTS rag_documents (
          document_id TEXT PRIMARY KEY,
          content TEXT NOT NULL,
          owner_id TEXT NOT NULL,
          embedding JSONB NOT NULL DEFAULT '[]'::jsonb,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `)
      .then(() =>
        p.query(`
          CREATE INDEX IF NOT EXISTS rag_documents_owner_idx
          ON rag_documents (owner_id);
        `)
      )
      .then(() =>
        p.query(`
          CREATE INDEX IF NOT EXISTS rag_documents_updated_at_idx
          ON rag_documents (updated_at DESC);
        `)
      )
      .then(() => undefined);
  }

  await initPromise;
}

function normalizeEmbedding(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((n) => Number(n)).filter((n) => Number.isFinite(n));
}

function rowToDoc(row: {
  document_id: string;
  content: string;
  owner_id: string;
  embedding: unknown;
}): StoredDocRecord {
  return {
    documentId: row.document_id,
    content: row.content,
    ownerId: row.owner_id,
    embedding: normalizeEmbedding(row.embedding),
  };
}

export function isDocumentPersistenceEnabled() {
  return !!DOCUMENTS_DATABASE_URL;
}

export async function upsertDocument(doc: StoredDocRecord): Promise<void> {
  const p = getPool();
  if (!p) return;
  await ensureInitialized();
  await p.query(
    `
      INSERT INTO rag_documents (document_id, content, owner_id, embedding, updated_at)
      VALUES ($1, $2, $3, $4::jsonb, now())
      ON CONFLICT (document_id)
      DO UPDATE SET
        content = EXCLUDED.content,
        owner_id = EXCLUDED.owner_id,
        embedding = EXCLUDED.embedding,
        updated_at = now()
    `,
    [doc.documentId, doc.content, doc.ownerId, JSON.stringify(doc.embedding)]
  );
}

export async function listDocumentsFromStore(): Promise<StoredDocRecord[] | null> {
  const p = getPool();
  if (!p) return null;
  await ensureInitialized();
  const res = await p.query(
    `
      SELECT document_id, content, owner_id, embedding
      FROM rag_documents
      ORDER BY updated_at DESC
    `
  );
  return res.rows.map(rowToDoc);
}

export async function getDocumentFromStore(documentId: string): Promise<StoredDocRecord | null> {
  const p = getPool();
  if (!p) return null;
  await ensureInitialized();
  const res = await p.query(
    `
      SELECT document_id, content, owner_id, embedding
      FROM rag_documents
      WHERE document_id = $1
      LIMIT 1
    `,
    [documentId]
  );
  if (res.rows.length === 0) return null;
  return rowToDoc(res.rows[0]);
}
