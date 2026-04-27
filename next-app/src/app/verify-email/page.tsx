'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email');
  
  return (
    <div className="min-h-screen flex flex-col font-display bg-background-light dark:bg-background-dark">
      <nav className="w-full px-6 py-4 flex justify-between items-center bg-white/50 dark:bg-background-dark/50 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
        <Link href="/" className="flex items-center gap-2 text-primary">
          <span className="material-symbols-outlined text-3xl font-bold">layers</span>
          <h1 className="text-slate-900 dark:text-slate-100 text-xl font-bold tracking-tight">JobTracker</h1>
        </Link>
      </nav>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[440px] bg-white dark:bg-slate-900 rounded-xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 p-8 md:p-10 text-center">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-blue-500 text-4xl">mark_email_unread</span>
          </div>
          
          <h2 className="text-slate-900 dark:text-slate-100 text-2xl font-bold mb-4">Check your Email</h2>
          
          <p className="text-slate-600 dark:text-slate-400 text-[15px] leading-relaxed mb-8">
            We have sent you a verification email to <span className="font-bold text-slate-800 dark:text-slate-200">{emailParam || 'your address'}</span>. Please verify it and log in.
          </p>

          <Link href="/login" className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center justify-center inline-block">
            Log In
          </Link>
        </div>
      </main>

      <footer className="p-6 text-center text-xs text-slate-400 dark:text-slate-600">
        <p>© 2024 JobTracker Analytics. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default function VerifyEmail() {
  return (
    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900"><div className="w-8 h-8 border-4 border-primary border-t-transparent flex rounded-full animate-spin"></div></div>}>
      <VerifyEmailContent />
    </React.Suspense>
  );
}
