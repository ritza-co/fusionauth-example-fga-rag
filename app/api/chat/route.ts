import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { decodeJwt } from 'jose';
import { retrieveWithPermify } from '@/lib/rag/retriever';
import { ollamaClient } from '@/lib/ollama';
import { getOrCreateConversation } from '@/lib/conversations';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.id_token) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const user = decodeJwt(session.id_token);
  const userId = user.sub as string;

  const { query, conversationId } = await req.json();
  if (!query) {
    return NextResponse.json({ error: 'query required' }, { status: 400 });
  }

  const conv = getOrCreateConversation(userId, conversationId, query);
  conv.messages.push({
    role: 'user',
    content: query,
    timestamp: new Date().toISOString(),
  });

  const docs = await retrieveWithPermify(query, userId);
  const sources = docs.map((d) => d.documentId);

  let answer: string;
  if (docs.length === 0) {
    answer =
      "I don't have any relevant documents to answer your question.";
  } else {
    const context = docs
      .map((d) => `[${d.documentId}]: ${d.content}`)
      .join('\n\n');
    const prompt = `Use the following documents to answer the question. If the documents don't contain the answer, say so.\n\nDocuments:\n${context}\n\nQuestion: ${query}\n\nAnswer:`;
    answer = await ollamaClient.chat(prompt);
  }

  conv.messages.push({
    role: 'assistant',
    content: answer,
    sources,
    timestamp: new Date().toISOString(),
  });
  conv.updatedAt = new Date().toISOString();

  return NextResponse.json({
    ok: true,
    answer,
    sources,
    conversationId: conv.id,
  });
}
