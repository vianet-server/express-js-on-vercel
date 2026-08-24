import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { api } from '@/lib/api';

import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { Separator } from '@/components/ui/separator';

export default function AdminLayout() {
  const [lastSync, setLastSync] = useState<string | null>(null);

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
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <span className="text-sm font-medium">Admin Panel</span>
          </div>
          {lastSync && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
              <Clock size={12} />
              <span>Last Synced: {lastSync}</span>
            </div>
          )}
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
