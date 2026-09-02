import { useCallback, useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Clock, PanelRightOpen, PanelRightClose } from 'lucide-react';
import { api } from '@/lib/api';

import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AiChat } from '@/components/admin/ai-chat';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

export default function AdminLayout() {
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  const toggleChat = useCallback(() => setChatOpen(prev => !prev), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'C' && e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const tag = (e.target as HTMLElement).tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target instanceof HTMLTextAreaElement) return;
        e.preventDefault();
        toggleChat();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleChat]);

  useEffect(() => {
    api.get<any>('/api/admin/settings/last-sync')
      .then(res => {
        if (res?.last_sync) {
          const d = new Date(res.last_sync);
          setLastSync(d.toLocaleString());
        }
      })
      .catch(console.error);
  }, []);

  return (
    <SidebarProvider className="min-h-screen">
      <AdminSidebar chatOpen={chatOpen} onToggleChat={toggleChat} />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <span className="text-sm font-medium">Admin Panel</span>
          </div>
          <div className="flex items-center gap-2">
            {lastSync && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                <Clock size={12} />
                <span>Last Synced: {lastSync}</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggleChat}
              title="AI Chat (Shift + C)"
            >
              {chatOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
            </Button>
          </div>
        </header>
        <div className="flex flex-1 overflow-hidden min-h-screen">
          <div className="flex flex-1 flex-col gap-4 p-4 overflow-y-auto">
            <Outlet />
          </div>
          {chatOpen && <AiChat />}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
