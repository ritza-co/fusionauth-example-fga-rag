export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  timestamp: string;
};

export type Conversation = {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
};

export const conversations: Conversation[] = [];
let nextConvId = 1;

export function getOrCreateConversation(
  userId: string,
  conversationId?: string,
  firstMessage?: string
): Conversation {
  if (conversationId) {
    const existing = conversations.find(
      (c) => c.id === conversationId && c.userId === userId
    );
    if (existing) return existing;
  }
  const conv: Conversation = {
    id: String(nextConvId++),
    userId,
    title: firstMessage ? firstMessage.slice(0, 60) : 'New conversation',
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  conversations.push(conv);
  return conv;
}
