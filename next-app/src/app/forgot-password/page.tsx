'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset email sent! Check your inbox (and spam folder) to reset your password.');
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email address.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-display bg-background-light dark:bg-background-dark">
      {/* Navigation */}
      <nav className="w-full px-6 py-4 flex items-center bg-white/50 dark:bg-background-dark/50 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
        <Link href="/" className="flex items-center gap-2 text-primary">
          <span className="material-symbols-outlined text-3xl font-bold">layers</span>
          <h1 className="text-slate-900 dark:text-slate-100 text-xl font-bold tracking-tight">JobTracker</h1>
        </Link>
      </nav>

      {/* Main Content Container */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[440px] bg-white dark:bg-slate-900 rounded-xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 p-8 md:p-10">
          
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-indigo-500 text-3xl">key</span>
            </div>
            <h2 className="text-slate-900 dark:text-slate-100 text-2xl font-bold mb-2">Reset Password</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center">
              Enter your email address and we will send you a link to reset your password.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleResetPassword}>
            {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium">{error}</div>}
            {message && <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm font-medium">{message}</div>}
            
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">mail</span>
                <input required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none" placeholder="yourname@domain.com" type="email" />
              </div>
            </div>
            
            <button disabled={isLoading} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed" type="submit">
              <span>{isLoading ? 'Sending Link...' : 'Send Reset Link'}</span>
              {!isLoading && <span className="material-symbols-outlined text-xl">send</span>}
            </button>
          </form>

          <div className="mt-8 text-center pt-6 border-t border-slate-100 dark:border-slate-800">
            <Link className="text-slate-500 hover:text-primary text-sm font-medium flex items-center justify-center gap-1 transition-colors" href="/login">
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Back to Login
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
