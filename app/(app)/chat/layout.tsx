import { ChatProvider } from '@/components/chat-provider';
import { ChatSidebar } from '@/components/chat-sidebar';

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ChatProvider>
      <div className="flex flex-1">
        <ChatSidebar />
        <div className="flex flex-1 flex-col">{children}</div>
      </div>
    </ChatProvider>
  );
}
