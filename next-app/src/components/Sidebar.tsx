'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, FileText, PieChart, Settings, Mic, Menu, X, Layers, Puzzle, UserCircle, Video } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { LogOut } from 'lucide-react';

const navigation = [
  { name: 'Dashboard',     href: '/dashboard',           icon: LayoutDashboard },
  { name: 'Interviews',    href: '/interviews',           icon: Users },
  { name: 'Voice Bot',     href: '/interviews/voice-bot', icon: Mic },
  { name: 'Video Mock',    href: '/interviews/video-bot', icon: Video },
  { name: 'Resume Tailor', href: '/resume-tailor',        icon: FileText },
  { name: 'History',       href: '/history',              icon: FileText },
  { name: 'Analytics',     href: '/analytics',            icon: PieChart },
  { name: 'Resumes',       href: '/resumes',              icon: FileText },
  { name: 'Settings',      href: '/settings',             icon: Settings },
  { name: 'Extension',     href: '/extension',            icon: Puzzle },
];

function NavLinks({ onNav }: { onNav?: () => void }) {
  const pathname = usePathname();
  return (
    <>
      {navigation.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNav}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Icon className="w-5 h-5 shrink-0" />
            {item.name}
          </Link>
        );
      })}
    </>
  );
}

function UserCard({ user }: { user: any }) {
  return (
    <div className="p-4 border-t border-slate-100 pb-8 flex flex-col gap-4">
      <Link href="/profile" className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl hover:bg-indigo-50 hover:border-indigo-100 border border-transparent transition group">
        {user?.photoURL ? (
          <img alt="User Profile" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" src={user.photoURL} />
        ) : (
          <div className="w-10 h-10 rounded-full border-2 border-slate-200 bg-slate-100 shadow-sm flex items-center justify-center">
            <UserCircle className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition" />
          </div>
        )}
        <div className="overflow-hidden flex-1">
          <p className="text-sm font-semibold truncate text-slate-900">{user?.displayName || user?.email?.split('@')[0] || 'Guest User'}</p>
          <p className="text-xs text-slate-400 truncate group-hover:text-indigo-500 transition">View Profile →</p>
        </div>
      </Link>
      <button
        onClick={() => signOut(auth)}
        className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-slate-600 hover:bg-rose-50 hover:text-rose-600 font-bold text-sm transition-colors border border-transparent hover:border-rose-100"
      >
        <LogOut className="w-4 h-4" /> Sign Out
      </button>
    </div>
  );
}

export default function Sidebar() {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Hamburger */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-sm"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="w-5 h-5 text-slate-600" />
      </button>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-slate-900/40 z-40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile Drawer */}
      <aside className={`lg:hidden fixed top-0 left-0 bottom-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-bold text-slate-900">JobTracker <span className="text-indigo-600">Pro</span></h1>
          </div>
          <button onClick={() => setMobileOpen(false)} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavLinks onNav={() => setMobileOpen(false)} />
        </nav>
        <UserCard user={user} />
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col h-full" data-purpose="sidebar">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">JobTracker <span className="text-indigo-600">Pro</span></h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <NavLinks />
        </nav>
        <UserCard user={user} />
      </aside>
    </>
  );
}
