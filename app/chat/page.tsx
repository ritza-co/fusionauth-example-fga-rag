import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { ChatInterface } from '@/components/chat-interface';
import { decodeJwt } from 'jose';

export default async function ChatPage() {
  const session = await auth();
  if (!session?.id_token) redirect('/');

  const user = decodeJwt(session.id_token);
  const email = user.email as string;
  const name = (user.name ?? user.preferred_username ?? email) as string;

  return <ChatInterface userName={name} />;
}
