import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { ChatProvider } from '@/components/chat-provider';
import { ChatSidebar } from '@/components/chat-sidebar';
import { ChatNavigation } from '@/components/chat-navigation';

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect('/');

  return (
    <ChatProvider>
      <div className="flex h-screen">
        <ChatSidebar />
        <div className="flex flex-1 flex-col">
          <ChatNavigation />
          {children}
        </div>
      </div>
    </ChatProvider>
  );
}
