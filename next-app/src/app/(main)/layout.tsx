'use client';

import Sidebar from '@/components/Sidebar';
import { CommandPalette } from '@/components/CommandPalette';
import { ToastProvider } from '@/components/ToastProvider';
import { ExtensionBridge } from '@/components/ExtensionBridge';
import { GlobalChatWidget } from '@/components/GlobalChatWidget';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <ExtensionBridge />
      <div className="main-wrapper h-screen flex w-full bg-slate-50 overflow-hidden font-display text-slate-900">
        <Sidebar />
        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          <CommandPalette />
          {children}
          <GlobalChatWidget />
        </main>
      </div>
    </ToastProvider>
  );
}
